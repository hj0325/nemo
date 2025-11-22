"use client";

import { useEffect, useRef } from "react";
import { GestureEngine } from "../utils/gestureEngine";

export default function ScrollInteraction() {
  const engineRef = useRef(null);
  const touchStartY = useRef(null);
  const enabledRef = useRef(false);

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

    function onEnable() {
      enabledRef.current = true;
    }
    window.addEventListener("bg-gradient:enable-scroll", onEnable);

    function onWheel(e) {
      if (!enabledRef.current) return;
      engineRef.current?.addWheel(e.deltaY);
      // also emit a continuous phase delta so color cycles can continue beyond 0..1
      const PHASE_WHEEL = 0.002;
      window.dispatchEvent(
        new CustomEvent("bg-gradient:phase", { detail: e.deltaY * PHASE_WHEEL })
      );
    }
    function onTouchStart(e) {
      if (!enabledRef.current) return;
      touchStartY.current = e.touches[0]?.clientY ?? null;
    }
    function onTouchMove(e) {
      if (!enabledRef.current) return;
      if (touchStartY.current == null) return;
      const currentY = e.touches[0]?.clientY ?? touchStartY.current;
      const dy = touchStartY.current - currentY; // swipe up -> positive
      engineRef.current?.addTouchDy(dy);
      const PHASE_TOUCH = 0.004;
      window.dispatchEvent(
        new CustomEvent("bg-gradient:phase", { detail: dy * PHASE_TOUCH })
      );
      touchStartY.current = currentY;
    }
    function onTouchEnd() {
      touchStartY.current = null;
    }

    function onDisable() {
      enabledRef.current = false;
    }
    window.addEventListener("bg-gradient:disable-scroll", onDisable);

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("bg-gradient:enable-scroll", onEnable);
      window.removeEventListener("bg-gradient:disable-scroll", onDisable);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  return null;
}
