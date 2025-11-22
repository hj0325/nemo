"use client";

export default function CenterPrompt({ visible, children, os = false, noFade = false, title = "message", raise = false }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9,
        pointerEvents: "none",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes promptRaise {
              0% { opacity: 0; transform: translateY(12px) scale(0.98); }
              60% { opacity: 1; transform: translateY(2px) scale(1.005); }
              100% { opacity: 1; transform: translateY(0) scale(1); }
            }
          `,
        }}
      />
      {os ? (
        <div
          style={{
            width: "min(80vw, 560px)",
            background: "rgba(231,233,238,0.56)",
            border: "1px solid rgba(154,160,170,0.45)",
            boxShadow: "0 8px 30px rgba(0,0,0,.25)",
            backdropFilter: "blur(8px) saturate(1.2)",
            WebkitBackdropFilter: "blur(8px) saturate(1.2)",
            borderRadius: 10,
            overflow: "hidden",
            animation: raise ? "promptRaise 600ms cubic-bezier(0.19,1,0.22,1) forwards" : undefined,
          }}
        >
          <div
            style={{
              height: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 8px",
              background: "linear-gradient(to bottom, rgba(220,224,232,0.6), rgba(200,204,212,0.6))",
              borderBottom: "1px solid rgba(154,160,170,0.45)",
              color: "#222",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span>{title}</span>
            <span style={{ letterSpacing: 2, fontWeight: 700 }}>— □ ×</span>
          </div>
          <div
            style={{
              padding: "18px 20px",
              background: "rgba(242,244,247,0.55)",
              color: "#111",
              fontWeight: 800,
              fontSize: 18,
              textAlign: "center",
            }}
          >
            {children}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: 12,
            background: "rgba(0,0,0,.7)",
            border: "1px solid rgba(255,255,255,.12)",
            color: "#e5e7eb",
            fontWeight: 700,
            letterSpacing: 0.2,
            boxShadow: "0 8px 30px rgba(0,0,0,.35)",
            animation: noFade ? undefined : "promptFade 2000ms ease-in-out forwards",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}


