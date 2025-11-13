"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  to: string;
  delayMs?: number;
  overlayDurationMs?: number;
};

export default function AutoRouteTransition({
  to,
  delayMs = 5000,
  overlayDurationMs = 1200,
}: Props) {
  const router = useRouter();
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const started = useRef<boolean>(false);

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


