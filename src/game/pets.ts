import { skins } from "@/styles/skins";
import type { Skin } from "@/styles/theme";
import type { Anchors } from "./accessories";
import { mochi, nib, pip } from "./art/commons";
import { aurora } from "./art/legendary";
import { ember, marina } from "./art/mythics";
import { lumi, sprout } from "./art/rares";
import { clover, puddle } from "./art/uncommons";
import type { Habitat } from "./habitat";
import { habitats } from "./habitats";
import { icons, type IconSet } from "./icons";
import type { Sprite } from "./sprite";
import type { Tier } from "./tiers";

export type Particle = "hearts" | "sparkles" | "bubbles" | "leaves" | "embers" | "stars";

export type Pet = {
  id: string;
  name: string;
  species: string;
  tier: Tier;
  sprite: Sprite;
  motion: "bounce" | "hop" | "float";
  pitch: number;
  particle: Particle;
  // Where accessories sit, on the sprite's own grid: top center of the head, viewer-left eye.
  anchors: Anchors;
  habitat: Habitat;
  icons: IconSet;
  skin: Skin;
};

type Def = Omit<Pet, "habitat" | "icons" | "skin">;

const defs: Def[] = [
  { id: "mochi", name: "Mochi", species: "jelly slime", tier: "common", sprite: mochi, motion: "bounce", pitch: 587, particle: "hearts", anchors: { head: [8, 3], eye: [5, 8] } },
  { id: "pip", name: "Pip", species: "chick", tier: "common", sprite: pip, motion: "hop", pitch: 880, particle: "hearts", anchors: { head: [8, 3], eye: [6, 7] } },
  { id: "nib", name: "Nib", species: "mushroom sprite", tier: "common", sprite: nib, motion: "bounce", pitch: 494, particle: "sparkles", anchors: { head: [8, 1], eye: [6, 9] } },
  { id: "clover", name: "Clover", species: "bunny", tier: "uncommon", sprite: clover, motion: "hop", pitch: 784, particle: "hearts", anchors: { head: [12, 8], eye: [8, 12] } },
  { id: "puddle", name: "Puddle", species: "frog", tier: "uncommon", sprite: puddle, motion: "hop", pitch: 392, particle: "bubbles", anchors: { head: [12, 8], eye: [6, 6] } },
  { id: "sprout", name: "Sprout", species: "leaf chibi", tier: "rare", sprite: sprout, motion: "bounce", pitch: 523, particle: "leaves", anchors: { head: [16, 6], eye: [11, 15] } },
  { id: "lumi", name: "Lumi", species: "spirit cat", tier: "rare", sprite: lumi, motion: "float", pitch: 440, particle: "sparkles", anchors: { head: [16, 7], eye: [11, 14] } },
  { id: "ember", name: "Ember", species: "flame-tailed fox", tier: "mythic", sprite: ember, motion: "bounce", pitch: 659, particle: "embers", anchors: { head: [24, 10], eye: [14, 17] } },
  { id: "marina", name: "Marina", species: "axolotl", tier: "mythic", sprite: marina, motion: "float", pitch: 698, particle: "bubbles", anchors: { head: [24, 10], eye: [11, 18] } },
  { id: "aurora", name: "Aurora", species: "celestial dragon", tier: "legendary", sprite: aurora, motion: "float", pitch: 523, particle: "stars", anchors: { head: [32, 11], eye: [21, 21] } },
];

export const pets: Pet[] = defs.map((d) => ({ ...d, habitat: habitats[d.id], icons: icons[d.id], skin: skins[d.id] }));
