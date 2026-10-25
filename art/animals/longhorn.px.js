// Familiars: longhorn (N=48). Built with pxl. Shared helpers + draw().
const N = 48, PAL = { b: '#c8692a', d: '#7a3a14', a: '#fff1de', c: '#f3e2bf', n: '#ffcf4d', x: '#2b2140' }
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
  const horn = (m) => {                                     // wide cream horns with dark tips
    const X = (x) => (m ? 45 - x : x)
    c.line(X(16), 14 + H, X(8), 11 + H, "f", 4); c.line(X(8), 11 + H, X(3), 7 + H, "f", 3); c.line(X(3), 7 + H, X(2), 2 + H, "f", 2)
    c.line(X(15), 12 + H, X(8), 9 + H, "g"); c.line(X(8), 9 + H, X(3), 5 + H, "g"); c.line(X(15), 15 + H, X(9), 13 + H, "e")
    c.line(X(3), 4 + H, X(2), 1 + H, "7", 2); c.px(X(2), 1 + H, "k"); c.px(X(1), 2 + H, "7")
  }
  horn(0); horn(1); c.shade((x, y) => x >= 30 && "efgh".includes(c.key(x, y) || "?"))
  // tail with tuft, body, white patch, legs and hooves
  c.line(33, 35 + B, 37, 40 + B, "7"); c.circ(37, 41 + B, 2, "7"); c.px(36, 40 + B, "8")
  blob(c, 23, 38 + B, 11, 7, "3", 0.4); c.ellipse(29, 40 + B, 3, 3, "b"); c.ellipse(22, 43 + B, 4, 2, "2")
  for (const x0 of [15, 31]) { c.ellipse(x0, 42 + J, 3, 3, "2"); c.ellipse(x0, 42 + J, 2, 2, "3"); c.rect(x0 - 2, 44 + J, 5, 2, "7"); c.px(x0 - 2, 44 + J, "8") }
  // ears under the horns
  const ey0 = 18 + H + E
  c.ellipse(9, ey0, 4, 2, "3"); c.ellipse(37, ey0, 4, 2, "3"); c.ellipse(9, ey0, 2, 1, "e"); c.ellipse(37, ey0, 2, 1, "e"); c.shade([37, ey0 - 2, 5, 5])
  // head, forelock, blaze, muzzle, nostrils, gold nose ring
  blob(c, 23, 22 + H, 13, 12, "3", 0.45)
  c.ellipse(23, 12 + H, 5, 2, "2"); for (const [x, y] of [[19, 11], [23, 10], [27, 11]]) c.px(x, y + H, "2"); c.hline(20, 12 + H, 2, "4")
  c.ellipse(23, 18 + H, 2, 6, "b"); c.ellipse(23, 29 + H, 8, 6, "b"); c.shade([15, 33 + H, 17, 2])
  c.rect(18, 28 + H, 2, 1, "7"); c.rect(26, 28 + H, 2, 1, "7")
  c.ring(23, 33 + H, 2, "m"); c.px(22, 31 + H, "n"); c.px(21, 32 + H, "n")
  if (mood === "eat" && f % 2) puff(c, 14, 33, 26 + H, "c")
  face(c, 23, 17 + H, mood, f, S)
  // legendary: gold rim light along the right edge + sparkle
  for (let y = 0; y < S; y++) for (let x = 24; x < S - 1; x++) if (c.is(x, y, "1234b") && !c.is(x + 1, y, "*")) c.px(x, y, "g")
  const sp = [[40, 6], [6, 4], [41, 30], [5, 28]][f]; c.px(sp[0], sp[1], "g"); c.px(sp[0] - 1, sp[1], "g"); c.px(sp[0] + 1, sp[1], "g"); c.px(sp[0], sp[1] - 1, "g"); c.px(sp[0], sp[1] + 1, "g")
}
for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`longhorn_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("longhorn", ["longhorn_idle", "longhorn_happy", "longhorn_eat", "longhorn_sad"], { cols: 4, pad: 0 })
