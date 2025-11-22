"use client";

import { useEffect, useState } from "react";

export default function SelectionFlashOverlay() {
  const [color, setColor] = useState("rgba(255,255,255,0)");
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onFlash(e) {
      const { r, g, b } = (e).detail || {};
      if (typeof r === "number" && typeof g === "number" && typeof b === "number") {
        const to255 = (x) => Math.round(Math.min(1, Math.max(0, x)) * 255);
        setColor(`rgba(${to255(r)}, ${to255(g)}, ${to255(b)}, 1)`);
        setShow(true);
        const t = setTimeout(() => setShow(false), 1100); // match animation
        return () => clearTimeout(t);
      }
    }
    window.addEventListener("bg-gradient:flash", onFlash);
    return () => {
      window.removeEventListener("bg-gradient:flash", onFlash);
    };
  }, []);

  if (!show) return null;
  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 flash-overlay"
      style={{ backgroundColor: color }}
    />
  );
}


