import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

// Deterministic pattern of rounded rectangles (colSpan,rowSpan) cycling
const SHAPES = [
  [3, 2],
  [2, 3],
  [4, 2],
  [2, 2],
  [3, 3],
  [2, 1],
  [1, 2],
  [4, 3],
  [3, 1],
  [5, 2],
];

export default function BlidingPage() {
  const [connected, setConnected] = useState(false);
  const [items, setItems] = useState([]); // {id,url,col,row}
  const shapeIdxRef = useRef(0);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io({ path: "/api/socketio" });
    socketRef.current = socket;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onGenClear = () => {
      // optional external clear
      setItems([]);
    };
    const onGenImage = ({ url }) => {
      if (!url) return;
      const [cs, rs] = SHAPES[shapeIdxRef.current % SHAPES.length];
      shapeIdxRef.current++;
      const id = Date.now() + "_" + Math.random().toString(36).slice(2, 8);
      setItems((prev) => [...prev, { id, url, col: cs, row: rs }]);
    };
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("genClear", onGenClear);
    socket.on("genImage", onGenImage);
    // late-join sync via localStorage
    const key = "bliding_images";
    const syncFromStorage = () => {
      try {
        const raw = typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
        if (!raw) return;
        const arr = JSON.parse(raw || "[]");
        const next = [];
        arr.forEach((e) => {
          if (!e?.url) return;
          const [cs, rs] = SHAPES[shapeIdxRef.current % SHAPES.length];
          shapeIdxRef.current++;
          next.push({ id: (e.t || Date.now()) + "_" + Math.random().toString(36).slice(2, 8), url: e.url, col: cs, row: rs });
        });
        if (next.length) setItems(next);
      } catch {}
    };
    syncFromStorage();
    const onStorage = (ev) => {
      if (ev.key === key) syncFromStorage();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("genClear", onGenClear);
      socket.off("genImage", onGenImage);
      socket.disconnect();
      socketRef.current = null;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // 12-column grid; auto-flow dense for TL->BR packing
  const gridCols = 12;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f1115",
        color: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{ width: "min(96vw, 96vh)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 13, color: "#bfc3ca" }}>{connected ? "connected" : "disconnected"}</div>
          <div style={{ fontSize: 12, color: "#8a90a0" }}>{items.length} images</div>
        </div>
        <div
          style={{
            width: "100%",
            border: "1px solid #23262d",
            borderRadius: 16,
            overflow: "hidden",
            background: "#050607",
            padding: 14,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
              gridAutoRows: 26,
              gridAutoFlow: "dense",
              gap: 10,
            }}
          >
            {items.map((it) => {
              const colSpan = Math.min(gridCols, Math.max(1, it.col));
              const rowSpan = Math.max(1, it.row);
              return (
                <div
                  key={it.id}
                  style={{
                    gridColumn: `span ${colSpan}`,
                    gridRow: `span ${rowSpan}`,
                    borderRadius: 16,
                    overflow: "hidden",
                    background: "#0b0d12",
                    border: "1px solid #23262d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 0 1px rgba(0,0,0,.4) inset",
                    position: "relative",
                    transition: "transform .3s ease, opacity .3s ease",
                    opacity: 1,
                  }}
                >
                  <img
                    src={it.url}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


