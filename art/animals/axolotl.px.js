// Axolotl — common, N=20. Pink starter: big round head, 3 frilly gills per side, tiny body, stubby feet.
const N = 20, S = N - 2
pal({ k: "#2b2140", w: "#ffffff", B: "#ff8fab", T: "#9fd8ff" })
shades("1234567", "#ffb3c7", { spread: 0.75 })   // body: 4 base, 3 shade, 5 light
shades("pqrstuv", "#ff6f9c", { spread: 0.7 })    // gills: s base
shades("hijlmno", "#ffe0ea", { spread: 0.6 })    // belly: l base
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
  const gd = m.down ? 2 : m.up ? -1 : 0                               // gills droop / perk
  const hy = 8 + dy - m.br + m.nod                                     // head centre
  // tail (behind body, to the right): lighter fin
  c.ellipse(14, 14 + dy, 3, 2, "5"); c.px(17, 13 + dy, "5"); c.shade([14, 15 + dy, 4, 2])
  // round body, light belly, stubby feet
  blob(c, 9, 14 + dy, 4, 3, "4", false)
  c.rect(4, 16 + dy, 2, 2, "4"); c.rect(13, 16 + dy, 2, 2, "4"); c.shade([13, 16 + dy, 2, 2])
  c.ellipse(9, 15 + dy, 2, 2, "l")
  // gills: three separate fronds per side, stalk + lighter tip, fanning out from the head
  for (const s of [-1, 1]) {
    const x0 = 9 + s * 5, tw = s < 0 ? -m.tw : m.tw
    const fr = [[hy - 3, -1 + gd + tw], [hy, gd], [hy + 3, 1 + gd]]
    for (const [y0, dyt] of fr) {
      c.line(x0, y0, x0 + s * 2, y0 + dyt, "s", 1)
      c.px(x0 + s * 3, y0 + dyt, "t")
    }
  }
  // head + face
  blob(c, 9, hy, 5, 5, "4")
  c.ellipse(9, hy + 2, 3, 1, "5")                                      // muzzle
  eye(c, 6, hy - 1, mood, f, -1); eye(c, 11, hy - 1, mood, f, 1)
  blush(c, 4, hy + 2); blush(c, 13, hy + 2)
  mouth(c, 8, hy + 2, mood, m)
  tear(c, 12, hy + 1, mood, f)
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`axolotl_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("axolotl", ["axolotl_idle", "axolotl_happy", "axolotl_eat", "axolotl_sad"], { cols: 4, pad: 0 })
