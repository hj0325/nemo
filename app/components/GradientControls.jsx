"use client";

import { useEffect, useMemo, useState } from "react";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function GradientControls() {
  const [transparentStart, setTransparentStart] = useState(71);
  const [stops, setStops] = useState([
    { id: uid(), color: "#373215", position: 82 },
    { id: uid(), color: "#fff4b8", position: 100 },
  ]);
  const [open, setOpen] = useState(true);

  const gradientCss = useMemo(() => {
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    const stopParts = sorted.map((s) => `${s.color} ${s.position}%`);
    const head = `rgba(0,0,0,0) ${transparentStart}%`;
    return `linear-gradient(180deg, ${[head, ...stopParts].join(", ")})`;
  }, [stops, transparentStart]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--gradient", gradientCss);
    }
  }, [gradientCss]);

  function updateStop(id, patch) {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function addStop() {
    const lastPos = stops.length ? Math.min(100, stops[stops.length - 1].position + 5) : 80;
    setStops((prev) => [...prev, { id: uid(), color: "#fff4b8", position: lastPos }]);
  }

  function removeStop(id) {
    setStops((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
  }

  function resetDefaults() {
    setTransparentStart(71);
    setStops([
      { id: uid(), color: "#373215", position: 82 },
      { id: uid(), color: "#fff4b8", position: 100 },
    ]);
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-xl border border-white/10 bg-black/50 p-3 backdrop-blur-md shadow-lg text-white w-[min(92vw,720px)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">Gradient controls</span>
        <div className="flex gap-2">
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-md bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
            aria-expanded={open}
            aria-controls="gradient-controls-panel"
          >
            {open ? "Collapse" : "Expand"}
          </button>
          <button
            onClick={addStop}
            className="rounded-md bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
          >
            + Add color
          </button>
          <button
            onClick={resetDefaults}
            className="rounded-md bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
          >
            Reset
          </button>
        </div>
      </div>

      <div id="gradient-controls-panel" className={`${open ? "block" : "hidden"}`}>
        <div className="mb-3">
        <label className="mb-1 block text-xs text-white/80">
          Fade start (transparent → colors): {transparentStart}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={transparentStart}
          onChange={(e) => setTransparentStart(Number(e.target.value))}
          className="w-full accent-yellow-300"
        />
        </div>

        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
        {stops
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((stop, idx) => (
            <div
              key={stop.id}
              className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                  className="h-6 w-6 cursor-pointer rounded border border-white/20 bg-transparent p-0"
                  aria-label={`Color ${idx + 1}`}
                />
                <span className="text-xs text-white/70">#{idx + 1}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={stop.position}
                onChange={(e) => updateStop(stop.id, { position: Number(e.target.value) })}
                className="w-full accent-yellow-300"
                aria-label={`Position ${idx + 1}`}
              />
              <span className="w-10 text-right text-xs tabular-nums">{stop.position}%</span>
              <button
                onClick={() => removeStop(stop.id)}
                className="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                aria-label={`Remove stop ${idx + 1}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


