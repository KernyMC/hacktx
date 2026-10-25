// Chill Capy — rare, N=32. Boxy brown head, blunt muzzle, tiny ears, a yuzu on the head, chunky body.
const N = 32, S = N - 2
pal({ k: "#2b2140", w: "#ffffff", q: "#ff8fab", t: "#9fd3ff", M: "#c8405e", T: "#ff9fb8" })
shades("1234567", "#b8865a", { spread: 0.8 })    // fur: 4 base
shades("PQRSUVX", "#8a5f3a", { spread: 0.7 })    // dark fur: S base
shades("hijlmno", "#d4a87a", { spread: 0.6 })    // muzzle / belly: l base
shades("abcdefg", "#ffb43c", { spread: 0.7 })    // yuzu: d base
pal({ n: "#4a3226", g: "#6fbf4a" })
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
  const ed = m.down ? 1 : m.up ? -1 : 0
  // legs
  for (const x of [6, 19]) c.rect(x, 25 + dy, 5, 5, "S")
  c.hline(6, 29, 5, "S"); c.hline(19, 29, 5, "S"); c.shade([22, 25 + dy, 2, 5])
  // chunky body + belly
  blob(c, 15, 23 + dy, 10, 6, "4")
  c.ellipse(15, 25 + dy, 6, 3, "l"); c.shade([17, 26 + dy, 5, 3])
  // ears: small and round, on top corners
  c.circ(8, hy - 6 + ed, 2, "S"); c.circ(22, hy - 6 + ed - m.tw, 2, "S"); c.px(8, hy - 6 + ed, "4"); c.px(22, hy - 6 + ed - m.tw, "4")
  // boxy head + wide blunt muzzle (3/4 front)
  blob(c, 15, hy, 9, 7, "4")
  c.rect(7, hy - 3, 17, 4, "4"); c.light([7, hy - 3, 3, 3])
  c.ellipse(15, hy + 5, 7, 3, "l"); c.rect(9, hy + 3, 13, 3, "l"); c.shade([18, hy + 4, 5, 4])
  c.rect(12, hy + 3, 7, 2, "n"); c.px(13, hy + 3, "S")               // big flat nose
  // yuzu hat: orange fruit with a leaf, slightly to the right
  c.circ(19, hy - 9, 3, "d"); c.px(17, hy - 10, "e"); c.shade([20, hy - 8, 3, 3]); c.px(21, hy - 10, "c")
  c.px(19, hy - 12, "g"); c.hline(20, hy - 13, 2, "g")
  // standard face (nose/mouth land on the muzzle)
  face(c, 15, hy - 2, mood, f, S)
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`capybara_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("capybara", ["capybara_idle", "capybara_happy", "capybara_eat", "capybara_sad"], { cols: 4, pad: 0 })
