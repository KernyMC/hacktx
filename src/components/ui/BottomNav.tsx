"use client";

import PixelSprite from "@/components/PixelSprite";
import { useSkin } from "./SkinProvider";

type Tab = { id: string; label: string; icon: string[] };

export default function BottomNav({ tabs, active, onSelect }: { tabs: Tab[]; active: string; onSelect: (id: string) => void }) {
  const skin = useSkin();
  const palette = { o: skin.outline, a: skin.accent, f: skin.panelLight };
  return (
    <nav className="px-plaque flex p-[6px]" aria-label="Main">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          aria-current={t.id === active ? "page" : undefined}
          onClick={() => onSelect(t.id)}
          className="px-focus flex flex-1 flex-col items-center gap-[3px] py-[6px] font-display text-[13px]"
          style={t.id === active ? { background: "var(--panel)", color: "var(--text)" } : undefined}
        >
          <PixelSprite rows={t.icon} palette={palette} scale={3} />
          {t.label}
        </button>
      ))}
    </nav>
  );
}
