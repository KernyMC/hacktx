import type { Habitat } from "./habitat";

// One scene per pet. Coordinates are on the 130x100 habitat grid; pets stand around y = 88.

const flower = { rows: [".p.", "pyp", ".p.", ".g."], palette: { p: "#ff8fb8", y: "#fff3a8", g: "#3f7a3a" } };
const daisy = { rows: [".w.", "wyw", ".w.", ".g."], palette: { w: "#ffffff", y: "#ffd23f", g: "#3f7a3a" } };
const grass = { rows: ["g.g", ".g."], palette: { g: "#2f6e2c" } };
const clover = { rows: ["g.g", ".g.", "g.g"], palette: { g: "#4c9a3c" } };
const spore = { rows: ["s"], palette: { s: "#d8ff9a" } };
const leaf = { rows: ["oo", ".o"], palette: { o: "#e8702a" } };
const bubble = { rows: [".w.", "w.w", ".w."], palette: { w: "#c8f4ff" } };
const sparkle = { rows: [".y.", "yWy", ".y."], palette: { y: "#fff3a8", W: "#ffffff" } };

const sunflower = {
  rows: [
    "..yyy..",
    ".yyyyy.",
    "yyobbyy",
    "yybbbyy",
    ".yyyyy.",
    "..yyy..",
    "...g...",
    "..gg...",
    "...g...",
    "...gg..",
    "...g...",
    "...g...",
  ],
  palette: { y: "#ffd23f", o: "#6b3e26", b: "#8a5232", g: "#3f7a3a" },
};

const mushroom = {
  rows: [".rrrr.", "rwrrwr", "rrrrrr", "..cc..", "..cc.."],
  palette: { r: "#e04a3c", w: "#fff3e0", c: "#f4e3c3" },
};

const burrow = {
  rows: ["..oooooo..", ".oddddddo.", "oddddddddo", "oddddddddo"],
  palette: { o: "#6b4a2a", d: "#2a1a10" },
};

const lilypad = {
  rows: ["..ggggggg..", ".ggggg.gggg", "ggggggggggg", ".ggggggggg."],
  palette: { g: "#4c9a3c" },
};

const lotus = { rows: [".p.p.", "ppwpp", ".ppp."], palette: { p: "#ff9ac8", w: "#ffffff" } };

const reeds = {
  rows: ["b...b", "b.b.b", "b.b.g", "g.g.g", "g.g.g", "g.g.g", "ggggg"],
  palette: { b: "#6b3e26", g: "#3f7a3a" },
};

const cottage = {
  rows: [
    "......rrrrrr......",
    ".....rrrrrrrr..cc.",
    "....rrrrrrrrrr.cc.",
    "...rrrrrrrrrrrrrr.",
    "..rrrrrrrrrrrrrrrr",
    "...wwwwwwwwwwwwww.",
    "...wwyywwwwwwyyww.",
    "...wwyywwddwwyyww.",
    "...wwwwwwddwwwwww.",
    "...wwwwwwddwwwwww.",
  ],
  palette: { r: "#c8443c", c: "#6b3e26", w: "#f6e7c1", y: "#ffe066", d: "#6b3e26" },
};

const fence = {
  rows: ["o..o..o..o..o..o..o..o", "oooooooooooooooooooooo", "o..o..o..o..o..o..o..o", "oooooooooooooooooooooo", "o..o..o..o..o..o..o..o"],
  palette: { o: "#d9a066" },
};

const chimney = { rows: ["oooo", "obbo", "obbo", "obbo", "obbo", "obbo"], palette: { o: "#5b2a2a", b: "#8a3b3b" } };

const lava = { rows: ["..yy..", ".yaay.", "yaaaay", "aaaaaa"], palette: { y: "#fff09a", a: "#ff6a2a" } };

const autumnTree = {
  rows: [
    "...oooo...",
    ".oooaaooo.",
    "ooaaaaaaoo",
    "oaaaaaaaao",
    ".ooaaaaoo.",
    "...oddo...",
    "....dd....",
    "....dd....",
  ],
  palette: { o: "#c0471f", a: "#f2a03d", d: "#5a2418" },
};

const coral = {
  rows: ["p...p..p", "pp.pp.pp", ".ppp.pp.", "..pppp..", "...pp...", "...pp..."],
  palette: { p: "#ff7a9a" },
};

const fanCoral = {
  rows: [".oooo.", "oyoyoo", "oyyyyo", ".oyyo.", "..oo..", "..oo.."],
  palette: { o: "#b05cff", y: "#e0b8ff" },
};

const shell = { rows: [".www.", "wpwpw", "wwwww"], palette: { w: "#fff0f5", p: "#ffb3cc" } };

const pillar = {
  rows: ["gggggggg", ".wwwwww.", "..wsws..", "..wsws..", "..wsws..", "..wsws..", "..wsws..", "..wsws..", "..wsws..", "..wsws..", "..wsws..", ".wwwwww.", "gggggggg"],
  palette: { g: "#f4c542", w: "#fff8e6", s: "#e6dcff" },
};

const bigCloud = {
  rows: [
    ".....wwwww..........",
    "...wwwwwwwww...www..",
    "..wwwwwwwwwwwwwwwww.",
    ".wwwwwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwwwwwww",
    ".ssssssssssssssssss.",
  ],
  palette: { w: "#ffffff", s: "#d6dcff" },
};

const roofTile = { rows: ["oooooooo", "rrrrrrro", "rrrrrrro"], palette: { o: "#2a1c3a", r: "#4a3a6a" } };

export const habitats: Record<string, Habitat> = {
  // Grassy meadow
  mochi: {
    layers: [
      { kind: "hills", color: "#8ccf6a", y: 62, amp: 5, freq: 0.05, seed: 1 },
      { kind: "hills", color: "#6abe30", y: 74, amp: 4, freq: 0.08, seed: 3 },
      { kind: "scatter", ...grass, y0: 76, y1: 98, count: 26, seed: 4 },
      { kind: "scatter", ...flower, y0: 74, y1: 96, count: 9, seed: 5 },
      { kind: "scatter", ...daisy, y0: 78, y1: 96, count: 7, seed: 6 },
    ],
  },
  // Sunflower patch with a fence
  pip: {
    layers: [
      { kind: "hills", color: "#9cc85a", y: 60, amp: 4, freq: 0.04, seed: 2 },
      ...[2, 14, 26, 96, 108, 120].map((x, i) => ({ kind: "sprite" as const, ...sunflower, x, y: 52 + (i % 2) * 4 })),
      { kind: "rect", color: "#7cb84a", x: 0, y: 70, w: 130, h: 30 },
      { kind: "sprite", ...fence, x: 0, y: 64 },
      { kind: "sprite", ...fence, x: 22, y: 64 },
      { kind: "sprite", ...fence, x: 86, y: 64 },
      { kind: "sprite", ...fence, x: 108, y: 64 },
      { kind: "scatter", ...grass, y0: 74, y1: 98, count: 22, seed: 8 },
    ],
  },
  // Mossy forest floor
  nib: {
    layers: [
      { kind: "rect", color: "#2f4a2a", x: 0, y: 30, w: 130, h: 70 },
      ...[6, 34, 92, 118].map((x, i) => ({ kind: "rect" as const, color: i % 2 ? "#4a3220" : "#5a3d26", x, y: 0, w: 9 - (i % 2) * 2, h: 82 })),
      { kind: "blob", color: "#2a5a2a", x: 10, y: 6, r: 18 },
      { kind: "blob", color: "#336b2e", x: 60, y: 0, r: 22 },
      { kind: "blob", color: "#2a5a2a", x: 116, y: 8, r: 20 },
      { kind: "hills", color: "#4c7a3a", y: 80, amp: 3, freq: 0.09, seed: 2 },
      { kind: "sprite", ...mushroom, x: 18, y: 77 },
      { kind: "sprite", ...mushroom, x: 104, y: 79 },
      { kind: "scatter", ...spore, y0: 40, y1: 80, count: 18, seed: 9 },
      { kind: "scatter", ...grass, y0: 82, y1: 98, count: 20, seed: 10 },
    ],
  },
  // Clover hill with a burrow
  clover: {
    layers: [
      { kind: "hills", color: "#9fd27a", y: 58, amp: 4, freq: 0.03, seed: 5 },
      { kind: "blob", color: "#79c25a", x: 100, y: 96, r: 44 },
      { kind: "hills", color: "#6abe30", y: 80, amp: 3, freq: 0.06, seed: 1 },
      { kind: "sprite", ...burrow, x: 104, y: 60 },
      { kind: "scatter", ...clover, y0: 80, y1: 97, count: 24, seed: 12 },
      { kind: "scatter", ...daisy, y0: 82, y1: 96, count: 5, seed: 13 },
    ],
  },
  // Lily pond
  puddle: {
    layers: [
      { kind: "hills", color: "#3f7a3a", y: 56, amp: 5, freq: 0.07, seed: 4 },
      { kind: "hills", color: "#2f6e2c", y: 62, amp: 3, freq: 0.11, seed: 2 },
      { kind: "water", color: "#3a8fb0", y: 66 },
      { kind: "sprite", ...lilypad, x: 8, y: 74 },
      { kind: "sprite", ...lotus, x: 11, y: 72 },
      { kind: "sprite", ...lilypad, x: 104, y: 80 },
      { kind: "sprite", ...lilypad, x: 44, y: 92 },
      { kind: "sprite", ...lilypad, x: 72, y: 70 },
      { kind: "sprite", ...reeds, x: 122, y: 60 },
      { kind: "sprite", ...reeds, x: 2, y: 59 },
    ],
  },
  // Cottage garden
  sprout: {
    layers: [
      { kind: "hills", color: "#8ccf6a", y: 60, amp: 3, freq: 0.04, seed: 8 },
      { kind: "sprite", ...cottage, x: 92, y: 50 },
      { kind: "rect", color: "#7cb84a", x: 0, y: 68, w: 130, h: 32 },
      ...[72, 80, 88, 96].map((y) => ({ kind: "rect" as const, color: "#8a5232", x: 0, y, w: 130, h: 3 })),
      { kind: "scatter", ...flower, y0: 70, y1: 96, count: 8, seed: 21 },
      { kind: "sprite", ...fence, x: 0, y: 63 },
      { kind: "sprite", ...fence, x: 22, y: 63 },
    ],
  },
  // Starry rooftop
  lumi: {
    sky: { day: ["#5a7ad0", "#7a98e0", "#a0b8f0", "#c8d8ff"] },
    layers: [
      { kind: "hills", color: "#2a2a5a", y: 64, amp: 2, freq: 0.2, seed: 1 },
      ...[0, 12, 24, 36, 48].map((x, i) => ({ kind: "rect" as const, color: "#3a3a6a", x: x * 2 + 4, y: 56 - (i % 3) * 4, w: 10, h: 20 })),
      ...[0, 1, 2, 3, 4, 5].flatMap((row) =>
        Array.from({ length: 17 }, (_, i) => ({ kind: "sprite" as const, ...roofTile, x: i * 8 - (row % 2) * 4, y: 74 + row * 3 })),
      ),
      { kind: "sprite", ...chimney, x: 108, y: 66 },
      { kind: "scatter", ...sparkle, y0: 4, y1: 50, count: 6, seed: 3 },
    ],
  },
  // Autumn volcano ridge
  ember: {
    sky: { day: ["#e8a070", "#f0b884", "#f8d0a0", "#ffe8c0"] },
    layers: [
      { kind: "hills", color: "#6b3a3a", y: 48, amp: 14, freq: 0.03, seed: 4.4 },
      { kind: "sprite", ...lava, x: 112, y: 36, glow: true },
      { kind: "hills", color: "#8a4a2a", y: 66, amp: 4, freq: 0.08, seed: 2 },
      { kind: "sprite", ...autumnTree, x: 4, y: 58 },
      { kind: "sprite", ...autumnTree, x: 112, y: 60 },
      { kind: "hills", color: "#a85a2a", y: 80, amp: 2, freq: 0.1, seed: 6 },
      { kind: "scatter", ...leaf, y0: 82, y1: 98, count: 16, seed: 14 },
    ],
  },
  // Coral reef (underwater: the "sky" is water)
  marina: {
    noSky: true,
    sky: {
      dawn: ["#2a4f8a", "#3a6fa8", "#5a90c0", "#7cb0d0"],
      day: ["#1f6fb0", "#2f8fc8", "#4fb0d8", "#7cd0e8"],
      sunset: ["#3a3a8a", "#5a4a9a", "#8a5aa0", "#c07a9a"],
      night: ["#081430", "#0c1c40", "#102650", "#163060"],
    },
    layers: [
      { kind: "rays" },
      { kind: "hills", color: "#e8d4a0", y: 84, amp: 3, freq: 0.07, seed: 3 },
      { kind: "sprite", ...coral, x: 6, y: 78 },
      { kind: "sprite", ...fanCoral, x: 22, y: 80 },
      { kind: "sprite", ...coral, x: 108, y: 80 },
      { kind: "sprite", ...fanCoral, x: 120, y: 78 },
      { kind: "sprite", ...shell, x: 92, y: 92 },
      { kind: "scatter", ...bubble, y0: 8, y1: 70, count: 10, seed: 17 },
    ],
  },
  // Cloud temple sky
  aurora: {
    sky: { day: ["#7a9cf0", "#9ab4f8", "#bccdff", "#e0e6ff"] },
    layers: [
      { kind: "aurora" },
      { kind: "sprite", ...pillar, x: 8, y: 52 },
      { kind: "sprite", ...pillar, x: 114, y: 52 },
      { kind: "sprite", ...bigCloud, x: -6, y: 62 },
      { kind: "sprite", ...bigCloud, x: 112, y: 64 },
      { kind: "hills", color: "#f4f0ff", y: 82, amp: 3, freq: 0.15, seed: 2 },
      { kind: "hills", color: "#dcd4ff", y: 92, amp: 2, freq: 0.2, seed: 5 },
      { kind: "scatter", ...sparkle, y0: 30, y1: 76, count: 6, seed: 23 },
    ],
  },
};
