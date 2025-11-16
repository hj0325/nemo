"use client";

export type GestureEngineOptions = {
  onUpdate: (value01: number) => void;
  friction?: number;      // per-frame damping (0..1), e.g. 0.08
  minVelocity?: number;   // stop threshold, e.g. 0.00005
  wheelScale?: number;    // wheel deltaY -> velocity
  touchScale?: number;    // touch dy -> velocity
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export class GestureEngine {
  private value = 0;         // 0..1
  private velocity = 0;      // arbitrary units/frame
  private raf = 0;
  private running = false;
  private opts: Required<GestureEngineOptions>;

  constructor(opts: GestureEngineOptions) {
    this.opts = {
      friction: opts.friction ?? 0.08,
      minVelocity: opts.minVelocity ?? 0.00005,
      wheelScale: opts.wheelScale ?? 0.0018,
      touchScale: opts.touchScale ?? 0.0035,
      onUpdate: opts.onUpdate,
    };
  }

  setValue01(next: number) {
    this.value = clamp01(next);
    this.opts.onUpdate(this.value);
  }

  addWheel(deltaY: number) {
    this.velocity += deltaY * this.opts.wheelScale;
    this.start();
  }

  addTouchDy(dy: number) {
    this.velocity += dy * this.opts.touchScale;
    this.start();
  }

  private start() {
    if (this.running) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.step);
  }

  private stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
  }

  private step = () => {
    // integrate velocity
    this.value = clamp01(this.value + this.velocity);
    this.opts.onUpdate(this.value);
    // apply damping
    this.velocity *= 1 - this.opts.friction;
    // stop if velocity is tiny
    if (Math.abs(this.velocity) < this.opts.minVelocity) {
      this.stop();
      return;
    }
    this.raf = requestAnimationFrame(this.step);
  };

  dispose() {
    this.stop();
  }
}


