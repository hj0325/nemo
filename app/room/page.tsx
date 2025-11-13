"use client";

import React from "react";
import Room from "@/components/desktop/room/room";

export default function FixedRoomPage() {
  return (
    <Room
      initialCamera={{ x: 4.0, y: 2.7, z: 5.2 }}  // pulled back slightly
      initialLight={{ x: -0.9, y: 12.8, z: -24.0 }} // light preset 1
      initialFov={38}
      hideUI={true}
      showPathSlider={true}
      zoomOnly={true}
    />
  );
}


