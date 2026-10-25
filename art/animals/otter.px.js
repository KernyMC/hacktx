// River Otter — rare, N=32. Round brown head, cream muzzle, tiny ears, paws holding a favourite rock.
const N = 32, S = N - 2
pal({ k: "#2b2140", w: "#ffffff", q: "#ff8fab", t: "#9fd3ff", M: "#c8405e", T: "#ff9fb8" })
shades("1234567", "#9a6a48", { spread: 0.8 })    // fur: 4 base
shades("PQRSUVX", "#6a4530", { spread: 0.7 })    // dark fur: S base
shades("hijlmno", "#f0dcc4", { spread: 0.55 })   // cream: l base
shades("abcdefg", "#b8d8ff", { spread: 0.6 })    // the rock: d base
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
  const hy = 10 + dy - m.br + m.nod
  const ed = m.down ? 1 : m.up ? -1 : 0
  // tail (thick, curls to the right), twitches on idle f3
  c.ellipse(24, 25 + dy, 5, 2, "S"); c.ellipse(27, 23 + dy - m.tw, 2, 3, "S"); c.light([22, 24 + dy, 3, 1])
  // feet
  for (const x of [9, 17]) c.rect(x, 27, 4, 3, "S")
  // body + belly
  blob(c, 15, 22 + dy, 8, 7, "4")
  c.ellipse(15, 23 + dy, 5, 5, "l"); c.shade([17, 25 + dy, 4, 4])
  // paws holding a rock on the chest
  c.ellipse(15, 22 + dy, 2, 2, "d"); c.px(14, 21 + dy, "e"); c.px(16, 23 + dy, "c")
  c.ellipse(12, 23 + dy, 2, 1, "4"); c.ellipse(18, 23 + dy, 2, 1, "4"); c.shade([18, 23 + dy, 3, 2])
  // ears (small, round)
  c.circ(7, hy - 6 + ed, 2, "4"); c.circ(23, hy - 6 + ed, 2, "4"); c.px(7, hy - 6 + ed, "l"); c.px(23, hy - 6 + ed, "l"); c.shade([23, hy - 8 + ed, 3, 5])
  // head + cream muzzle + whiskers, then standard face (nose/mouth land on the muzzle)
  blob(c, 15, hy, 9, 8, "4")
  c.ellipse(15, hy + 4, 6, 3, "l"); c.shade([17, hy + 5, 5, 3])
  c.hline(5, hy + 4, 3, "S"); c.hline(23, hy + 4, 3, "S")
  face(c, 15, hy - 2, mood, f, S)
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`otter_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("otter", ["otter_idle", "otter_happy", "otter_eat", "otter_sad"], { cols: 4, pad: 0 })
