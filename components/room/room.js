"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";

export default function Room() {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const spotRef = useRef(null);
  const spotTargetRef = useRef(null);
  const spotHelperRef = useRef(null);
  const orbitAngleRef = useRef(0);
  const lastTimeRef = useRef(typeof performance !== "undefined" ? performance.now() : 0);

  // Sidebar state (camera and control toggles)
  const [controlsOpen, setControlsOpen] = useState(true);
  const [camX, setCamX] = useState(-3.2);
  const [camY, setCamY] = useState(1.7);
  const [camZ, setCamZ] = useState(8.6);
  const [enableZoom, setEnableZoom] = useState(true);
  const [enablePan, setEnablePan] = useState(false);
  const [lockDistance, setLockDistance] = useState(false);
  const [lockTilt, setLockTilt] = useState(true);

  // Light toolbar state
  const [lightOpen, setLightOpen] = useState(true);
  const [lightX, setLightX] = useState(1.8);
  const [lightY, setLightY] = useState(3.8);
  const [lightZ, setLightZ] = useState(1.8);

  const sidebarWidth = 300;

  function createBlobGradientTexture(size = 1024) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, size, size);
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.48;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    radial.addColorStop(0.0, "rgba(0,0,0,1)");
    radial.addColorStop(0.7, "rgba(0,0,0,1)");
    radial.addColorStop(1.0, "rgba(0,0,0,0)");
    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1115);

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(2.5, 2, 3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Environment (EXR) background
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    new EXRLoader().load(
      "/exr/mea.exr",
      (exrTexture) => {
        try {
          const envMap = pmremGenerator.fromEquirectangular(exrTexture).texture;
          scene.environment = envMap;
          scene.background = envMap;
        } finally {
          exrTexture.dispose && exrTexture.dispose();
          pmremGenerator.dispose();
        }
      },
      undefined,
      (error) => {
        console.error("Failed to load /exr/mea.exr", error);
      }
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = enableZoom;
    controls.enablePan = enablePan;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 0.25);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(5, 10, 7.5);
    dirLight.castShadow = false;
    scene.add(dirLight);

    const loader = new GLTFLoader();
    loader.load(
      "/3d/mainhome2.glb",
      (gltf) => {
        const modelRoot = gltf.scene || (gltf.scenes && gltf.scenes[0]);
        if (!modelRoot) return;
        scene.add(modelRoot);
        modelRef.current = modelRoot;
        modelRoot.traverse((obj) => {
          const mesh = obj;
          if (mesh && mesh.isMesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            // Reduce environment (EXR) contribution for higher contrast
            const material = mesh.material;
            if (Array.isArray(material)) {
              material.forEach((m) => {
                if (m && "envMapIntensity" in m) m.envMapIntensity = 0.80;
              });
            } else if (material && "envMapIntensity" in material) {
              material.envMapIntensity = 0.50;
            }
          }
        });

        const box = new THREE.Box3().setFromObject(modelRoot);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        modelRoot.position.x += -center.x;
        modelRoot.position.y += -center.y;
        modelRoot.position.z += -center.z;

        // Spotlight - very strong, focused
        const spot = new THREE.SpotLight(new THREE.Color("#d8d4ba"), 2500, 160, 0.32, 0.7, 1.6);
        spot.position.set(lightX, lightY, lightZ);
        spot.castShadow = true;
        spot.shadow.mapSize.set(2048, 2048);
        spot.shadow.bias = -0.003;
        spot.shadow.camera.near = 0.5;
        spot.shadow.camera.far = 160;
        const gobo = createBlobGradientTexture(1024);
        gobo.flipY = false;
        gobo.needsUpdate = true;
        spot.map = gobo;
        const target = new THREE.Object3D();
        target.position.set(0, 1, 0.7);
        scene.add(target);
        spot.target = target;
        scene.add(spot);
        spotRef.current = spot;
        spotTargetRef.current = target;
        const helper = new THREE.SpotLightHelper(spot);
        helper.visible = false;
        scene.add(helper);
        spotHelperRef.current = helper;
      },
      undefined,
      (error) => {
        console.error("Failed to load /3d/mainhome2.glb", error);
      }
    );

    let animationFrameId = null;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      if (spotHelperRef.current) {
        spotHelperRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    if ("ResizeObserver" in window) {
      resizeObserverRef.current = new ResizeObserver(handleResize);
      resizeObserverRef.current.observe(container);
    } else {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      } else {
        window.removeEventListener("resize", handleResize);
      }
      controls.dispose();
      if (rendererRef.current) {
        rendererRef.current.dispose();
        const el = rendererRef.current.domElement;
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }
      if (scene.background && scene.background.dispose) {
        scene.background.dispose();
      }
      if (scene.environment && scene.environment.dispose) {
        scene.environment.dispose();
      }
      scene.traverse((obj) => {
        const mesh = obj;
        if (!(mesh && mesh.isMesh)) return;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material;
        if (!material) return;
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose && m.dispose());
        } else if (material.dispose) {
          material.dispose();
        }
      });
    };
  }, []);

  // Apply camera and control changes from sidebar
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    camera.position.set(camX, camY, camZ);
    const distance = camera.position.length();
    camera.near = distance / 100;
    camera.far = distance * 100;
    camera.updateProjectionMatrix();
    const spherical = new THREE.Spherical().setFromVector3(camera.position);
    if (lockDistance) {
      controls.minDistance = distance;
      controls.maxDistance = distance;
    } else {
      controls.minDistance = 0.1;
      controls.maxDistance = Infinity;
    }
    if (lockTilt) {
      controls.minPolarAngle = spherical.phi;
      controls.maxPolarAngle = spherical.phi;
    } else {
      controls.minPolarAngle = 0.01;
      controls.maxPolarAngle = Math.PI - 0.01;
    }
    controls.enableZoom = enableZoom;
    controls.enablePan = enablePan;
    controls.update();
  }, [camX, camY, camZ, lockDistance, lockTilt, enableZoom, enablePan]);

  // Apply light position changes
  useEffect(() => {
    if (!spotRef.current) return;
    spotRef.current.position.set(lightX, lightY, lightZ);
    spotRef.current.updateMatrixWorld();
  }, [lightX, lightY, lightZ]);

  const Sidebar = useMemo(() => {
    return (
      <div
        style={{
          position: "fixed",
          top: 60,
          left: controlsOpen ? 0 : -sidebarWidth,
          width: sidebarWidth,
          height: "calc(100vh - 60px)",
          background: "#0e1117",
          color: "#e5e7eb",
          borderRight: "1px solid #23262d",
          transition: "left 0.2s ease",
          overflowY: "auto",
          padding: 16,
          boxSizing: "border-box",
          zIndex: 20,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Camera Controls</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>camX: {camX.toFixed(2)}</label>
          <input type="range" min={-50} max={50} step={0.1} value={camX} onChange={(e) => setCamX(parseFloat(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>camY: {camY.toFixed(2)}</label>
          <input type="range" min={-50} max={50} step={0.1} value={camY} onChange={(e) => setCamY(parseFloat(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>camZ: {camZ.toFixed(2)}</label>
          <input type="range" min={-50} max={50} step={0.1} value={camZ} onChange={(e) => setCamZ(parseFloat(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={enableZoom} onChange={(e) => setEnableZoom(e.target.checked)} />
            Enable Zoom
          </label>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={enablePan} onChange={(e) => setEnablePan(e.target.checked)} />
            Enable Pan
          </label>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={lockDistance} onChange={(e) => setLockDistance(e.target.checked)} />
            Lock Distance
          </label>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={lockTilt} onChange={(e) => setLockTilt(e.target.checked)} />
            Lock Tilt
          </label>
        </div>

        {/* Presets */}
        <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px solid #23262d" }}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Presets</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                // Preset 1: match parameter image (camX 7.6, camY 5.1, camZ 9.6)
                setCamX(7.6);
                setCamY(5.1);
                setCamZ(9.6);
                setEnableZoom(true);
                setEnablePan(false);
                setLockDistance(false);
                setLockTilt(true);
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #6b5bd4",
                background: "#1a1f2e",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
              title="Preset 1"
            >
              1
            </button>
            <button
              onClick={() => {
                // Preset 2: a neutral default view
                setCamX(2.5);
                setCamY(2.0);
                setCamZ(3.0);
                setEnableZoom(true);
                setEnablePan(false);
                setLockDistance(false);
                setLockTilt(true);
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #6b5bd4",
                background: "#1a1f2e",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
              title="Preset 2"
            >
              2
            </button>
            <button
              onClick={() => {
                // Preset 3: 자유 무빙 (free moving)
                setEnableZoom(true);
                setEnablePan(true);
                setLockDistance(false);
                setLockTilt(false);
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #6b5bd4",
                background: "#1a1f2e",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
              title="Preset 3 - Free move"
            >
              3
            </button>
          </div>
        </div>

        {/* Light Presets on left tool */}
        <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px solid #23262d" }}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Light Presets</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                // Light Preset 1: match screenshot params
                setLightX(-2.9);
                setLightY(7.6);
                setLightZ(-17.1);
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #6b5bd4",
                background: "#1a1f2e",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
              title="Light Preset 1"
            >
              1
            </button>
            <button
              onClick={() => {
                // Light Preset 2: neutral/front-right-above
                setLightX(5.0);
                setLightY(6.0);
                setLightZ(5.0);
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #6b5bd4",
                background: "#1a1f2e",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
              title="Light Preset 2"
            >
              2
            </button>
            <button
              onClick={() => {
                // Light Preset 3: reset to defaults
                setLightX(1.8);
                setLightY(3.8);
                setLightZ(1.8);
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #6b5bd4",
                background: "#1a1f2e",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
              title="Light Preset 3 (Reset)"
            >
              3
            </button>
          </div>
        </div>
      </div>
    );
  }, [controlsOpen, camX, camY, camZ, enableZoom, enablePan, lockDistance, lockTilt]);

  const LightToolbar = useMemo(() => {
    const panelWidth = 280;
    return (
      <div
        style={{
          position: "fixed",
          top: 60,
          right: lightOpen ? 0 : -panelWidth,
          width: panelWidth,
          height: "calc(100vh - 60px)",
          background: "#0e1117",
          color: "#e5e7eb",
          borderLeft: "1px solid #23262d",
          transition: "right 0.2s ease",
          overflowY: "auto",
          padding: 16,
          boxSizing: "border-box",
          zIndex: 25,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Light Position</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>lightX: {lightX.toFixed(2)}</label>
          <input type="range" min={-50} max={50} step={0.1} value={lightX} onChange={(e) => setLightX(parseFloat(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>lightY: {lightY.toFixed(2)}</label>
          <input type="range" min={0} max={50} step={0.1} value={lightY} onChange={(e) => setLightY(parseFloat(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>lightZ: {lightZ.toFixed(2)}</label>
          <input type="range" min={-50} max={50} step={0.1} value={lightZ} onChange={(e) => setLightZ(parseFloat(e.target.value))} style={{ width: "100%" }} />
        </div>
      </div>
    );
  }, [lightOpen, lightX, lightY, lightZ]);

  return (
    <>
      {/* Toggle handle */}
      <button
        onClick={() => setControlsOpen((v) => !v)}
        style={{
          position: "fixed",
          top: 60,
          left: controlsOpen ? sidebarWidth : 0,
          transform: "translateX(-50%)",
          width: 36,
          height: 36,
          borderRadius: 18,
          border: "1px solid #23262d",
          background: "#111318",
          color: "#e5e7eb",
          cursor: "pointer",
          zIndex: 30,
          transition: "left 0.2s ease",
        }}
        aria-label="Toggle camera controls"
        title="Toggle camera controls"
      >
        {controlsOpen ? "←" : "→"}
      </button>
      {/* Light toolbar toggle */}
      <button
        onClick={() => setLightOpen((v) => !v)}
        style={{
          position: "fixed",
          top: 60,
          right: lightOpen ? 280 : 0,
          transform: "translateX(50%)",
          width: 36,
          height: 36,
          borderRadius: 18,
          border: "1px solid #23262d",
          background: "#111318",
          color: "#e5e7eb",
          cursor: "pointer",
          zIndex: 30,
          transition: "right 0.2s ease",
        }}
        aria-label="Toggle light controls"
        title="Toggle light controls"
      >
        {lightOpen ? "→" : "←"}
      </button>
      {Sidebar}
      {LightToolbar}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    </>
  );
}


