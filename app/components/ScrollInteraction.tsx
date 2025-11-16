"use client";

import { useEffect, useRef } from "react";
import { GestureEngine } from "../utils/gestureEngine";

export default function ScrollInteraction() {
  const engineRef = useRef<GestureEngine | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    engineRef.current = new GestureEngine({
      onUpdate: (v) => {
        window.dispatchEvent(
          new CustomEvent("bg-gradient:progress", { detail: v })
        );
      },
      friction: 0.10,
      minVelocity: 0.00005,
      wheelScale: 0.0018,
      touchScale: 0.0035,
    });

    function onWheel(e: WheelEvent) {
      engineRef.current?.addWheel(e.deltaY);
    }
    function onTouchStart(e: TouchEvent) {
      touchStartY.current = e.touches[0]?.clientY ?? null;
    }
    function onTouchMove(e: TouchEvent) {
      if (touchStartY.current == null) return;
      const currentY = e.touches[0]?.clientY ?? touchStartY.current;
      const dy = touchStartY.current - currentY; // swipe up -> positive
      engineRef.current?.addTouchDy(dy);
      touchStartY.current = currentY;
    }
    function onTouchEnd() {
      touchStartY.current = null;
    }

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel as EventListener);
      window.removeEventListener("touchstart", onTouchStart as EventListener);
      window.removeEventListener("touchmove", onTouchMove as EventListener);
      window.removeEventListener("touchend", onTouchEnd as EventListener);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  return null;
}
