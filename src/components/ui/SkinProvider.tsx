"use client";

import { createContext, useContext, type ReactNode } from "react";
import { skinVars, type Skin } from "@/styles/theme";

const SkinContext = createContext<Skin | null>(null);

// Canvas-drawn pieces (icons) need the hex values, CSS pieces read the variables.
export function useSkin() {
  const skin = useContext(SkinContext);
  if (!skin) throw new Error("useSkin must be used inside <SkinProvider>");
  return skin;
}

export default function SkinProvider({ skin, className, children }: { skin: Skin; className?: string; children: ReactNode }) {
  return (
    <SkinContext value={skin}>
      <div className={className} style={{ ...skinVars(skin), background: skin.screen, color: skin.text }}>
        {children}
      </div>
    </SkinContext>
  );
}
