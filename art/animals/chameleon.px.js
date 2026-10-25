// Familiars: chameleon (N=40). Built with pxl. Shared helpers + draw().
const N = 40, PAL = { b: '#7fd36a', d: '#3f9a6a', a: '#d8f7a8', c: '#ffcf4d', n: '#2b2140' }
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
  const T = mood === "idle" && f === 2 ? -1 : mood === "sad" ? 1 : 0
  const green = (x, y) => "1234".includes(c.key(x, y) || "?")
  // spiral tail on the right
  const sx = 29, sy = 28 + B + T
  for (let t = 0; t <= 4.4 * Math.PI; t += 0.12) { const r = 1.2 + t * 0.62; c.px(R(sx + Math.cos(t + 2.6) * r), R(sy + Math.sin(t + 2.6) * r), "3") }
  for (let t = 0; t <= 4.4 * Math.PI; t += 0.12) { const r = 1.2 + t * 0.62; c.px(R(sx + Math.cos(t + 2.6) * r), R(sy + Math.sin(t + 2.6) * r + 1), "7") }
  c.shade((x, y) => x >= 32 && green(x, y))
  // body with stripes, belly, mitten feet
  blob(c, 15, 28 + B, 9, 7, "3", 0.4)
  for (const x0 of [8, 13, 18, 23]) for (let y = 22; y < 30; y++) { const x = x0 + R((y - 22) / 3.5); if (green(x, y + B)) c.px(x, y + B, "7") }
  c.ellipse(15, 31 + B, 5, 3, "b")
  c.ellipse(9, 35 + J, 3, 2, "3"); c.ellipse(21, 35 + J, 3, 2, "3"); c.vline(9, 35 + J, 2, "7"); c.vline(21, 35 + J, 2, "7")
  // head + casque crest
  c.poly([8, 10 + H, 15, 1 + H + E, 24, 8 + H], "7"); c.poly([10, 10 + H, 15, 4 + H + E, 22, 9 + H], "3"); c.px(15, 2 + H + E, "f")
  blob(c, 15, 15 + H, 11, 9, "3", 0.45); c.shade([5, 23 + H, 21, 1])
  for (const [x, y] of [[6, 20], [24, 20], [12, 23], [19, 24]]) c.px(x, y + H, "f")
  // cone eye turrets with gold rings
  c.circ(9, 14 + H, 4, "7"); c.circ(21, 14 + H, 4, "7"); c.circ(9, 14 + H, 3, "4"); c.circ(21, 14 + H, 3, "4")
  c.ring(9, 14 + H, 4, "f"); c.ring(21, 14 + H, 4, "f")
  if (mood === "eat" && f % 2) puff(c, 7, 23, 20 + H, "c")
  face(c, 15, 12 + H, mood, f, S)
}
for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`chameleon_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("chameleon", ["chameleon_idle", "chameleon_happy", "chameleon_eat", "chameleon_sad"], { cols: 4, pad: 0 })
