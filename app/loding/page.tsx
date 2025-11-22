"use client";
import { useEffect, useRef } from "react";
import TextCascade from "./components/TextCascade";

export default function LodingPage() {
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const setVars = () => {
      const rect = el.getBoundingClientRect();
      const scale = Math.min(1.8, Math.max(0.8, rect.width / 1280)); // base 1280px width
      el.style.setProperty("--frame-w", `${rect.width}px`);
      el.style.setProperty("--frame-h", `${rect.height}px`);
      el.style.setProperty("--frame-min", `${Math.min(rect.width, rect.height)}px`);
      el.style.setProperty("--tc-scale", `${scale}`);
    };
    setVars();
    const ro = new ResizeObserver(setVars);
    ro.observe(el);
    window.addEventListener("resize", setVars);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", setVars);
    };
  }, []);

  return (
    <main className="min-h-screen w-full bg-black">
      {/* Center a 16:9 frame that always fits inside the viewport */}
      <div className="fixed inset-0 z-0 flex items-center justify-center">
        <div ref={frameRef} className="loding-frame">
          <video
            src="/nemo.mp4"
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          {/* Text overlay is anchored to the same frame */}
          <div className="absolute inset-0">
            <TextCascade attachToFrame />
          </div>
        </div>
      </div>
      <style jsx global>{`
        /* 16:9 frame that fits fully in any viewport */
        .loding-frame {
          position: relative;
          width: 100vw;
          height: 56.25vw; /* 9/16 */
          max-height: 100vh;
          max-width: 177.78vh; /* 16/9 */
          background-color: #000;
          box-shadow: 0 0 80px rgba(0,0,0,.6);
          /* Make this a container so children can use container-relative units */
          container-type: size;
        }
      `}</style>
    </main>
  );
}



