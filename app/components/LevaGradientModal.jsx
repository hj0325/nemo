"use client";

import { useEffect, useMemo, useState } from "react";
import { Leva, useControls, useCreateStore, folder, button } from "leva";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function LevaGradientModal() {
  // Casted Leva to any for passing custom store without TS friction
  const LevaAny = Leva;
  const store = useCreateStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showTrigger, setShowTrigger] = useState(true); // hide trigger on final screen
  const [transparentStart, setTransparentStart] = useState(80);
  const [stops, setStops] = useState([
    { id: uid(), color: "#191603", position: 82 },
    { id: uid(), color: "#fffef8", position: 100 },
  ]);
  // Background (WebGL) editor state
  const [c3, setC3] = useState("#000000"); // dark-ochre (black)
  const [c4, setC4] = useState("#0d0a02"); // very dark brown
  const [c5, setC5] = useState("#f6f0d5"); // light warm yellow
  const [yellowStart, setYellowStart] = useState(85.0); // %
  const [yellowEnd, setYellowEnd] = useState(92.6); // %
  const [animAmp, setAnimAmp] = useState(4.45); // %
  // Coordinate overrides (explicit top/bottom band positions)
  const [topStart, setTopStart] = useState(85.0);
  const [topEnd, setTopEnd] = useState(93.0);
  // New bottom white gradient controls
  const [bottomWhiteStart, setBottomWhiteStart] = useState(7.0);
  const [bottomWhiteEnd, setBottomWhiteEnd] = useState(63.0);
  const [bottomWhiteColor, setBottomWhiteColor] = useState("#f6f0d5");
  const [bottomAnimAmp, setBottomAnimAmp] = useState(4.45);
  const [linkBottomMotion, setLinkBottomMotion] = useState(true);
  const [debugAxis, setDebugAxis] = useState(false);

  const gradientCss = useMemo(() => {
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    const head = `rgba(0,0,0,0) ${transparentStart}%`;
    const parts = sorted.map((s) => `${s.color} ${s.position}%`);
    return `linear-gradient(180deg, ${[head, ...parts].join(", ")})`;
  }, [stops, transparentStart]);

  useEffect(() => {
    document.documentElement.style.setProperty("--gradient", gradientCss);
  }, [gradientCss]);

  // Push updates to the WebGL background (normalized 0-1 where needed)
  useEffect(() => {
    const event = new CustomEvent("bg-gradient:update", {
      detail: {
        c3,
        c4,
        c5,
        yellowStart: Math.min(0.995, Math.max(0.80, yellowStart / 100)),
        yellowEnd: Math.min(1.0, Math.max(0.805, yellowEnd / 100)),
        animAmp: Math.max(0.0, animAmp / 100),
        topStart: Math.min(0.999, Math.max(0.0, topStart / 100)),
        topEnd: Math.min(1.0, Math.max(0.0, topEnd / 100)),
        bottomWhiteStart: Math.min(0.999, Math.max(0.0, bottomWhiteStart / 100)),
        bottomWhiteEnd: Math.min(1.0, Math.max(0.0, bottomWhiteEnd / 100)),
        bottomWhiteColor,
        bottomAnimAmp: Math.max(0.0, bottomAnimAmp / 100),
        linkBottomMotion: linkBottomMotion ? 1.0 : 0.0,
        debugAxis: debugAxis ? 1.0 : 0.0,
      },
    });
    window.dispatchEvent(event);
  }, [c3, c4, c5, yellowStart, yellowEnd, animAmp, topStart, topEnd, bottomWhiteStart, bottomWhiteEnd, bottomWhiteColor, bottomAnimAmp, linkBottomMotion, debugAxis]);

  function updateStop(id, patch) {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function addStop() {
    setStops((prev) => {
      const last = prev[prev.length - 1];
      const nextPos = Math.min(100, (last?.position ?? 80) + 5);
      return [...prev, { id: uid(), color: "#fff4b8", position: nextPos }];
    });
  }
  function removeStop(id) {
    setStops((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
  }
  function resetDefaults() {
    setTransparentStart(80);
    setStops([
      { id: uid(), color: "#191603", position: 82 },
      { id: uid(), color: "#fffef8", position: 100 },
    ]);
  }
  function resetBackground() {
    setC3("#000000");
    setC4("#0d0a02");
    setC5("#f6f0d5");
    setYellowStart(85.0);
    setYellowEnd(92.6);
    setAnimAmp(4.45);
    setTopStart(85.0);
    setTopEnd(93.0);
    setBottomWhiteStart(7.0);
    setBottomWhiteEnd(63.0);
    setBottomWhiteColor("#f6f0d5");
    setBottomAnimAmp(4.45);
    setLinkBottomMotion(true);
    setDebugAxis(false);
  }

  useControls(
    () => {
      const schema = {
        "Fade start (%)": {
          value: transparentStart,
          min: 0,
          max: 100,
          onChange: (v) => setTransparentStart(v),
        },
        "Background (3D)": folder(
          {
            "Dark-ochre (c3)": {
              value: c3,
              onChange: (v) => setC3(v),
            },
            "Gold (c4)": {
              value: c4,
              onChange: (v) => setC4(v),
            },
            "Light yellow (c5)": {
              value: c5,
              onChange: (v) => setC5(v),
            },
            "Yellow start (%)": {
              value: yellowStart,
              min: 80,
              max: 99.5,
              onChange: (v) => setYellowStart(v),
            },
            "Yellow end (%)": {
              value: yellowEnd,
              min: 81,
              max: 100,
              onChange: (v) => setYellowEnd(v),
            },
            "Breath amp (%)": {
              value: animAmp,
              min: 0,
              max: 5,
              onChange: (v) => setAnimAmp(v),
            },
            Coordinates: folder(
              {
                "Top start (%)": {
                  value: topStart,
                  min: 0,
                  max: 100,
                  onChange: (v) => setTopStart(v),
                },
                "Top end (%)": {
                  value: topEnd,
                  min: 0,
                  max: 100,
                  onChange: (v) => setTopEnd(v),
                },
                "Bottom white start (%)": {
                  value: bottomWhiteStart,
                  min: 0,
                  max: 100,
                  onChange: (v) => setBottomWhiteStart(v),
                },
                "Bottom white end (%)": {
                  value: bottomWhiteEnd,
                  min: 0,
                  max: 100,
                  onChange: (v) => setBottomWhiteEnd(v),
                },
                "Bottom white color": {
                  value: bottomWhiteColor,
                  onChange: (v) => setBottomWhiteColor(v),
                },
                "Link bottom motion to top": {
                  value: linkBottomMotion,
                  onChange: (v) => setLinkBottomMotion(v),
                },
                "Bottom breath amp (%)": {
                  value: bottomAnimAmp,
                  min: 0,
                  max: 5,
                  onChange: (v) => setBottomAnimAmp(v),
                },
              },
              { collapsed: true }
            ),
            Debug: folder(
              {
                "Show debug axis": {
                  value: debugAxis,
                  onChange: (v) => setDebugAxis(v),
                },
              },
              { collapsed: false }
            ),
            "Reset background": button(resetBackground),
          },
          { collapsed: false }
        ),
        Actions: folder(
          {
            "Add stop": button(addStop),
            Reset: button(resetDefaults),
            "Close panel": button(() => setIsOpen(false)),
          },
          { collapsed: false }
        ),
      };
      stops.forEach((s, index) => {
        schema[`Stop ${index + 1}`] = folder(
          {
            [`Color ${index + 1}`]: {
              value: s.color,
              onChange: (v) => updateStop(s.id, { color: v }),
            },
            [`Position ${index + 1}`]: {
              value: s.position,
              min: 0,
              max: 100,
              onChange: (v) => updateStop(s.id, { position: v }),
            },
            [`Remove ${index + 1}`]: button(() => removeStop(s.id)),
          },
          { collapsed: false }
        );
      });
      return schema;
    },
    { store, collapsed: false },
    [stops, transparentStart, c3, c4, c5, yellowStart, yellowEnd, animAmp]
  );

  // Hide editor trigger and close panel on final screen
  useEffect(() => {
    function onFinal() {
      setIsOpen(false);
      setShowTrigger(false);
    }
    window.addEventListener("bg-gradient:final", onFinal);
    return () => window.removeEventListener("bg-gradient:final", onFinal);
  }, []);

  return (
    <>
      {/* Open button */}
      {!isOpen && showTrigger && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 backdrop-blur-md border border-white/10"
        >
          Open gradient controls
        </button>
      )}

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          {/* Leva attaches to body, keep open while modal visible */}
          <LevaAny
            store={store}
            collapsed={false}
            fill={false}
            theme={{ colors: { elevation2: "#1a1a1a", accent1: "#f4d24b" } }}
          />
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 rounded-md bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20 border border-white/10"
            aria-label="Close gradient controls"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}


