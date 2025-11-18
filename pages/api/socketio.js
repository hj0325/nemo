// Next.js (pages router) Socket.IO server
import { Server } from "socket.io";

export default function handler(req, res) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: "/api/socketio",
      addTrailingSlash: false,
      cors: { origin: "*", methods: ["GET", "POST"] },
    });
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      // Landing proceed trigger (e.g., mobile connected/scanned)
      socket.on("landingProceed", (payload) => {
        io.emit("landingProceed", { ts: Date.now(), ...(payload || {}) });
      });
      socket.on("next", () => {
        io.emit("next");
      });
      socket.on("prev", () => {
        io.emit("prev");
      });
      socket.on("progress", (value) => {
        io.emit("progress", typeof value === "number" ? value : 0);
      });
      socket.on("setStep", (value) => {
        io.emit("setStep", typeof value === "number" ? value : 0);
      });
      socket.on("overlayOpacity", (value) => {
        io.emit("overlayOpacity", typeof value === "number" ? value : 0);
      });
      socket.on("overlayIndex", (value) => {
        // Expect 0-based integer index
        const v = typeof value === "number" ? Math.floor(value) : 0;
        io.emit("overlayIndex", v);
      });
      socket.on("healingText", (value) => {
        const text = typeof value === "string" ? value : "";
        io.emit("healingText", text);
      });
      // Generated image tiling instructions for bliding page
      socket.on("genImage", (payload) => {
        // payload: { url: string, cols?: number, rows?: number, delayMs?: number }
        const url = payload && typeof payload.url === "string" ? payload.url : "";
        if (!url) return;
        const cols = Math.max(1, Math.min(64, Number(payload?.cols ?? 12)));
        const rows = Math.max(1, Math.min(64, Number(payload?.rows ?? 12)));
        const delayMs = Math.max(0, Math.min(2000, Number(payload?.delayMs ?? 40)));
        io.emit("genImage", { url, cols, rows, delayMs });
      });
      socket.on("genClear", () => {
        io.emit("genClear");
      });
    });
  }
  res.end();
}


