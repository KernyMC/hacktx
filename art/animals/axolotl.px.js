// Axolotl — common, N=20. Pink starter: big round head, 3 frilly gills per side, tiny body, stubby feet.
const N = 20, S = N - 2
pal({ k: "#2b2140", w: "#ffffff", p: "#ff8fab", t: "#9fd8ff" })
shades("123456", "#ffb3c7")   // body: 4 base, 3 shade, 5 light
shades("ghijlm", "#ff6f9c")   // gills: j base
shades("abcdef", "#ffe0ea")   // belly: d base

// ellipse lit from top-left: base, shade crescent bottom-right, small highlight top-left
function blob(c, cx, cy, rx, ry, base, sh = 1) {
  c.ellipse(cx, cy, rx, ry, base)
  const e = (x, y, ox, oy, s) => ((x + 0.5 - cx - ox) / (rx * s)) ** 2 + ((y + 0.5 - cy - oy) / (ry * s)) ** 2
  c.shade((x, y) => c.is(x, y, base) && e(x, y, -rx * 0.28, -ry * 0.28, 1.12) > 1, sh)
  c.light((x, y) => c.is(x, y, base) && e(x, y, -rx * 0.4, -ry * 0.45, 0.38) < 1)
}
function eye(c, x, y, mood, f, side) {
  if (mood === "idle" && f === 1) return c.hline(x, y + 1, 2, "k")          // blink
  if (mood === "sad") { c.hline(x, y + 1, 2, "k"); c.px(x + (side < 0 ? 1 : 0), y, "k"); return }
  if (mood === "happy") { c.px(x, y + 1, "k"); c.px(x + 1, y, "k"); c.px(x + 2, y + 1, "k"); return }
  c.rect(x, y, 2, 2, "k"); c.px(x, y, "w")
}
function mouth(c, x, y, mood, f) {
  if (mood === "eat") return (f === 0 || f === 2) ? (c.rect(x, y, 3, 2, "k"), c.px(x + 1, y + 1, "p")) : c.hline(x, y, 3, "k")
  if (mood === "happy") return (c.px(x, y, "k"), c.hline(x, y + 1, 3, "k"), c.px(x + 2, y, "k"))
  if (mood === "sad") return (c.px(x, y + 1, "k"), c.hline(x, y, 3, "k"), c.px(x + 2, y + 1, "k"))
  c.hline(x, y, 3, "k")
}

function draw(c, f, mood) {
  const dy = (mood === "happy" ? [0, -2, -3, -1][f] : 0) + (mood === "sad" ? 1 : 0)
  const br = mood === "idle" && (f === 1 || f === 2) ? 1 : 0        // breathe: head rises 1px
  const nod = mood === "eat" && (f === 1 || f === 2) ? 1 : 0
  const tw = mood === "idle" && f === 3 ? 1 : 0                       // gill twitch
  const gd = mood === "sad" ? 2 : mood === "happy" ? -1 : 0            // gills droop / perk
  const hy = 8 + dy - br + nod
  // tail (behind body, to the right)
  c.ellipse(14, 14 + dy, 3, 2, "4"); c.px(17, 13 + dy, "4"); c.shade([13, 14 + dy, 5, 3])
  // body + feet
  blob(c, 9, 14 + dy, 4, 3, "4")
  c.rect(4, 16 + dy, 3, 2, "4"); c.rect(11, 16 + dy, 3, 2, "4"); c.shade([12, 16 + dy, 2, 2])
  c.ellipse(9, 15 + dy, 2, 2, "d")
  // gills: three fronds per side, growing from the head sides
  for (const s of [-1, 1]) {
    const x0 = 9 + s * 6, up = s < 0 ? tw : 0
    c.line(x0, hy - 2 + gd, x0 + s * 3, hy - 4 + gd - up, "j", 1); c.px(x0 + s * 3, hy - 4 + gd - up, "l")
    c.line(x0, hy, x0 + s * 3, hy - 1 + gd + (s > 0 ? tw : 0), "j", 1); c.px(x0 + s * 3, hy - 1 + gd + (s > 0 ? tw : 0), "l")
    c.line(x0, hy + 2, x0 + s * 3, hy + 3 + gd, "j", 1); c.px(x0 + s * 3, hy + 3 + gd, "l")
    c.shade((x, y) => c.is(x, y, "j") && (y === hy + 3 + gd || (s > 0 && y > hy + gd)))
  }
  // head
  blob(c, 9, hy, 6, 5, "4")
  c.ellipse(9, hy + 2, 3, 1, "5")                                      // muzzle
  // face
  eye(c, 5, hy - 1, mood, f, -1); eye(c, 11, hy - 1, mood, f, 1)
  c.px(4, hy + 2, "p"); c.px(14, hy + 2, "p")
  mouth(c, 8, hy + 2, mood, f)
  if (mood === "sad" && f >= 1) { c.px(13, hy + 1, "t"); c.px(13, hy + 2, "t") }
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`axolotl_${mood}`, { w: S, h: S, frames: 4, selout: "k" }, (c) => draw(c, c.frame, mood))
sheet("axolotl", ["axolotl_idle", "axolotl_happy", "axolotl_eat", "axolotl_sad"], { cols: 4, pad: 0 })
