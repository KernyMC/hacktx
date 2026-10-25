// Puddle Frog — common, N=20. Wide green head with bulging eyes, pale throat, splayed legs.
const N = 20, S = N - 2
pal({ k: "#2b2140", w: "#ffffff", B: "#ff9fb2", T: "#9fd8ff" })
shades("1234567", "#7fd36a", { spread: 0.75 })   // body: 4 base
shades("pqrstuv", "#4f9e48", { spread: 0.7 })    // markings: s base
shades("hijlmno", "#e4f7b8", { spread: 0.6 })    // belly: l base
// ---- shared helpers (same in every animal file) ----
const EW = N >= 40 ? 4 : N >= 32 ? 3 : 2, EH = N >= 40 ? 5 : N >= 32 ? 4 : N >= 24 ? 3 : 2, GL = N >= 40 ? 3 : N >= 24 ? 2 : 1
const MW = N >= 32 ? 5 : 3, BL = N >= 32 ? 3 : 2
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
function eye(c, x, y, mood, f, side) {              // x,y = top-left of an EW x EH eye
  if (mood === "idle" && f === 1) return c.hline(x, y + EH - 1, EW, "k")
  if (mood === "sad") { const h = EH >> 1; c.rect(x, y + h, EW, EH - h, "k"); c.px(x + (side < 0 ? EW - 1 : 0), y + h - 1, "k"); return }
  if (mood === "happy") { const m = (EW + 1) >> 1; c.line(x, y + EH - 2, x + m, y, "k"); c.line(x + m, y, x + 2 * m, y + EH - 2, "k"); return }
  c.rect(x, y, EW, EH, "k"); c.vline(x, y, GL, "w")
}
function mouth(c, x, y, mood, m) {                  // x = left edge, MW wide; idle = small smile
  const h = N >= 32 ? 3 : 2
  if (mood === "eat") return m.open ? (c.rect(x, y, MW, h, "k"), c.rect(x + 1, y + h - 1, MW - 2, 1, "B")) : c.hline(x, y, MW, "k")
  if (mood === "happy") return (c.px(x, y, "k"), c.px(x + MW - 1, y, "k"), c.hline(x, y + 1, MW, "k"), c.hline(x + 1, y + 1, MW - 2, "B"), c.hline(x + 1, y + 2, MW - 2, "k"))
  if (mood === "sad") return (c.px(x, y + 1, "k"), c.hline(x, y, MW, "k"), c.px(x + MW - 1, y + 1, "k"))
  c.px(x, y, "k"); c.hline(x, y + 1, MW, "k"); c.px(x + MW - 1, y, "k")
}
function blush(c, x, y) { c.hline(x, y, BL, "B") }
function tear(c, x, y, mood, f) { if (mood === "sad" && f >= 1) c.vline(x, y, N >= 32 ? 3 : 2, "T") }
// ---- end helpers ----
function draw(c, f, mood) {
  const m = motion(f, mood), dy = m.dy
  const hy = 9 + dy - m.br + m.nod
  const puff = m.tw                                                    // throat puff on idle f3
  // back legs (splayed, behind)
  c.ellipse(3, 15 + dy, 2, 2, "4"); c.ellipse(14, 15 + dy, 2, 2, "4")
  c.hline(1, 17, 4, "4"); c.hline(13, 17, 4, "4"); c.shade([13, 15 + dy, 4, 3])
  // body + belly
  blob(c, 9, 14 + dy, 5, 3, "4", false)
  c.ellipse(9, 15 + dy, 3, 2 + puff, "l")
  // eye bumps on top of the head
  c.circ(5, hy - 3, 2, "4"); c.circ(13, hy - 3, 2, "4"); c.shade([14, hy - 4, 2, 3])
  // head (wide)
  blob(c, 9, hy, 6, 4, "4")
  c.circ(5, hy - 3, 2, "4"); c.circ(13, hy - 3, 2, "4"); c.light([3, hy - 5, 2, 2])
  c.ellipse(9, hy + 2, 4, 1, "5")                                      // chin
  // spots on the back
  c.px(3, hy + 2, "s"); c.px(15, hy + 1, "s"); c.hline(6, hy - 1, 1, "s")
  // face
  eye(c, 4, hy - 4, mood, f, -1); eye(c, 12, hy - 4, mood, f, 1)
  blush(c, 3, hy + 1); blush(c, 13, hy + 1)
  if (mood === "eat") { m.open ? (c.rect(6, hy + 1, 7, 2, "k"), c.hline(7, hy + 2, 5, "B")) : c.hline(6, hy + 1, 7, "k") }
  else if (mood === "sad") { c.hline(7, hy + 1, 5, "k"); c.px(6, hy + 2, "k"); c.px(12, hy + 2, "k") }
  else { c.hline(7, hy + 2, 5, "k"); c.px(6, hy + 1, "k"); c.px(12, hy + 1, "k") }
  tear(c, 13, hy - 1, mood, f)
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`frog_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("frog", ["frog_idle", "frog_happy", "frog_eat", "frog_sad"], { cols: 4, pad: 0 })
