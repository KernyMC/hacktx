import type { Layer } from "@/components/PixelSprite";
import type { Palette } from "./sprite";

// An accessory sprite plus the pixel inside it that lands on the pet's anchor point.
type Accessory = { rows: string[]; palette: Palette; anchor: [number, number]; on: "head" | "eye" };

export type Anchors = { head: [number, number]; eye: [number, number] };

const pirate: Palette = { o: "#1a1420", k: "#2b2b3a", w: "#ffffff", g: "#f4c542" };

export const accessories: Record<string, Accessory[]> = {
  pirate: [
    {
      on: "head",
      anchor: [5, 5],
      palette: pirate,
      rows: [
        "...ooooo...",
        ".ookkkkkoo.",
        "okkkkwkkkko",
        "okkkkkkkkko",
        "ogggggggggo",
        ".ooooooooo.",
      ],
    },
    {
      on: "eye",
      anchor: [4, 4],
      palette: pirate,
      rows: ["k.....", ".k....", "..kkkk", "..kkkk", "..kkkk", "..kkkk"],
    },
  ],
};

// Turns an accessory set into canvas layers for a pet; pets 48px and up draw them at 2x.
export function accessoryLayers(id: string, anchors: Anchors, size: number): Layer[] {
  const k = size >= 48 ? 2 : 1;
  return (accessories[id] ?? []).map((a) => {
    const [px, py] = anchors[a.on];
    return { rows: a.rows, palette: a.palette, k, x: px - a.anchor[0] * k, y: py - a.anchor[1] * k };
  });
}
