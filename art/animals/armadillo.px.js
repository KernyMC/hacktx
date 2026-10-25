// Armored Dillo — mythic, N=40. Rosy armadillo: banded shell dome, long snout, tall ears, ringed tail, claws.
const N = 40, S = N - 2
pal({ k: "#2b2140", w: "#ffffff", q: "#ff8fab", t: "#9fd3ff", M: "#c8405e", T: "#ff9fb8" })
shades("1234567", "#c9a6a0", { spread: 0.8 })    // skin: 4 base
shades("PQRSUVX", "#8f6a66", { spread: 0.75 })   // shell: S base
shades("hijlmno", "#f1ddd6", { spread: 0.55 })   // light: l base
shades("abcdefg", "#ffb0b8", { spread: 0.6 })    // inner ear: d base
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
  const hy = 15 + dy - m.br + m.nod
  const ed = m.down ? 2 : m.up ? -1 : 0
  // ringed tail (right, behind), twitches on idle f3
  c.ellipse(32, 31 + dy - m.tw, 5, 2, "S"); c.ellipse(36, 28 + dy - 2 * m.tw, 1, 3, "S")
  for (const x of [30, 33]) c.vline(x, 30 + dy - m.tw, 3, "U")
  // four legs with claws
  for (const x of [6, 13, 22, 29]) { c.rect(x, 31 + dy, 4, 5, "4"); c.hline(x, 36, 4, "4"); c.hline(x, 37, 4, "3"); c.px(x, 37, "k"); c.px(x + 2, 37, "k") }
  c.shade([24, 31 + dy, 2, 6]); c.shade([31, 31 + dy, 2, 6])
  // banded shell: a dome rising behind the head, bands as curved seams
  blob(c, 19, 24 + dy, 15, 12, "S")
  for (const r of [5, 8, 11, 14]) c.ellipse(19, 25 + dy, r, Math.round(r * 0.85), "Q", true)
  c.light((x, y) => c.is(x, y, "Q") && y < 23 + dy && x < 17, 2)
  c.shade((x, y) => x >= 27 && y >= 13 + dy && y <= 34 + dy && c.is(x, y, "SQU"))
  c.ellipse(19, 34 + dy, 12, 2, "l"); c.shade([23, 34 + dy, 9, 2])      // soft belly rim
  // tall ears with pink inside
  for (const s of [-1, 1]) { const ex = 19 + s * 7; c.ellipse(ex, hy - 8 + ed, 2, 5, "4"); c.ellipse(ex, hy - 7 + ed, 1, 3, "d") }
  c.shade([26, hy - 13 + ed, 3, 10])
  // head + long snout, then standard face, then the nose on the snout tip
  blob(c, 19, hy, 10, 8, "4")
  c.ellipse(19, hy + 6, 5, 4, "l"); c.ellipse(19, hy + 8, 3, 2, "5"); c.shade([21, hy + 6, 4, 5])
  face(c, 19, hy - 2, mood, f, S)
  c.rect(18, hy + 8, 3, 2, "k"); c.px(18, hy + 8, "3")
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`armadillo_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("armadillo", ["armadillo_idle", "armadillo_happy", "armadillo_eat", "armadillo_sad"], { cols: 4, pad: 0 })
