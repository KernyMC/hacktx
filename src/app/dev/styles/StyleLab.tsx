"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import PixelPet from "@/components/PixelPet";
import PixelSprite from "@/components/PixelSprite";
import { boop } from "@/game/sound";
import type { Palette, Sprite } from "@/game/sprite";
import { blip, bowl, icons, lamp, lumi, moon, plant, sprout, twinkle } from "./sprites";

// Stepped box-shadow outline: square edges with notched pixel corners.
const notch = (c: string, w = 3) => `${w}px 0 0 0 ${c}, -${w}px 0 0 0 ${c}, 0 ${w}px 0 0 ${c}, 0 -${w}px 0 0 ${c}`;

// A 3px square on a tiled background, for pixel dot patterns.
const dots = (color: string, tile: number, x = 0, y = 0) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${tile}' height='${tile}' shape-rendering='crispEdges'%3E%3Crect x='${x}' y='${y}' width='3' height='3' fill='${color.replace("#", "%23")}'/%3E%3C/svg%3E")`;

type Direction = {
  id: string;
  name: string;
  tagline: string;
  display: string;
  body: string;
  bodySize: number;
  text: string;
  screen: string;
  headerText: CSSProperties;
  panel: CSSProperties;
  nav: CSSProperties;
  navActive: CSSProperties;
  check: (done: boolean) => CSSProperties;
  xp: { empty: string; fill: string; shine: string };
  reward: string;
  iconPalette: Palette;
  navPalette: Palette;
  pet: Sprite;
  petName: string;
  motion: "bounce" | "hop" | "float";
  pitch: number;
  Room: (props: { children: ReactNode }) => ReactNode;
};

function PetShadow({ color }: { color: string }) {
  return <div style={{ width: 96, height: 6, margin: "0 auto", background: color, boxShadow: notch(color, 6) }} />;
}

function MeadowRoom({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[300px] overflow-hidden" style={{ background: "repeating-linear-gradient(90deg, #d9a066 0 42px, #c98d55 42px 45px)" }}>
      {/* window onto the garden */}
      <div
        className="absolute left-[36px] top-[36px] h-[96px] w-[108px]"
        style={{
          background: "linear-gradient(#8fd3ff 0 60%, #6abe30 60% 78%, #3f7a3a 78%)",
          boxShadow: `${notch("#6b3e26", 6)}, inset 0 0 0 3px #fff6dc`,
        }}
      >
        <div className="absolute left-1/2 top-0 h-full w-[6px] -translate-x-1/2 bg-[#6b3e26]" />
        <div className="absolute left-0 top-1/2 h-[6px] w-full -translate-y-1/2 bg-[#6b3e26]" />
        <div className="absolute left-[12px] top-[12px] h-[6px] w-[18px] bg-white" />
        <div className="absolute left-[66px] top-[18px] h-[6px] w-[24px] bg-white" />
      </div>
      <div className="absolute left-[30px] top-[138px] h-[12px] w-[120px] bg-[#a0603a]" style={{ boxShadow: "0 6px 0 0 #6b3e26" }} />
      {/* floor */}
      <div
        className="absolute bottom-0 h-[96px] w-full"
        style={{ background: "repeating-linear-gradient(0deg, #a0603a 0 21px, #8a5232 21px 24px)", boxShadow: "0 -6px 0 0 #6b3e26" }}
      />
      <div className="absolute bottom-[18px] left-1/2 h-[36px] w-[216px] -translate-x-1/2" style={{ background: "repeating-linear-gradient(90deg, #f7a1b0 0 18px, #f6e7c1 18px 36px)", boxShadow: notch("#c2457a", 6) }} />
      <div className="absolute bottom-[54px] right-[24px]">
        <PixelSprite rows={plant.rows} palette={plant.palette} scale={6} />
      </div>
      <div className="absolute bottom-[30px] left-1/2 -translate-x-1/2">
        {children}
        <PetShadow color="rgba(59,36,23,0.25)" />
      </div>
    </div>
  );
}

function PocketRoom({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[300px] flex-col items-center justify-center gap-[15px]">
      <div className="bg-[#ffd1e3] p-[12px]" style={{ boxShadow: `${notch("#2b2d42", 3)}, 6px 6px 0 0 #c2457a` }}>
        <div
          className="relative h-[198px] w-[288px] overflow-hidden"
          style={{
            background:
              "linear-gradient(#d4ecbf 1px, transparent 1px) 0 0 / 5px 5px, linear-gradient(90deg, #d4ecbf 1px, transparent 1px) 0 0 / 5px 5px, #e8f7d4",
            boxShadow: "inset 0 0 0 3px #b4d99a",
          }}
        >
          <div className="absolute bottom-[15px] right-[20px]">
            <PixelSprite rows={bowl.rows} palette={bowl.palette} scale={5} />
          </div>
          <div className="absolute bottom-[5px] left-1/2 -translate-x-1/2">{children}</div>
        </div>
      </div>
      <div className="flex gap-[24px]">
        {[523, 659, 784].map((p, i) => (
          <button
            key={p}
            type="button"
            aria-label={`Device button ${i + 1}`}
            onClick={() => boop(p)}
            className="h-[18px] w-[18px] bg-[#ffe680] active:translate-y-[3px]"
            style={{ boxShadow: `${notch("#2b2d42", 3)}, 0 6px 0 0 #c2457a` }}
          />
        ))}
      </div>
    </div>
  );
}

const starPixels = [
  [12, 18], [48, 6], [90, 24], [138, 12], [162, 42], [24, 60], [114, 54], [72, 84],
].map(([x, y]) => `${x}px ${y}px 0 0 #f8f4ff`).join(", ");

function StarlitRoom({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[300px] overflow-hidden" style={{ background: "repeating-linear-gradient(90deg, #2e2a5c 0 30px, #332f66 30px 60px)" }}>
      {/* lamp glow, banded instead of a smooth gradient to stay pixel-y */}
      <div
        className="absolute right-[-48px] top-[66px] h-[216px] w-[216px]"
        style={{ background: "radial-gradient(circle, rgba(255,179,138,0.22) 0 36px, rgba(255,179,138,0.12) 36px 72px, rgba(255,179,138,0.05) 72px 108px, transparent 108px)" }}
      />
      <div
        className="absolute left-[30px] top-[30px] h-[120px] w-[150px] overflow-hidden"
        style={{
          background: "linear-gradient(#1d1b3a 0 34%, #262350 34% 64%, #3a3470 64% 86%, #5b4b9a 86%)",
          boxShadow: `${notch("#120f26", 6)}, inset 0 0 0 3px #a99be0`,
        }}
      >
        <div className="absolute left-0 top-0 h-[3px] w-[3px] animate-pulse" style={{ boxShadow: starPixels }} />
        <div className="absolute right-[15px] top-[15px]">
          <PixelSprite rows={moon.rows} palette={moon.palette} scale={4} />
        </div>
        <div className="absolute left-[24px] top-[30px] animate-pulse">
          <PixelSprite rows={twinkle.rows} palette={twinkle.palette} scale={3} />
        </div>
        <div className="absolute left-1/2 top-0 h-full w-[6px] -translate-x-1/2 bg-[#120f26]" />
      </div>
      <div className="absolute bottom-[42px] right-[36px] z-10">
        <PixelSprite rows={lamp.rows} palette={lamp.palette} scale={6} />
      </div>
      <div className="absolute bottom-0 h-[78px] w-full bg-[#1d1b3a]" style={{ boxShadow: "0 -6px 0 0 #120f26" }} />
      <div className="absolute bottom-[18px] left-1/2 h-[30px] w-[228px] -translate-x-1/2 bg-[#5b4b9a]" style={{ boxShadow: `${notch("#a99be0", 3)}, inset 0 0 0 6px #4a3d85` }} />
      <div className="absolute bottom-[21px] left-1/2 -translate-x-1/2">
        {children}
        <div className="mt-[6px]">
          <PetShadow color="rgba(18,15,38,0.45)" />
        </div>
      </div>
    </div>
  );
}

const directions: Direction[] = [
  {
    id: "meadow",
    name: "Meadow Cottage",
    tagline: "Stardew-style farmhouse: wood frames, cream parchment, leafy greens. Warm, homey, bouncy.",
    display: "var(--font-pixelify)",
    body: "var(--font-nunito)",
    bodySize: 15,
    text: "#3b2417",
    screen: "repeating-linear-gradient(90deg, #8a5232 0 45px, #7a4529 45px 48px)",
    headerText: { color: "#fff6dc", textShadow: "2px 2px 0 #3b2417" },
    panel: { background: "#f6e7c1", boxShadow: `${notch("#3b2417")}, inset 3px 3px 0 #fff6dc, inset -3px -3px 0 #d9a066` },
    nav: { background: "#a0603a", color: "#fff6dc", boxShadow: `${notch("#3b2417")}, inset 3px 3px 0 #d9a066, inset -3px -3px 0 #6b3e26` },
    navActive: { background: "#d9a066", boxShadow: `${notch("#6b3e26")}` },
    check: (done) => ({ background: done ? "#6abe30" : "#fff6dc", boxShadow: `${notch("#3b2417")}, inset -3px -3px 0 ${done ? "#3f7a3a" : "#d9a066"}` }),
    xp: { empty: "#6b3e26", fill: "#f4c542", shine: "#fff6dc" },
    reward: "#a0603a",
    iconPalette: { o: "#3b2417", a: "#6abe30", f: "#fff6dc" },
    navPalette: { o: "#3b2417", a: "#f4c542", f: "#fff6dc" },
    pet: sprout,
    petName: "Sprout",
    motion: "bounce",
    pitch: 523,
    Room: MeadowRoom,
  },
  {
    id: "pocket",
    name: "Pocket Device",
    tagline: "Tamagotchi / GBA toy: candy shell, LCD screen, crisp ink outlines and hard drop shadows. Snappy, 2-frame motion.",
    display: "var(--font-press-start)",
    body: "var(--font-vt323)",
    bodySize: 21,
    text: "#2b2d42",
    screen: `${dots("#ffd1e3", 18)}, #ff8fb8`,
    headerText: { color: "#2b2d42" },
    panel: { background: "#ffffff", boxShadow: `${notch("#2b2d42")}, 6px 6px 0 0 #c2457a` },
    nav: { background: "#2b2d42", color: "#ffe680", boxShadow: `${notch("#2b2d42")}, 6px 6px 0 0 #c2457a` },
    navActive: { background: "#b9a3ff", color: "#2b2d42" },
    check: (done) => ({ background: done ? "#7ee0c3" : "#e8f7d4", boxShadow: notch("#2b2d42") }),
    xp: { empty: "#e8f7d4", fill: "#7ee0c3", shine: "#ffffff" },
    reward: "#c2457a",
    iconPalette: { o: "#2b2d42", a: "#b9a3ff", f: "#ffffff" },
    navPalette: { o: "#ffe680", a: "#ff8fb8", f: "#2b2d42" },
    pet: blip,
    petName: "Blip",
    motion: "hop",
    pitch: 784,
    Room: PocketRoom,
  },
  {
    id: "starlit",
    name: "Starlit Dream",
    tagline: "EarthBound-ish cozy night: dusk purples, warm peach lamplight, double-line windows. Floaty and calm.",
    display: "var(--font-silkscreen)",
    body: "var(--font-quicksand)",
    bodySize: 15,
    text: "#f8f4ff",
    screen: `${dots("#5b4b9a", 42, 6, 9)}, ${dots("#3a3470", 30, 21, 3)}, #1d1b3a`,
    headerText: { color: "#ffd6a5", textShadow: "2px 2px 0 #120f26" },
    panel: { background: "#2e2a5c", boxShadow: `${notch("#120f26")}, inset 0 0 0 3px #a99be0, inset 0 0 0 6px #120f26` },
    nav: { background: "#2e2a5c", color: "#f8f4ff", boxShadow: `${notch("#120f26")}, inset 0 0 0 3px #a99be0, inset 0 0 0 6px #120f26` },
    navActive: { background: "#5b4b9a", color: "#ffd6a5" },
    check: (done) => ({ background: done ? "#ffb38a" : "#1d1b3a", boxShadow: `${notch("#120f26")}, inset 0 0 0 3px ${done ? "#ffd6a5" : "#a99be0"}` }),
    xp: { empty: "#1d1b3a", fill: "#ffb38a", shine: "#ffd6a5" },
    reward: "#6fe3d4",
    iconPalette: { o: "#120f26", a: "#a99be0", f: "#fff3a8" },
    navPalette: { o: "#a99be0", a: "#ff7eb6", f: "#fff3a8" },
    pet: lumi,
    petName: "Lumi",
    motion: "float",
    pitch: 440,
    Room: StarlitRoom,
  },
];

const quests = [
  { title: "Drink a glass of water", xp: 10, icon: icons.water },
  { title: "Take a 10-minute walk", xp: 25, icon: icons.walk },
  { title: "Tidy your desk", xp: 15, icon: icons.tidy },
];

const tabs = [
  { label: "Home", icon: icons.home },
  { label: "Quests", icon: icons.quests },
  { label: "Shop", icon: icons.shop },
  { label: "Pets", icon: icons.pets },
];

function XPBar({ d, xp, max }: { d: Direction; xp: number; max: number }) {
  const segments = 16;
  const filled = Math.round((xp / max) * segments);
  return (
    <div className="px-[18px] py-[15px]" style={d.panel}>
      <div className="mb-[9px] flex justify-between text-[12px]" style={{ fontFamily: d.display }}>
        <span>XP</span>
        <span>
          {xp} / {max}
        </span>
      </div>
      <div className="flex gap-[3px]">
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            className="h-[12px] flex-1"
            style={{ background: i < filled ? d.xp.fill : d.xp.empty, boxShadow: i < filled ? `inset 0 3px 0 ${d.xp.shine}` : undefined }}
          />
        ))}
      </div>
    </div>
  );
}

function Phone({ d }: { d: Direction }) {
  const [done, setDone] = useState<boolean[]>([false, true, false]);
  const xp = 120 + quests.reduce((sum, q, i) => sum + (done[i] ? q.xp : 0), 0);
  const toggle = (i: number) => {
    boop(done[i] ? d.pitch * 0.75 : d.pitch * 1.25);
    setDone(done.map((v, j) => (j === i ? !v : v)));
  };

  return (
    <div
      className="mx-auto flex w-full max-w-[390px] flex-col overflow-hidden"
      style={{ background: d.screen, color: d.text, fontFamily: d.body, fontSize: d.bodySize, boxShadow: "0 0 0 6px #000, 0 0 0 9px #333" }}
    >
      <header className="flex items-center justify-between px-[18px] pb-[12px] pt-[18px]" style={{ fontFamily: d.display, ...d.headerText }}>
        <span className="text-[16px]">{d.petName}</span>
        <span className="text-[12px]">Lv 3 · 42 coins</span>
      </header>
      <d.Room>
        <PixelPet sprite={d.pet} name={d.petName} motion={d.motion} pitch={d.pitch} />
      </d.Room>
      <div className="flex flex-col gap-[18px] px-[18px] pb-[18px] pt-[18px]">
        <XPBar d={d} xp={xp} max={200} />
        <h2 className="text-[12px]" style={{ fontFamily: d.display, ...d.headerText }}>
          Today&apos;s quests
        </h2>
        {quests.map((q, i) => (
          <div key={q.title} className="flex items-center gap-[12px] px-[15px] py-[12px]" style={{ ...d.panel, color: d.panel.color ?? d.text }}>
            <PixelSprite rows={q.icon} palette={d.iconPalette} scale={3} />
            <div className="flex-1 leading-tight">
              <div style={{ textDecoration: done[i] ? "line-through" : undefined, opacity: done[i] ? 0.6 : 1 }}>{q.title}</div>
              <div className="mt-[3px] text-[11px]" style={{ fontFamily: d.display, color: d.reward }}>
                +{q.xp} XP
              </div>
            </div>
            <button
              type="button"
              aria-label={`${done[i] ? "Undo" : "Complete"} ${q.title}`}
              aria-pressed={done[i]}
              onClick={() => toggle(i)}
              className="grid h-[30px] w-[30px] place-items-center text-[14px] active:translate-y-[3px]"
              style={{ ...d.check(done[i]), fontFamily: d.display, color: d.text === "#f8f4ff" ? "#120f26" : d.text }}
            >
              {done[i] ? "✓" : ""}
            </button>
          </div>
        ))}
      </div>
      <nav className="mx-[18px] mb-[18px] mt-auto flex justify-between p-[9px]" style={d.nav}>
        {tabs.map((t, i) => (
          <button
            key={t.label}
            type="button"
            className="flex flex-1 flex-col items-center gap-[6px] py-[6px] text-[10px]"
            style={{ fontFamily: d.display, ...(i === 0 ? d.navActive : null) }}
          >
            <PixelSprite rows={t.icon} palette={d.navPalette} scale={3} />
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function StyleLab() {
  const [active, setActive] = useState(0);
  const d = directions[active];
  return (
    <main className="min-h-screen bg-[#14121c] px-[16px] py-[24px] text-[#e8e4f0]">
      <div role="tablist" aria-label="Visual directions" className="mx-auto mb-[12px] flex max-w-[390px] gap-[6px]">
        {directions.map((dir, i) => (
          <button
            key={dir.id}
            role="tab"
            type="button"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`flex-1 px-[6px] py-[9px] text-[13px] ${i === active ? "bg-[#e8e4f0] text-[#14121c]" : "bg-[#2a2735]"}`}
            style={{ fontFamily: dir.display }}
          >
            {dir.name}
          </button>
        ))}
      </div>
      <p className="mx-auto mb-[24px] max-w-[390px] text-[14px] leading-snug text-[#b8b2c8]">{d.tagline}</p>
      {/* key resets quest state when switching directions */}
      <Phone key={d.id} d={d} />
    </main>
  );
}
