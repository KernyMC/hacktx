// Familiars: Great-tailed Grackle (N=48): the HEB parking-lot king. Signature: tail flare. Built with pxl. Shared helpers + draw().
const N = 48, PAL = { b: '#3a3d78', d: '#6a4fb0', a: '#b8c4f4', c: '#ffe066', n: '#2b2140' }
// ---- shared Familiars helpers (identical in every animal file) ----
pal({ k: "#2b2140", w: "#ffffff", q: "#ff8fab", t: "#9fd3ff", M: "#c8405e", T: "#ff9fb8", g: "#ffe9a3" })
const SH = { spread: 0.42, shift: 20 }
shades("1234", PAL.b, SH); shades("5678", PAL.d, SH); shades("abcd", PAL.a, SH); shades("efgh", PAL.c, SH); shades("ijmn", PAL.n, SH)
const SC = N / 24, S = N - 2
const R = (v) => Math.round(v)
const rampOf = (k) => ["1234", "5678", "abcd", "efgh", "ijmn"].find((r) => r.includes(k)) || k
// light from top-left: `k` is the mid key of a ramp; shadow lower-right, highlight upper-left
function blob(c, cx, cy, rx, ry, k, lit = 0.5) {
  const ramp = rampOf(k)
  const inside = (x, y) => ((x - cx) / (rx + 0.5)) ** 2 + ((y - cy) / (ry + 0.5)) ** 2 <= 1 && ramp.includes(c.key(x, y) || "?")
  c.ellipse(cx, cy, rx, ry, k)
  const lx = cx - rx * 0.4, ly = cy - ry * 0.5
  const d = (x, y) => Math.hypot((x - lx) / (rx + 0.5), (y - ly) / (ry + 0.5))
  c.shade((x, y) => inside(x, y) && d(x, y) > 1.45)
  if (lit) c.light((x, y) => inside(x, y) && d(x, y) < lit)
}
pal({ o: "#ff9a3c", O: "#c96a1a", p: "#ffb3c7" })   // FACE_PAL: beak / beak dark / snout
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
// cheek puffs while chewing (eat, odd frames), drawn before face()
function puff(c, lx, rx, y, key) { const r = N >= 40 ? 2 : 1; c.ellipse(lx, y, r + 1, r, key); c.ellipse(rx, y, r + 1, r, key) }
const JUMP = (f) => R([0, -2, -3, -1][f] * SC), BOB = (f) => [0, -1, -1, 0][f]
function offsets(mood, f) {
  const J = mood === "happy" ? JUMP(f) : 0, B = J + (mood === "idle" ? BOB(f) : 0) + (mood === "sad" ? 1 : 0)
  return { J, B, H: B + (mood === "eat" ? [0, 1, 0, 1][f] : 0), E: mood === "happy" ? -1 : mood === "sad" ? 1 : mood === "idle" && f === 2 ? -1 : 0 }
}
// ---- end helpers ----
function draw(c, f, mood) {
  const { J, B, H, E } = offsets(mood, f)
  // signature: the long keel tail fans up (happy, and a flick on idle frame 3); droops when sad
  const flare = mood === "happy" || (mood === "idle" && f === 3)
  if (mood === "sad") { c.poly([30, 36 + B, 44, 44, 38, 45], "1"); c.poly([31, 38 + B, 41, 45, 35, 45], "2") }
  else if (flare) {
    c.poly([30, 34 + B, 40, 4 + B, 45, 8 + B, 36, 34 + B], "1"); c.poly([31, 35 + B, 45, 14 + B, 45, 24 + B], "2")
    c.line(33, 32 + B, 41, 8 + B, "7"); c.line(34, 34 + B, 44, 18 + B, "6")
  } else { c.poly([30, 34 + B, 44, 18 + B, 45, 26 + B, 34, 38 + B], "1"); c.line(33, 35 + B, 43, 22 + B, "6") }
  // thin legs, body with a purple-blue sheen
  for (const x0 of [18, 26]) { c.line(x0, 38 + B, x0, 43 + J, "k"); c.hline(x0 - 2, 44 + J, 4, "k") }
  blob(c, 22, 32 + B, 12, 9, "2", 0.45)
  c.ellipse(27, 32 + B, 6, 5, "6"); c.line(23, 29 + B, 31, 34 + B, "7"); c.light([14, 26 + B, 8, 4])
  // head with iridescent crown
  blob(c, 22, 17 + H, 12, 11, "2", 0.5)
  c.hline(16, 7 + H, 9, "c"); c.hline(14, 8 + H, 4, "b"); c.px(25, 8 + H, "7")
  // pale yellow eyes behind the standard face's pupils (not on ^ ^ or blink frames)
  const ey = 13 + H + E
  if (mood !== "happy" && !(mood === "idle" && f === 2)) { c.rect(14, ey - 1, 6, 7, "h"); c.rect(26, ey - 1, 6, 7, "h") }
  if (mood === "eat" && f % 2) puff(c, 13, 32, 22 + H, "6")
  face(c, { cx: 22, ey, mood, f, S, kind: "beak", mouthY: 21 + H, beak: "8" })
  for (let y = 0; y < S; y++) for (let x = 24; x < S - 1; x++) if (c.is(x, y, "1234") && !c.is(x + 1, y, "*")) c.px(x, y, "g")
  const sp = [[40, 6], [6, 4], [41, 30], [5, 28]][f]; c.px(sp[0], sp[1], "g"); c.px(sp[0] - 1, sp[1], "g"); c.px(sp[0] + 1, sp[1], "g"); c.px(sp[0], sp[1] - 1, "g"); c.px(sp[0], sp[1] + 1, "g")
}
for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`grackle_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("grackle", ["grackle_idle", "grackle_happy", "grackle_eat", "grackle_sad"], { cols: 4, pad: 0 })
