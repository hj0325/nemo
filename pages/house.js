import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function HouseViewerPage() {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const [lastImage, setLastImage] = useState(null);

  useEffect(() => {
    try {
      const src = localStorage.getItem("nemo_last_image");
      if (src) setLastImage(src);
      const onStorage = (e) => {
        if (e.key === "nemo_last_image" && e.newValue) setLastImage(e.newValue);
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    } catch {}
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1115);

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(2.5, 2, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    // Keep horizontal rotation only; no zoom/pan so the model size stays fixed
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.target.set(0, 0, 0);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 10, 7.5);
    dirLight.castShadow = false;
    scene.add(dirLight);

    const loader = new GLTFLoader();
    let modelRoot = null;

    loader.load(
      '/3d/house.glb',
      (gltf) => {
        modelRoot = gltf.scene || gltf.scenes[0];
        scene.add(modelRoot);

        // Center the model at the origin
        const box = new THREE.Box3().setFromObject(modelRoot);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        // Move the model so its center is at (0, 0, 0)
        modelRoot.position.x += -center.x;
        modelRoot.position.y += -center.y;
        modelRoot.position.z += -center.z;

        // Fit camera to model
        const maxDim = Math.max(size.x, size.y, size.z);
        const fitOffset = 1.35; // space around the object
        const fov = THREE.MathUtils.degToRad(camera.fov);
        const distance = (maxDim * fitOffset) / (2 * Math.tan(fov / 2));

        // Position camera on a diagonal for a nice view
        camera.position.set(distance, distance * 0.75, distance);
        camera.near = distance / 100;
        camera.far = distance * 100;
        camera.updateProjectionMatrix();

        controls.target.set(0, 0, 0);
        // Lock distance and vertical angle so size/tilt remain fixed,
        // while allowing left-right (azimuthal) rotation.
        controls.minDistance = distance;
        controls.maxDistance = distance;
        const initialPolar = controls.getPolarAngle();
        controls.minPolarAngle = initialPolar;
        controls.maxPolarAngle = initialPolar;
        controls.update();

        // Add a floor under the model
        const floorY = -size.y / 2; // model base after centering
        const floorSize = Math.max(size.x, size.z) * 10;
        const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize);
        const floorMaterial = new THREE.MeshStandardMaterial({
          color: 0x16181d,
          roughness: 1,
          metalness: 0
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = floorY;
        scene.add(floor);
      },
      undefined,
      (error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to load /house.glb', error);
      }
    );

    let animationFrameId = null;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    // Observe container size to handle layout changes
    if ('ResizeObserver' in window) {
      resizeObserverRef.current = new ResizeObserver(handleResize);
      resizeObserverRef.current.observe(container);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      } else {
        window.removeEventListener('resize', handleResize);
      }
      controls.dispose();
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement && rendererRef.current.domElement.parentNode) {
          rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
        }
      }
      // Clean up scene
      scene.traverse((obj) => {
        if (!obj.isMesh) return;
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose && m.dispose());
          } else if (obj.material.dispose) {
            obj.material.dispose();
          }
        }
      });
    };
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      />
      {lastImage && (
        <div
          style={{
            position: 'fixed',
            top: 12,
            left: 12,
            width: 300,
            height: 170,
            border: '1px solid #2a2f3a',
            boxShadow: '0 6px 24px rgba(0,0,0,.35)',
            background: '#0b0d12',
            overflow: 'hidden',
            zIndex: 6,
          }}
          title="선택된 이미지 미리보기"
        >
          <img src={lastImage} alt="selected" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
    </div>
  );
}


