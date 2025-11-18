"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { io } from "socket.io-client";
import QRCode from "qrcode";

export default function Index() {
  const videoRef = useRef(null);
  const router = useRouter();
  const [srcIdx, setSrcIdx] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [fading, setFading] = useState(false);
  const sources = useMemo(() => {
    // Expect /public/vid/v1.mp4, /public/vid/v2.mp4. Fallbacks will be handled onerror.
    return ["/vid/v1.mp4", "/vid/v2.mp4"];
  }, []);
  const fallback = "/vid/nemo.mp4";

  const playCurrent = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    // set source
    el.src = sources[srcIdx] || fallback;
    // attempt autoplay
    const p = el.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        // try play after a tick (mobile autoplay policies)
        setTimeout(() => el.play().catch(() => {}), 50);
      });
    }
  }, [srcIdx, sources, fallback]);

  useEffect(() => {
    // generate QR for /mobile on same host (socket path shared)
    const href = typeof window !== "undefined" ? `${window.location.origin}/mobile` : "/mobile";
    QRCode.toDataURL(href, { margin: 1, scale: 6, color: { dark: "#e5e7eb", light: "#000000" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, []);

  useEffect(() => {
    playCurrent();
  }, [playCurrent]);

  useEffect(() => {
    // Listen for mobile connection to auto proceed
    const socket = io({ path: "/api/socketio" });
    const onProceed = () => {
      handleStart();
    };
    socket.on("landingProceed", onProceed);
    return () => {
      socket.off("landingProceed", onProceed);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = useCallback(() => {
    if (fading) return;
    setFading(true);
    // small delay for fade-out, then navigate
    setTimeout(() => {
      router.push("/page2");
    }, 600);
  }, [fading, router]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        background: "#000",
        overflow: "hidden",
      }}
    >
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        controls={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "contrast(1.08) saturate(0.95)",
        }}
        onEnded={() => {
          // alternate v1 <-> v2
          setSrcIdx((i) => (i + 1) % sources.length);
          // next source will be set by effect and play
        }}
        onError={(e) => {
          // if current src fails, switch to fallback
          const el = e?.currentTarget;
          if (el && el.src.indexOf(fallback) === -1) {
            el.src = fallback;
            el.play().catch(() => {});
          }
        }}
      />

      {/* QR bottom-center */}
      <div
        style={{
          position: "absolute",
          bottom: 22,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "center",
          padding: "8px 10px",
          borderRadius: 12,
          background: "rgba(0,0,0,.55)",
          border: "1px solid rgba(255,255,255,.08)",
          backdropFilter: "blur(4px)",
        }}
      >
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="Open mobile control"
            width={110}
            height={110}
            style={{ display: "block" }}
          />
        ) : null}
        <div style={{ color: "#bfc3ca", fontSize: 12, maxWidth: 260, lineHeight: 1.5 }}>
          모바일 카메라로 QR을 스캔하면 컨트롤 페이지(/mobile)로 연결됩니다.
        </div>
        <button
          onClick={handleStart}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #2a2f3a",
            background: "#111318",
            color: "#e5e7eb",
            fontWeight: 600,
            letterSpacing: 0.2,
            cursor: "pointer",
          }}
        >
          시작
        </button>
      </div>

      {/* Fade-to-black overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#000",
          pointerEvents: "none",
          opacity: fading ? 1 : 0,
          transition: "opacity 600ms ease",
        }}
      />
    </div>
  );
}


