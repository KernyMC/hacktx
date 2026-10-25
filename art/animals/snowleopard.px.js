// Familiars: snowleopard (N=40). Built with pxl. Shared helpers + draw().
const N = 40, PAL = { b: '#e9edf5', d: '#5c6478', a: '#ffffff', c: '#ffb0c0', n: '#ff7c95' }
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
pal({ u: "#3f7fe6" })
function draw(c, f, mood) {
  const { J, B, H, E } = offsets(mood, f)
  const T = mood === "idle" && f === 2 ? -1 : mood === "sad" ? 2 : 0
  const spots = (list, ro) => list.forEach(([x, y], i) => { if (ro && i % 2) { c.px(x - 1, y, "7"); c.px(x + 1, y, "7"); c.px(x, y - 1, "7"); c.px(x, y + 1, "7") } else { c.px(x, y, "7"); c.px(x + 1, y, "7") } })
  // thick tail curling around the right side
  const tail = [[25, 35], [29, 34], [32, 31], [34, 27], [34, 23], [32, 19]]
  tail.forEach(([x, y], i) => c.ellipse(x, y + B + (i > 2 ? T : 0), 3, 3, "3"))
  spots([[28, 34 + B], [34, 26 + B + T], [33, 20 + B + T], [32, 31 + B]], 1)
  c.shade((x, y) => x >= 31 && "1234".includes(c.key(x, y) || "?"))
  // body, belly, paws
  blob(c, 17, 29 + B, 11, 8, "3", 0.4); c.ellipse(17, 32 + B, 6, 4, "b")
  spots([[8, 26 + B], [10, 31 + B], [26, 27 + B], [24, 32 + B], [12, 24 + B], [22, 24 + B]], 1)
  c.ellipse(9, 35 + J, 4, 2, "3"); c.ellipse(25, 35 + J, 4, 2, "3"); c.hline(7, 36 + J, 5, "2"); c.hline(23, 36 + J, 5, "2")
  // round ears
  const ey0 = 7 + H + E
  c.circ(6, ey0, 4, "3"); c.circ(28, ey0, 4, "3"); c.shade([29, ey0 - 3, 4, 7]); c.circ(6, ey0, 1, "f"); c.circ(28, ey0, 1, "f"); c.px(5, ey0 - 1, "f"); c.px(27, ey0 - 1, "f")
  // head, rosettes, muzzle
  blob(c, 17, 15 + H, 13, 11, "3", 0.45); c.shade([6, 25 + H, 23, 1])
  spots([[9, 8 + H], [17, 6 + H], [25, 8 + H], [6, 16 + H], [28, 15 + H], [13, 5 + H], [22, 5 + H], [5, 20 + H], [29, 20 + H]], 1)
  c.ellipse(17, 22 + H, 6, 3, "b"); c.rect(16, 19 + H, 3, 1, "n"); c.px(17, 20 + H, "n")
  if (mood === "eat" && f % 2) puff(c, 9, 25, 20 + H, "c")
  face(c, 17, 13 + H, mood, f, S)
  if (!(mood === "idle" && f === 2) && mood !== "happy") for (const x0 of [10, 21]) c.rect(x0, 15 + H, 4, 3, "u"), c.px(x0 + 3, 16 + H, "w")   // ice-blue eyes
}
for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`snowleopard_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("snowleopard", ["snowleopard_idle", "snowleopard_happy", "snowleopard_eat", "snowleopard_sad"], { cols: 4, pad: 0 })
