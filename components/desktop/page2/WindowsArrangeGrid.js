"use client";

export default function WindowsArrangeGrid({
  windows,
  survivors,
  moods = [],
  moodIndex = 0,
  scrollPulseDir = null,
  scrollKey = 0,
}) {
  const chooseMesySrc = (w, i) => {
    const ww = parseFloat(w.widthVw ?? parseFloat(w.width || "0"));
    const hh = parseFloat(w.heightVh ?? parseFloat(w.height || "0"));
    if (!isFinite(ww) || !isFinite(hh) || ww <= 0 || hh <= 0) {
      const fallback = (i % 11) + 1;
      return `/2d/mesy/img${fallback}.png`;
    }
    const r = ww / hh;
    const wide = [2, 5, 8, 11];
    const tall = [3, 6, 9];
    const square = [1, 4, 7, 10];
    if (r >= 1.25) {
      const pick = wide[i % wide.length];
      return `/2d/mesy/img${pick}.png`;
    }
    if (r <= 0.8) {
      const pick = tall[i % tall.length];
      return `/2d/mesy/img${pick}.png`;
    }
    const pick = square[i % square.length];
    return `/2d/mesy/img${pick}.png`;
  };
  const choosePicsumSrc = (i) => {
    // use mood name as seed for consistency across 9 tiles
    const has = Array.isArray(moods) && moods.length > 0;
    if (!has) return null;
    const mood = moods[(moodIndex % moods.length + moods.length) % moods.length]?.name || "nemo";
    const seed = encodeURIComponent(`${mood}-${i}`);
    // fixed size; objectFit: cover handles crop
    return `https://picsum.photos/seed/${seed}/1200/800`;
  };
  const moodStyle = (() => {
    const m = Array.isArray(moods) && moods.length ? moods[(moodIndex % moods.length + moods.length) % moods.length] : null;
    return {
      overlay: m?.overlay || "rgba(0,0,0,0)",
      filter: m?.filter || "none",
    };
  })();
  const pulseAnim =
    scrollPulseDir === "up"
      ? "modalPulseUp 1200ms ease-in-out"
      : scrollPulseDir === "down"
      ? "modalPulseDown 1200ms ease-in-out"
      : "none";
  // Only render survivor windows (9개). If survivors 미지정, 첫 9개 사용
  const renderList = Array.isArray(survivors) && survivors.length
    ? survivors.map((idx) => windows[idx]).filter(Boolean).slice(0, 9)
    : windows.slice(0, 9);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows: "repeat(3, 1fr)",
        columnGap: 0,
        rowGap: 0,
        padding: 0,
        zIndex: 6,
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes modalScrollY {
              0%   { transform: translateY(0%); }
              100% { transform: translateY(-50%); }
            }
            @keyframes modalPulseUp {
              0%   { transform: translateY(0%); }
              50%  { transform: translateY(-50%); }
              100% { transform: translateY(0%); }
            }
            @keyframes modalPulseDown {
              0%   { transform: translateY(0%); }
              50%  { transform: translateY(50%); }
              100% { transform: translateY(0%); }
            }
          `,
        }}
      />
      {renderList.map((w, i) => {
        const picsum = choosePicsumSrc(i);
        const src = picsum || chooseMesySrc(w, i);
        const withScroll = i % 4 === 0; // 일부만 스크롤 효과
        const dur = 7 + (i % 4) * 1.4;
        return (
          <div
            key={`grid_${w.id}`}
            style={{
              background: "#e7e9ee",
              border: "1px solid #9aa0aa",
              boxShadow: "0 8px 30px rgba(0,0,0,.25)",
              pointerEvents: "none",
              boxSizing: "border-box",
              overflow: "hidden",
              display: "grid",
              gridTemplateRows: "26px 1fr",
            }}
          >
            <div
              style={{
                height: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 8px",
                background: "#c8ccd4",
                borderBottom: "1px solid #9aa0aa",
                color: "#222",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <span>{`window_${i + 1}`}</span>
              <span style={{ letterSpacing: 2, fontWeight: 700 }}>— □ ×</span>
            </div>
            <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", filter: moodStyle.filter }}>
              {/* mood overlay */}
              <div style={{ position: "absolute", inset: 0, background: moodStyle.overlay, mixBlendMode: "multiply", pointerEvents: "none", zIndex: 2 }} />
              {/* track for pulse scroll */}
              <div
                key={`${scrollKey}-${i}`}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  height: "200%",
                  animation: pulseAnim,
                }}
              >
                <img src={src} alt="" style={{ width: "100%", height: "50%", objectFit: "cover", display: "block" }} />
                <img src={src} alt="" style={{ width: "100%", height: "50%", objectFit: "cover", display: "block" }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


