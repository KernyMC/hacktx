"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import PixelSprite, { type Layer } from "./PixelSprite";
import { checkRows, withBlink, type Sprite } from "@/game/sprite";
import { boop } from "@/game/sound";
import styles from "./PixelPet.module.css";

type Props = {
  sprite: Sprite;
  name: string;
  scale?: number;
  motion?: "bounce" | "hop" | "float";
  pitch?: number;
  layers?: Layer[];
  flip?: boolean;
  onPet?: () => void;
};

const FRAME_MS = 160;

export default function PixelPet({ sprite, name, scale = 6, motion = "bounce", pitch, layers, flip, onPet }: Props) {
  if (process.env.NODE_ENV !== "production") checkRows(sprite.rows, sprite.palette, sprite.rows.length);
  const [blinking, setBlinking] = useState(false);
  const [frame, setFrame] = useState(0);
  const squishRef = useRef<HTMLDivElement>(null);
  const frameCount = sprite.frames?.length ?? 0;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      timer = setTimeout(() => {
        setBlinking(true);
        timer = setTimeout(() => {
          setBlinking(false);
          next();
        }, 140);
      }, 2200 + Math.random() * 2800);
    };
    next();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!frameCount) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % frameCount), FRAME_MS);
    return () => clearInterval(id);
  }, [frameCount]);

  const rows = useMemo(() => {
    const base = sprite.frames?.[frame % frameCount] ?? sprite.rows;
    return blinking && sprite.blink ? withBlink(base, sprite.blink) : base;
  }, [blinking, frame, frameCount, sprite]);

  const pet = () => {
    boop(pitch);
    onPet?.();
    squishRef.current?.animate(
      [
        { transform: "scale(1, 1)" },
        { transform: "scale(1.18, 0.8)" },
        { transform: "scale(0.9, 1.12)" },
        { transform: "scale(1.04, 0.97)" },
        { transform: "scale(1, 1)" },
      ],
      { duration: 380, easing: "steps(8, end)" },
    );
  };

  return (
    <button type="button" aria-label={`Pet ${name}`} onClick={pet} className={styles.pet}>
      <div className={styles[motion]} style={{ "--px": `${scale}px` } as CSSProperties}>
        <div ref={squishRef} style={{ transformOrigin: "50% 100%" }}>
          <PixelSprite rows={rows} palette={sprite.palette} scale={scale} layers={layers} style={flip ? { transform: "scaleY(-1)" } : undefined} />
        </div>
      </div>
    </button>
  );
}
