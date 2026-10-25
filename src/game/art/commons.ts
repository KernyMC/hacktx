import type { Sprite } from "../sprite";

// Common tier: 16x16, few colors, chunky shapes.

export const mochi: Sprite = {
  palette: { o: "#3a2340", b: "#ff9ec4", s: "#e0679a", h: "#ffe0ee", p: "#ff5c8a" },
  rows: [
    "................",
    "................",
    "................",
    "......oooo......",
    "....oohhbboo....",
    "...ohhbbbbbbo...",
    "..ohbbbbbbbbso..",
    "..obbbbbbbbbso..",
    ".obbbobbbbobbso.",
    ".obbbobbbbobbso.",
    ".obppbboobbppso.",
    "obbbbbbbbbbbbsso",
    "obbbbbbbbbbbbsso",
    "osbbbbbbbbbbssso",
    ".osssssssssssso.",
    "..oooooooooooo..",
  ],
  blink: { 8: ".obbbbbbbbbbbso." },
};

export const pip: Sprite = {
  palette: { o: "#3d2a14", b: "#ffd84a", s: "#e8a92a", h: "#fff3a0", k: "#ff8c2a", p: "#ff9a8a" },
  rows: [
    "................",
    "........oo......",
    ".......obo......",
    ".....oobboo.....",
    "....ohhbbbbo....",
    "...ohbbbbbbbo...",
    "...obbbbbbbso...",
    "..obbbobbobbso..",
    "..obbbobbobbso..",
    "..obpbbkkbbpso..",
    "..obbbbkkbbbso..",
    ".osbbbbbbbbbbso.",
    ".osbbbbbbbbbsso.",
    "..ossbbbbbbsso..",
    "...oooooooooo...",
    ".....kk..kk.....",
  ],
  blink: { 7: "..obbbbbbbbbso.." },
};

export const nib: Sprite = {
  palette: { o: "#2a1f1a", r: "#e04a3c", d: "#a8302a", l: "#ff7a66", w: "#fff3e0", b: "#f4e3c3", s: "#d4b98f", p: "#ff9a8a" },
  rows: [
    "................",
    ".....oooooo.....",
    "...olrrrwwrro...",
    "..olwwrrrrrrdo..",
    ".orwwrrrrrrwwdo.",
    ".orrrrrwwrrrrdo.",
    "oddrrrrrrrrrrddo",
    ".oooooooooooooo.",
    "...obbbbbbbbo...",
    "...obbobbobso...",
    "...obbobbobso...",
    "...obpboobpso...",
    "...obbbbbbbso...",
    "...osbbbbbsso...",
    "....oooooooo....",
    "................",
  ],
  blink: { 9: "...obbbbbbbso..." },
};
