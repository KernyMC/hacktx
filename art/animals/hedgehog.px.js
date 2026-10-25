// Familiars: hedgehog (N=24). Built with pxl. Shared helpers + draw().
const N = 24, PAL = { b: '#f2d6b0', d: '#8a5a3c', a: '#fff1de', c: '#ffa9c0', n: '#2b2140' }
// ---- shared Familiars helpers (identical in every animal file) ----
pal({ k: "#2b2140", w: "#ffffff", q: "#ff8fab", t: "#9fd3ff", M: "#c8405e", T: "#ff9fb8", g: "#ffe9a3" })
const SH = { spread: 0.42, shift: 20 }
shades("1234", PAL.b, SH); shades("5678", PAL.d, SH); shades("abcd", PAL.a, SH); shades("efgh", PAL.c, SH); shades("ijmn", PAL.n, SH)
const SC = N / 24, S = N - 2
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
// cheek puffs while chewing (eat, odd frames), drawn before face()
function puff(c, lx, rx, y, key) { const r = N >= 40 ? 2 : 1; c.ellipse(lx, y, r + 1, r, key); c.ellipse(rx, y, r + 1, r, key) }
const JUMP = (f) => R([0, -2, -3, -1][f] * SC), BOB = (f) => [0, -1, -1, 0][f]
function offsets(mood, f) {
  const J = mood === "happy" ? JUMP(f) : 0, B = J + (mood === "idle" ? BOB(f) : 0) + (mood === "sad" ? 1 : 0)
  return { J, B, H: B + (mood === "eat" ? [0, 1, 0, 1][f] : 0), E: mood === "happy" ? -1 : mood === "sad" ? 1 : mood === "idle" && f === 2 ? -1 : 0 }
}
// ---- end helpers ----
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
  c.shade([4, 9 + H, 10, 1])
  c.poly([5, 15 + H, 2, 18 + H, 2, 19 + H, 8, 19 + H], "3"); c.line(3, 19 + H, 7, 19 + H, "2")   // pointed snout
  c.rect(2, 17 + H, 2, 2, "k"); c.px(2, 17 + H, "w")                                            // dark nose
  if (mood === "eat" && f % 2) puff(c, 4, 12, 14 + H, "4")
  face(c, 8, 11 + H, mood, f, S)
  // feet (brown paws)
  c.ellipse(7, 20 + J, 2, 1, "6"); c.ellipse(14, 20 + J, 2, 1, "6"); c.px(6, 20 + J, "7"); c.px(13, 20 + J, "7")
}
for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`hedgehog_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("hedgehog", ["hedgehog_idle", "hedgehog_happy", "hedgehog_eat", "hedgehog_sad"], { cols: 4, pad: 0 })
