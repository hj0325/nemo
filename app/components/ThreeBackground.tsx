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
    function hslToRgb01(h: number, s: number, l: number): [number, number, number] {
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const hh = h / 60;
      const x = c * (1 - Math.abs((hh % 2) - 1));
      let r1 = 0, g1 = 0, b1 = 0;
      if (0 <= hh && hh < 1) { r1 = c; g1 = x; b1 = 0; }
      else if (1 <= hh && hh < 2) { r1 = x; g1 = c; b1 = 0; }
      else if (2 <= hh && hh < 3) { r1 = 0; g1 = c; b1 = x; }
      else if (3 <= hh && hh < 4) { r1 = 0; g1 = x; b1 = c; }
      else if (4 <= hh && hh < 5) { r1 = x; g1 = 0; b1 = c; }
      else if (5 <= hh && hh < 6) { r1 = c; g1 = 0; b1 = x; }
      const m = l - c / 2;
      return [r1 + m, g1 + m, b1 + m];
    }
    function frac(x: number) { return x - Math.floor(x); }
    function rand(seed: number) {
      // deterministic pseudo-random in 0..1
      return frac(Math.sin(seed * 127.1 + 311.7) * 43758.5453123);
    }
    function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
    type RGB = [number, number, number];
    function lerpRGB(a: RGB, b: RGB, t: number): RGB {
      return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
    }
    function segPalette(segIndex: number) {
      // Seeded by segment index – yields '랜덤'하지만 스크롤에 따라 재현 가능한 팔레트
      const s0 = rand(segIndex * 1.73 + 0.13);
      const s1 = rand(segIndex * 2.11 + 0.57);
      const s2 = rand(segIndex * 3.01 + 0.91);
      const s3 = rand(segIndex * 5.33 + 0.27);
      // Dark base tint hue around teal/blue/purple region
      const hd = lerp(170, 280, s0);
      // Yellow family hue (gold ↔ coral)
      const hy = lerp(30, 65, s1);
      // Bottom band complementary-ish hue
      const hb = (hy + lerp(140, 220, s2)) % 360;
      // Dark stack
      const c0: RGB = hslToRgb01(hd, lerp(0.06, 0.18, s3), lerp(0.02, 0.05, s0));
      const c1: RGB = hslToRgb01(hd, lerp(0.08, 0.22, s0), lerp(0.05, 0.08, s1));
      const c2: RGB = hslToRgb01(hd, lerp(0.10, 0.28, s1), lerp(0.08, 0.12, s2));
      const c3: RGB = hslToRgb01(hd, lerp(0.12, 0.34, s2), lerp(0.12, 0.16, s3));
      // Warm top band
      const c4: RGB = hslToRgb01(hy, lerp(0.70, 0.90, s0), lerp(0.45, 0.62, s1)); // gold
      const c5: RGB = hslToRgb01(hy, lerp(0.35, 0.55, s2), lerp(0.78, 0.92, s3)); // pale
      // Bottom band color
      const bottom: RGB = hslToRgb01(hb, lerp(0.35, 0.70, s1), lerp(0.80, 0.95, s0));
      // Band geometry per segment
      const bwStart = lerp(0.04, 0.16, s2);
      const bwEnd = Math.min(0.98, bwStart + lerp(0.45, 0.75, s3));
      return { c0, c1, c2, c3, c4, c5, bottom, bwStart, bwEnd };
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
      // target palette for scroll transition (pink → peach → cream → teal → deep teal → near-black)
      u_c0b: { value: new THREE.Color(0xf7dbe9) },
      u_c1b: { value: new THREE.Color(0xf3d7c6) },
      u_c2b: { value: new THREE.Color(0xefe4bc) },
      u_c3b: { value: new THREE.Color(0x8eb5b5) },
      u_c4b: { value: new THREE.Color(0x1f3a3f) },
      u_c5b: { value: new THREE.Color(0x0b0f10) },
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
      // scroll progress (0 at top → 1 at bottom)
      u_scroll: { value: 0.0 },
      u_scrollTarget: { value: 0.0 },
      // debug overlay
      u_debugAxis: { value: 0.0 },
    };

    // Snapshot of initial (original) palette to keep the very first screen unchanged
    function readRGB(u: any): [number, number, number] {
      const c = u.value as THREE.Color;
      return [c.r, c.g, c.b];
    }
    const initSnapshot = {
      c0: readRGB(uniforms.u_c0),
      c1: readRGB(uniforms.u_c1),
      c2: readRGB(uniforms.u_c2),
      c3: readRGB(uniforms.u_c3),
      c4: readRGB(uniforms.u_c4),
      c5: readRGB(uniforms.u_c5),
      bottom: readRGB(uniforms.u_bottomWhiteColor),
      bwStart: uniforms.u_bottomWhiteStart.value as number,
      bwEnd: uniforms.u_bottomWhiteEnd.value as number,
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
        uniform vec3 u_c0b, u_c1b, u_c2b, u_c3b, u_c4b, u_c5b;
        uniform float u_yellowStart, u_yellowEnd, u_animAmp;
        uniform float u_topStart, u_topEnd;
        uniform float u_bottomWhiteStart, u_bottomWhiteEnd;
        uniform vec3 u_bottomWhiteColor;
        uniform float u_bottomAnimAmp, u_linkBottomMotion;
        uniform float u_scroll;
        uniform float u_scrollTarget;
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

        // Target palette gradient (image-inspired)
        vec3 targetGradient(float t) {
          float t1 = 0.20;
          float t2 = 0.55;
          float t3 = 0.80;
          if (t < t1)       return mix(u_c0b, u_c1b, smoothstep(0.0, t1, t));
          else if (t < t2)  return mix(u_c1b, u_c2b, smoothstep(t1, t2, t));
          else if (t < t3)  return mix(u_c2b, u_c3b, smoothstep(t2, t3, t));
          else              return mix(u_c3b, u_c4b, smoothstep(t3, 1.0, t));
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
          vec3 colOld = warmGradient(tTop, yStartTop, yEndTop);
          vec3 colNew = targetGradient(tTop);
          // Bottom white gradient independent of the top band:
          float yB = 1.0 - v_uv.y; // 0 at top, 1 at bottom
          // Use same breathing motion as top (or custom amp if unlinked)
          float bAmp = mix(u_bottomAnimAmp, u_animAmp, step(0.5, u_linkBottomMotion));
          // use scroll to push the white band upward as you scroll (smoothed)
          float rise = u_scroll * 0.6;
          float bwStart = clamp(u_bottomWhiteStart + bAmp * wave + rise, 0.0, 1.0);
          float bwEnd   = clamp(max(u_bottomWhiteEnd + bAmp * wave + rise, bwStart + 0.005), 0.0, 1.0);
          float sB = smoothstep(bwStart, bwEnd, yB);
          vec3 bottomWhite = mix(vec3(0.0), u_bottomWhiteColor, sB);
          // Smooth palette transition with region-sensitive response (bottom > mid > top)
          float p = smoothstep(0.0, 1.0, u_scroll);
          float yBottom = 1.0 - v_uv.y;  // 0 top → 1 bottom
          // region gains
          float gainTop = 0.65;
          float gainBottom = 1.35;
          float gainMid = 1.0;
          // base interpolation from top->bottom
          float baseGain = mix(gainTop, gainBottom, yBottom);
          // soft bump around middle band
          float midBump = smoothstep(0.30, 0.50, yBottom) * (1.0 - smoothstep(0.50, 0.70, yBottom)) * (gainMid - baseGain);
          float regionGain = clamp(baseGain + midBump, 0.5, 1.5);
          float localP = clamp(p * regionGain, 0.0, 1.0);
          float falloff = pow(yBottom, 1.4);
          float wNew = smoothstep(0.0, 1.0, falloff * localP);
          vec3 colBlend = mix(colOld, colNew, wNew);
          // Compose: palette blend with bottom white overlay rising with scroll
          vec3 col = mix(colBlend, bottomWhite, sB);

          // (hint wave removed per design)

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
    // Progress target from ScrollInteraction (0..1)
    let scrollTarget = 0;
    let scrollDisplayed = 0;
    function onProgress(e: Event) {
      const value = (e as CustomEvent).detail as number;
      scrollTarget = Math.min(1, Math.max(0, Number(value) || 0));
      (uniforms.u_scrollTarget.value as number) = scrollTarget;
    }
    window.addEventListener("bg-gradient:progress", onProgress as EventListener);

    // Remove swipe interactions (kept off)

    let raf = 0;
    const start = performance.now();
    // roulette randomize with smooth tween of background + yellows + bottom band
    function randomIn(min: number, max: number) { return Math.random() * (max - min) + min; }
    function genPalette() {
      // base hue for yellows
      const hy = randomIn(30, 65);
      // complementary-ish hue for bottom band
      const hb = (hy + randomIn(140, 220)) % 360;
      // dark tinted blacks
      const hd = randomIn(170, 260); // teal/blue tint for darks
      const c0: RGB = hslToRgb01(hd, randomIn(0.08, 0.20), randomIn(0.02, 0.05));
      const c1: RGB = hslToRgb01(hd, randomIn(0.10, 0.25), randomIn(0.05, 0.08));
      const c2: RGB = hslToRgb01(hd, randomIn(0.12, 0.30), randomIn(0.08, 0.12));
      const c3: RGB = hslToRgb01(hd, randomIn(0.15, 0.35), randomIn(0.12, 0.16));
      const c4: RGB = hslToRgb01(hy, randomIn(0.70, 0.90), randomIn(0.45, 0.60)); // gold
      const c5: RGB = hslToRgb01(hy, randomIn(0.35, 0.55), randomIn(0.78, 0.90)); // pale yellow
      const bottom: RGB = hslToRgb01(hb, randomIn(0.40, 0.70), randomIn(0.82, 0.94));
      // shape
      const bwStart = randomIn(0.04, 0.14);
      const bwEnd = Math.min(0.98, bwStart + randomIn(0.45, 0.75));
      return { c0, c1, c2, c3, c4, c5, bottom, bwStart, bwEnd };
    }
    let tweenActive = false;
    let tweenStart = 0;
    let tweenDur = 1000;
    const fromCols: Record<string, RGB> = {} as any;
    const toCols: Record<string, RGB> = {} as any;
    let fromStart = 0, fromEnd = 0, toStart = 0, toEnd = 0;
    function captureFrom() {
      function read(u: any): RGB { const c = u.value as THREE.Color; return [c.r, c.g, c.b]; }
      fromCols.u_c0 = read(uniforms.u_c0);
      fromCols.u_c1 = read(uniforms.u_c1);
      fromCols.u_c2 = read(uniforms.u_c2);
      fromCols.u_c3 = read(uniforms.u_c3);
      fromCols.u_c4 = read(uniforms.u_c4);
      fromCols.u_c5 = read(uniforms.u_c5);
      fromCols.u_bottomWhiteColor = read(uniforms.u_bottomWhiteColor);
      fromStart = uniforms.u_bottomWhiteStart.value as number;
      fromEnd = uniforms.u_bottomWhiteEnd.value as number;
    }
    function applyLerp(e: number) {
      function lerpRGB(a: RGB, b: RGB, t: number): RGB { return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }
      const u = uniforms;
      const c0 = lerpRGB(fromCols.u_c0, toCols.u_c0, e); (u.u_c0.value as THREE.Color).setRGB(c0[0], c0[1], c0[2]);
      const c1 = lerpRGB(fromCols.u_c1, toCols.u_c1, e); (u.u_c1.value as THREE.Color).setRGB(c1[0], c1[1], c1[2]);
      const c2 = lerpRGB(fromCols.u_c2, toCols.u_c2, e); (u.u_c2.value as THREE.Color).setRGB(c2[0], c2[1], c2[2]);
      const c3 = lerpRGB(fromCols.u_c3, toCols.u_c3, e); (u.u_c3.value as THREE.Color).setRGB(c3[0], c3[1], c3[2]);
      const c4 = lerpRGB(fromCols.u_c4, toCols.u_c4, e); (u.u_c4.value as THREE.Color).setRGB(c4[0], c4[1], c4[2]);
      const c5 = lerpRGB(fromCols.u_c5, toCols.u_c5, e); (u.u_c5.value as THREE.Color).setRGB(c5[0], c5[1], c5[2]);
      const cb = lerpRGB(fromCols.u_bottomWhiteColor, toCols.u_bottomWhiteColor, e); (u.u_bottomWhiteColor.value as THREE.Color).setRGB(cb[0], cb[1], cb[2]);
      const s = fromStart + (toStart - fromStart) * e;
      const ed = fromEnd + (toEnd - fromEnd) * e;
      uniforms.u_bottomWhiteStart.value = s;
      uniforms.u_bottomWhiteEnd.value = ed;
    }
    function easeInOutCubic(t: number) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2; }
    function onRandomize() {
      const pal = genPalette();
      captureFrom();
      toCols.u_c0 = pal.c0; toCols.u_c1 = pal.c1; toCols.u_c2 = pal.c2; toCols.u_c3 = pal.c3;
      toCols.u_c4 = pal.c4; toCols.u_c5 = pal.c5; toCols.u_bottomWhiteColor = pal.bottom;
      toStart = pal.bwStart; toEnd = pal.bwEnd;
      tweenStart = performance.now();
      tweenDur = 1100;
      tweenActive = true;
    }
    window.addEventListener("bg-gradient:randomize", onRandomize as EventListener);
    function animate() {
      uniforms.u_time.value = (performance.now() - start) / 1000.0;
      // smooth approach to target progress for natural transition (single lerp in Three)
      scrollDisplayed += (scrollTarget - scrollDisplayed) * 0.08;
      uniforms.u_scroll.value = scrollDisplayed;
      // Random-like palette driven by scroll progress (segment blend)
      const segments = 8.0;
      const sVal = scrollDisplayed * segments;
      const segA = Math.floor(sVal);
      const tSeg = sVal - segA;
      if (scrollDisplayed <= 0.001) {
        // Keep original initial screen colors when no scroll has happened
        (uniforms.u_c0.value as THREE.Color).setRGB(initSnapshot.c0[0], initSnapshot.c0[1], initSnapshot.c0[2]);
        (uniforms.u_c1.value as THREE.Color).setRGB(initSnapshot.c1[0], initSnapshot.c1[1], initSnapshot.c1[2]);
        (uniforms.u_c2.value as THREE.Color).setRGB(initSnapshot.c2[0], initSnapshot.c2[1], initSnapshot.c2[2]);
        (uniforms.u_c3.value as THREE.Color).setRGB(initSnapshot.c3[0], initSnapshot.c3[1], initSnapshot.c3[2]);
        (uniforms.u_c4.value as THREE.Color).setRGB(initSnapshot.c4[0], initSnapshot.c4[1], initSnapshot.c4[2]);
        (uniforms.u_c5.value as THREE.Color).setRGB(initSnapshot.c5[0], initSnapshot.c5[1], initSnapshot.c5[2]);
        (uniforms.u_bottomWhiteColor.value as THREE.Color).setRGB(initSnapshot.bottom[0], initSnapshot.bottom[1], initSnapshot.bottom[2]);
        uniforms.u_bottomWhiteStart.value = initSnapshot.bwStart;
        uniforms.u_bottomWhiteEnd.value = initSnapshot.bwEnd;
      } else {
        const palA = segPalette(segA);
        const palB = segPalette(segA + 1);
        const c0 = lerpRGB(palA.c0, palB.c0, tSeg); (uniforms.u_c0.value as THREE.Color).setRGB(c0[0], c0[1], c0[2]);
        const c1 = lerpRGB(palA.c1, palB.c1, tSeg); (uniforms.u_c1.value as THREE.Color).setRGB(c1[0], c1[1], c1[2]);
        const c2 = lerpRGB(palA.c2, palB.c2, tSeg); (uniforms.u_c2.value as THREE.Color).setRGB(c2[0], c2[1], c2[2]);
        const c3 = lerpRGB(palA.c3, palB.c3, tSeg); (uniforms.u_c3.value as THREE.Color).setRGB(c3[0], c3[1], c3[2]);
        const c4 = lerpRGB(palA.c4, palB.c4, tSeg); (uniforms.u_c4.value as THREE.Color).setRGB(c4[0], c4[1], c4[2]);
        const c5 = lerpRGB(palA.c5, palB.c5, tSeg); (uniforms.u_c5.value as THREE.Color).setRGB(c5[0], c5[1], c5[2]);
        const cb = lerpRGB(palA.bottom, palB.bottom, tSeg); (uniforms.u_bottomWhiteColor.value as THREE.Color).setRGB(cb[0], cb[1], cb[2]);
        uniforms.u_bottomWhiteStart.value = lerp(palA.bwStart, palB.bwStart, tSeg);
        uniforms.u_bottomWhiteEnd.value = lerp(palA.bwEnd, palB.bwEnd, tSeg);
      }
      // Keep target palette equal to current to avoid double-mix; let colors come from JS.
      (uniforms.u_c0b.value as THREE.Color).copy(uniforms.u_c0.value as THREE.Color);
      (uniforms.u_c1b.value as THREE.Color).copy(uniforms.u_c1.value as THREE.Color);
      (uniforms.u_c2b.value as THREE.Color).copy(uniforms.u_c2.value as THREE.Color);
      (uniforms.u_c3b.value as THREE.Color).copy(uniforms.u_c3.value as THREE.Color);
      (uniforms.u_c4b.value as THREE.Color).copy(uniforms.u_c4.value as THREE.Color);
      (uniforms.u_c5b.value as THREE.Color).copy(uniforms.u_c5.value as THREE.Color);
      if (tweenActive) {
        const now = performance.now();
        const t = Math.min(1, (now - tweenStart) / tweenDur);
        applyLerp(easeInOutCubic(t));
        if (t >= 1) tweenActive = false;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("bg-gradient:randomize", onRandomize as EventListener);
      window.removeEventListener("resize", resize);
      window.removeEventListener("bg-gradient:update", onUpdate as EventListener);
      window.removeEventListener("bg-gradient:progress", onProgress as EventListener);
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


