"use client";

import { useEffect, useMemo, useState } from "react";

type Stream = {
  text: string;
  style: React.CSSProperties;
  className?: string;
  delay: number;
  duration: number;
};

function makeSentence(): string {
  const subjects = [
    "Light", "Shadow", "Waves", "Breath", "Silence", "Air", "Dust", "Echo",
    "Lines", "Clouds", "Time", "Space"
  ];
  const verbs = [
    "drifts", "lingers", "whispers", "rests", "falls", "glows", "unfolds",
    "softens", "hums", "settles", "wanders", "fades"
  ];
  const phrases = [
    "over the water", "between shadows", "under calm skies", "beside the night",
    "inside the city", "across the glass", "beyond the noise", "in quiet rooms"
  ];
  const feelings = [
    "ease", "healing", "clarity", "simple joy", "warmth", "gentle focus",
    "slow time", "soft balance", "light and shade", "quiet wonder"
  ];
  function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }
  return `${pick(subjects)} ${pick(verbs)} ${pick(phrases)}, ${pick(feelings)}.`;
}

export default function TextCascade({ attachToFrame = false }: { attachToFrame?: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const streams = useMemo<Stream[]>(() => {
    if (!mounted) return [];
    const cols = [
      { left: "6%",  align: "right",  size: 12 },
      { left: "20%", align: "right",  size: 11 },
      { right: "22%", align: "left", size: 11 },
      { right: "7%",  align: "left", size: 12 },
    ] as const;

    const list: Stream[] = [];

    // vertical streams (left/right)
    cols.forEach((c, i) => {
      list.push({
        text: new Array(6 + i).fill(0).map(() => makeSentence()).join(" "),
        style: {
          position: "absolute",
          top: "12%",
          bottom: "12%",
          ...("left" in c ? { left: c.left } : {}),
          ...("right" in c ? { right: c.right } : {}),
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          letterSpacing: "1px",
          lineHeight: "1.3",
          opacity: 0.85,
        },
        className: "tc-stream",
        delay: i * 0.8,
        duration: 14 + i * 3,
      });
    });

    // top centered line (centered to viewport)
    list.push({
      text: new Array(4).fill(0).map(() => makeSentence()).join(" "),
      style: {
        position: "fixed",
        top: "6vh",
        left: "50%",
        transform: "translateX(-50%)",
        width: "66vw",
        textAlign: "center",
        letterSpacing: "1.2px",
        lineHeight: "1.35",
        opacity: 0.9,
        whiteSpace: "normal",
      },
      className: "tc-line tc-line-top",
      delay: 0.2,
      duration: 14,
    });

    // bottom centered line (centered to viewport)
    list.push({
      text: new Array(4).fill(0).map(() => makeSentence()).join(" "),
      style: {
        position: "fixed",
        bottom: "6vh",
        left: "50%",
        transform: "translateX(-50%)",
        width: "70vw",
        textAlign: "center",
        letterSpacing: "1.2px",
        lineHeight: "1.35",
        opacity: 0.9,
        whiteSpace: "normal",
      },
      className: "tc-line tc-line-bottom",
      delay: 0.4,
      duration: 16,
    });
    return list;
  }, [mounted]);

  const containerClass = attachToFrame
    ? "pointer-events-none absolute inset-0 z-10 text-white"
    : "pointer-events-none fixed inset-0 z-10 text-white";

  return (
    <div className={containerClass} suppressHydrationWarning>
      {streams.map((s, idx) => (
        <div
          key={idx}
          className={`${s.className}`}
          style={{
            ...s.style,
            // rem/px 기반 + 프레임 스케일 배수(DevTools 영향 최소화)
            fontSize:
              s.className === "tc-stream"
                ? "calc(13px * var(--tc-scale, 1))"
                : "calc(12px * var(--tc-scale, 1))",
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        >
          {s.text}
        </div>
      ))}
      <style jsx global>{`
        @keyframes lodingRise {
          0%   { transform: translateY(8px); opacity: .0; }
          10%  { opacity: .85; }
          90%  { opacity: .85; }
          100% { transform: translateY(-8px); opacity: 0; }
        }
        @keyframes lodingDriftX {
          0%   { transform: translateX(0px); opacity: .0; }
          10%  { opacity: .9; }
          90%  { opacity: .9; }
          100% { transform: translateX(8px); opacity: 0; }
        }
        /* Opacity-only for center-aligned lines to keep translateX(-50%) intact */
        @keyframes lodingFadeOnly {
          0%   { opacity: .0; }
          10%  { opacity: .9; }
          90%  { opacity: .9; }
          100% { opacity: 0; }
        }
        .tc-stream {
          animation: lodingRise linear infinite;
          text-shadow: 0 0 6px rgba(255,255,255,.4);
          mix-blend-mode: screen;
          font-size: 13px; /* base, scaled by inline via --tc-scale */
          transform: translateZ(0);
          will-change: transform;
          text-rendering: geometricPrecision;
          -webkit-font-smoothing: antialiased;
        }
        .tc-line {
          animation: lodingDriftX linear infinite;
          text-shadow: 0 0 6px rgba(255,255,255,.35);
          mix-blend-mode: screen;
          font-size: 12px; /* base, scaled by inline via --tc-scale */
          transform: translateZ(0);
          will-change: transform;
          text-rendering: geometricPrecision;
          -webkit-font-smoothing: antialiased;
        }
        /* Ensure centered lines don't override translateX(-50%) */
        .tc-line.tc-line-top,
        .tc-line.tc-line-bottom {
          animation: lodingFadeOnly linear infinite;
        }
        /* no vw/vh/cqw based font-sizes; scaling is controlled only by --tc-scale */
      `}</style>
    </div>
  );
}


