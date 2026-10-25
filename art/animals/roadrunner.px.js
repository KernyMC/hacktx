// Road Runner — rare, N=32. Blue-grey bird: spiky crest, long orange bill, tall tail, long legs.
const N = 32, S = N - 2
pal({ k: "#2b2140", w: "#ffffff", q: "#ff8fab", t: "#9fd3ff", M: "#c8405e", T: "#ff9fb8" })
shades("1234567", "#6f86b8", { spread: 0.8 })    // feathers: 4 base
shades("PQRSUVX", "#3f4f7a", { spread: 0.7 })    // dark feathers: S base
shades("hijlmno", "#e8e2f0", { spread: 0.5 })    // light belly / eye streak: l base
shades("abcdefg", "#ff9a3c", { spread: 0.7 })    // bill + legs: d base
// ---- shared helpers (same in every animal file) ----
function motion(f, mood) {
  const k = N / 24
  return { dy: (mood === "happy" ? Math.round([0, -2, -3, -1][f] * k) : 0) + (mood === "sad" ? (N >= 32 ? 2 : 1) : 0),
    br: mood === "idle" && (f === 1 || f === 2) ? 1 : 0, nod: mood === "eat" && (f === 1 || f === 2) ? 1 : 0,
    tw: mood === "idle" && f === 3 ? 1 : 0, open: mood === "eat" && (f === 0 || f === 2), up: mood === "happy", down: mood === "sad" }
}
// ellipse lit from top-left: base tone, shade crescent bottom-right, small highlight top-left
function blob(c, cx, cy, rx, ry, base, hi = true) {
  c.ellipse(cx, cy, rx, ry, base)
  const e = (x, y, ox, oy, s) => ((x + 0.5 - cx - ox) / (rx * s)) ** 2 + ((y + 0.5 - cy - oy) / (ry * s)) ** 2
  const inside = (x, y) => c.is(x, y, base) && e(x, y, 0, 0, 1.08) <= 1
  c.shade((x, y) => inside(x, y) && e(x, y, -rx * 0.22, -ry * 0.22, N >= 32 ? 1.1 : 1.12) > 1)
  if (hi) c.light((x, y) => inside(x, y) && e(x, y, -rx * 0.42, -ry * 0.45, 0.36) < 1)
}
// ---- STANDARD FACE (copy verbatim into every animal file) ----------------------------
// cx: face centre x · ey: eye row (top of the eyes) · mood: idle|happy|eat|sad · f: frame 0..3
// S = inner canvas size. Eyes/mouth scale with S. Needs palette keys k w q t M T.
function face(c, cx, ey, mood, f, S) {
  const big = S >= 30, huge = S >= 38
  const ew = huge ? 4 : big ? 3 : 2, eh = huge ? 5 : big ? 3 : 2, gap = huge ? 9 : big ? 6 : 4
  const lx = cx - gap / 2 - ew + 1, rx = cx + gap / 2
  const blink = mood === "idle" && f === 2
  const lid = mood === "sad"
  for (const x0 of [lx, rx]) {
    if (blink) { c.hline(x0, ey + eh - 1, ew, "k"); continue }
    if (mood === "happy") {                    // ^ ^ eyes
      if (huge) { c.px(x0, ey + 2, "k"); c.px(x0 + 1, ey + 1, "k"); c.px(x0 + 2, ey + 1, "k"); c.px(x0 + 3, ey + 2, "k") }
      else if (big) { c.px(x0, ey + 1, "k"); c.px(x0 + 1, ey, "k"); c.px(x0 + 2, ey + 1, "k") }
      else { c.px(x0, ey + 1, "k"); c.px(x0 + 1, ey, "k") }
      continue
    }
    c.rect(x0, ey, ew, eh, "k")
    if (lid) c.rect(x0, ey, ew, 1, c.at ? c.at(x0, ey - 1) || "k" : "k")   // droopy lid (no-op if at() missing)
    c.px(x0, ey, "w")                           // glint
    if (huge) c.px(x0 + ew - 1, ey + eh - 2, "w")
  }
  const ny = ey + eh + (big ? 1 : 0)            // nose row
  const my = ny + 1                             // mouth row
  if (mood === "eat" && f % 2 === 0) {          // open mouth, tongue
    c.rect(cx - 1, my, huge ? 4 : big ? 3 : 2, huge ? 3 : 2, "M"); c.px(cx, my + 1, "T"); if (huge) c.px(cx + 1, my + 2, "T")
  } else if (mood === "sad") {                  // small frown
    c.px(cx - 1, my + 1, "k"); c.px(cx, my, "k"); c.px(cx + 1, my + 1, "k")
    c.px(lx - 1, ey + eh, "t"); if (f) c.px(lx - 1, ey + eh + 1, "t")        // tear
  } else if (mood === "happy") {                // open smile
    c.hline(cx - 1, my, 3, "k"); c.hline(cx - 1, my + 1, 3, "M"); if (big) c.hline(cx - 2, my - 1, 5, "k") && c.hline(cx - 1, my, 3, "M")
  } else {                                      // "w" kitty mouth
    c.px(cx - 1, my, "k"); c.px(cx + 1, my, "k"); c.px(cx, my - 1, "q")      // pink nose above
    if (big) { c.px(cx - 2, my - 1, "k"); c.px(cx + 2, my - 1, "k") }
  }
  const bx = big ? 2 : 1
  c.rect(lx - bx - 1, ey + eh, bx, 1, "q"); c.rect(rx + ew + 1, ey + eh, bx, 1, "q")   // blush
}
function draw(c, f, mood) {
  const m = motion(f, mood), dy = m.dy
  const hy = 11 + dy - m.br + m.nod
  const cu = m.up ? -2 : m.down ? 2 : -m.tw                           // crest up / down
  // tail: long dark feathers up to the right (behind)
  c.poly([19, 24 + dy, 28, 13 + dy, 29, 16 + dy, 22, 26 + dy], "S"); c.line(24, 20 + dy, 28, 15 + dy, "U", 1)
  // long legs + three-toed feet
  for (const x of [11, 17]) { c.rect(x, 24, 2, 5, "d"); c.hline(x - 2, 29, 6, "d"); c.px(x - 1, 28, "d"); c.px(x + 2, 28, "d") }
  // body + light belly
  blob(c, 15, 21 + dy, 7, 4, "4")
  c.ellipse(15, 22 + dy, 4, 2, "l")
  // crest: spiky dark feathers on top of the head
  c.poly([10, hy - 5, 8, hy - 11 + cu, 12, hy - 7, 13, hy - 12 + cu, 15, hy - 7, 18, hy - 10 + cu, 18, hy - 5], "S")
  // head + light eye streak, then standard face, then the long bill over the mouth
  blob(c, 15, hy, 8, 6, "4")
  c.ellipse(15, hy + 3, 6, 2, "l")
  face(c, 15, hy - 2, mood, f, S)
  const o = mood === "eat" && m.open ? 1 : 0
  c.poly([12, hy + 3, 24, hy + 4, 12, hy + 5], "e"); c.poly([12, hy + 5 + o, 23, hy + 5 + o, 12, hy + 7 + o], "c")
  if (o) c.hline(13, hy + 5, 8, "M")
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`roadrunner_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("roadrunner", ["roadrunner_idle", "roadrunner_happy", "roadrunner_eat", "roadrunner_sad"], { cols: 4, pad: 0 })
