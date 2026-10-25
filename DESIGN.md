# Familiars: visual directions

Goal: a cute, polished, cohesive 16-bit pet on a phone screen. All three directions share the same rules:

- Pets are 32x32 sprites, hand-placed pixels, scaled by integer steps (x6 to x8 on a 390px screen) with `image-rendering: pixelated`.
- Each sprite has a dark outline (never pure black), one main color, a shade and a highlight. Big eyes with a 1px shine, a blush dot on each cheek.
- UI chrome is built from hard-edged pixel steps (stacked `box-shadow`s), never border-radius blur.
- Motion snaps to whole pixels; squash and stretch is quick and cute, never floaty for no reason.

## Research notes

- **Stardew Valley**: warm wood frames around cream parchment, orange-brown outlines, saturated greens. Everything feels hand-made and slightly chunky. ConcernedApe's style (see the Stardew modding wiki's pixel-art guide) uses a few hue-shifted shades per material instead of plain darker tints.
- **Tamagotchi**: the egg-shaped shell sets the vibe as much as the sprite. Characters started as loose "heta-uma" drawings turned into very low-color pixel art (32x32, about 4 colors). Modern Pix models use pastel shells (floral pink, sky purple, ocean blue, nature green).
- **Neko Atsume**: simple, minimal, very readable. Flat cream backgrounds, few colors, cute because of restraint and pose, not detail.
- **EarthBound / cozy night**: playful double-line window frames, odd lovely color combos (purple + peach + mint), starry backdrops.
- **UI kits** (Kenney, itch.io): 9-slice panels with a 2-3px border, a 1px inner highlight line, buttons with a 2px "pressed" offset.

## Direction 1: Meadow Cottage

Stardew-style warm farmhouse. Wood frames, cream parchment, leafy greens. The pet lives in a sunny cottage room with a window onto the garden.

| Role | Hex |
|---|---|
| Outline / ink | `#3b2417` |
| Wood dark | `#6b3e26` |
| Wood | `#a0603a` |
| Wood light | `#d9a066` |
| Parchment | `#f6e7c1` |
| Paper highlight | `#fff6dc` |
| Leaf dark | `#3f7a3a` |
| Leaf | `#6abe30` |
| Sky | `#8fd3ff` |
| Blush | `#f7a1b0` |
| Gold (XP, coins) | `#f4c542` |
| Pet main (peach) | `#ffc58a` |

- **Fonts**: Pixelify Sans (display) + Nunito (body).
- **Frames**: 3px wood border with a 1px light bevel on top-left and dark on bottom-right, parchment fill. Buttons are wooden plaques that sink 2px when pressed. Quest cards are pinned notes with a little tack.
- **Pet**: round chibi, about 2 heads tall, short stubby legs, leaf sprout on the head, 4px eyes. Fills ~24x24 of the 32x32 grid.
- **Animation**: soft bouncy idle (2px up, 1.2s), slow blinks, squish on tap with a little hop. Happy, homey.

## Direction 2: Pocket Device

Tamagotchi / GBA handheld. The whole screen sits inside a candy-colored egg shell, the room is a pale-green LCD, chrome is crisp and graphic.

| Role | Hex |
|---|---|
| Ink | `#2b2d42` |
| Shell | `#ff8fb8` |
| Shell shade | `#c2457a` |
| Shell highlight | `#ffd1e3` |
| LCD | `#e8f7d4` |
| LCD shade | `#b4d99a` |
| Mint | `#7ee0c3` |
| Lilac | `#b9a3ff` |
| Butter | `#ffe680` |
| Coral | `#ff7a7a` |
| White | `#ffffff` |

- **Fonts**: Press Start 2P (display) + VT323 (body, used at 20px+ so it stays readable).
- **Frames**: 2px ink outline with a hard 3px drop shadow, no bevel. Buttons are round-ish pill shapes made of pixel steps, like the device's three buttons. Panels look like LCD windows with a faint scanline.
- **Pet**: tiny big-eyed blob, 1.5 heads tall, no neck, little antenna. Smaller in the frame (~20x20) so it reads as "on a screen".
- **Animation**: snappy, 2-frame steps (`steps()` timing), side-to-side hop, blink is a single frame. Feels like a toy.

## Direction 3: Starlit Dream

Cozy night, EarthBound-ish. A bedroom with a big starry window, dusk purples with warm peach light from a lamp. Quiet and magical.

| Role | Hex |
|---|---|
| Outline | `#120f26` |
| Night | `#1d1b3a` |
| Indigo | `#2e2a5c` |
| Violet | `#5b4b9a` |
| Lavender | `#a99be0` |
| Peach | `#ffb38a` |
| Apricot | `#ffd6a5` |
| Star | `#fff3a8` |
| Rose | `#ff7eb6` |
| Mint | `#6fe3d4` |
| Moon white | `#f8f4ff` |

- **Fonts**: Silkscreen (display) + Quicksand (body).
- **Frames**: EarthBound-style double line: 2px light line, 2px gap of dark, 2px outline, on a deep indigo panel. Buttons glow (lavender fill, peach on press). Quest cards have a tiny star in the corner.
- **Pet**: floaty spirit-cat, 2 heads tall, pointed ears, wispy tail, no legs, star mark on the forehead. ~22x26 in the grid.
- **Animation**: slow sine float (3px, 2.4s ease-in-out), twinkling stars behind, sparkles on tap. Dreamy, calm.

## Free asset packs (reference only, nothing copied into the repo)

| Pack | Link | License | Useful for |
|---|---|---|---|
| Kenney Pixel UI Pack (750 assets, 16x16 9-slices) | https://opengameart.org/content/pixel-ui-pack-750-assets | CC0 | Panel/button reference, cursors, bars |
| Kenney UI Pack (400+ sprites) | https://kenney-assets.itch.io/ui-pack | CC0 | Button/panel layout ideas (not pixel art) |
| Kenney Tiny Town (16x16 tiles) | https://kenney.nl/assets/tiny-town | CC0 | Garden/room background tiles |
| OgreofWart "Eggs" (whole, cracked, hatched) | https://opengameart.org/content/eggs | CC0 | Egg crack-stage reference |
| isaiah658's Pixel Pack #2 (64x64 monsters, 16x16 furniture, UI) | https://opengameart.org/node/107528 | CC0 | Monster proportions, room furniture |

Licenses checked on each page on 2026-10-24. Re-check the license file inside a download before shipping any of it.
