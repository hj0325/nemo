"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function IntroSequence() {
  const [showLogo, setShowLogo] = useState(true);
  const [logoFading, setLogoFading] = useState(false);
  const [showCenterHint, setShowCenterHint] = useState(false);

  useEffect(() => {
    // Hold visible for 3s AFTER all fade-ins complete (~3s), so total ~6s
    const t1 = setTimeout(() => {
      setLogoFading(true); // start fade-out after 3s
      const t2 = setTimeout(() => {
        setShowLogo(false);
        setShowCenterHint(true);
        // enable scroll interaction once the hint appears
        window.dispatchEvent(new CustomEvent("bg-gradient:enable-scroll"));
      }, 700); // match fade-out duration
      return () => clearTimeout(t2);
    }, 6000);

    function onProgress(e) {
      const v = (e).detail;
      if (typeof v === "number" && v > 0.001) {
        setShowCenterHint(false);
      }
    }
    window.addEventListener("bg-gradient:progress", onProgress);
    return () => {
      clearTimeout(t1);
      window.removeEventListener("bg-gradient:progress", onProgress);
    };
  }, []);

  return (
    <>
      {showLogo && (
        <div className={`fixed inset-0 z-30 flex items-center justify-center ${logoFading ? "fade-out-700" : "fade-in-1s"}`}>
          <div className="flex flex-col items-center text-center px-4">
            <Image
              src="/nemo.png"
              alt="Nemo"
              width={200}
              height={200}
              priority
              className="fade-in-3s -mt-6 mb-2"
            />
            <p className="fade-in-delayed text-white/90 text-[14px] sm:text-[14px] leading-snug max-w-[34ch] whitespace-pre-line break-keep" style={{ textWrap: "balance" }}>
              네모나게 각진 세상 속,{"\n"}
              나만의 휴식의 틈이 필요하신가요?{"\n"}
              화면을 스크롤 하며 여러분만의 ‘틈’의 창을 만들어보세요.
            </p>
          </div>
        </div>
      )}

      {showCenterHint && (
        <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
          <div className="rounded-full bg-white/10 border border-white/25 text-white/95 px-5 py-2 text-sm backdrop-blur-md fade-in-1s">
            화면을 스크롤하여 제작을 시작하세요
          </div>
        </div>
      )}
    </>
  );
}


