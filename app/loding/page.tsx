"use client";

export default function LodingPage() {
  return (
    <main className="min-h-screen w-full bg-black">
      <div className="fixed inset-0 z-0">
        <video
          src="/nemo.mp4"
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      </div>
    </main>
  );
}


