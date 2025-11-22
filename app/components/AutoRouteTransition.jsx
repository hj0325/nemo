"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function AutoRouteTransition({
  to,
  delayMs = 5000,
  overlayDurationMs = 1200,
}) {
  const router = useRouter();
  const [showOverlay, setShowOverlay] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (started.current) return;
      started.current = true;
      setShowOverlay(true);
      // Navigate after overlay fully covers the screen for a seamless transition
      setTimeout(() => {
        router.push(to);
      }, overlayDurationMs);
    }, delayMs);
    return () => clearTimeout(t);
  }, [delayMs, overlayDurationMs, router, to]);

  return <>{showOverlay && <div className="gradient-overlay show" />}</>;
}


