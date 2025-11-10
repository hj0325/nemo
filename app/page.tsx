/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function Home() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

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

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    const loader = new GLTFLoader();
    loader.load(
      "/house.glb",
      (gltf) => {
        const modelRoot = gltf.scene || gltf.scenes?.[0];
        if (!modelRoot) return;
        scene.add(modelRoot);

        const box = new THREE.Box3().setFromObject(modelRoot);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        modelRoot.position.x += -center.x;
        modelRoot.position.y += -center.y;
        modelRoot.position.z += -center.z;

        const maxDim = Math.max(size.x, size.y, size.z);
        const fitOffset = 1.35;
        const fov = THREE.MathUtils.degToRad(camera.fov);
        const distance = (maxDim * fitOffset) / (2 * Math.tan(fov / 2));

        camera.position.set(distance, distance * 0.75, distance);
        camera.near = distance / 100;
        camera.far = distance * 100;
        camera.updateProjectionMatrix();

        controls.target.set(0, 0, 0);
        controls.update();
      },
      undefined,
      (error) => {
        // eslint-disable-next-line no-console
        console.error("Failed to load /house.glb", error);
      }
    );

    let animationFrameId: number | null = null;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
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
      scene.traverse((obj: THREE.Object3D) => {
        const mesh = obj as THREE.Mesh;
        if (!("isMesh" in mesh) || !(mesh as any).isMesh) return;
        if (mesh.geometry) mesh.geometry.dispose();
        const material: any = (mesh as any).material;
        if (!material) return;
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose && m.dispose());
        } else if (material.dispose) {
          material.dispose();
        }
      });
    };
  }, []);

  return (
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
  );
}
