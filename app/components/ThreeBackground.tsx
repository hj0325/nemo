"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const container = containerRef.current!;
    if (!container) return;

    function hexToRgb01(hex: string): [number, number, number] {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
      if (!m) return [0, 0, 0];
      const r = parseInt(m[1], 16) / 255;
      const g = parseInt(m[2], 16) / 255;
      const b = parseInt(m[3], 16) / 255;
      return [r, g, b];
    }

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
      // color uniforms (editable via Leva)
      u_c0: { value: new THREE.Color(0x000000) }, // deep black
      u_c1: { value: new THREE.Color(0x0a0906) }, // very dark brown
      u_c2: { value: new THREE.Color(0x16130a) }, // dark umber
      u_c3: { value: new THREE.Color(0x000000) }, // dark-ochre (black)
      u_c4: { value: new THREE.Color(0x0d0a02) }, // very dark brown
      u_c5: { value: new THREE.Color(0xf6f0d5) }, // light warm yellow
      // band controls
      u_yellowStart: { value: 0.85 },
      u_yellowEnd: { value: 0.926 },
      u_animAmp: { value: 0.0445 },
      // explicit coordinate controls
      u_topStart: { value: 0.85 },
      u_topEnd: { value: 0.93 },
      // bottom white gradient
      u_bottomWhiteStart: { value: 0.07 }, // distance from bottom (0..1)
      u_bottomWhiteEnd: { value: 0.63 },
      u_bottomWhiteColor: { value: new THREE.Color(0xf6f0d5) },
      // bottom motion
      u_bottomAnimAmp: { value: 0.0445 },
      u_linkBottomMotion: { value: 1.0 },
      // debug overlay
      u_debugAxis: { value: 0.0 },
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
        uniform vec3 u_c0, u_c1, u_c2, u_c3, u_c4, u_c5;
        uniform float u_yellowStart, u_yellowEnd, u_animAmp;
        uniform float u_topStart, u_topEnd;
        uniform float u_bottomWhiteStart, u_bottomWhiteEnd;
        uniform vec3 u_bottomWhiteColor;
        uniform float u_bottomAnimAmp, u_linkBottomMotion;
        uniform float u_debugAxis;

        vec3 srgb(float r, float g, float b) { return vec3(r,g,b)/255.0; }

        // Warm black-to-gold gradient
        // Long dark section, then a golden band near the very bottom fading to pale yellow
        vec3 warmGradient(float t, float yellowStart, float yellowEnd) {
          // fixed interior stops for the dark section (can be extended later)
          float t1 = 0.20;
          float t2 = 0.55;
          float t3 = 0.80;

          if (t < t1)       return mix(u_c0, u_c1, smoothstep(0.0, t1, t));
          else if (t < t2)  return mix(u_c1, u_c2, smoothstep(t1, t2, t));
          else if (t < t3)  return mix(u_c2, u_c3, smoothstep(t2, t3, t));
          else if (t < yellowStart) return mix(u_c3, u_c4, smoothstep(t3, yellowStart, t));
          // golden band to pale yellow
          float tt = smoothstep(yellowStart, yellowEnd, t);
          vec3 bandMix = mix(u_c4, u_c5, tt);
          // after end, hold u_c5
          return (t <= yellowEnd) ? bandMix : u_c5;
        }

        void main() {
          // Subtle motion so the band breathes slightly (clamped very low at bottom)
          float wave = sin(u_time * 0.6) * 0.5 + cos((u_time * 0.4) + v_uv.x * 5.5) * 0.5;
          // Effective coordinates (top band only; bottom uses separate white fade)
          float yStartTop = clamp(u_topStart + u_animAmp * wave, 0.0, 1.0);
          float yEndTop   = clamp(max(u_topEnd + u_animAmp * wave, yStartTop + 0.005), 0.0, 1.0);

          // Top band sampling with its own breathing
          float yTop = v_uv.y;
          float tTop = clamp(yTop + (sin(u_time * 0.10 + yTop * 2.5) * 0.005), 0.0, 1.0);
          vec3 colTop = warmGradient(tTop, yStartTop, yEndTop);
          // Bottom white gradient independent of the top band:
          float yB = 1.0 - v_uv.y; // 0 at top, 1 at bottom
          // Use same breathing motion as top (or custom amp if unlinked)
          float bAmp = mix(u_bottomAnimAmp, u_animAmp, step(0.5, u_linkBottomMotion));
          float bwStart = clamp(u_bottomWhiteStart + bAmp * wave, 0.0, 1.0);
          float bwEnd   = clamp(max(u_bottomWhiteEnd + bAmp * wave, bwStart + 0.005), 0.0, 1.0);
          float sB = smoothstep(bwStart, bwEnd, yB);
          vec3 bottomWhite = mix(vec3(0.0), u_bottomWhiteColor, sB);
          // Compose: keep top, fade to white near the bottom
          vec3 col = mix(colTop, bottomWhite, sB);

          // Debug overlay: show our notion of top/mid/bottom and coordinate bars
          if (u_debugAxis > 0.5) {
            float y = v_uv.y;
            float lw = 0.004;
            float lTop = 1.0 - smoothstep(0.0, lw, abs(y - 0.95));
            float lMid = 1.0 - smoothstep(0.0, lw, abs(y - 0.50));
            float lBot = 1.0 - smoothstep(0.0, lw, abs(y - 0.05));
            vec3 guide = vec3(0.0);
            guide += vec3(1.0, 0.2, 0.2) * lTop; // red-ish near "top" for v_uv.y
            guide += vec3(0.2, 1.0, 0.2) * lMid; // green middle
            guide += vec3(0.2, 0.6, 1.0) * lBot; // blue near "bottom" for v_uv.y
            col = clamp(col + guide, 0.0, 1.0);

            // Left bar: grayscale showing v_uv.y (0..1)
            if (v_uv.x < 0.02) {
              float g = y;
              vec3 leftBar = vec3(g);
              col = mix(col, leftBar, 0.85);
            }
            // Right bar: red channel showing 1 - v_uv.y (our "distance from bottom")
            if (v_uv.x > 0.98) {
              float rb = 1.0 - y;
              vec3 rightBar = vec3(rb, 0.1, 0.1);
              col = mix(col, rightBar, 0.85);
            }
          }
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

    // Listen for Leva updates
    function onUpdate(e: Event) {
      const detail = (e as CustomEvent).detail as {
        c3?: string; c4?: string; c5?: string;
        yellowStart?: number; yellowEnd?: number; animAmp?: number;
        topStart?: number; topEnd?: number;
        bottomWhiteStart?: number; bottomWhiteEnd?: number; bottomWhiteColor?: string;
        bottomAnimAmp?: number; linkBottomMotion?: number;
        debugAxis?: number;
      };
      if (!detail) return;
      if (detail.c3) {
        const [r,g,b] = hexToRgb01(detail.c3);
        (uniforms.u_c3.value as THREE.Color).setRGB(r, g, b);
      }
      if (detail.c4) {
        const [r,g,b] = hexToRgb01(detail.c4);
        (uniforms.u_c4.value as THREE.Color).setRGB(r, g, b);
      }
      if (detail.c5) {
        const [r,g,b] = hexToRgb01(detail.c5);
        (uniforms.u_c5.value as THREE.Color).setRGB(r, g, b);
      }
      if (typeof detail.yellowStart === "number") {
        uniforms.u_yellowStart.value = detail.yellowStart;
      }
      if (typeof detail.yellowEnd === "number") {
        uniforms.u_yellowEnd.value = detail.yellowEnd;
      }
      if (typeof detail.animAmp === "number") {
        uniforms.u_animAmp.value = detail.animAmp;
      }
      if (typeof detail.topStart === "number") {
        uniforms.u_topStart.value = detail.topStart;
      }
      if (typeof detail.topEnd === "number") {
        uniforms.u_topEnd.value = detail.topEnd;
      }
      if (typeof detail.bottomWhiteStart === "number") {
        uniforms.u_bottomWhiteStart.value = detail.bottomWhiteStart;
      }
      if (typeof detail.bottomWhiteEnd === "number") {
        uniforms.u_bottomWhiteEnd.value = detail.bottomWhiteEnd;
      }
      if (typeof detail.bottomWhiteColor === "string") {
        const [r,g,b] = hexToRgb01(detail.bottomWhiteColor);
        (uniforms.u_bottomWhiteColor.value as THREE.Color).setRGB(r, g, b);
      }
      if (typeof detail.bottomAnimAmp === "number") {
        uniforms.u_bottomAnimAmp.value = detail.bottomAnimAmp;
      }
      if (typeof detail.linkBottomMotion === "number") {
        uniforms.u_linkBottomMotion.value = detail.linkBottomMotion;
      }
      if (typeof detail.debugAxis === "number") {
        uniforms.u_debugAxis.value = detail.debugAxis;
      }
    }
    window.addEventListener("bg-gradient:update", onUpdate as EventListener);

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
      window.removeEventListener("bg-gradient:update", onUpdate as EventListener);
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


