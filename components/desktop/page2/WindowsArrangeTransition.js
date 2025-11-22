"use client";

export default function WindowsArrangeTransition({
  windows,
  survivors,
  targets,
  start,
  tileSources = [],
  prevTileSources = [],
  pulseDir = null,
  pulseKey = 0,
}) {
  const flingName = (i) => {
    const names = ["flingTR", "flingTL", "flingBR", "flingBL"];
    return names[i % names.length];
  };
  // lightweight image chooser to avoid content 'pop' when switching to grid
  const chooseMesySrc = (w, i) => {
    const ww = parseFloat(w.widthVw ?? parseFloat(w.width || "0"));
    const hh = parseFloat(w.heightVh ?? parseFloat(w.height || "0"));
    if (!isFinite(ww) || !isFinite(hh) || ww <= 0 || hh <= 0) {
      const fallback = (i % 11) + 1;
      return `/2d/mesy/img${fallback}.png`;
    }
    const r = ww / Math.max(1, hh);
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
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 7,
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes tileSlideUp {
            0%   { transform: translateY(0%); }
            100% { transform: translateY(-50%); }
          }
          @keyframes tileSlideDown {
            0%   { transform: translateY(-50%); }
            100% { transform: translateY(0%); }
          }
          /* dynamic variants to ensure animation restarts without remount (avoid flicker) */
          @keyframes tileSlideUp_${pulseKey} {
            0%   { transform: translateY(0%); }
            100% { transform: translateY(-50%); }
          }
          @keyframes tileSlideDown_${pulseKey} {
            0%   { transform: translateY(-50%); }
            100% { transform: translateY(0%); }
          }
          /* subtle dream-like wobble for 1-9 images */
          @keyframes dreamWobble1 {
            0%   { transform: translate3d(0, 0, 0) scale(1); }
            25%  { transform: translate3d(0.2%, -0.4%, 0) scale(1.008); }
            50%  { transform: translate3d(-0.25%, 0.2%, 0) scale(0.996); }
            75%  { transform: translate3d(0.15%, 0.3%, 0) scale(1.006); }
            100% { transform: translate3d(0, 0, 0) scale(1); }
          }
          @keyframes dreamWobble2 {
            0%   { transform: translate3d(0, 0, 0) scale(1); }
            20%  { transform: translate3d(-0.18%, 0.3%, 0) scale(1.004); }
            50%  { transform: translate3d(0.22%, -0.25%, 0) scale(1.007); }
            80%  { transform: translate3d(-0.12%, 0.18%, 0) scale(0.994); }
            100% { transform: translate3d(0, 0, 0) scale(1); }
          }
          @keyframes dreamWobble3 {
            0%   { transform: translate3d(0, 0, 0) scale(1); }
            30%  { transform: translate3d(0.25%, 0.2%, 0) scale(0.996); }
            60%  { transform: translate3d(-0.2%, -0.3%, 0) scale(1.008); }
            90%  { transform: translate3d(0.1%, 0.12%, 0) scale(1.004); }
            100% { transform: translate3d(0, 0, 0) scale(1); }
          }
        `,
        }}
      />
      {windows.map((w, i) => {
        const isSurvivor = survivors.includes(i);
        const idx = survivors.indexOf(i);
        const tgt = targets[idx] || null;
        if (isSurvivor && tgt) {
          const morph = !!start; // when true, we also square-up and clear filters
          const toSrc = tileSources[idx] || chooseMesySrc(w, i);
          const fromSrc = prevTileSources[idx] || chooseMesySrc(w, i);
          const invert = (i % 2) === 0;
          const baseFilter = invert ? "grayscale(1) invert(1) contrast(1.05)" : "grayscale(1) contrast(1.05)";
          const imgFilter = morph ? "none" : `${baseFilter} blur(0.9px)`;
          const from = {
            left: w.leftVw,
            top: w.topVh,
            width: w.widthVw,
            height: w.heightVh,
          };
          const to = {
            left: tgt.left,
            top: tgt.top,
            width: tgt.width,
            height: tgt.height,
          };
          return (
            <div
              key={`arr_${w.id}`}
              style={{
                position: "absolute",
                left: `${start ? to.left : from.left}vw`,
                top: `${start ? to.top : from.top}vh`,
                width: `${start ? to.width : from.width}vw`,
                height: `${start ? to.height : from.height}vh`,
                background: "rgba(231,233,238,0.56)",
                border: "1px solid rgba(154,160,170,0.45)",
                boxShadow: "0 8px 30px rgba(0,0,0,.25)",
                backdropFilter: "blur(8px) saturate(1.2)",
                WebkitBackdropFilter: "blur(8px) saturate(1.2)",
                borderRadius: 10,
                overflow: "hidden",
                transition:
                  "left 900ms cubic-bezier(0.19,1,0.22,1), top 900ms cubic-bezier(0.19,1,0.22,1), width 900ms cubic-bezier(0.19,1,0.22,1), height 900ms cubic-bezier(0.19,1,0.22,1)",
              }}
            >
              <div
                style={{
                  height: 26, // keep OS titlebar always visible
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 8px",
                  background: "linear-gradient(to bottom, rgba(220,224,232,0.6), rgba(200,204,212,0.6))",
                  borderBottom: "1px solid rgba(154,160,170,0.45)",
                  color: "#222",
                  fontSize: 12,
                  fontWeight: 700,
                  overflow: "hidden",
                }}
              >
                <span>{`window_${i + 1}`}</span>
                <span style={{ letterSpacing: 2, fontWeight: 700 }}>— □ ×</span>
              </div>
              {/* content box that narrows horizontally to become square */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 26,
                  bottom: 0,
                  transform: "translateX(-50%)",
                  height: "calc(100% - 26px)",
                  width: "100%",
                  maxWidth: "100%",
                  transition: "opacity 900ms ease",
                  overflow: "hidden",
                }}
              >
                {/* slide track (200% height) to simulate in-modal vertical scroll */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    height: "200%",
                    animation:
                      pulseDir === "up"
                        ? `tileSlideUp_${pulseKey} 700ms ease-in-out forwards`
                        : pulseDir === "down"
                        ? `tileSlideDown_${pulseKey} 700ms ease-in-out forwards`
                        : "none",
                    willChange: "transform",
                  }}
                >
                  <img
                    src={fromSrc}
                    alt=""
                    style={{
                      width: "100%",
                      height: "50%",
                      objectFit: "cover",
                      display: "block",
                      // Slight blur for 1-9 files when arranged, stronger filters pre-arrange
                      filter: morph ? "blur(0.45px)" : imgFilter,
                      backfaceVisibility: "hidden",
                      transformOrigin: "50% 50%",
                      willChange: "transform",
                      animation: morph
                        ? `${['dreamWobble1','dreamWobble2','dreamWobble3'][idx % 3]} ${6.6 + (idx % 3) * 0.8}s ease-in-out infinite alternate`
                        : "none",
                    }}
                  />
                  <img
                    src={toSrc}
                    alt=""
                    style={{
                      width: "100%",
                      height: "50%",
                      objectFit: "cover",
                      display: "block",
                      // Slight blur for 1-9 files when arranged, stronger filters pre-arrange
                      filter: morph ? "blur(0.45px)" : imgFilter,
                      backfaceVisibility: "hidden",
                      transformOrigin: "50% 50%",
                      willChange: "transform",
                      animation: morph
                        ? `${['dreamWobble1','dreamWobble2','dreamWobble3'][idx % 3]} ${7.0 + (idx % 3) * 0.8}s ease-in-out infinite alternate`
                        : "none",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        }
        return (
          <div
            key={`fall_${w.id}`}
            style={{
              position: "absolute",
              left: `${w.leftVw}vw`,
              top: `${w.topVh}vh`,
              width: `${w.widthVw}vw`,
              height: `${w.heightVh}vh`,
              background: "rgba(231,233,238,0.56)",
              border: "1px solid rgba(154,160,170,0.45)",
              boxShadow: "0 8px 30px rgba(0,0,0,.25)",
              backdropFilter: "blur(8px) saturate(1.2)",
              WebkitBackdropFilter: "blur(8px) saturate(1.2)",
              borderRadius: 10,
              overflow: "hidden",
              animation: `${flingName(i)} 700ms cubic-bezier(0.1,0.8,0.2,1) forwards`,
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
            <div style={{ position: "absolute", inset: "26px 0 0 0", background: "rgba(242,244,247,0.55)" }} />
          </div>
        );
      })}
    </div>
  );
}


