"use client";

import { useEffect, useRef } from "react";
import { checkRows, drawRows, type Palette } from "@/game/sprite";

type Props = {
  rows: string[];
  palette: Palette;
  scale?: number;
  className?: string;
};

// Draws at native size; CSS scales it up with hard pixel edges.
export default function PixelSprite({ rows, palette, scale = 4, className }: Props) {
  if (process.env.NODE_ENV !== "production") checkRows(rows, palette);
  const ref = useRef<HTMLCanvasElement>(null);
  const w = rows[0].length;
  const h = rows.length;

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx) drawRows(ctx, rows, palette);
  }, [rows, palette]);

  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      aria-hidden
      className={className}
      style={{ width: w * scale, height: h * scale, imageRendering: "pixelated", display: "block" }}
    />
  );
}
