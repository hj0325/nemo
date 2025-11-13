"use client";

export default function RandomizeButton() {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <button
        onClick={() =>
          window.dispatchEvent(new CustomEvent("bg-gradient:randomize"))
        }
        className="rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2 text-sm text-white hover:bg-white/20 active:scale-[0.98] transition"
        aria-label="Randomize background colors"
      >
        랜덤
      </button>
    </div>
  );
}


