"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Landing() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg,#0b0d12 0%, #0e1117 60%, #0b0d12 100%)",
        color: "#e5e7eb",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      }}
    >
      <div
        style={{
          width: "min(92vw, 980px)",
          padding: "36px 28px",
          borderRadius: 16,
          border: "1px solid #23262d",
          background: "rgba(15,17,23,0.6)",
          backdropFilter: "blur(6px)",
          boxShadow: "0 10px 40px rgba(0,0,0,.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: 0.2 }}>Nemo</h1>
          <span style={{ color: "#9aa0aa", fontSize: 12 }}>{mounted ? "Ready" : "Loading..."}</span>
        </div>
        <p style={{ marginTop: 0, marginBottom: 22, color: "#bfc3ca" }}>
          시작하기: 아래 단계대로 이동하거나 바로 원하는 섹션으로 이동하세요.
        </p>
        <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
          <li>
            <Link href="/main" style={linkStyle}>
              1) 메인 룸 입장 (/main)
            </Link>
            <span style={subtle}> — 3D 룸과 오버레이 이미지</span>
          </li>
          <li>
            <Link href="/mobile" style={linkStyle}>
              2) 모바일 컨트롤 (/mobile)
            </Link>
            <span style={subtle}> — 슬라이더/버튼으로 단계 제어</span>
          </li>
          <li>
            <Link href="/generate" style={linkStyle}>
              3) 이미지 생성 (/generate)
            </Link>
            <span style={subtle}> — DALL·E 기반 이미지 생성</span>
          </li>
          <li>
            <Link href="/bliding" style={linkStyle}>
              4) 블라이딩 보기 (/bliding)
            </Link>
            <span style={subtle}> — 생성 이미지 타일링으로 순차 표시</span>
          </li>
        </ol>
        <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
          <CTA href="/main" label="메인으로 가기" primary />
          <CTA href="/mobile" label="모바일 컨트롤" />
          <CTA href="/generate" label="이미지 생성" />
          <CTA href="/bliding" label="블라이딩 보기" />
        </div>
      </div>
    </div>
  );
}

const subtle = { color: "#9aa0aa", marginLeft: 6, fontSize: 12 };
const linkStyle = {
  color: "#e5e7eb",
  textDecoration: "none",
  borderBottom: "1px dashed #555b66",
};

function CTA({ href, label, primary }) {
  return (
    <Link
      href={href}
      style={{
        padding: "12px 16px",
        borderRadius: 10,
        border: primary ? "1px solid #6b5bd4" : "1px solid #2a2f3a",
        background: primary ? "#1a1f2e" : "#111318",
        color: "#e5e7eb",
        textDecoration: "none",
        fontWeight: 600,
        letterSpacing: 0.2,
        boxShadow: primary ? "0 6px 20px rgba(107,91,212,.25)" : "none",
      }}
    >
      {label}
    </Link>
  );
}


