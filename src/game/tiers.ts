export type Tier = "common" | "uncommon" | "rare" | "mythic" | "legendary";

// Sprite size per tier, the whole-number display scale, reveal flash color and egg odds (SPEC.md).
export const tiers: Record<Tier, { size: number; scale: number; color: string; odds: number; label: string }> = {
  common: { size: 16, scale: 8, color: "#b8b8c0", odds: 0.55, label: "Common" },
  uncommon: { size: 24, scale: 6, color: "#6abe30", odds: 0.25, label: "Uncommon" },
  rare: { size: 32, scale: 5, color: "#5fa8ff", odds: 0.13, label: "Rare" },
  mythic: { size: 48, scale: 4, color: "#b05cff", odds: 0.06, label: "Mythic" },
  legendary: { size: 64, scale: 4, color: "#f4c542", odds: 0.01, label: "Legendary" },
};

export const tierOrder: Tier[] = ["common", "uncommon", "rare", "mythic", "legendary"];
