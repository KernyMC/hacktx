// Cloud Lamb — uncommon, N=24. A puff of wool with a soft grey face, dark ears and legs, wool cap.
const N = 24, S = N - 2
const P = { b: "#ffffff", d: "#5e5470", a: "#f1eef7", c: "#ffa9c0", n: "#2b2140" }
pal({ k: "#2b2140", w: "#ffffff", q: "#ff8fab", t: "#9fd3ff", M: "#c8405e", T: "#ff9fb8" })
pal({ 1: "#cfc6e0", 2: P.a, 3: P.b }); ramps("123")          // wool: lavender shadow, pure white light
pal({ C: "#463d5a", D: P.d, E: "#9a8fb3", F: "#b5aacd", c: P.c })   // face / legs / ears

// Ellipse lit from the top-left: dark rim on the lower-right, a highlight patch up-left.
function blob(c, cx, cy, rx, ry, o = {}) {
  const ax = rx + 0.5, ay = ry + 0.5, inside = (x, y) => (x / ax) ** 2 + (y / ay) ** 2 <= 1
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    if (!inside(x, y)) continue
    let col = o.mid || "2"
    if (!inside(x + 1, y + 1) && (x > 0 || y > 0)) col = o.dark || "1"
    else if (((x + rx * 0.5) / (ax * 0.36)) ** 2 + ((y + ry * 0.5) / (ay * 0.3)) ** 2 <= 1) col = o.lit || "3"
    c.px(cx + x, cy + y, col)
  }
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

function puffs(c, pts, k) { for (const [x, y, r] of pts) c.circ(x, y, r, k) }

function draw(c, f, mood) {
  const oy = mood === "happy" ? [0, -2, -3, -1][f] : 0
  const hy = (mood === "idle" && f === 1 ? -1 : 0) + (mood === "sad" ? 1 : 0) + (mood === "eat" && f % 2 === 0 ? 1 : 0)
  // legs
  c.rect(6, 19 + oy, 2, 3, "D"); c.rect(13, 19 + oy, 2, 3, "D"); c.px(6, 19 + oy, "E"); c.px(13, 19 + oy, "E")
  // woolly body: a blob plus bumps along the edge
  blob(c, 10, 14 + oy, 8, 5)
  puffs(c, [[3, 12 + oy, 1], [17, 13 + oy, 1], [4, 17 + oy, 1], [10, 19 + oy, 1], [16, 17 + oy, 1], [8, 10 + oy, 1], [13, 10 + oy, 1]], "2")
  puffs(c, [[4, 13 + oy, 1], [16, 15 + oy, 1], [11, 19 + oy, 1]], "1"); c.px(3, 11 + oy, "3"); c.px(4, 16 + oy, "3")
  // ears (perk up when happy, droop when sad)
  const Y = 9 + hy + oy, edy = mood === "happy" ? -1 : mood === "sad" ? 1 : 0
  c.ellipse(4, Y + edy, 2, 1, "D"); c.ellipse(16, Y + edy, 2, 1, "C"); c.px(3, Y + edy, "E"); c.px(15, Y + edy, "D")
  if (mood === "idle" && f === 3) c.px(2, Y - 1, "D")
  // face then the wool cap on top of the head
  blob(c, 10, Y + 1, 5, 4, { mid: "E", dark: "D", lit: "F" })
  blob(c, 10, Y - 4, 6, 3)
  puffs(c, [[5, Y - 3, 1], [15, Y - 3, 1], [8, Y - 6, 1], [12, Y - 6, 1]], "2"); c.px(4, Y - 4, "3"); c.px(7, Y - 7, "3"); c.px(16, Y - 2, "1")
  if (mood === "eat" && f % 2 === 0) { c.rect(6, Y + 2, 1, 2, "F"); c.rect(14, Y + 2, 1, 2, "E") }
  face(c, { cx: 10, ey: Y, mood, f, S, kind: "dog", nose: "q", noseY: Y + 2, mouthY: Y + 3 })
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`sheep_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("sheep", ["sheep_idle", "sheep_happy", "sheep_eat", "sheep_sad"], { cols: 4, pad: 0 })
