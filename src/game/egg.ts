import type { Sprite } from "./sprite";

// 24x24 egg. "t" spots take the tier color during a reveal; cracks are drawn in "o".
export const egg: Sprite = {
  palette: { o: "#3b2a3a", e: "#fff6e6", s: "#e8d8bf", h: "#ffffff", t: "#c9b8ff" },
  rows: [
    "........................",
    ".........oooooo.........",
    ".......ohhheeesso.......",
    "......ohhheeeeesso......",
    ".....ohhheeeeeeesso.....",
    ".....ohhhtteeeeesso.....",
    "....ohhhttteeeeeesso....",
    "....oheeeteeeeeeesso....",
    "....oheeeeeeeeteesso....",
    "...oheeeeeeeetteeesso...",
    "...oeeeeeeeettteeesso...",
    "...oetteeeeeeteeeesso...",
    "...oettteeeeeeeeeesso...",
    "...oeetteeeeeeeettsso...",
    "...oeeeeeeeeeeetttsso...",
    "...oeeeeteeeeeeetesso...",
    "...oeeettteeeeeeeesso...",
    "....oseetteeeeeessso....",
    "....oseeeeeeeeeessso....",
    ".....osssssssssssso.....",
    "......osssssssssso......",
    ".......oooooooooo.......",
    "........................",
    "........................",
  ],
};

// Zigzag crack across the middle; each stage reveals more of it.
const crack: [number, number][] = [
  [19, 9], [18, 10], [17, 9], [16, 10], [15, 11], [14, 10], [13, 11], [12, 12],
  [11, 11], [10, 12], [9, 13], [8, 12], [7, 13], [6, 12], [5, 13], [4, 12], [12, 13], [12, 14],
];

export function eggStage(stage: 0 | 1 | 2 | 3): string[] {
  const n = [0, 4, 9, crack.length][stage];
  const rows = egg.rows.map((r) => r.split(""));
  for (const [x, y] of crack.slice(0, n)) rows[y][x] = "o";
  return rows.map((r) => r.join(""));
}
