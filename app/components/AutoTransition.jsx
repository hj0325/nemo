"use client";

import { useEffect, useRef, useState } from "react";

export default function AutoTransition({ delayMs = 5000, durationMs = 1200 } = {}) {
  const [showOverlay, setShowOverlay] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (started.current) return;
      started.current = true;
      setShowOverlay(true);
      // After overlay reaches top, swap the background gradient permanently
      setTimeout(() => {
        document.documentElement.style.setProperty(
          "--gradient",
          "var(--gradient-bright)"
        );
        setShowOverlay(false);
      }, durationMs);
    }, delayMs);
    return () => clearTimeout(t);
  }, [delayMs, durationMs]);

  return (
    <>
      {showOverlay && <div className="gradient-overlay show" />}
    </>
  );
}

