"use client";

import { useEffect, useState } from "react";

export default function TopQuestion() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onProgress(e: Event) {
      const v = (e as CustomEvent).detail as number;
      if (typeof v === "number" && v > 0.001) setShow(true);
    }
    window.addEventListener("bg-gradient:progress", onProgress as EventListener);
    return () => {
      window.removeEventListener("bg-gradient:progress", onProgress as EventListener);
    };
  }, []);

  if (!show) return null;
  return (
    <div className="pointer-events-none fixed top-10 left-1/2 -translate-x-1/2 z-30">
      <div className="rounded-full bg-white/10 border border-white/25 text-white/95 px-5 py-2 text-sm backdrop-blur-md fade-in-1s text-center whitespace-nowrap">
        하루 중 어떤 시간에 휴식이 필요하신가요?
      </div>
    </div>
  );
}


