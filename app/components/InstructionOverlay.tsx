"use client";

import { useEffect, useState } from "react";

export default function InstructionOverlay() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 3000); // 모든 요소 등장 후 3초 뒤 표시
    function onProgress(e: Event) {
      const v = (e as CustomEvent).detail as number;
      if (typeof v === "number" && v > 0.001) setShow(false); // 스크롤 시작되면 숨김
    }
    window.addEventListener("bg-gradient:progress", onProgress as EventListener);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("bg-gradient:progress", onProgress as EventListener);
    };
  }, []);

  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-end justify-center pb-24">
      <div className="instruction-pop rounded-full bg-white/10 border border-white/25 text-white/95 px-5 py-2 text-sm backdrop-blur-md">
        화면을 스크롤하여 제작을 시작하세요
      </div>
    </div>
  );
}


