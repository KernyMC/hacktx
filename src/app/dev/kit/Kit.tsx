"use client";

import { useState, type ReactNode } from "react";
import BottomNav from "@/components/ui/BottomNav";
import PixelButton from "@/components/ui/PixelButton";
import PixelPanel from "@/components/ui/PixelPanel";
import QuestCard from "@/components/ui/QuestCard";
import SkinProvider from "@/components/ui/SkinProvider";
import XPBar from "@/components/ui/XPBar";
import { skins } from "@/styles/skins";
// shortcut: lab icons until each pet gets its own icon set (sprites step).
import { icons } from "../styles/sprites";

const ids = Object.keys(skins);

const quests = [
  { title: "Drink a glass of water", xp: 10, coins: 10, icon: icons.water },
  { title: "Take a 10-minute walk", xp: 25, coins: 20, icon: icons.walk },
  { title: "Tidy your desk", xp: 15, coins: 15, icon: icons.tidy },
];

const tabs = [
  { id: "home", label: "Home", icon: icons.home },
  { id: "quests", label: "Quests", icon: icons.quests },
  { id: "shop", label: "Shop", icon: icons.shop },
  { id: "book", label: "Book", icon: icons.pets },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[15px]">
      <h2 className="px-title text-[18px]">{title}</h2>
      {children}
    </section>
  );
}

export default function Kit() {
  const [skinId, setSkinId] = useState(ids[0]);
  const [done, setDone] = useState([false, true, false]);
  const [tab, setTab] = useState("home");

  return (
    <main className="min-h-screen px-[16px] py-[24px]">
      <h1 className="mx-auto mb-[12px] max-w-[390px] font-display text-[24px]">Familiars kit</h1>
      <div className="mx-auto mb-[24px] flex max-w-[390px] flex-wrap gap-[6px]" role="radiogroup" aria-label="Skin">
        {ids.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={id === skinId}
            onClick={() => setSkinId(id)}
            className={`flex items-center gap-[6px] px-[9px] py-[3px] font-display text-[14px] capitalize ${id === skinId ? "bg-[#f8f4ff] text-[#14121c]" : "bg-[#2a2735]"}`}
          >
            <span className="h-[12px] w-[12px]" style={{ background: skins[id].button, boxShadow: `0 0 0 2px ${skins[id].outline}` }} />
            {id}
          </button>
        ))}
      </div>

      <SkinProvider skin={skins[skinId]} className="mx-auto flex max-w-[390px] flex-col gap-[30px] p-[18px]">
        <Section title="Panel and type">
          <PixelPanel>
            <p className="font-display text-[20px]">Pixelify Sans display</p>
            <p>VT323 body at 20px. Your familiar grows when you do real-life quests.</p>
          </PixelPanel>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap gap-[15px]">
            <PixelButton>Hatch egg</PixelButton>
            <PixelButton variant="soft">Later</PixelButton>
            <PixelButton disabled>100 coins</PixelButton>
          </div>
        </Section>

        <Section title="XP bar">
          <XPBar value={145} max={200} />
          <XPBar value={0} max={200} label="Pity" />
        </Section>

        <Section title="Quest cards">
          {quests.map((q, i) => (
            <QuestCard key={q.title} {...q} done={done[i]} onToggle={() => setDone(done.map((v, j) => (j === i ? !v : v)))} />
          ))}
        </Section>

        <Section title="Bottom nav">
          <BottomNav tabs={tabs} active={tab} onSelect={setTab} />
        </Section>
      </SkinProvider>
    </main>
  );
}
