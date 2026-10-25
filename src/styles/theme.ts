import type { CSSProperties } from "react";

// One pet's UI colors. Applied as CSS variables; frame classes in pixel.css read them.
export type Skin = {
  outline: string;
  panel: string;
  panelLight: string;
  panelDark: string;
  button: string;
  buttonLight: string;
  buttonDark: string;
  text: string;
  buttonText: string;
  accent: string;
  accentShine: string;
  screen: string;
};

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export const skinVars = (skin: Skin) =>
  Object.fromEntries(Object.entries(skin).map(([k, v]) => [`--${kebab(k)}`, v])) as CSSProperties;

// Square edges with notched pixel corners.
export const notch = (color: string, w = 3) =>
  `${w}px 0 0 0 ${color}, -${w}px 0 0 0 ${color}, 0 ${w}px 0 0 ${color}, 0 -${w}px 0 0 ${color}`;
