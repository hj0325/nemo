"use client";

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export class GestureEngine {
  value = 0;         // 0..1
  velocity = 0;      // arbitrary units/frame
  raf = 0;
  running = false;
  opts;

  constructor(opts) {
    this.opts = {
      friction: opts.friction ?? 0.08,
      minVelocity: opts.minVelocity ?? 0.00005,
      wheelScale: opts.wheelScale ?? 0.0018,
      touchScale: opts.touchScale ?? 0.0035,
      onUpdate: opts.onUpdate,
    };
  }

  setValue01(next) {
    this.value = clamp01(next);
    this.opts.onUpdate(this.value);
  }

  addWheel(deltaY) {
    this.velocity += deltaY * this.opts.wheelScale;
    this.start();
  }

  addTouchDy(dy) {
    this.velocity += dy * this.opts.touchScale;
    this.start();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.step);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
  }

  step = () => {
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
