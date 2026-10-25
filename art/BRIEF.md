# Familiars sprite brief (pxl)

Game: Familiars (HackTX 2026). Cute 16-bit pixel pets. Every animal is drawn with **pxl**
(`node tools/pxl/bin/pxl.js`, docs in `tools/pxl/SKILL.md` + `tools/pxl/reference.md`). No emoji anywhere.

## Contract (the game loads exactly this)

One file per animal: `art/animals/<id>.px.js`. It must define four anims and one sheet:

```js
// N = final cell size for this animal's rarity: common 20 · uncommon 24 · rare 32 · mythic 40 · legendary 48
// selout/outline grows the canvas by 1px on each side, so draw on an inner canvas of N-2.
const N = 24, S = N - 2
for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`<id>_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("<id>", [`<id>_idle`, `<id>_happy`, `<id>_eat`, `<id>_sad`], { cols: 4, pad: 0 })
```

Build + check: `node tools/pxl/bin/pxl.js build art/animals/<id>.px.js --out art/out/<id>` then look at
`art/out/<id>/_preview/<id>.png` (the 4x4 sheet: rows idle/happy/eat/sad, 4 frames each) and run
`node tools/pxl/bin/pxl.js lint art/animals/<id>.px.js <id>_idle`. Fix orphans/jaggies/pillow shading.
The result `art/out/<id>/<id>.png` must be exactly (4·N) × (4·N) px.

## Style guide (all 30 animals must look like one set)

- **Chibi**: head ≈ 50–60% of the height, big round eyes, tiny body, stubby legs. 3/4 front view, facing the viewer.
- **Bottom-aligned, centred**: feet on the last 1–2 rows of the inner canvas; leave ≥1 px empty on left/right.
- **Palette**: use the animal's colours from `js/animals.js` (`pal.b` body, `pal.d` markings, `pal.a` belly/light,
  `pal.c` inner ear/beak/horns, `pal.n` nose). Build ramps with `shades("1234", pal.b)` etc. so shadows go cool and
  lights warm. 2–4 shades per material. Ink `k: "#2b2140"`, eye white `w: "#ffffff"`, blush `"#ff8fab"`.
- **Light from top-left**: lit side `light`, right/underside `shade`. Never pillow-shade.
- **Outline: use `outline: "k"` (solid ink #2b2140), NOT `selout`.** The game draws pets over pastel skies and parchment
  panels; a soft coloured outline disappears there. The rest of the UI (icons, eggs) has solid ink outlines too.
- **Silhouette first.** Pets are shown at 160 px on the stage and 72 px in cards: the shape alone must say "hedgehog"
  (spiky back), "axolotl" (three gill fronds per side), "bunny" (long ears). Add the species' signature feature big.
- **Face**: two dark eyes with a 1px white glint (2px tall at N≥24, 3px at N≥40), small nose/mouth, blush dots.
  Higher tiers get more detail: fur texture, markings, a second shade step, a rim highlight (legendary: gold `#ffe9a3` rim on the right edge).
- **Animations** (4 frames each, the game plays them at its own speed):
  - `idle`: gentle breathing (body ±1px), blink on frame 2 (eyes become a 1px line), ears/tail twitch on frame 3.
  - `happy`: jump arc (y offset 0, -2, -3, -1 scaled by N/24), `^ ^` eyes or wide eyes, open smile, ears up.
  - `eat`: mouth opens/closes (frames 0,2 open with a dark mouth + cheeks puffed), small nod.
  - `sad`: ears/tail down, droopy half-closed eyes, a 1px light-blue tear on frames 1–3, body slumps 1px.
- Write a `draw(c, f, mood)` function with helpers; use `c.ellipse/circ/rect/poly/px/shade/light/clip`. Avoid giant hand grids;
  small `grid()` patches for faces are fine.
- Keep each file self-contained (no imports). Keep the file under ~150 lines.

## Animal list (id · rarity · N · class · look)

See `js/animals.js` for the full definitions (name, flavor, pal). Each `def('<id>', {...})` has `shapes` describing the
current look: use it as the reference silhouette (ears, tail, horns, wings) and make it much better.

axolotl · common · N=20 · water · Axolotl
cat · common · N=20 · farm · Snack Cat
dog · common · N=20 · farm · Party Pup
bunny · common · N=20 · farm · Clover Bun
chick · common · N=20 · farm · Sunny Chick
hamster · common · N=20 · prairie · Pocket Hammy
frog · common · N=20 · water · Puddle Frog
mouse · common · N=20 · farm · Crumb Mouse
duckling · common · N=20 · water · Splash Duck
pig · uncommon · N=24 · farm · Mud Piglet
sheep · uncommon · N=24 · farm · Cloud Lamb
hedgehog · uncommon · N=24 · wild · Burr Hog
squirrel · uncommon · N=24 · wild · Acorn Squirrel
turtle · uncommon · N=24 · water · Pond Turtle
prairiedog · uncommon · N=24 · prairie · Lookout Pup
goat · uncommon · N=24 · farm · Hill Goat
redpanda · rare · N=32 · wild · Ember Panda
penguin · rare · N=32 · water · Tux Penguin
fennec · rare · N=32 · prairie · Dune Fennec
otter · rare · N=32 · water · River Otter
raccoon · rare · N=32 · wild · Trash Bandit
capybara · rare · N=32 · water · Chill Capy
owl · rare · N=32 · wild · Night Owl
roadrunner · rare · N=32 · prairie · Road Runner
armadillo · mythic · N=40 · prairie · Armored Dillo
snowleopard · mythic · N=40 · wild · Frost Leopard
chameleon · mythic · N=40 · wild · Prism Chameleon
bat · mythic · N=40 · legends · Congress Bat
jackalope · mythic · N=40 · legends · Jackalope
longhorn · legendary · N=48 · legends · Texas Longhorn
