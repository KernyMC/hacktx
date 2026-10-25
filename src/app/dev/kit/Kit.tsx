"use client";

import { useMemo, useState, type ReactNode } from "react";
import Aura from "@/components/Aura";
import HabitatView from "@/components/HabitatView";
import PixelPet from "@/components/PixelPet";
import PixelSprite from "@/components/PixelSprite";
import BottomNav from "@/components/ui/BottomNav";
import PixelButton from "@/components/ui/PixelButton";
import PixelPanel from "@/components/ui/PixelPanel";
import QuestCard from "@/components/ui/QuestCard";
import SkinProvider, { useSkin } from "@/components/ui/SkinProvider";
import XPBar from "@/components/ui/XPBar";
import { accessoryLayers } from "@/game/accessories";
import { egg, eggStage } from "@/game/egg";
import { phases, type Phase } from "@/game/habitat";
import { pets, type Pet } from "@/game/pets";
import { tierOrder, tiers } from "@/game/tiers";
import { usePhase } from "@/game/usePhase";
// shortcut: quest category icons still come from the style lab; move them to src/game when quests get real categories.
import { icons as questIcons } from "../styles/sprites";

const quests = [
  { title: "Drink a glass of water", xp: 10, coins: 10, icon: questIcons.water },
  { title: "Take a 10-minute walk", xp: 25, coins: 20, icon: questIcons.walk },
  { title: "Tidy your desk", xp: 15, coins: 15, icon: questIcons.tidy },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[15px]">
      <h2 className="px-title text-[18px]">{title}</h2>
      {children}
    </section>
  );
}

function Chips<T extends string>({ label, items, value, onChange }: { label: string; items: { id: T; text: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="mx-auto mb-[12px] flex max-w-[390px] flex-wrap gap-[6px]" role="radiogroup" aria-label={label}>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          role="radio"
          aria-checked={it.id === value}
          onClick={() => onChange(it.id)}
          className={`px-[9px] py-[3px] font-display text-[14px] ${it.id === value ? "bg-[#f8f4ff] text-[#14121c]" : "bg-[#2a2735] text-[#f8f4ff]"}`}
        >
          {it.text}
        </button>
      ))}
    </div>
  );
}

function Icons({ pet }: { pet: Pet }) {
  const skin = useSkin();
  const palette = { o: skin.outline, a: skin.accent, f: skin.panelLight };
  return (
    <PixelPanel className="flex justify-between">
      {Object.entries(pet.icons).map(([name, rows]) => (
        <div key={name} className="flex flex-col items-center gap-[6px] text-[16px]">
          <PixelSprite rows={rows} palette={palette} scale={4} />
          {name}
        </div>
      ))}
    </PixelPanel>
  );
}

export default function Kit() {
  const [petId, setPetId] = useState(pets[0].id);
  const [phaseChoice, setPhaseChoice] = useState<Phase | "now">("now");
  const [pirate, setPirate] = useState(false);
  const [done, setDone] = useState([false, true, false]);
  const [tab, setTab] = useState("home");
  const clock = usePhase();
  const phase = phaseChoice === "now" ? clock : phaseChoice;
  const pet = pets.find((p) => p.id === petId)!;
  const tier = tiers[pet.tier];
  const size = pet.sprite.rows.length;
  const layers = useMemo(() => (pirate ? accessoryLayers("pirate", pet.anchors, size) : undefined), [pirate, pet, size]);

  const petView = <PixelPet key={pet.id} sprite={pet.sprite} name={pet.name} scale={tier.scale} motion={pet.motion} pitch={pet.pitch} layers={layers} />;
  const tabs = [
    { id: "home", label: "Home", icon: pet.icons.home },
    { id: "quests", label: "Quests", icon: pet.icons.quests },
    { id: "shop", label: "Shop", icon: pet.icons.shop },
    { id: "book", label: "Book", icon: pet.icons.book },
  ];

  return (
    <main className="min-h-screen py-[24px]">
      <h1 className="mx-auto mb-[12px] max-w-[390px] px-[16px] font-display text-[24px]">Familiars kit</h1>
      <div className="px-[16px]">
        <Chips label="Pet" items={pets.map((p) => ({ id: p.id, text: p.name }))} value={petId} onChange={setPetId} />
        <Chips
          label="Time of day"
          items={[{ id: "now" as const, text: `Now (${clock})` }, ...phases.map((p) => ({ id: p, text: p }))]}
          value={phaseChoice}
          onChange={setPhaseChoice}
        />
        <Chips label="Curse" items={[{ id: "none", text: "No curse" }, { id: "pirate", text: "Pirate's Plunder" }]} value={pirate ? "pirate" : "none"} onChange={(v) => setPirate(v === "pirate")} />
      </div>

      <SkinProvider skin={pet.skin} className="mx-auto flex max-w-[390px] flex-col gap-[30px] pb-[24px]">
        <div>
          <HabitatView habitat={pet.habitat} phase={phase}>
            {pet.tier === "legendary" ? (
              <Aura color={tier.color} size={size * tier.scale * 1.5}>
                {petView}
              </Aura>
            ) : (
              petView
            )}
          </HabitatView>
          <div className="flex items-center justify-between px-[18px] pt-[12px]">
            <span className="px-title text-[20px]">
              {pet.name} <span className="text-[14px]">the {pet.species}</span>
            </span>
            <span className="px-[9px] py-[3px] font-display text-[13px] text-[#14121c]" style={{ background: tier.color }}>
              {tier.label} · {size}px
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-[30px] px-[18px]">
          <Section title="All 10 pets (half scale)">
            <PixelPanel className="flex flex-wrap items-end justify-around gap-[15px]">
              {tierOrder.flatMap((t) =>
                pets
                  .filter((p) => p.tier === t)
                  .map((p) => (
                    <button key={p.id} type="button" onClick={() => setPetId(p.id)} className="px-focus flex flex-col items-center gap-[3px] text-[16px]">
                      <PixelSprite rows={p.sprite.rows} palette={p.sprite.palette} scale={Math.floor(tiers[t].scale / 2)} />
                      <span style={{ color: tiers[t].color === "#b8b8c0" ? undefined : tiers[t].color, textShadow: "1px 1px 0 var(--outline)" }}>{p.name}</span>
                    </button>
                  )),
              )}
            </PixelPanel>
          </Section>

          <Section title={`${pet.name}'s icons`}>
            <Icons pet={pet} />
          </Section>

          <Section title="Egg: 3 crack stages, tinted per tier">
            <PixelPanel className="flex flex-col gap-[12px]">
              {tierOrder.map((t) => (
                <div key={t} className="flex items-center justify-between">
                  {([0, 1, 2, 3] as const).map((s) => (
                    <PixelSprite key={s} rows={eggStage(s)} palette={{ ...egg.palette, t: tiers[t].color }} scale={2} />
                  ))}
                  <span className="w-[80px] text-right text-[16px]">{tiers[t].label}</span>
                </div>
              ))}
            </PixelPanel>
          </Section>

          <Section title="Pirate's Plunder on every pet">
            <PixelPanel className="flex flex-wrap items-end justify-around gap-[12px]">
              {pets.map((p) => {
                const n = p.sprite.rows.length;
                return <PixelSprite key={p.id} rows={p.sprite.rows} palette={p.sprite.palette} scale={Math.floor(tiers[p.tier].scale / 2)} layers={accessoryLayers("pirate", p.anchors, n)} />;
              })}
            </PixelPanel>
          </Section>

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
          </Section>

          <Section title="Quest cards">
            {quests.map((q, i) => (
              <QuestCard key={q.title} {...q} done={done[i]} onToggle={() => setDone(done.map((v, j) => (j === i ? !v : v)))} />
            ))}
          </Section>

          <Section title="Bottom nav">
            <BottomNav tabs={tabs} active={tab} onSelect={setTab} />
          </Section>
        </div>
      </SkinProvider>
    </main>
  );
}
