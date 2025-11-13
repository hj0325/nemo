import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

function GradientControl({ label, onChange, quantize = null, colorA = "#8b5cf6", colorB = "#06b6d4" }) {
  const ref = useRef(null);
  const [value, setValue] = useState(0.5);
  const handle = (clientX) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let v = (clientX - r.left) / Math.max(1, r.width);
    v = Math.max(0, Math.min(1, v));
    if (typeof quantize === "number" && quantize > 1) {
      const step = Math.round(v * (quantize - 1));
      v = step / (quantize - 1);
    }
    setValue(v);
    onChange && onChange(v);
  };
  return (
    <div
      ref={ref}
      onPointerDown={(e) => {
        if (e.target && typeof e.target.setPointerCapture === "function") {
          e.target.setPointerCapture(e.pointerId);
        }
        handle(e.clientX);
      }}
      onPointerMove={(e) => {
        if ((e.buttons & 1) === 1) handle(e.clientX);
      }}
      style={{
        position: "relative",
        height: 100,
        borderRadius: 14,
        border: "1px solid #23262d",
        background: `linear-gradient(90deg, ${colorA}, ${colorB})`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.35)), radial-gradient(ellipse at center, rgba(255,255,255,.12), rgba(255,255,255,0))",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `calc(${(value * 100).toFixed(2)}% - 10px)`,
          width: 20,
          background: "rgba(255,255,255,.9)",
          boxShadow: "0 0 18px rgba(255,255,255,.6)",
          borderRadius: 6,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "absolute", top: 8, left: 12, color: "#e5e7eb", fontSize: 12 }}>{label}</div>
      <div style={{ position: "absolute", bottom: 8, right: 12, color: "#e5e7eb", fontSize: 12 }}>
        {value.toFixed(3)}
      </div>
    </div>
  );
}

export default function MobileController() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const socket = io({ path: "/api/socketio" });
    socketRef.current = socket;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onNext = () => setStep((s) => Math.min(3, s + 1));
    const onPrev = () => setStep((s) => Math.max(0, s - 1));
    const onSetStep = (v) => setStep(() => Math.max(0, Math.min(3, Math.floor(v || 0))));
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("next", onNext);
    socket.on("prev", onPrev);
    socket.on("setStep", onSetStep);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("next", onNext);
      socket.off("prev", onPrev);
      socket.off("setStep", onSetStep);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);
  const emit = (event, payload) => socketRef.current && socketRef.current.emit(event, payload);

  return (
    <div
      style={{
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        background: "#0b0d12",
        padding: 12,
        boxSizing: "border-box",
      }}
    >
      <div style={{ height: 8, color: connected ? "#10b981" : "#ef4444", fontSize: 12 }}>
        {connected ? "connected" : "disconnected"}
      </div>
      {/* Step 0: Next only (desktop timing) */}
      {step === 0 && (
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => emit("next")}
            style={{
              flex: 1,
              padding: "16px 18px",
              borderRadius: 12,
              border: "1px solid #23262d",
              background: "linear-gradient(180deg,#1a1f2e,#111318)",
              color: "#e5e7eb",
            }}
          >
            다음
          </button>
        </div>
      )}
      {/* Step 1: Light Path gradient + prev/next */}
      {step === 1 && (
        <>
          <GradientControl
            label="Light Path"
            colorA="#8b5cf6"
            colorB="#06b6d4"
            onChange={(v) => emit("progress", v)}
          />
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => emit("prev")}
              style={{
                flex: 1,
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid #23262d",
                background: "linear-gradient(180deg,#1a1f2e,#111318)",
                color: "#e5e7eb",
              }}
            >
              이전
            </button>
            <button
              onClick={() => emit("next")}
              style={{
                flex: 1,
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid #23262d",
                background: "linear-gradient(180deg,#1a1f2e,#111318)",
                color: "#e5e7eb",
              }}
            >
              다음
            </button>
          </div>
        </>
      )}
      {/* Step 2+: Overlay gradient */}
      {step >= 2 && (
        <>
          <GradientControl
            label="Fade"
            colorA="#f59e0b"
            colorB="#ef4444"
            onChange={(v) => emit("overlayOpacity", v)}
          />
          <div style={{ display: "flex", gap: 12 }}>
            {step > 0 && (
              <button
                onClick={() => emit("prev")}
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1px solid #23262d",
                  background: "linear-gradient(180deg,#1a1f2e,#111318)",
                  color: "#e5e7eb",
                }}
              >
                이전
              </button>
            )}
            {step < 3 && (
              <button
                onClick={() => emit("next")}
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1px solid #23262d",
                  background: "linear-gradient(180deg,#1a1f2e,#111318)",
                  color: "#e5e7eb",
                }}
              >
                다음
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}


