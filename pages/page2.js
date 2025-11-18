"use client";

import { useEffect, useRef, useState } from "react";

export default function Page2() {
  const [show, setShow] = useState(false);
  const vidRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => {
      setShow(true);
      const v = vidRef.current;
      if (v) {
        const p = v.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      }
    }, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        background: "#000",
        overflow: "hidden",
      }}
    >
      {show ? (
        <video
          ref={vidRef}
          src="/vid/nemo.mp4"
          playsInline
          muted
          controls={false}
          autoPlay
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          onError={(e) => {
            // noop
          }}
        />
      ) : null}
    </div>
  );
}


