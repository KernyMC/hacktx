"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { drawHabitat, H, W, type Habitat, type Phase } from "@/game/habitat";

// The pet's scene at 3x, with children (the pet) standing on the ground line.
export default function HabitatView({ habitat, phase, children }: { habitat: Habitat; phase: Phase; children?: ReactNode }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx) drawHabitat(ctx, habitat, phase);
  }, [habitat, phase]);

  return (
    <div className="relative mx-auto overflow-hidden" style={{ width: W * 3, height: H * 3 }}>
      <canvas ref={ref} width={W} height={H} aria-hidden style={{ width: W * 3, height: H * 3, imageRendering: "pixelated", display: "block" }} />
      <div className="absolute bottom-[24px] left-1/2 -translate-x-1/2">{children}</div>
    </div>
  );
}
