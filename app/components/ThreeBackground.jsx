"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeBackground() {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function hexToRgb01(hex) {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
      if (!m) return [0, 0, 0];
      const r = parseInt(m[1], 16) / 255;
      const g = parseInt(m[2], 16) / 255;
      const b = parseInt(m[3], 16) / 255;
      return [r, g, b];
    }
    function hslToRgb01(h, s, l) {
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
    function frac(x) { return x - Math.floor(x); }
    function rand(seed) {
      // deterministic pseudo-random in 0..1
      return frac(Math.sin(seed * 127.1 + 311.7) * 43758.5453123);
    }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function smoothstep(edge0, edge1, x) {
      const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
    }
    function lerpRGB(a, b, t) {
      return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
    }
    function segPalette(segIndex) {
      // Seeded randoms (stable per segment)
      const s0 = rand(segIndex * 1.73 + 0.13);
      const s1 = rand(segIndex * 2.11 + 0.57);
      const s2 = rand(segIndex * 3.01 + 0.91);
      const s3 = rand(segIndex * 5.33 + 0.27);

      // Stage hue order (sky → green → yellow → orange → navy → purple → navy → sky)
      const baseOrder = [200, 130, 58, 30, 230, 280, 230, 200]; // degrees
      const idx = ((segIndex % 8) + 8) % 8;
      // small jitter to feel random while keeping stage
      const jitter = lerp(-10, 10, s0);
      const hBase = (baseOrder[idx] + jitter + 360) % 360;

      // Build palette from hBase
      // Dark stack tinted by hBase
      const c0 = hslToRgb01(hBase, lerp(0.06, 0.18, s3), lerp(0.02, 0.06, s0));
      const c1 = hslToRgb01(hBase, lerp(0.10, 0.24, s0), lerp(0.05, 0.09, s1));
      const c2 = hslToRgb01(hBase, lerp(0.14, 0.30, s1), lerp(0.08, 0.13, s2));
      const c3 = hslToRgb01(hBase, lerp(0.18, 0.36, s2), lerp(0.12, 0.18, s3));

      // Light stack (top side) aligned to hBase (not always yellow now)
      const c4 = hslToRgb01(hBase, lerp(0.50, 0.85, s1), lerp(0.55, 0.72, s2));
      const c5 = hslToRgb01(hBase, lerp(0.30, 0.55, s0), lerp(0.78, 0.92, s3));

      // Bottom band color as brighter variant of hBase
      const bottom = hslToRgb01(hBase, lerp(0.35, 0.70, s1), lerp(0.82, 0.96, s0));

      // Band geometry per segment
      const bwStart = lerp(0.05, 0.16, s2);
      const bwEnd = Math.min(0.98, bwStart + lerp(0.45, 0.75, s3));
      return { c0, c1, c2, c3, c4, c5, bottom, bwStart, bwEnd };
    }
    function segPaletteStage2(segIndex) {
      const idx = ((segIndex % 9) + 9) % 9;
      // sequence: white > yellow > pink > blue > green > orange > red > navy > white
      const hues = [0, 58, 330, 210, 130, 30, 0, 230, 0]; // hue for stages (white handled specially)
      const isWhite = (i) => i === 0 || i === 8;
      const hBase = hues[idx];
      const s0 = rand(segIndex * 1.71 + 0.21);
      const s1 = rand(segIndex * 2.37 + 0.49);
      const s2 = rand(segIndex * 3.91 + 0.73);
      const s3 = rand(segIndex * 5.07 + 0.17);

      const whiteLight = [1.0, 1.0, 1.0];
      const whitePale = [0.97, 0.97, 0.97];
      const darkTintH = 210;

      const c0 = isWhite(idx)
        ? hslToRgb01(darkTintH, 0.06, 0.03)
        : hslToRgb01(hBase, lerp(0.06, 0.18, s3), lerp(0.02, 0.06, s0));
      const c1 = isWhite(idx)
        ? hslToRgb01(darkTintH, 0.10, 0.06)
        : hslToRgb01(hBase, lerp(0.10, 0.24, s0), lerp(0.05, 0.09, s1));
      const c2 = isWhite(idx)
        ? hslToRgb01(darkTintH, 0.14, 0.10)
        : hslToRgb01(hBase, lerp(0.14, 0.30, s1), lerp(0.08, 0.13, s2));
      const c3 = isWhite(idx)
        ? hslToRgb01(darkTintH, 0.18, 0.14)
        : hslToRgb01(hBase, lerp(0.18, 0.36, s2), lerp(0.12, 0.18, s3));

      const c4 = isWhite(idx)
        ? whiteLight
        : hslToRgb01(hBase, lerp(0.50, 0.85, s1), lerp(0.55, 0.75, s2));
      const c5 = isWhite(idx)
        ? whitePale
        : hslToRgb01(hBase, lerp(0.30, 0.55, s0), lerp(0.80, 0.94, s3));

      const bottom = isWhite(idx)
        ? whitePale
        : hslToRgb01(hBase, lerp(0.35, 0.70, s1), lerp(0.82, 0.96, s0));

      const bwStart = lerp(0.05, 0.16, s2);
      const bwEnd = Math.min(0.98, bwStart + lerp(0.45, 0.75, s3));
      return { c0, c1, c2, c3, c4, c5, bottom, bwStart, bwEnd };
    }

    // Fully random palette per segment, seeded by segIndex (smoothly blended between segments)
    function segPaletteRandom(segIndex) {
      const s0 = rand(segIndex * 1.11 + 0.17);
      const s1 = rand(segIndex * 2.23 + 0.29);
      const s2 = rand(segIndex * 3.47 + 0.41);
      const s3 = rand(segIndex * 5.89 + 0.13);
      const hBase = (360.0 * s0) % 360;
      const c0 = hslToRgb01(hBase, lerp(0.05, 0.20, s1), lerp(0.02, 0.06, s2));
      const c1 = hslToRgb01(hBase, lerp(0.10, 0.30, s2), lerp(0.05, 0.10, s3));
      const c2 = hslToRgb01(hBase, lerp(0.15, 0.40, s3), lerp(0.10, 0.18, s0));
      const c3 = hslToRgb01(hBase, lerp(0.20, 0.50, s0), lerp(0.15, 0.25, s1));
      const c4 = hslToRgb01(hBase, lerp(0.50, 0.90, s1), lerp(0.55, 0.80, s2));
      const c5 = hslToRgb01(hBase, lerp(0.30, 0.60, s3), lerp(0.80, 0.96, s0));
      const bottom = hslToRgb01(hBase, lerp(0.35, 0.75, s2), lerp(0.82, 0.96, s3));
      const bwStart = lerp(0.05, 0.18, s2);
      const bwEnd = Math.min(0.98, bwStart + lerp(0.40, 0.80, s1));
      return { c0, c1, c2, c3, c4, c5, bottom, bwStart, bwEnd };
    }
    // Calmer random palette: lower saturation, softer contrasts, slightly higher lightness
    function segPaletteRandomCalm(segIndex) {
      const s0 = rand(segIndex * 1.13 + 0.07);
      const s1 = rand(segIndex * 2.19 + 0.31);
      const s2 = rand(segIndex * 3.41 + 0.59);
      const s3 = rand(segIndex * 5.17 + 0.23);
      const hBase = (360.0 * s0) % 360;
      // dark stack: gently tinted, very low saturation and low lightness
      const c0 = hslToRgb01(hBase, lerp(0.04, 0.10, s1), lerp(0.04, 0.07, s2));
      const c1 = hslToRgb01(hBase, lerp(0.05, 0.12, s2), lerp(0.06, 0.10, s3));
      const c2 = hslToRgb01(hBase, lerp(0.06, 0.16, s3), lerp(0.10, 0.16, s0));
      const c3 = hslToRgb01(hBase, lerp(0.08, 0.20, s0), lerp(0.14, 0.22, s1));
      // top light stack: pastel-like, low-to-mid saturation, higher lightness
      const c4 = hslToRgb01(hBase, lerp(0.18, 0.38, s1), lerp(0.62, 0.78, s2));
      const c5 = hslToRgb01(hBase, lerp(0.12, 0.32, s3), lerp(0.78, 0.90, s0));
      // bottom band: calm complementary-ish hue with muted saturation
      const hb = (hBase + lerp(120, 220, s2)) % 360;
      const bottom = hslToRgb01(hb, lerp(0.18, 0.36, s1), lerp(0.82, 0.94, s3));
      const bwStart = lerp(0.06, 0.14, s2);
      const bwEnd = Math.min(0.98, bwStart + lerp(0.45, 0.70, s3));
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
    function readRGB(u) {
      const c = u.value;
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
      bwStart: uniforms.u_bottomWhiteStart.value,
      bwEnd: uniforms.u_bottomWhiteEnd.value,
    };
    // Snapshot captured when user clicks "select" (used for stage2 pre-white transition)
    let selectedSnapshot = null;

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
      uniforms.u_resolution.value.set(w, h);
    }
    resize();
    window.addEventListener("resize", resize);

    // Listen for Leva updates
    function onUpdate(e) {
      const detail = (e).detail;
      if (!detail) return;
      if (detail.c3) {
        const [r,g,b] = hexToRgb01(detail.c3);
        uniforms.u_c3.value.setRGB(r, g, b);
      }
      if (detail.c4) {
        const [r,g,b] = hexToRgb01(detail.c4);
        uniforms.u_c4.value.setRGB(r, g, b);
      }
      if (detail.c5) {
        const [r,g,b] = hexToRgb01(detail.c5);
        uniforms.u_c5.value.setRGB(r, g, b);
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
        uniforms.u_bottomWhiteColor.value.setRGB(r, g, b);
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
    window.addEventListener("bg-gradient:update", onUpdate);
    // Guard: keep original initial palette until first real scroll happens
    let initialGuard = true;
    // Progress target from ScrollInteraction (0..1)
    let scrollTarget = 0;
    let scrollDisplayed = 0;
    function onProgress(e) {
      const value = (e).detail;
      scrollTarget = Math.min(1, Math.max(0, Number(value) || 0));
      uniforms.u_scrollTarget.value = scrollTarget;
      if (initialGuard && scrollTarget > 0.001) {
        initialGuard = false;
      }
    }
    window.addEventListener("bg-gradient:progress", onProgress);

    // Remove swipe interactions (kept off)

    let raf = 0;
    const start = performance.now();
    // roulette randomize with smooth tween of background + yellows + bottom band
    function randomIn(min, max) { return Math.random() * (max - min) + min; }
    function genPalette() {
      // base hue for yellows
      const hy = randomIn(30, 65);
      // complementary-ish hue for bottom band
      const hb = (hy + randomIn(140, 220)) % 360;
      // dark tinted blacks
      const hd = randomIn(170, 260); // teal/blue tint for darks
      const c0 = hslToRgb01(hd, randomIn(0.08, 0.20), randomIn(0.02, 0.05));
      const c1 = hslToRgb01(hd, randomIn(0.10, 0.25), randomIn(0.05, 0.08));
      const c2 = hslToRgb01(hd, randomIn(0.12, 0.30), randomIn(0.08, 0.12));
      const c3 = hslToRgb01(hd, randomIn(0.15, 0.35), randomIn(0.12, 0.16));
      const c4 = hslToRgb01(hy, randomIn(0.70, 0.90), randomIn(0.45, 0.60)); // gold
      const c5 = hslToRgb01(hy, randomIn(0.35, 0.55), randomIn(0.78, 0.90)); // pale yellow
      const bottom = hslToRgb01(hb, randomIn(0.40, 0.70), randomIn(0.82, 0.94));
      // shape
      const bwStart = randomIn(0.04, 0.14);
      const bwEnd = Math.min(0.98, bwStart + randomIn(0.45, 0.75));
      return { c0, c1, c2, c3, c4, c5, bottom, bwStart, bwEnd };
    }
    let tweenActive = false;
    let tweenStart = 0;
    let tweenDur = 1000;
    const fromCols = {};
    const toCols = {};
    let fromStart = 0, fromEnd = 0, toStart = 0, toEnd = 0;
    let paletteLocked = false;
    let phaseAccum = 0; // allows infinite cycling across the 0..1 progress range
    let stage2 = false; // after question changes to '창밖에...'
    let stage2ProgressStart = 0; // progress at the moment stage2 begins
    let stage2PhaseStart = 0;    // phase value at stage2 begin (to detect movement via phase)
    let stage3 = false; // third question: fully random on scroll
    let stage3ProgressStart = 0;
    let stage3PhaseStart = 0;
    let finalTween = false; // transitioning to default palette for final screen
    let isFinal = false;    // hard-lock to initial palette on final screen
    // stage1 (base palette) hold state: keep selected colors until movement after entering stage1
    let stage1HoldActive = false;
    let stage1HoldProgressStart = 0;
    let stage1HoldPhaseStart = 0;
    function captureFrom() {
      function read(u) { const c = u.value; return [c.r, c.g, c.b]; }
      fromCols.u_c0 = read(uniforms.u_c0);
      fromCols.u_c1 = read(uniforms.u_c1);
      fromCols.u_c2 = read(uniforms.u_c2);
      fromCols.u_c3 = read(uniforms.u_c3);
      fromCols.u_c4 = read(uniforms.u_c4);
      fromCols.u_c5 = read(uniforms.u_c5);
      fromCols.u_bottomWhiteColor = read(uniforms.u_bottomWhiteColor);
      fromStart = uniforms.u_bottomWhiteStart.value;
      fromEnd = uniforms.u_bottomWhiteEnd.value;
    }
    function applyLerp(e) {
      function lerpRGB(a, b, t) { return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }
      const u = uniforms;
      const c0 = lerpRGB(fromCols.u_c0, toCols.u_c0, e); u.u_c0.value.setRGB(c0[0], c0[1], c0[2]);
      const c1 = lerpRGB(fromCols.u_c1, toCols.u_c1, e); u.u_c1.value.setRGB(c1[0], c1[1], c1[2]);
      const c2 = lerpRGB(fromCols.u_c2, toCols.u_c2, e); u.u_c2.value.setRGB(c2[0], c2[1], c2[2]);
      const c3 = lerpRGB(fromCols.u_c3, toCols.u_c3, e); u.u_c3.value.setRGB(c3[0], c3[1], c3[2]);
      const c4 = lerpRGB(fromCols.u_c4, toCols.u_c4, e); u.u_c4.value.setRGB(c4[0], c4[1], c4[2]);
      const c5 = lerpRGB(fromCols.u_c5, toCols.u_c5, e); u.u_c5.value.setRGB(c5[0], c5[1], c5[2]);
      const cb = lerpRGB(fromCols.u_bottomWhiteColor, toCols.u_bottomWhiteColor, e); u.u_bottomWhiteColor.value.setRGB(cb[0], cb[1], cb[2]);
      const s = fromStart + (toStart - fromStart) * e;
      const ed = fromEnd + (toEnd - fromEnd) * e;
      uniforms.u_bottomWhiteStart.value = s;
      uniforms.u_bottomWhiteEnd.value = ed;
    }
    function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2; }
    function onRandomize() {
      if (paletteLocked) return;
      const pal = genPalette();
      captureFrom();
      toCols.u_c0 = pal.c0; toCols.u_c1 = pal.c1; toCols.u_c2 = pal.c2; toCols.u_c3 = pal.c3;
      toCols.u_c4 = pal.c4; toCols.u_c5 = pal.c5; toCols.u_bottomWhiteColor = pal.bottom;
      toStart = pal.bwStart; toEnd = pal.bwEnd;
      tweenStart = performance.now();
      tweenDur = 1100;
      tweenActive = true;
    }
    window.addEventListener("bg-gradient:randomize", onRandomize);
    function onSelect() {
      // lock the current palette and stop further dynamic updates
      paletteLocked = true;
      tweenActive = false;
      // capture selected colors
      selectedSnapshot = {
        c0: readRGB(uniforms.u_c0),
        c1: readRGB(uniforms.u_c1),
        c2: readRGB(uniforms.u_c2),
        c3: readRGB(uniforms.u_c3),
        c4: readRGB(uniforms.u_c4),
        c5: readRGB(uniforms.u_c5),
        bottom: readRGB(uniforms.u_bottomWhiteColor),
        bwStart: uniforms.u_bottomWhiteStart.value,
        bwEnd: uniforms.u_bottomWhiteEnd.value,
      };
      // emit flash color (use the current warm top color c4)
      const cc = (uniforms.u_c4.value);
      window.dispatchEvent(
        new CustomEvent("bg-gradient:flash", {
          detail: { r: cc.r, g: cc.g, b: cc.b },
        })
      );
    }
    window.addEventListener("bg-gradient:select", onSelect);
    function onPhase(e) {
      if (paletteLocked) return;
      const d = Number((e).detail);
      if (Number.isFinite(d)) {
        phaseAccum += d; // can be positive/negative; not clamped to let it cycle
      }
    }
    window.addEventListener("bg-gradient:phase", onPhase);
    function onStage2() {
      stage2 = true;
      stage3 = false;
      paletteLocked = false; // allow interaction again for stage 2
      phaseAccum = 0;        // start new cycle from beginning (white)
      stage2ProgressStart = scrollDisplayed; // remember current progress to compute delta
      stage2PhaseStart = phaseAccum;
    }
    window.addEventListener("bg-gradient:stage2", onStage2);
    function onStage1() {
      // Switch to base palette logic (formerly stage1 behavior)
      stage2 = false;
      stage3 = false;
      paletteLocked = false;
      phaseAccum = 0;
      // start hold of selected colors until movement
      stage1HoldActive = true;
      stage1HoldProgressStart = scrollDisplayed;
      stage1HoldPhaseStart = phaseAccum;
    }
    window.addEventListener("bg-gradient:stage1", onStage1);
    function onStage3() {
      // enable fully-random palette cycling on scroll
      stage3 = true;
      stage2 = false;
      paletteLocked = false;
      phaseAccum = 0;
      stage3ProgressStart = scrollDisplayed;
      stage3PhaseStart = phaseAccum;
    }
    window.addEventListener("bg-gradient:stage3", onStage3);
    function onFinal() {
      // Transition from current (stage3-selected) colors to default initial palette
      stage2 = false;
      stage3 = false;
      finalTween = true;
      isFinal = true;
      paletteLocked = true; // freeze dynamic updates during tween
      captureFrom();
      toCols.u_c0 = initSnapshot.c0; toCols.u_c1 = initSnapshot.c1; toCols.u_c2 = initSnapshot.c2;
      toCols.u_c3 = initSnapshot.c3; toCols.u_c4 = initSnapshot.c4; toCols.u_c5 = initSnapshot.c5;
      toCols.u_bottomWhiteColor = initSnapshot.bottom;
      toStart = initSnapshot.bwStart; toEnd = initSnapshot.bwEnd;
      tweenStart = performance.now();
      tweenDur = 1200;
      tweenActive = true;
      // Apply immediately as well (avoid any stale colors before tween completes)
      uniforms.u_c0.value.setRGB(initSnapshot.c0[0], initSnapshot.c0[1], initSnapshot.c0[2]);
      uniforms.u_c1.value.setRGB(initSnapshot.c1[0], initSnapshot.c1[1], initSnapshot.c1[2]);
      uniforms.u_c2.value.setRGB(initSnapshot.c2[0], initSnapshot.c2[1], initSnapshot.c2[2]);
      uniforms.u_c3.value.setRGB(initSnapshot.c3[0], initSnapshot.c3[1], initSnapshot.c3[2]);
      uniforms.u_c4.value.setRGB(initSnapshot.c4[0], initSnapshot.c4[1], initSnapshot.c4[2]);
      uniforms.u_c5.value.setRGB(initSnapshot.c5[0], initSnapshot.c5[1], initSnapshot.c5[2]);
      uniforms.u_bottomWhiteColor.value.setRGB(initSnapshot.bottom[0], initSnapshot.bottom[1], initSnapshot.bottom[2]);
      uniforms.u_bottomWhiteStart.value = initSnapshot.bwStart;
      uniforms.u_bottomWhiteEnd.value = initSnapshot.bwEnd;
    }
    window.addEventListener("bg-gradient:final", onFinal);
    function animate() {
      uniforms.u_time.value = (performance.now() - start) / 1000.0;
      // smooth approach to target progress for natural transition (single lerp in Three)
      scrollDisplayed += (scrollTarget - scrollDisplayed) * 0.08;
      uniforms.u_scroll.value = scrollDisplayed;
      // Hard lock to initial palette on final screen
      if (isFinal) {
        uniforms.u_c0.value.setRGB(initSnapshot.c0[0], initSnapshot.c0[1], initSnapshot.c0[2]);
        uniforms.u_c1.value.setRGB(initSnapshot.c1[0], initSnapshot.c1[1], initSnapshot.c1[2]);
        uniforms.u_c2.value.setRGB(initSnapshot.c2[0], initSnapshot.c2[1], initSnapshot.c2[2]);
        uniforms.u_c3.value.setRGB(initSnapshot.c3[0], initSnapshot.c3[1], initSnapshot.c3[2]);
        uniforms.u_c4.value.setRGB(initSnapshot.c4[0], initSnapshot.c4[1], initSnapshot.c4[2]);
        uniforms.u_c5.value.setRGB(initSnapshot.c5[0], initSnapshot.c5[1], initSnapshot.c5[2]);
        uniforms.u_bottomWhiteColor.value.setRGB(initSnapshot.bottom[0], initSnapshot.bottom[1], initSnapshot.bottom[2]);
        uniforms.u_bottomWhiteStart.value = initSnapshot.bwStart;
        uniforms.u_bottomWhiteEnd.value = initSnapshot.bwEnd;
      }
      // Random-like palette driven by scroll progress (segment blend)
      const segments = stage3 ? 12.0 : (stage2 ? 9.0 : 8.0);
      const sVal = (scrollDisplayed + phaseAccum) * segments;
      const segA = Math.floor(sVal);
      const tSeg = sVal - segA;
      if (initialGuard) {
        // Keep original initial screen colors when no scroll has happened
        uniforms.u_c0.value.setRGB(initSnapshot.c0[0], initSnapshot.c0[1], initSnapshot.c0[2]);
        uniforms.u_c1.value.setRGB(initSnapshot.c1[0], initSnapshot.c1[1], initSnapshot.c1[2]);
        uniforms.u_c2.value.setRGB(initSnapshot.c2[0], initSnapshot.c2[1], initSnapshot.c2[2]);
        uniforms.u_c3.value.setRGB(initSnapshot.c3[0], initSnapshot.c3[1], initSnapshot.c3[2]);
        uniforms.u_c4.value.setRGB(initSnapshot.c4[0], initSnapshot.c4[1], initSnapshot.c4[2]);
        uniforms.u_c5.value.setRGB(initSnapshot.c5[0], initSnapshot.c5[1], initSnapshot.c5[2]);
        uniforms.u_bottomWhiteColor.value.setRGB(initSnapshot.bottom[0], initSnapshot.bottom[1], initSnapshot.bottom[2]);
        uniforms.u_bottomWhiteStart.value = initSnapshot.bwStart;
        uniforms.u_bottomWhiteEnd.value = initSnapshot.bwEnd;
      } else if (stage2 && selectedSnapshot && !paletteLocked) {
        // Stage2: hold the previously selected color until the user actually scrolls
        // (in ANY direction). Once movement detected, enter the stage2 routine.
        const deltaProgress = Math.abs(scrollDisplayed - stage2ProgressStart);
        const deltaPhase = Math.abs(phaseAccum - stage2PhaseStart);
        const moved = (deltaProgress + deltaPhase) > 0.002; // small epsilon to avoid jitter locking
        if (!moved) {
          // hold selected colors
          uniforms.u_c0.value.setRGB(selectedSnapshot.c0[0], selectedSnapshot.c0[1], selectedSnapshot.c0[2]);
          uniforms.u_c1.value.setRGB(selectedSnapshot.c1[0], selectedSnapshot.c1[1], selectedSnapshot.c1[2]);
          uniforms.u_c2.value.setRGB(selectedSnapshot.c2[0], selectedSnapshot.c2[1], selectedSnapshot.c2[2]);
          uniforms.u_c3.value.setRGB(selectedSnapshot.c3[0], selectedSnapshot.c3[1], selectedSnapshot.c3[2]);
          uniforms.u_c4.value.setRGB(selectedSnapshot.c4[0], selectedSnapshot.c4[1], selectedSnapshot.c4[2]);
          uniforms.u_c5.value.setRGB(selectedSnapshot.c5[0], selectedSnapshot.c5[1], selectedSnapshot.c5[2]);
          uniforms.u_bottomWhiteColor.value.setRGB(selectedSnapshot.bottom[0], selectedSnapshot.bottom[1], selectedSnapshot.bottom[2]);
          uniforms.u_bottomWhiteStart.value = selectedSnapshot.bwStart;
          uniforms.u_bottomWhiteEnd.value = selectedSnapshot.bwEnd;
        } else {
          // proceed with stage2 cycling (first segment = white)
          const palA = segPaletteStage2(segA);
          const palB = segPaletteStage2(segA + 1);
          const c0 = lerpRGB(palA.c0, palB.c0, tSeg); uniforms.u_c0.value.setRGB(c0[0], c0[1], c0[2]);
          const c1 = lerpRGB(palA.c1, palB.c1, tSeg); uniforms.u_c1.value.setRGB(c1[0], c1[1], c1[2]);
          const c2 = lerpRGB(palA.c2, palB.c2, tSeg); uniforms.u_c2.value.setRGB(c2[0], c2[1], c2[2]);
          const c3 = lerpRGB(palA.c3, palB.c3, tSeg); uniforms.u_c3.value.setRGB(c3[0], c3[1], c3[2]);
          const c4 = lerpRGB(palA.c4, palB.c4, tSeg); uniforms.u_c4.value.setRGB(c4[0], c4[1], c4[2]);
          const c5 = lerpRGB(palA.c5, palB.c5, tSeg); uniforms.u_c5.value.setRGB(c5[0], c5[1], c5[2]);
          const cb = lerpRGB(palA.bottom, palB.bottom, tSeg); uniforms.u_bottomWhiteColor.value.setRGB(cb[0], cb[1], cb[2]);
          uniforms.u_bottomWhiteStart.value = lerp(palA.bwStart, palB.bwStart, tSeg);
          uniforms.u_bottomWhiteEnd.value = lerp(palA.bwEnd, palB.bwEnd, tSeg);
        }
      } else if (stage1HoldActive && selectedSnapshot && !paletteLocked) {
        // Stage1 (base palette) entry: keep selected colors until any movement
        const deltaProgress = Math.abs(scrollDisplayed - stage1HoldProgressStart);
        const deltaPhase = Math.abs(phaseAccum - stage1HoldPhaseStart);
        const moved = (deltaProgress + deltaPhase) > 0.002;
        if (!moved) {
          uniforms.u_c0.value.setRGB(selectedSnapshot.c0[0], selectedSnapshot.c0[1], selectedSnapshot.c0[2]);
          uniforms.u_c1.value.setRGB(selectedSnapshot.c1[0], selectedSnapshot.c1[1], selectedSnapshot.c1[2]);
          uniforms.u_c2.value.setRGB(selectedSnapshot.c2[0], selectedSnapshot.c2[1], selectedSnapshot.c2[2]);
          uniforms.u_c3.value.setRGB(selectedSnapshot.c3[0], selectedSnapshot.c3[1], selectedSnapshot.c3[2]);
          uniforms.u_c4.value.setRGB(selectedSnapshot.c4[0], selectedSnapshot.c4[1], selectedSnapshot.c4[2]);
          uniforms.u_c5.value.setRGB(selectedSnapshot.c5[0], selectedSnapshot.c5[1], selectedSnapshot.c5[2]);
          uniforms.u_c0b.value.setRGB(selectedSnapshot.c0[0], selectedSnapshot.c0[1], selectedSnapshot.c0[2]);
          uniforms.u_c1b.value.setRGB(selectedSnapshot.c1[0], selectedSnapshot.c1[1], selectedSnapshot.c1[2]);
          uniforms.u_c2b.value.setRGB(selectedSnapshot.c2[0], selectedSnapshot.c2[1], selectedSnapshot.c2[2]);
          uniforms.u_c3b.value.setRGB(selectedSnapshot.c3[0], selectedSnapshot.c3[1], selectedSnapshot.c3[2]);
          uniforms.u_c4b.value.setRGB(selectedSnapshot.c4[0], selectedSnapshot.c4[1], selectedSnapshot.c4[2]);
          uniforms.u_c5b.value.setRGB(selectedSnapshot.c5[0], selectedSnapshot.c5[1], selectedSnapshot.c5[2]);
          uniforms.u_bottomWhiteColor.value.setRGB(selectedSnapshot.bottom[0], selectedSnapshot.bottom[1], selectedSnapshot.bottom[2]);
          uniforms.u_bottomWhiteStart.value = selectedSnapshot.bwStart;
          uniforms.u_bottomWhiteEnd.value = selectedSnapshot.bwEnd;
        } else {
          stage1HoldActive = false;
        }
      } else if (stage3 && selectedSnapshot && !paletteLocked) {
        // Stage3: keep the selected colors until any movement is detected.
        const deltaProgress = Math.abs(scrollDisplayed - stage3ProgressStart);
        const deltaPhase = Math.abs(phaseAccum - stage3PhaseStart);
        const moved = (deltaProgress + deltaPhase) > 0.002;
        if (!moved) {
          // hold selected snapshot for both top band and background palettes
          uniforms.u_c0.value.setRGB(selectedSnapshot.c0[0], selectedSnapshot.c0[1], selectedSnapshot.c0[2]);
          uniforms.u_c1.value.setRGB(selectedSnapshot.c1[0], selectedSnapshot.c1[1], selectedSnapshot.c1[2]);
          uniforms.u_c2.value.setRGB(selectedSnapshot.c2[0], selectedSnapshot.c2[1], selectedSnapshot.c2[2]);
          uniforms.u_c3.value.setRGB(selectedSnapshot.c3[0], selectedSnapshot.c3[1], selectedSnapshot.c3[2]);
          uniforms.u_c4.value.setRGB(selectedSnapshot.c4[0], selectedSnapshot.c4[1], selectedSnapshot.c4[2]);
          uniforms.u_c5.value.setRGB(selectedSnapshot.c5[0], selectedSnapshot.c5[1], selectedSnapshot.c5[2]);
          uniforms.u_c0b.value.setRGB(selectedSnapshot.c0[0], selectedSnapshot.c0[1], selectedSnapshot.c0[2]);
          uniforms.u_c1b.value.setRGB(selectedSnapshot.c1[0], selectedSnapshot.c1[1], selectedSnapshot.c1[2]);
          uniforms.u_c2b.value.setRGB(selectedSnapshot.c2[0], selectedSnapshot.c2[1], selectedSnapshot.c2[2]);
          uniforms.u_c3b.value.setRGB(selectedSnapshot.c3[0], selectedSnapshot.c3[1], selectedSnapshot.c3[2]);
          uniforms.u_c4b.value.setRGB(selectedSnapshot.c4[0], selectedSnapshot.c4[1], selectedSnapshot.c4[2]);
          uniforms.u_c5b.value.setRGB(selectedSnapshot.c5[0], selectedSnapshot.c5[1], selectedSnapshot.c5[2]);
          uniforms.u_bottomWhiteColor.value.setRGB(selectedSnapshot.bottom[0], selectedSnapshot.bottom[1], selectedSnapshot.bottom[2]);
          uniforms.u_bottomWhiteStart.value = selectedSnapshot.bwStart;
          uniforms.u_bottomWhiteEnd.value = selectedSnapshot.bwEnd;
        } else {
          // Stage3 movement detected: switch to calm random palettes with separate top/bg
          const palTopA = segPaletteRandomCalm(segA * 2);
          const palTopB = segPaletteRandomCalm(segA * 2 + 1);
          const palBgA  = segPaletteRandomCalm(1000 + segA * 2);
          const palBgB  = segPaletteRandomCalm(1000 + segA * 2 + 1);
          // Top breathing band colors (u_c*)
          const t0 = lerpRGB(palTopA.c0, palTopB.c0, tSeg); uniforms.u_c0.value.setRGB(t0[0], t0[1], t0[2]);
          const t1 = lerpRGB(palTopA.c1, palTopB.c1, tSeg); uniforms.u_c1.value.setRGB(t1[0], t1[1], t1[2]);
          const t2 = lerpRGB(palTopA.c2, palTopB.c2, tSeg); uniforms.u_c2.value.setRGB(t2[0], t2[1], t2[2]);
          const t3 = lerpRGB(palTopA.c3, palTopB.c3, tSeg); uniforms.u_c3.value.setRGB(t3[0], t3[1], t3[2]);
          const t4 = lerpRGB(palTopA.c4, palTopB.c4, tSeg); uniforms.u_c4.value.setRGB(t4[0], t4[1], t4[2]);
          const t5 = lerpRGB(palTopA.c5, palTopB.c5, tSeg); uniforms.u_c5.value.setRGB(t5[0], t5[1], t5[2]);
          // Background gradient colors (u_c*b)
          const b0 = lerpRGB(palBgA.c0, palBgB.c0, tSeg); uniforms.u_c0b.value.setRGB(b0[0], b0[1], b0[2]);
          const b1 = lerpRGB(palBgA.c1, palBgB.c1, tSeg); uniforms.u_c1b.value.setRGB(b1[0], b1[1], b1[2]);
          const b2 = lerpRGB(palBgA.c2, palBgB.c2, tSeg); uniforms.u_c2b.value.setRGB(b2[0], b2[1], b2[2]);
          const b3 = lerpRGB(palBgA.c3, palBgB.c3, tSeg); uniforms.u_c3b.value.setRGB(b3[0], b3[1], b3[2]);
          const b4 = lerpRGB(palBgA.c4, palBgB.c4, tSeg); uniforms.u_c4b.value.setRGB(b4[0], b4[1], b4[2]);
          const b5 = lerpRGB(palBgA.c5, palBgB.c5, tSeg); uniforms.u_c5b.value.setRGB(b5[0], b5[1], b5[2]);
          // Bottom band aligned to background palette
          const cb = lerpRGB(palBgA.bottom, palBgB.bottom, tSeg); uniforms.u_bottomWhiteColor.value.setRGB(cb[0], cb[1], cb[2]);
          uniforms.u_bottomWhiteStart.value = lerp(palBgA.bwStart, palBgB.bwStart, tSeg);
          uniforms.u_bottomWhiteEnd.value = lerp(palBgA.bwEnd, palBgB.bwEnd, tSeg);
        }
      } else if (stage3 && !paletteLocked) {
        // Stage3: fully random palette blended by segments, with DIFFERENT palettes
        // for the top breathing band (u_c*) vs the background (u_c*b).
        // Use distinct seeded indices to ensure different hues per segment for band vs bg.
        const palTopA = segPaletteRandomCalm(segA * 2);
        const palTopB = segPaletteRandomCalm(segA * 2 + 1);
        const palBgA  = segPaletteRandomCalm(1000 + segA * 2);
        const palBgB  = segPaletteRandomCalm(1000 + segA * 2 + 1);
        // Top breathing band colors (u_c*)
        const t0 = lerpRGB(palTopA.c0, palTopB.c0, tSeg); uniforms.u_c0.value.setRGB(t0[0], t0[1], t0[2]);
        const t1 = lerpRGB(palTopA.c1, palTopB.c1, tSeg); uniforms.u_c1.value.setRGB(t1[0], t1[1], t1[2]);
        const t2 = lerpRGB(palTopA.c2, palTopB.c2, tSeg); uniforms.u_c2.value.setRGB(t2[0], t2[1], t2[2]);
        const t3 = lerpRGB(palTopA.c3, palTopB.c3, tSeg); uniforms.u_c3.value.setRGB(t3[0], t3[1], t3[2]);
        const t4 = lerpRGB(palTopA.c4, palTopB.c4, tSeg); uniforms.u_c4.value.setRGB(t4[0], t4[1], t4[2]);
        const t5 = lerpRGB(palTopA.c5, palTopB.c5, tSeg); uniforms.u_c5.value.setRGB(t5[0], t5[1], t5[2]);
        // Background gradient colors (u_c*b)
        const b0 = lerpRGB(palBgA.c0, palBgB.c0, tSeg); uniforms.u_c0b.value.setRGB(b0[0], b0[1], b0[2]);
        const b1 = lerpRGB(palBgA.c1, palBgB.c1, tSeg); uniforms.u_c1b.value.setRGB(b1[0], b1[1], b1[2]);
        const b2 = lerpRGB(palBgA.c2, palBgB.c2, tSeg); uniforms.u_c2b.value.setRGB(b2[0], b2[1], b2[2]);
        const b3 = lerpRGB(palBgA.c3, palBgB.c3, tSeg); uniforms.u_c3b.value.setRGB(b3[0], b3[1], b3[2]);
        const b4 = lerpRGB(palBgA.c4, palBgB.c4, tSeg); uniforms.u_c4b.value.setRGB(b4[0], b4[1], b4[2]);
        const b5 = lerpRGB(palBgA.c5, palBgB.c5, tSeg); uniforms.u_c5b.value.setRGB(b5[0], b5[1], b5[2]);
        // Bottom white band derived from background palette
        const cb = lerpRGB(palBgA.bottom, palBgB.bottom, tSeg); uniforms.u_bottomWhiteColor.value.setRGB(cb[0], cb[1], cb[2]);
        uniforms.u_bottomWhiteStart.value = lerp(palBgA.bwStart, palBgB.bwStart, tSeg);
        uniforms.u_bottomWhiteEnd.value = lerp(palBgA.bwEnd, palBgB.bwEnd, tSeg);
      } else if (!paletteLocked) {
        const palA = stage2 ? segPaletteStage2(segA) : segPalette(segA);
        const palB = stage2 ? segPaletteStage2(segA + 1) : segPalette(segA + 1);
        const c0 = lerpRGB(palA.c0, palB.c0, tSeg); uniforms.u_c0.value.setRGB(c0[0], c0[1], c0[2]);
        const c1 = lerpRGB(palA.c1, palB.c1, tSeg); uniforms.u_c1.value.setRGB(c1[0], c1[1], c1[2]);
        const c2 = lerpRGB(palA.c2, palB.c2, tSeg); uniforms.u_c2.value.setRGB(c2[0], c2[1], c2[2]);
        const c3 = lerpRGB(palA.c3, palB.c3, tSeg); uniforms.u_c3.value.setRGB(c3[0], c3[1], c3[2]);
        const c4 = lerpRGB(palA.c4, palB.c4, tSeg); uniforms.u_c4.value.setRGB(c4[0], c4[1], c4[2]);
        const c5 = lerpRGB(palA.c5, palB.c5, tSeg); uniforms.u_c5.value.setRGB(c5[0], c5[1], c5[2]);
        const cb = lerpRGB(palA.bottom, palB.bottom, tSeg); uniforms.u_bottomWhiteColor.value.setRGB(cb[0], cb[1], cb[2]);
        uniforms.u_bottomWhiteStart.value = lerp(palA.bwStart, palB.bwStart, tSeg);
        uniforms.u_bottomWhiteEnd.value = lerp(palA.bwEnd, palB.bwEnd, tSeg);
      } else {
        // palette locked: keep current uniforms as-is (no dynamic changes)
      }
      // Keep target palette equal to current for non-stage3 to avoid double-mix.
      if (!stage3) {
        uniforms.u_c0b.value.copy(uniforms.u_c0.value);
        uniforms.u_c1b.value.copy(uniforms.u_c1.value);
        uniforms.u_c2b.value.copy(uniforms.u_c2.value);
        uniforms.u_c3b.value.copy(uniforms.u_c3.value);
        uniforms.u_c4b.value.copy(uniforms.u_c4.value);
        uniforms.u_c5b.value.copy(uniforms.u_c5.value);
      }
      if (tweenActive) {
        const now = performance.now();
        const t = Math.min(1, (now - tweenStart) / tweenDur);
        applyLerp(easeInOutCubic(t));
        if (t >= 1) {
          tweenActive = false;
          if (finalTween) {
            finalTween = false;
            // remain paletteLocked at the default colors for the final screen
          }
        }
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("bg-gradient:randomize", onRandomize);
      window.removeEventListener("bg-gradient:select", onSelect);
      window.removeEventListener("bg-gradient:phase", onPhase);
      window.removeEventListener("bg-gradient:stage2", onStage2);
      window.removeEventListener("bg-gradient:stage1", onStage1);
      window.removeEventListener("bg-gradient:stage3", onStage3);
      window.removeEventListener("bg-gradient:final", onFinal);
      window.removeEventListener("resize", resize);
      window.removeEventListener("bg-gradient:update", onUpdate);
      window.removeEventListener("bg-gradient:progress", onProgress);
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


