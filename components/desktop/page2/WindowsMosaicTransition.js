"use client";

export default function WindowsMosaicTransition({
  windows = [],
  targets4 = [],
  start = false,
  durationMs = 900,
  clarity = 0,
  cameraTargets = [],
  cameraImages = [],
  onDone,
  initialScale = 1,
  finalScale = 2.0,
}) {
  const chooseMesySrc = (w, i) => {
    const ww = parseFloat(w.widthVw ?? parseFloat(w.width || "0"));
    const hh = parseFloat(w.heightVh ?? parseFloat(w.height || "0"));
    if (!isFinite(ww) || !isFinite(hh) || ww <= 0 || hh <= 0) {
      const fallback = (i % 11) + 1;
      return `/2d/mesy/img${fallback}.png`;
    }
    const r = ww / hh;
    if (i % 6 === 1) return "/2d/mesy/monocity.png";
    if (i % 6 === 5) return "/2d/mesy/monocity3.png";
    if (i % 6 === 4) return "/2d/mesy/monocity2.png";
    const wide = [2, 5, 8, 11];
    const tall = [3, 6, 9];
    const square = [1, 4, 7, 10];
    if (r >= 1.25) return `/2d/mesy/img${wide[i % wide.length]}.png`;
    if (r <= 0.8) return `/2d/mesy/img${tall[i % tall.length]}.png`;
    return `/2d/mesy/img${square[i % square.length]}.png`;
  };

  const blurBase = 0.5;
  const blurNow = Math.max(0, blurBase * (1 - Math.max(0, Math.min(1, clarity))));

  const animName = `mosaicZoomIn_${String(initialScale).replace('.','_')}_${String(finalScale).replace('.','_')}`;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 7, overflow: "hidden" }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes ${animName} { 0% { transform: scale(${initialScale}); } 100% { transform: scale(${finalScale}); } }`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "center",
          animation: start ? `${animName} ${durationMs}ms cubic-bezier(0.19,1,0.22,1) forwards` : undefined,
          willChange: "transform",
        }}
        onAnimationEnd={() => {
          if (typeof onDone === "function") onDone();
        }}
      >
        {windows.map((w, i) => {
          const tgt = targets4[i];
          if (!tgt) return null;
          const camIdx = cameraTargets.includes(i) ? (i % Math.max(1, cameraImages.length)) : -1;
          const src = camIdx >= 0 && cameraImages[camIdx] ? cameraImages[camIdx] : chooseMesySrc(w, i);
          const invert = (i % 2) === 0;
          const imgFilter = invert
            ? `blur(${blurNow}px) grayscale(1) invert(1) contrast(1.05)`
            : `blur(${blurNow}px) grayscale(1) contrast(1.05)`;

          const left = start ? `${tgt.left}vw` : `${w.leftVw}vw`;
          const top = start ? `${tgt.top}vh` : `${w.topVh}vh`;
          const width = start ? `${tgt.width}vw` : `${w.widthVw}vw`;
          const height = start ? `${tgt.height}vh` : `${w.heightVh}vh`;

          return (
            <div
              key={`mosaic_${w.id}`}
              style={{
                position: "absolute",
                left,
                top,
                width,
                height,
                background: "rgba(231,233,238,0.56)",
                border: "1px solid rgba(154,160,170,0.45)",
                borderRadius: 10,
                overflow: "hidden",
                transition:
                  "left 600ms cubic-bezier(0.19,1,0.22,1), top 600ms cubic-bezier(0.19,1,0.22,1), width 600ms cubic-bezier(0.19,1,0.22,1), height 600ms cubic-bezier(0.19,1,0.22,1)",
                boxShadow: "0 8px 30px rgba(0,0,0,.18)",
                willChange: "left, top, width, height",
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
                <span>{`window_${i + 1}`}</span>
                <span style={{ letterSpacing: 2, fontWeight: 700 }}>— □ ×</span>
              </div>
              <img
                src={src}
                alt=""
                style={{
                  position: "absolute",
                  inset: "26px 0 0 0",
                  width: "100%",
                  height: "calc(100% - 26px)",
                  objectFit: "cover",
                  filter: imgFilter,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

