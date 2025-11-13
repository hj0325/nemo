"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const container = containerRef.current!;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false, // opaque background
      powerPreference: "high-performance",
    });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
    camera.position.z = 1;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      u_time: { value: 0 },
      u_resolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
    };

    const material = new THREE.ShaderMaterial({
      transparent: false,
      depthTest: false,
      uniforms,
      vertexShader: `
        varying vec2 v_uv;
        void main() {
          v_uv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 v_uv;
        uniform vec2 u_resolution;
        uniform float u_time;

        vec3 srgb(float r, float g, float b) { return vec3(r,g,b)/255.0; }

        // Background gradient (black -> olive/coal -> teal -> warm yellow)
        vec3 bgGradient(float t, float yellowEdge) {
          vec3 s0 = srgb(0.0, 0.0, 0.0);      // #000000
          vec3 s1 = srgb(17.0,16.0,4.0);      // #111004
          vec3 s2 = srgb(18.0,19.0,20.0);     // #121314
          vec3 s3 = srgb(44.0,56.0,58.0);     // #2C383A
          vec3 s4 = srgb(62.0,103.0,108.0);   // #3E676C
          vec3 s5 = srgb(255.0,246.0,221.0);  // #FFF6DD

          // piecewise stops before yellow
          if (t < 0.15)      return mix(s0, s1, smoothstep(0.0, 0.15, t));
          else if (t < 0.40) return mix(s1, s2, smoothstep(0.15, 0.40, t));
          else if (t < 0.65) return mix(s2, s3, smoothstep(0.40, 0.65, t));
          else if (t < yellowEdge) return mix(s3, s4, smoothstep(0.65, yellowEdge, t));
          // yellow region
          else {
            float tt = smoothstep(yellowEdge, 1.0, t);
            return mix(s4, s5, tt);
          }
        }

        void main() {
          // Yellow band edge oscillates smoothly over time with slight horizontal variation
          float baseEdge = 0.90;          // baseline start of yellow band (near bottom)
          float amp = 0.035;              // amplitude of expansion/contraction
          float wave = sin(u_time * 0.7) * 0.5 + cos((u_time * 0.45) + v_uv.x * 6.0) * 0.5;
          float yellowEdge = clamp(baseEdge + amp * wave, 0.80, 0.97);

          // small breathing along the whole gradient
          float t = clamp(v_uv.y + (sin(u_time * 0.12 + v_uv.y * 3.0) * 0.01), 0.0, 1.0);
          vec3 col = bgGradient(t, yellowEdge);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      (uniforms.u_resolution.value as THREE.Vector2).set(w, h);
    }
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const start = performance.now();
    function animate() {
      uniforms.u_time.value = (performance.now() - start) / 1000.0;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="three-bg" aria-hidden="true" />;
}


