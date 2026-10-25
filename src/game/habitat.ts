import { drawRows, type Palette } from "./sprite";

// Habitat backgrounds: low-res pixel scenes (W x H, shown at 3x) that follow the time of day.
export const W = 130;
export const H = 100;

export type Phase = "dawn" | "day" | "sunset" | "night";
export const phases: Phase[] = ["dawn", "day", "sunset", "night"];

// SPEC.md: dawn 5-8, day 8-17, sunset 17-20, night 20-5.
export function phaseAt(hour: number): Phase {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "sunset";
  return "night";
}

export type Layer =
  | { kind: "hills"; color: string; y: number; amp: number; freq: number; seed: number }
  | { kind: "rect"; color: string; x: number; y: number; w: number; h: number }
  | { kind: "blob"; color: string; x: number; y: number; r: number }
  | { kind: "water"; color: string; y: number }
  | { kind: "sprite"; rows: string[]; palette: Palette; x: number; y: number; glow?: boolean }
  | { kind: "scatter"; rows: string[]; palette: Palette; y0: number; y1: number; count: number; seed: number }
  | { kind: "rays" }
  | { kind: "aurora" };

export type Habitat = {
  sky?: Partial<Record<Phase, string[]>>;
  layers: Layer[];
  // Underwater and indoor scenes have no sun, moon or stars.
  noSky?: boolean;
};

const SKY: Record<Phase, string[]> = {
  dawn: ["#6b6bb8", "#c98ac8", "#ffb8b0", "#ffd9a8"],
  day: ["#4fa8f0", "#6cc0ff", "#93d4ff", "#c4ebff"],
  sunset: ["#3e2f7a", "#a04a8a", "#ec6a6a", "#ffb36b"],
  night: ["#0c0d28", "#141640", "#1d1f55", "#2a2a6a"],
};

const TINT: Record<Phase, [string, number]> = {
  dawn: ["#ff9ac0", 0.18],
  day: ["#ffffff", 0],
  sunset: ["#ff7a4a", 0.28],
  night: ["#141a48", 0.58],
};

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export function mix(a: string, b: string, t: number) {
  const [x, y] = [rgb(a), rgb(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

// Small seeded RNG so scenes look the same on every render.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cloud = [
  "....wwww........",
  "..wwwwwwww.www..",
  ".wwwwwwwwwwwwww.",
  "wwwwwwwwwwwwwwww",
  ".ssssssssssssss.",
];

function sky(ctx: CanvasRenderingContext2D, colors: string[]) {
  const band = Math.ceil(H / colors.length);
  for (let y = 0; y < H; y++) {
    const i = Math.min(colors.length - 1, Math.floor(y / band));
    const next = colors[Math.min(colors.length - 1, i + 1)];
    const edge = (i + 1) * band - y; // rows left before the next band
    for (let x = 0; x < W; x++) {
      // checker dither over the last 3 rows of each band
      const dither = edge <= 3 && (x + y) % (edge === 1 ? 1 : edge === 2 ? 2 : 4) === 0;
      ctx.fillStyle = dither ? next : colors[i];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function disc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    const w = Math.round(Math.sqrt(r * r - y * y));
    ctx.fillRect(cx - w, cy + y, w * 2 + 1, 1);
  }
}

function celestial(ctx: CanvasRenderingContext2D, phase: Phase) {
  const r = rng(7);
  if (phase === "night") {
    for (let i = 0; i < 46; i++) {
      ctx.fillStyle = i % 5 === 0 ? "#fff3a8" : "#ffffff";
      const x = Math.floor(r() * W);
      const y = Math.floor(r() * 60);
      ctx.fillRect(x, y, 1, 1);
      if (i % 9 === 0) {
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
      }
    }
    disc(ctx, 104, 16, 7, "#fff6d0");
    disc(ctx, 107, 14, 6, SKY.night[0]); // bite out of the moon
    return;
  }
  const sun = { dawn: [22, 46, 8, "#ffd9a8", "#fff3d6"], day: [104, 14, 6, "#ffe066", "#fff6c0"], sunset: [104, 48, 10, "#ff9a5a", "#ffd08a"] }[phase];
  const [x, y, rad, ring, core] = sun as [number, number, number, string, string];
  disc(ctx, x, y, rad + 2, ring);
  disc(ctx, x, y, rad, core);
  if (phase !== "sunset") {
    const pal = { w: phase === "dawn" ? "#ffe6ee" : "#ffffff", s: phase === "dawn" ? "#e8b0c8" : "#d6e8f5" };
    drawRows(ctx, cloud, pal, 14, 12);
    drawRows(ctx, cloud, pal, 70, 22);
  }
}

export function drawHabitat(ctx: CanvasRenderingContext2D, hab: Habitat, phase: Phase) {
  const [tc, tt] = TINT[phase];
  const t = (c: string) => (tt ? mix(c, tc, tt) : c);
  const tp = (p: Palette) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, t(v)]));
  sky(ctx, hab.sky?.[phase] ?? SKY[phase]);
  if (!hab.noSky) celestial(ctx, phase);
  for (const l of hab.layers) {
    switch (l.kind) {
      case "hills": {
        const rim = t(mix(l.color, "#ffffff", 0.22));
        for (let x = 0; x < W; x++) {
          const top = Math.round(l.y - l.amp * (Math.sin(x * l.freq + l.seed) * 0.6 + Math.sin(x * l.freq * 2.3 + l.seed * 1.7) * 0.4));
          ctx.fillStyle = t(l.color);
          ctx.fillRect(x, top, 1, H - top);
          ctx.fillStyle = rim;
          ctx.fillRect(x, top, 1, 1);
        }
        break;
      }
      case "rect":
        ctx.fillStyle = t(l.color);
        ctx.fillRect(l.x, l.y, l.w, l.h);
        break;
      case "blob":
        disc(ctx, l.x, l.y, l.r, t(l.color));
        break;
      case "water": {
        ctx.fillStyle = t(l.color);
        ctx.fillRect(0, l.y, W, H - l.y);
        const r = rng(l.y);
        ctx.fillStyle = t(mix(l.color, "#ffffff", 0.35));
        for (let y = l.y + 2; y < H; y += 4) for (let i = 0; i < 5; i++) ctx.fillRect(Math.floor(r() * W), y, 3 + Math.floor(r() * 4), 1);
        break;
      }
      case "sprite":
        drawRows(ctx, l.rows, l.glow ? l.palette : tp(l.palette), l.x, l.y);
        break;
      case "scatter": {
        const r = rng(l.seed);
        const pal = tp(l.palette);
        for (let i = 0; i < l.count; i++) drawRows(ctx, l.rows, pal, Math.floor(r() * (W - 3)), l.y0 + Math.floor(r() * (l.y1 - l.y0)));
        break;
      }
      case "rays":
        if (phase === "night") break;
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        for (const x0 of [18, 52, 90]) for (let y = 0; y < 70; y++) ctx.fillRect(x0 + Math.floor(y / 3), y, 6, 1);
        break;
      case "aurora":
        if (phase !== "night" && phase !== "dawn") break;
        for (const [i, c] of ["#8af0e0", "#b48cff", "#ff9ad5"].entries()) {
          ctx.fillStyle = c;
          for (let x = 0; x < W; x++) ctx.fillRect(x, Math.round(14 + i * 4 + Math.sin(x / 9 + i) * 4), 1, 2);
        }
        break;
    }
  }
}
