"use client";

import { useEffect, useState, useRef } from "react";

export default function SelectButton() {
  const [show, setShow] = useState(false);
  const finalizedRef = useRef(false);

  useEffect(() => {
    function onProgress(e) {
      if (finalizedRef.current) return;
      const v = (e).detail;
      if (typeof v === "number" && v > 0.001) setShow(true);
    }
    function onSelect() {
      if (finalizedRef.current) return;
      // keep visible after selection as well (no change)
      setShow(true);
    }
    function onFinal() {
      // hide button on final screen
      setShow(false);
      finalizedRef.current = true;
    }
    window.addEventListener("bg-gradient:progress", onProgress);
    window.addEventListener("bg-gradient:select", onSelect);
    window.addEventListener("bg-gradient:final", onFinal);
    return () => {
      window.removeEventListener("bg-gradient:progress", onProgress);
      window.removeEventListener("bg-gradient:select", onSelect);
      window.removeEventListener("bg-gradient:final", onFinal);
    };
  }, []);

  if (!show) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <button
        onClick={() =>
          window.dispatchEvent(new CustomEvent("bg-gradient:select"))
        }
        className="rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2 text-sm text-white hover:bg-white/20 active:scale-[0.98] transition"
        aria-label="Fix current background colors"
      >
        선택
      </button>
    </div>
  );
}


