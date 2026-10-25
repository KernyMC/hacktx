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

## Animal list (id · rarity · N · look)

See `js/animals.js` for the full definitions (name, flavor, pal). Each `def('<id>', {...})` has `shapes` describing the
current look: use it as the reference silhouette (ears, tail, horns, wings) and make it much better.

axolotl · common · N=20 · Axolotl
cat · common · N=20 · Snack Cat
dog · common · N=20 · Party Pup
bunny · common · N=20 · Clover Bun
chick · common · N=20 · Sunny Chick
hamster · common · N=20 · Pocket Hammy
frog · common · N=20 · Puddle Frog
mouse · common · N=20 · Crumb Mouse
duckling · common · N=20 · Splash Duck
pig · uncommon · N=24 · Mud Piglet
sheep · uncommon · N=24 · Cloud Lamb
hedgehog · uncommon · N=24 · Burr Hog
squirrel · uncommon · N=24 · Acorn Squirrel
turtle · uncommon · N=24 · Pond Turtle
prairiedog · uncommon · N=24 · Lookout Pup
goat · uncommon · N=24 · Hill Goat
redpanda · rare · N=32 · Ember Panda
penguin · rare · N=32 · Tux Penguin
fennec · rare · N=32 · Dune Fennec
otter · rare · N=32 · River Otter
raccoon · rare · N=32 · Trash Bandit
capybara · rare · N=32 · Chill Capy
owl · rare · N=32 · Night Owl
roadrunner · rare · N=32 · Road Runner
armadillo · mythic · N=40 · Armored Dillo
snowleopard · mythic · N=40 · Frost Leopard
chameleon · mythic · N=40 · Prism Chameleon
bat · mythic · N=40 · Congress Bat
jackalope · mythic · N=40 · Jackalope
longhorn · legendary · N=48 · Texas Longhorn
grackle · legendary · N=48 · Grackle
salamander · legendary · N=48 · Golden Salamander
hornedlizard · legendary · N=48 · Horned Lizard

## Standard face v2 (REQUIRED: copy verbatim into every animal file; never draw your own eyes/mouth)

Every species gets a **face kind** so the mouth matches the animal and sits on the muzzle it drew:
`kitty` (pink nose + "w"), `dog` (dark nose + smile/tongue), `bunny` (pink nose + split lip + teeth),
`snout` (plate with nostrils, mouth under it: pig, capybara, longhorn, armadillo), `beak` (opens to eat:
chick, duckling, penguin, owl), `wide` (no nose, wide grin: frog, axolotl, chameleon, turtle, bat), `eyes`
(eyes + blush only, for species whose nose/mouth is off-centre: hedgehog, roadrunner).
**Always pass `noseY` and `mouthY`** as rows on the muzzle/beak you drew; defaults only work for plain round heads.
Palette keys it needs: `pal({ k: "#2b2140", w: "#ffffff", q: "#ff8fab", t: "#9fd3ff", M: "#c8405e", T: "#ff9fb8", o: "#ff9a3c", O: "#c96a1a", p: "#ffb3c7" })`.
Review rule: build, open `_preview/<id>.png` and check all four rows: nose on the muzzle, mouth below the nose, beak
under the eyes, eat frame opens the mouth, sad frame frowns + tear.

```js
// ---- STANDARD FACE v2 (copy verbatim into every animal file) -------------------------
// face(c, { cx, ey, mood, f, S, kind, noseY, mouthY, nose, beak, snout })
//   cx: face centre x · ey: top row of the eyes · mood: idle|happy|eat|sad · f: frame 0..3 · S: inner canvas
//   kind: "kitty" (pink nose + w mouth)        cat-like: cat, fennec, snowleopard, redpanda
//         "dog"   (dark nose + smile/tongue)   dog, otter, raccoon, hedgehog, squirrel, hamster, mouse, prairiedog, jackalope, sheep, goat
//         "bunny" (pink Y nose, split lip)     bunny
//         "snout" (snout plate + nostrils, mouth under it)   pig, capybara, longhorn, armadillo
//         "beak"  (beak instead of nose+mouth; opens to eat) chick, duckling, penguin, roadrunner, owl
//         "wide"  (no nose, wide smile)        frog, axolotl, chameleon, turtle, bat
//   noseY / mouthY: rows where the nose and mouth sit — PUT THEM ON THE MUZZLE YOU DREW. Defaults: just under the eyes.
//   nose: palette key for a "dog"/"snout" nose (default "k") · beak: key for the beak (default "o") · snout: key for the snout plate (default "p")
function face(c, o) {
  const { cx, ey, mood, f, S } = o, kind = o.kind || "kitty"
  const big = S >= 30, huge = S >= 38, u = huge ? 2 : 1
  const ew = huge ? 4 : big ? 3 : 2, eh = huge ? 5 : big ? 3 : 2, gap = o.gap || (huge ? 9 : big ? 6 : 4)
  const lx = cx - Math.floor(gap / 2) - ew + 1, rx = cx + Math.ceil(gap / 2)
  const blink = mood === "idle" && f === 2
  for (const x0 of [lx, rx]) {
    if (blink) { c.hline(x0, ey + eh - 1, ew, "k"); continue }
    if (mood === "happy") {                                     // ^ ^ eyes
      if (huge) { c.px(x0, ey + 2, "k"); c.px(x0 + 1, ey + 1, "k"); c.px(x0 + 2, ey + 1, "k"); c.px(x0 + 3, ey + 2, "k") }
      else if (big) { c.px(x0, ey + 1, "k"); c.px(x0 + 1, ey, "k"); c.px(x0 + 2, ey + 1, "k") }
      else { c.px(x0, ey + 1, "k"); c.px(x0 + 1, ey, "k") }
      continue
    }
    c.rect(x0, ey, ew, eh, "k")
    if (mood === "sad") c.rect(x0, ey, ew, 1, "_")               // droopy lid (erase the top row)
    c.px(x0, ey + (mood === "sad" ? 1 : 0), "w")                 // glint
    if (huge) c.px(x0 + ew - 1, ey + eh - 2, "w")
  }
  const noseY = o.noseY != null ? o.noseY : ey + eh + (big ? 1 : 0)
  const mouthY = o.mouthY != null ? o.mouthY : noseY + (kind === "snout" ? (huge ? 4 : 3) : kind === "beak" ? 0 : u + 0)
  const open = (w, h) => { c.rect(cx - Math.floor(w / 2), mouthY, w, h, "M"); c.rect(cx - Math.floor(w / 2) + (w > 2 ? 1 : 0), mouthY + h - 1, Math.max(1, w - 2), 1, "T") }
  const frown = () => { c.px(cx - u, mouthY + 1, "k"); c.hline(cx - u + 1, mouthY, u * 2 - 1, "k"); c.px(cx + u, mouthY + 1, "k") }
  const smile = (wide) => { const r = wide ? u + 1 : u; c.px(cx - r, mouthY - 1, "k"); c.hline(cx - r + 1, mouthY, r * 2 - 1, "k"); c.px(cx + r, mouthY - 1, "k") }
  const eating = mood === "eat" && f % 2 === 0
  if (kind === "kitty") {
    c.px(cx, noseY, "q"); if (big) c.hline(cx - 1, noseY, 3, "q"); if (huge) c.px(cx, noseY + 1, "q")
    if (eating) open(big ? 3 : 2, 2)
    else if (mood === "sad") frown()
    else if (mood === "happy") { c.hline(cx - u, mouthY, u * 2 + 1, "k"); c.hline(cx - u + 1, mouthY + 1, u * 2 - 1, "M") }
    else { c.px(cx - 1, mouthY, "k"); c.px(cx + 1, mouthY, "k"); if (big) { c.px(cx - 2, mouthY - 1, "k"); c.px(cx + 2, mouthY - 1, "k") } }   // w
  } else if (kind === "dog") {
    const nk = o.nose || "k"
    if (huge) { c.rect(cx - 1, noseY, 3, 2, nk); c.px(cx - 1, noseY, "w") } else if (big) c.hline(cx - 1, noseY, 3, nk); else c.hline(cx, noseY, 2, nk)
    if (eating) open(big ? 3 : 2, 2)
    else if (mood === "sad") frown()
    else if (mood === "happy") { c.hline(cx - u, mouthY, u * 2 + 1, "k"); c.rect(cx - (big ? 1 : 0), mouthY + 1, big ? 2 : 1, big ? 2 : 1, "T") }  // tongue
    else smile(false)
  } else if (kind === "bunny") {
    c.px(cx, noseY, "q"); if (big) { c.hline(cx - 1, noseY - 1, 3, "q") }
    c.px(cx, mouthY, "k")                                       // split lip
    if (eating) open(2, 2)
    else if (mood === "sad") frown()
    else { c.px(cx - 1, mouthY + (mood === "happy" ? 1 : 0), "k"); c.px(cx + 1, mouthY + (mood === "happy" ? 1 : 0), "k") }
    if (big) { c.px(cx - 1, noseY + 1, "w"); c.px(cx, noseY + 1, "w") }   // teeth
  } else if (kind === "snout") {
    const sw = huge ? 9 : big ? 7 : 5, sh = huge ? 5 : big ? 4 : 3
    c.ellipse(cx, noseY + Math.floor(sh / 2), Math.floor(sw / 2), Math.floor(sh / 2), o.snout || "p")
    c.px(cx - u, noseY + 1, o.nose || "k"); c.px(cx + u, noseY + 1, o.nose || "k")   // nostrils
    if (eating) open(big ? 3 : 2, 2)
    else if (mood === "sad") frown()
    else if (mood === "happy") smile(true)
    else c.hline(cx - u, mouthY, u * 2 + 1, "k")
  } else if (kind === "beak") {
    const bk = o.beak || "o", bw = huge ? 7 : big ? 5 : 3
    if (eating || mood === "happy") {                           // open beak
      c.poly([cx - Math.floor(bw / 2), mouthY, cx + Math.floor(bw / 2), mouthY, cx, mouthY - u], bk)
      c.poly([cx - Math.floor(bw / 2) + 1, mouthY + 1, cx + Math.floor(bw / 2) - 1, mouthY + 1, cx, mouthY + u + 1], "O")
      if (eating) c.px(cx, mouthY + 1, "M")
    } else c.poly([cx - Math.floor(bw / 2), mouthY, cx + Math.floor(bw / 2), mouthY, cx, mouthY + u + (big ? 1 : 0)], bk)
    if (mood === "sad") { c.px(cx - Math.floor(bw / 2) - 1, mouthY, "k"); c.px(cx + Math.floor(bw / 2) + 1, mouthY, "k") }
  } else if (kind === "wide") {
    const r = huge ? 4 : big ? 3 : 2
    if (eating) open(r * 2 - 1, 2)
    else if (mood === "sad") { c.px(cx - r, mouthY + 1, "k"); c.hline(cx - r + 1, mouthY, r * 2 - 1, "k"); c.px(cx + r, mouthY + 1, "k") }
    else if (mood === "happy") { c.px(cx - r, mouthY - 1, "k"); c.hline(cx - r + 1, mouthY, r * 2 - 1, "k"); c.px(cx + r, mouthY - 1, "k"); c.hline(cx - r + 2, mouthY + 1, r * 2 - 3, "M") }
    else { c.px(cx - r, mouthY - 1, "k"); c.hline(cx - r + 1, mouthY, r * 2 - 1, "k"); c.px(cx + r, mouthY - 1, "k") }
  }
  if (mood === "sad") { c.px(lx - 1, ey + eh, "t"); if (f) c.px(lx - 1, ey + eh + 1, "t") }   // tear
  const bx = big ? 2 : 1
  c.rect(lx - bx - 1, ey + eh, bx, 1, "q"); c.rect(rx + ew + 1, ey + eh, bx, 1, "q")           // blush
}
```
