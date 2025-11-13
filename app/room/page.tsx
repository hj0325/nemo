"use client";

import React, { useEffect, useMemo, useState } from "react";
import Room from "@/components/desktop/room/room";

export default function FixedRoomPage() {
  // 페이지 스크롤 잠금
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlHeight = html.style.height;
    const prevBodyHeight = body.style.height;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.height = "100%";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      html.style.height = prevHtmlHeight;
      body.style.height = prevBodyHeight;
    };
  }, []);
  // page-level HTML screen controls (left panel)
  const [pHtmlDist, setPHtmlDist] = useState(-10.0);
  const [pHtmlOffX, setPHtmlOffX] = useState(-40.0);
  const [pHtmlOffY, setPHtmlOffY] = useState(-29.524);
  const [pHtmlOffZ, setPHtmlOffZ] = useState(-27.937);
  const [pHtmlScale, setPHtmlScale] = useState(5.0);
  // Dramatic landing (very close), then pull back step-by-step
  // Push in even further for a “fully zoomed-in” landing shot
  const camVeryClose = useMemo(() => ({ x: 1.10, y: 1.00, z: 2.00 }), []);
  // Start slightly higher on Z, then settle down to camVeryClose
  const camVeryCloseUp = useMemo(() => ({ x: 1.10, y: 1.00, z: 2.30 }), []);
  const camClose = useMemo(() => ({ x: 3.2, y: 2.2, z: 4.2 }), []);
  const camFar = useMemo(() => ({ x: 6.0, y: 4.0, z: 12.0 }), []);
  // 이미지 각도에 더 근접하도록 오른쪽/뒤/약간 위로
  const camAngle = useMemo(() => ({ x: -3.9, y: -2, z: 6.8 }), []);
  // 정면 보기 타겟 (창문 방향을 정면으로 바라보는 느낌)
  const lookWindow = useMemo(() => ({ x: -3.9, y: -1.6, z: -4.8 }), []);
  // Step 0 -> camClose, Step 1 -> camFar, Step 2 -> camAngle
  const steps = [camClose, camFar, camAngle] as { x: number; y: number; z: number }[];
  const [step, setStep] = useState(0);
  // step 0로 돌아오면 랜딩 최종 구도(camVeryClose)로 복귀
  const stepTarget = step === 0 ? camVeryClose : steps[step];
  // Intro settle animation (once on mount: camVeryCloseUp -> camVeryClose)
  const [intro, setIntro] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setIntro(false), 900);
    return () => clearTimeout(id);
  }, []);
  const combinedTarget = intro ? camVeryClose : stepTarget;
  useEffect(() => {
    if (step === 0 || step === 1) {
      setPHtmlDist(-10.0);
      setPHtmlOffX(-40.0);
      setPHtmlOffY(-29.524);
      setPHtmlOffZ(-27.937);
      setPHtmlScale(5.0);
    } else if (step === 2) {
      setPHtmlDist(-10.0);
      setPHtmlOffX(-31.746);
      setPHtmlOffY(-30.794);
      setPHtmlOffZ(-27.937);
      setPHtmlScale(5.0);
    }
  }, [step]);

  // Light presets aligned with index: 1 -> (-0.9,12.8,-24.0), 2 -> (-14.7,10.7,-18.9)
  const lightPreset1 = useMemo(() => ({ x: -0.9, y: 12.8, z: -24.0 }), []);
  const lightPreset2 = useMemo(() => ({ x: -14.7, y: 10.7, z: -18.9 }), []);
  // 첫 “다음”에 조명을 파라미터 첫 화면 상태(프리셋1)로 부드럽게 복귀
  const lightSteps = [null, lightPreset1, lightPreset1] as (null | { x: number; y: number; z: number })[];
  const lightTarget = lightSteps[step] || undefined;
  // 진행 슬라이더: 랜딩(0)에서는 0.538, 첫 다음(1)에서는 0.0(아침)으로 이동
  // 그 이후 스텝에서는 사용자가 조정한 값을 보존하도록 별도 타깃을 주지 않음
  const progressTarget = step === 0 ? 0.538 : (step === 1 ? 0.0 : (undefined as any));

  return (
    <>
      <Room
        initialCamera={camVeryCloseUp}
        cameraTarget={combinedTarget}
        cameraLerp={1200}
        controlsTarget={step === 2 ? lookWindow : { x: 0, y: 0, z: 0 }}
        controlsLerp={1200}
        initialLight={lightPreset1}
        lightTarget={lightTarget}
        lightLerp={1200}
        pinIntensityTarget={step === 2 ? 6 : 20}
        pinIntensityLerp={900}
        initialHtmlDist={pHtmlDist}
        initialHtmlOffX={pHtmlOffX}
        initialHtmlOffY={pHtmlOffY}
        initialHtmlOffZ={pHtmlOffZ}
        initialHtmlScaleMul={pHtmlScale}
        htmlVisible={step !== 2}
        overlayImageUrl={"/2d/nemo.png"}
        overlayVisible={step === 2}
        overlayPos={{ x: -3.9, y: -1.8, z: -8.0 }}
        overlayScale={5.0}
        progressTarget={progressTarget as any}
        progressLerp={900}
        progressTrigger={step}
        initialProgress={0.538}
        disableColorMapping={step === 0}
        initialFov={28}
        hideUI={true}
        showPathSlider={step > 0}
        staticView={true}
      />
      <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 12, zIndex: 40 }}>
        {step > 0 && (
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #23262d",
              background: "#111318",
              color: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            이전
          </button>
        )}
        {step < steps.length - 1 && (
          <button
            onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #23262d",
              background: "#111318",
              color: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            다음
          </button>
        )}
      </div>
      {/* Quick HUD for current HTML params (bottom-left) */}
      <div style={{ position: "fixed", left: 12, bottom: 12, background: "rgba(17,19,24,.8)", border: "1px solid #23262d", borderRadius: 8, color: "#e5e7eb", padding: "8px 10px", fontSize: 12, zIndex: 50 }}>
        <div style={{ opacity: 0.8, marginBottom: 4 }}>HTML Params</div>
        <div>Dist: {pHtmlDist.toFixed(3)}</div>
        <div>X: {pHtmlOffX.toFixed(3)} · Y: {pHtmlOffY.toFixed(3)} · Z: {pHtmlOffZ.toFixed(3)}</div>
        <div>Scale: {pHtmlScale.toFixed(3)}</div>
      </div>
      {/* Page-level left panel for HTML param control */}
      <div style={{ position: "fixed", top: 60, left: 0, width: 280, background: "#0e1117", borderRight: "1px solid #23262d", color: "#e5e7eb", padding: 12, zIndex: 45 }}>
        <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>HTML Controls (Page)</div>
        <div style={{ marginBottom: 10, fontSize: 12 }}>Dist: {pHtmlDist.toFixed(3)}</div>
        <input type="range" min={-10} max={20} step={0.001} value={pHtmlDist} onChange={(e) => setPHtmlDist(parseFloat(e.target.value))} style={{ width: "100%", marginBottom: 10 }} />
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12 }}>X</span>
          <input type="range" min={-40} max={40} step={0.001} value={pHtmlOffX} onChange={(e) => setPHtmlOffX(parseFloat(e.target.value))} />
          <span style={{ fontSize: 12 }}>Y</span>
          <input type="range" min={-40} max={40} step={0.001} value={pHtmlOffY} onChange={(e) => setPHtmlOffY(parseFloat(e.target.value))} />
          <span style={{ fontSize: 12 }}>Z</span>
          <input type="range" min={-40} max={40} step={0.001} value={pHtmlOffZ} onChange={(e) => setPHtmlOffZ(parseFloat(e.target.value))} />
          <span style={{ fontSize: 12 }}>Scale</span>
          <input type="range" min={0.2} max={80} step={0.001} value={pHtmlScale} onChange={(e) => setPHtmlScale(parseFloat(e.target.value))} />
        </div>
      </div>
    </>
  );
}


