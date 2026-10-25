"use client";

import PixelSprite from "@/components/PixelSprite";
import { useSkin } from "./SkinProvider";

type Props = {
  icon: string[];
  title: string;
  xp: number;
  coins: number;
  done: boolean;
  onToggle: () => void;
};

// Icon rows use o = outline, a = accent, f = light.
export default function QuestCard({ icon, title, xp, coins, done, onToggle }: Props) {
  const skin = useSkin();
  return (
    <div className="px-panel flex items-center gap-[12px] px-[15px] py-[12px]">
      <PixelSprite rows={icon} palette={{ o: skin.outline, a: skin.accent, f: skin.panelLight }} scale={3} />
      <div className="flex-1 leading-tight">
        <div className={done ? "line-through opacity-60" : undefined}>{title}</div>
        <div className="font-display text-[13px] opacity-80">
          +{xp} XP · +{coins} coins
        </div>
      </div>
      <button
        type="button"
        aria-label={`${done ? "Undo" : "Complete"} ${title}`}
        aria-pressed={done}
        onClick={onToggle}
        className="px-btn grid h-[33px] w-[33px] place-items-center font-display text-[16px]"
        style={done ? undefined : { background: "var(--panel-light)", color: "var(--text)" }}
      >
        {done ? "✓" : ""}
      </button>
    </div>
  );
}
