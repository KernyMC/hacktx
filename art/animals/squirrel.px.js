// Familiars: squirrel (N=24). Built with pxl. Shared helpers + draw().
const N = 24, PAL = { b: '#d9824a', d: '#9c5128', a: '#ffe4c4', c: '#c96a3a', n: '#2b2140' }
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
  const T = mood === "idle" && f === 2 ? -1 : mood === "sad" ? 2 : 0
  // big bushy S-tail behind, rising along the right edge and curling over at the top
  const ty = B + T
  c.poly([13, 21 + ty, 15, 17 + ty, 14, 13 + ty, 16, 9 + ty, 14, 5 + ty, 17, 1 + ty, 20, 3 + ty, 20, 8 + ty, 21, 13 + ty, 20, 18 + ty, 18, 21 + ty], "7")
  c.poly([14, 20 + ty, 16, 17 + ty, 15, 13 + ty, 17, 9 + ty, 15, 6 + ty, 17, 3 + ty, 19, 5 + ty, 19, 9 + ty, 20, 13 + ty, 19, 17 + ty, 17, 20 + ty], "4")
  c.line(17, 6 + ty, 18, 18 + ty, "b"); c.line(18, 4 + ty, 19, 6 + ty, "b"); c.shade((x, y) => x >= 19 && y > 7 + ty && "1234".includes(c.key(x, y) || "?"))
  // body + belly + feet
  blob(c, 8, 17 + B, 5, 4, "3", 0.4); c.ellipse(8, 18 + B, 3, 2, "b")
  c.ellipse(5, 20 + J, 2, 1, "2"); c.ellipse(11, 20 + J, 2, 1, "2")
  // acorn in the paws (lifted to the mouth while eating)
  const ay = mood === "eat" ? 15 + H : 17 + B
  c.rect(7, ay, 3, 2, "7"); c.hline(7, ay - 1, 3, "e"); c.px(8, ay - 2, "7"); c.px(7, ay, "8"); c.px(6, ay + 1, "2"); c.px(10, ay + 1, "2")
  // tufted ears
  const ey0 = 4 + H + E
  c.poly([2, ey0 + 3, 3, ey0 - 3, 6, ey0 + 1], "3"); c.poly([10, ey0 + 1, 13, ey0 - 3, 14, ey0 + 3], "3")
  c.vline(3, ey0 - 2, 3, "e"); c.vline(13, ey0 - 2, 3, "e")
  // head, cheeks, face
  blob(c, 8, 10 + H, 7, 6, "3", 0.45); c.shade([3, 15 + H, 11, 1])
  c.ellipse(8, 13 + H, 3, 2, "b"); c.px(8, 11 + H, "b")
  if (mood === "eat" && f % 2) puff(c, 4, 12, 12 + H, "4")
  face(c, 8, 9 + H, mood, f, S)
}
for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`squirrel_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("squirrel", ["squirrel_idle", "squirrel_happy", "squirrel_eat", "squirrel_sad"], { cols: 4, pad: 0 })
