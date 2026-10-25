"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { checkRows, drawRows, type Palette } from "@/game/sprite";

// Extra sprites drawn on top, on the same pixel grid (accessories, overlays).
export type Layer = { rows: string[]; palette: Palette; x: number; y: number; k?: number };

type Props = {
  rows: string[];
  palette: Palette;
  scale?: number;
  layers?: Layer[];
  className?: string;
  style?: CSSProperties;
};

// Draws at native size; CSS scales it up with hard pixel edges.
export default function PixelSprite({ rows, palette, scale = 4, layers, className, style }: Props) {
  if (process.env.NODE_ENV !== "production") checkRows(rows, palette);
  const ref = useRef<HTMLCanvasElement>(null);
  const w = rows[0].length;
  const h = rows.length;
  // Grow the canvas when layers poke outside the sprite (a hat above the head); margins keep the sprite in place.
  let [top, left, right, bottom] = [0, 0, 0, 0];
  for (const l of layers ?? []) {
    const k = l.k ?? 1;
    top = Math.max(top, -l.y);
    left = Math.max(left, -l.x);
    right = Math.max(right, l.x + l.rows[0].length * k - w);
    bottom = Math.max(bottom, l.y + l.rows.length * k - h);
  }
  const cw = w + left + right;
  const ch = h + top + bottom;

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, cw, ch);
    drawRows(ctx, rows, palette, left, top);
    layers?.forEach((l) => drawRows(ctx, l.rows, l.palette, l.x + left, l.y + top, l.k));
  }, [rows, palette, layers, cw, ch, left, top]);

  return (
    <canvas
      ref={ref}
      width={cw}
      height={ch}
      aria-hidden
      className={className}
      style={{
        width: cw * scale,
        height: ch * scale,
        margin: `${-top * scale}px ${-right * scale}px ${-bottom * scale}px ${-left * scale}px`,
        imageRendering: "pixelated",
        display: "block",
        ...style,
      }}
    />
  );
}
