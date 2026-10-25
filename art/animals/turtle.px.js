// Pond Turtle — uncommon, N=24. Round green head, domed shell with plates, four stubby legs, tiny tail.
const N = 24, S = N - 2
pal({ k: "#2b2140", w: "#ffffff", q: "#ff8fab", t: "#9fd3ff", M: "#c8405e", T: "#ff9fb8" })
shades("1234567", "#9fd67a", { spread: 0.75 })   // skin: 4 base
shades("PQRSUVX", "#5f8f3e", { spread: 0.75 })   // shell: S base
shades("hijlmno", "#e6f4c8", { spread: 0.6 })    // belly / plate highlights: l base
shades("abcdefg", "#b07a43", { spread: 0.7 })    // shell rim: d base
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
  const hy = 7 + dy - m.br + m.nod
  // tail (right, behind), wiggles on idle f3
  c.hline(18, 18 + dy + m.tw, 3, "4"); c.px(20, 17 + dy + m.tw, "4")
  // legs stick out of the shell sides, feet on the ground
  c.rect(1, 15 + dy, 4, 6, "4"); c.rect(17, 15 + dy, 4, 6, "4"); c.hline(1, 21, 4, "4"); c.hline(17, 21, 4, "4")
  c.shade([19, 15 + dy, 2, 7]); c.light([1, 15 + dy, 2, 2])
  // shell: dark dome with scute seams (darker lines), brown rim, cream plastron
  blob(c, 11, 15 + dy, 8, 5, "S")
  c.ellipse(11, 13 + dy, 3, 2, "Q", true); c.ellipse(6, 16 + dy, 2, 1, "Q", true); c.ellipse(16, 16 + dy, 2, 1, "Q", true)
  c.ellipse(11, 12 + dy, 2, 1, "U"); c.hline(5, 15 + dy, 2, "U"); c.hline(15, 15 + dy, 2, "U")
  c.shade((x, y) => x >= 15 && y >= 11 + dy && y <= 18 + dy && c.is(x, y, "S"))
  c.hline(4, 19 + dy, 15, "d"); c.hline(4, 19 + dy, 5, "e"); c.shade([15, 19 + dy, 4, 1])
  c.ellipse(11, 21 + dy, 6, 1, "l"); c.hline(7, 20 + dy, 9, "l"); c.shade([12, 20 + dy, 5, 2])
  // head + chin + standard face
  blob(c, 11, hy, 5, 5, "4")
  c.ellipse(11, hy + 3, 3, 1, "5")
  face(c, 11, hy - 1, mood, f, S)
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`turtle_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("turtle", ["turtle_idle", "turtle_happy", "turtle_eat", "turtle_sad"], { cols: 4, pad: 0 })
