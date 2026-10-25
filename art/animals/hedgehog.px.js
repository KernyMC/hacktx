// Familiars: hedgehog (N=24). Built with pxl. Shared helpers + draw().
const N = 24, PAL = { b: '#f2d6b0', d: '#8a5a3c', a: '#fff1de', c: '#ffa9c0', n: '#2b2140' }
// ---- shared Familiars helpers (identical in every animal file) ----
pal({ k: "#2b2140", w: "#ffffff", p: "#ff8fab", t: "#9fd8ff", g: "#ffe9a3" })
const SH = { spread: 0.42, shift: 20 }
shades("1234", PAL.b, SH); shades("5678", PAL.d, SH); shades("abcd", PAL.a, SH); shades("efgh", PAL.c, SH); shades("ijmn", PAL.n, SH)
const SC = N / 24, S = N - 2
const EYE = { 20: [2, 3, 1], 24: [3, 3, 2], 32: [3, 4, 2], 40: [4, 5, 3], 48: [5, 6, 3] }[N]
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
function eyes(c, lx, rx, y, mood, f, lid) {
  const [ew, eh, gh] = EYE, gx = ew >= 4 ? 1 : 0, gy = eh - gh > 1 ? 1 : 0
  for (const x of [lx, rx]) {
    if (mood === "idle" && f === 1) { c.hline(x, y + eh - 1, ew, "k"); continue }
    if (mood === "happy" && f >= 2) {                       // ^ ^ eyes
      const m = Math.floor(ew / 2)
      for (let i = 0; i <= m; i++) { c.px(x + i, y + eh - 1 - i, "k"); c.px(x + ew - 1 - i, y + eh - 1 - i, "k") }
      continue
    }
    if (mood === "happy") { c.rect(x, y - 1, ew, eh + 1, "k"); c.rect(x + gx, y + gy - 1, 1, gh + 1, "w"); c.px(x + ew - 1, y + eh - 1, "w"); continue }
    c.rect(x, y, ew, eh, "k")
    if (mood === "sad") { const h = Math.ceil(eh / 2); c.rect(x, y, ew, h, lid); c.hline(x, y + h - 1, ew, "k"); c.vline(x + gx, y + h, Math.max(1, gh - 1), "w"); continue }
    c.vline(x + gx, y + gy, gh, "w")
  }
}
function mouth(c, mx, my, mood, f, skin) {
  const wd = N >= 40 ? 2 : 1, big = N >= 32
  if (mood === "happy" || (mood === "eat" && f % 2 === 0)) {
    const W = wd * 2 + 1, h = wd + 1 + (mood === "eat" ? 1 : 0)
    c.rect(mx - wd, my, W, h, "k"); c.px(mx - wd, my + h - 1, skin); c.px(mx + wd, my + h - 1, skin)
    c.hline(mx - wd + 1, my + h - 1, W - 2, "p")
    return
  }
  if (mood === "eat") { c.hline(mx - wd, my, wd * 2 + 1, "k"); return }
  if (mood === "sad") { if (big) { c.hline(mx - 1, my, 3, "k"); c.px(mx - 2, my + 1, "k"); c.px(mx + 2, my + 1, "k") } else { c.px(mx, my, "k"); c.px(mx - 1, my + 1, "k"); c.px(mx + 1, my + 1, "k") } return }
  if (big) { c.hline(mx - 1, my + 1, 3, "k"); c.px(mx - 2, my, "k"); c.px(mx + 2, my, "k") } else { c.px(mx - 1, my, "k"); c.px(mx + 1, my, "k"); c.px(mx, my + 1, "k") }
}
function blush(c, lx, rx, y, mood, f, puff) {
  const r = N >= 40 ? 1 : 0
  for (const x of [lx, rx]) {
    if (mood === "eat" && f % 2 === 1 && puff) c.ellipse(x, y, r + 1 + (N >= 32 ? 1 : 0), r + 1, puff)
    if (r) c.circ(x, y, r, "p"); else c.hline(x, y, 2, "p")
  }
}
function tear(c, x, y, f) { if (f >= 1) c.vline(x, y + f - 1, 2, "t") }
function face(c, cx, ey, mood, f, o) {
  const [ew, eh] = EYE
  eyes(c, o.lx, o.rx, ey, mood, f, o.lid)
  if (o.nose) c.rect(cx - Math.floor(o.nose[0] / 2), ey + eh + (o.noseDy ?? 0), o.nose[0], o.nose[1], o.noseKey ?? "k")
  mouth(c, cx, ey + eh + (o.mouthDy ?? 1), mood, f, o.lid)
  if (o.bx) blush(c, o.bx[0], o.bx[1], ey + eh - 1 + (o.bdy ?? 0), mood, f, o.puff)
  if (mood === "sad") tear(c, o.rx + ew, ey + eh, f)
}
const JUMP = (f) => R([0, -2, -3, -1][f] * SC), BOB = (f) => [0, -1, -1, 0][f]
function offsets(mood, f) {
  const J = mood === "happy" ? JUMP(f) : 0, B = J + (mood === "idle" ? BOB(f) : 0) + (mood === "sad" ? 1 : 0)
  return { J, B, H: B + (mood === "eat" ? [0, 1, 0, 1][f] : 0), E: mood === "happy" ? -1 : mood === "sad" ? 1 : mood === "idle" && f === 2 ? -1 : 0 }
}
// ---- end helpers ----
EYE[0] = 2; EYE[1] = 2; EYE[2] = 1                       // hedgehog: small beady eyes
function draw(c, f, mood) {
  const { J, B, H, E } = offsets(mood, f)
  const dark = (x, y) => "5678".includes(c.key(x, y) || "?")
  const cx = 11, cy = 11 + B, r = 7, dr = mood === "sad" ? 1 : 0
  // spiky back: dome + a ring of fat triangular spikes over the top and right edge (silhouette first)
  c.circ(cx, cy, r, "7")
  let i = 0
  for (let a = -170; a <= 60; a += 23, i++) {
    const t = (a * Math.PI) / 180, s = (a > -10 ? 3 : 4 - dr) + (i % 2)
    const P = (ang, rad) => [R(cx + Math.cos(ang) * rad), R(cy + Math.sin(ang) * rad)]
    const [tx, ty] = P(t, r + s), [ax, ay] = P(t - 0.36, r - 2), [bx, by] = P(t + 0.36, r - 2)
    c.poly([ax, ay, tx, ty, bx, by], a < -70 ? (i % 2 ? "8" : "7") : a < 20 ? "7" : (i % 2 ? "6" : "7"))
  }
  c.shade((x, y) => dark(x, y) && (x - cx) + (y - cy) * 0.8 > 6)
  c.shade((x, y) => dark(x, y) && (x - cx) + (y - cy) * 0.8 > 10)
  for (const [x0, y0] of [[14, cy - 1], [16, cy + 2], [12, cy - 4]]) c.line(x0, y0, x0 + 1, y0 + 2, "5")
  // ear (pink inner) peeking between face and spines
  c.circ(13, 10 + H + E, 1, "f"); c.px(14, 10 + H + E, "e")
  // cream face lower-left with a pointed snout
  blob(c, 8, 14 + H, 6, 5, "3", 0.4)
  c.poly([4, 11 + H, 1, 15 + H, 1, 17 + H, 5, 19 + H], "3"); c.line(2, 17 + H, 4, 19 + H, "2")
  c.rect(1, 15 + H, 2, 2, "k"); c.px(1, 15 + H, "w")          // dark nose with a glint
  c.shade([4, 9 + H, 10, 1])
  face(c, 6, 11 + H, mood, f, { lx: 6, rx: 10, lid: "3", mouthDy: 2, bx: [8, 12], bdy: 2, puff: "4" })
  // feet (brown paws)
  c.ellipse(7, 20 + J, 2, 1, "6"); c.ellipse(14, 20 + J, 2, 1, "6"); c.px(6, 20 + J, "7"); c.px(13, 20 + J, "7")
}
for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`hedgehog_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("hedgehog", ["hedgehog_idle", "hedgehog_happy", "hedgehog_eat", "hedgehog_sad"], { cols: 4, pad: 0 })
