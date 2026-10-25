"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import PixelSprite from "./PixelSprite";
import { checkRows, type Sprite } from "@/game/sprite";
import { boop } from "@/game/sound";
import styles from "./PixelPet.module.css";

type Props = {
  sprite: Sprite;
  name: string;
  scale?: number;
  motion?: "bounce" | "hop" | "float";
  pitch?: number;
};

export default function PixelPet({ sprite, name, scale = 6, motion = "bounce", pitch }: Props) {
  if (process.env.NODE_ENV !== "production") checkRows(sprite.rows, sprite.palette, 32);
  const [blinking, setBlinking] = useState(false);
  const squishRef = useRef<HTMLDivElement>(null);

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

  const rows = useMemo(
    () => (blinking && sprite.blink ? sprite.rows.map((r, i) => sprite.blink?.[i] ?? r) : sprite.rows),
    [blinking, sprite],
  );

  const pet = () => {
    boop(pitch);
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
          <PixelSprite rows={rows} palette={sprite.palette} scale={scale} />
        </div>
      </div>
    </button>
  );
}
