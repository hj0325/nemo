"use client";

import { useEffect, useState } from "react";

export default function TopQuestion() {
  const [show, setShow] = useState(false);
  const [text, setText] = useState("하루 중 어떤 시간에 휴식이 필요하신가요?");
  const [stage, setStage] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    function onProgress(e: Event) {
      const v = (e as CustomEvent).detail as number;
      if (typeof v === "number" && v > 0.001) setShow(true);
    }
    function onSelect() {
      // change text after flash finishes (~1100ms) and show again
      setShow(false);
      setTimeout(() => {
        if (stage === 1) {
          // move to stage 2 question
          setText("창밖에 어떤 빛이 보였으면 좋겠나요?");
          setShow(true);
          setStage(2);
          window.dispatchEvent(new CustomEvent("bg-gradient:stage2"));
          // ensure scroll interaction is enabled again for stage 2
          window.dispatchEvent(new CustomEvent("bg-gradient:enable-scroll"));
        } else if (stage === 2) {
          // move to stage 3 question
          setText("휴식의 순간, 당신은 어떤 감정을 느끼고 싶나요?");
          setShow(true);
          setStage(3);
          window.dispatchEvent(new CustomEvent("bg-gradient:stage3"));
        } else {
          // stage 3 selected again: keep showing same question
          setShow(true);
        }
      }, 1100);
    }
    window.addEventListener("bg-gradient:progress", onProgress as EventListener);
    window.addEventListener("bg-gradient:select", onSelect as EventListener);
    return () => {
      window.removeEventListener("bg-gradient:progress", onProgress as EventListener);
      window.removeEventListener("bg-gradient:select", onSelect as EventListener);
    };
  }, []);

  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
      <div className="rounded-full bg-white/10 border border-white/25 text-white/95 px-5 py-2 text-sm backdrop-blur-md fade-in-1s text-center whitespace-nowrap">
        {text}
      </div>
    </div>
  );
}


