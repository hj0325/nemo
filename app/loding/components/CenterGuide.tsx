"use client";

export default function CenterGuide() {
  return (
    <>
      {/* Viewport center lines */}
      <div className="pointer-events-none fixed inset-0 z-[60]">
        <div
          style={{
            position: "fixed",
            left: "50%",
            top: 0,
            width: "0px",
            height: "100vh",
            borderLeft: "1px dashed rgba(255,255,255,.35)",
            transform: "translateX(-0.5px)",
          }}
        />
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: 0,
            height: "0px",
            width: "100vw",
            borderTop: "1px dashed rgba(255,255,255,.35)",
            transform: "translateY(-0.5px)",
          }}
        />
      </div>
      {/* Frame center lines (must be placed inside an absolute container within the frame) */}
      <div className="pointer-events-none absolute inset-0 z-[61]">
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: "0px",
            height: "100%",
            borderLeft: "1px dashed rgba(0,200,255,.45)",
            transform: "translateX(-0.5px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            height: "0px",
            width: "100%",
            borderTop: "1px dashed rgba(0,200,255,.45)",
            transform: "translateY(-0.5px)",
          }}
        />
      </div>
    </>
  );
}


