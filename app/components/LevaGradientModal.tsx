"use client";

import { useEffect, useMemo, useState } from "react";
import { Leva, useControls, useCreateStore, folder, button } from "leva";

type GradientStop = {
  id: string;
  color: string;
  position: number;
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function LevaGradientModal() {
  const store = useCreateStore();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [transparentStart, setTransparentStart] = useState<number>(80);
  const [stops, setStops] = useState<GradientStop[]>([
    { id: uid(), color: "#191603", position: 82 },
    { id: uid(), color: "#fffef8", position: 100 },
  ]);
  // Background (WebGL) editor state
  const [c3, setC3] = useState<string>("#000000"); // dark-ochre (black)
  const [c4, setC4] = useState<string>("#0d0a02"); // very dark brown
  const [c5, setC5] = useState<string>("#f6f0d5"); // light warm yellow
  const [yellowStart, setYellowStart] = useState<number>(85.0); // %
  const [yellowEnd, setYellowEnd] = useState<number>(92.6); // %
  const [animAmp, setAnimAmp] = useState<number>(4.45); // %

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
      },
    });
    window.dispatchEvent(event);
  }, [c3, c4, c5, yellowStart, yellowEnd, animAmp]);

  function updateStop(id: string, patch: Partial<GradientStop>) {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function addStop() {
    setStops((prev) => {
      const last = prev[prev.length - 1];
      const nextPos = Math.min(100, (last?.position ?? 80) + 5);
      return [...prev, { id: uid(), color: "#fff4b8", position: nextPos }];
    });
  }
  function removeStop(id: string) {
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
  }

  useControls(
    () => {
      const schema: Record<string, any> = {
        "Fade start (%)": {
          value: transparentStart,
          min: 0,
          max: 100,
          onChange: (v: number) => setTransparentStart(v),
        },
        "Background (3D)": folder(
          {
            "Dark-ochre (c3)": {
              value: c3,
              onChange: (v: string) => setC3(v),
            },
            "Gold (c4)": {
              value: c4,
              onChange: (v: string) => setC4(v),
            },
            "Light yellow (c5)": {
              value: c5,
              onChange: (v: string) => setC5(v),
            },
            "Yellow start (%)": {
              value: yellowStart,
              min: 80,
              max: 99.5,
              onChange: (v: number) => setYellowStart(v),
            },
            "Yellow end (%)": {
              value: yellowEnd,
              min: 81,
              max: 100,
              onChange: (v: number) => setYellowEnd(v),
            },
            "Breath amp (%)": {
              value: animAmp,
              min: 0,
              max: 5,
              onChange: (v: number) => setAnimAmp(v),
            },
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
              onChange: (v: string) => updateStop(s.id, { color: v }),
            },
            [`Position ${index + 1}`]: {
              value: s.position,
              min: 0,
              max: 100,
              onChange: (v: number) => updateStop(s.id, { position: v }),
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

  return (
    <>
      {/* Open button */}
      {!isOpen && (
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
          <Leva
            store={store}
            collapsed={false}
            fill={false}
            theme={{ colors: { elevation2: "#1a1a1a", accent1: "#f4d24b" } } as any}
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


