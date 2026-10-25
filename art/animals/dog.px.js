// Party Pup — common, N=20. Chibi tan puppy with floppy brown ears, eye patch and a party collar.
const N = 20, S = N - 2
const P = { b: "#e8c79a", d: "#9a6a43", a: "#fff4e2", c: "#ff7c95", n: "#2b2140" }
pal({ k: "#2b2140", w: "#ffffff", p: "#ff8fab", t: "#9fd8ff", c: P.c, A: P.a, r: "#e2585e", y: "#ffd84a" })
shades("01234", P.b, { spread: 0.7 }); pal({ 0: "#2b2140" })   // 1 shadow · 2 base · 3 light
shades("CDE", P.d, { spread: 0.5 })                           // ears / patch (E light, D base, C dark)

function blob(c, cx, cy, rx, ry, o = {}) {
  const ax = rx + 0.5, ay = ry + 0.5, inside = (x, y) => (x / ax) ** 2 + (y / ay) ** 2 <= 1
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    if (!inside(x, y)) continue
    let col = o.mid || "2"
    if (!inside(x + 1, y + 1) && (x > 0 || y > 0)) col = o.dark || "1"
    else if (((x + rx * 0.5) / (ax * 0.42)) ** 2 + ((y + ry * 0.5) / (ay * 0.36)) ** 2 <= 1) col = o.lit || "3"
    c.px(cx + x, cy + y, col)
  }
}
function eye(c, x, y, kind, right) {
  if (kind === "blink") return c.hline(x, y + 1, 2, "k")
  if (kind === "happy") { const m = right ? x + 1 : x; c.px(m - 1, y + 1, "k"); c.px(m, y, "k"); c.px(m + 1, y + 1, "k"); return }
  if (kind === "sad") { c.hline(x, y, 2, right ? "C" : "1"); c.hline(x, y + 1, 2, "k"); return }
  c.rect(x, y, 2, 2, "k"); c.px(x, y, "w")
}
function ear(c, Y, right, mood, f) {
  // floppy ear hanging beside the head; up and flapping when happy, drooping when sad
  const X = (x) => right ? 16 - x : x
  const dy = mood === "sad" ? 2 : 0
  if (mood === "happy" && f > 0) { c.poly([X(2), Y - 3, X(4), Y - 2, X(3), Y + 2, X(1), Y - 1], "D"); c.px(X(2), Y - 3, "E"); return }
  blob(c, X(2), Y - 1 + dy, 1, 3, { mid: "D", dark: "C", lit: right ? "D" : "E" })
  if (mood === "idle" && f === 3 && !right) c.px(1, Y - 5, "D")
}

function draw(c, f, mood) {
  const oy = mood === "happy" ? [0, -2, -3, -1][f] : 0
  const hy = (mood === "idle" && f === 1 ? -1 : 0) + (mood === "sad" ? 1 : 0) + (mood === "eat" && f % 2 === 0 ? 1 : 0)
  // wagging tail on the right
  const wag = mood === "sad" ? [16, 16] : (mood === "happy" || (mood === "idle" && f === 3)) ? (f % 2 ? [16, 10] : [16, 12]) : [16, 11]
  c.line(13, 14 + oy, wag[0], wag[1] + oy, "2"); c.px(wag[0], wag[1] + oy, "3")
  // body, belly, paws
  blob(c, 8, 13 + oy, 5, 4)
  c.ellipse(8, 15 + oy, 2, 1, "A")
  c.rect(4, 16 + oy, 3, 2, "2"); c.rect(9, 16 + oy, 3, 2, "2"); c.hline(4, 17 + oy, 2, "A"); c.hline(10, 17 + oy, 2, "A")
  c.px(6, 16 + oy, "1"); c.px(11, 16 + oy, "1")
  // collar with a tag
  c.hline(5, 12 + oy + (mood === "sad" ? 1 : 0), 7, "r"); c.px(8, 13 + oy + (mood === "sad" ? 1 : 0), "y")
  // head + ears
  const Y = 7 + hy + oy
  blob(c, 8, Y, 6, 5)
  c.ellipse(11, Y - 1, 2, 2, "D"); c.px(10, Y - 3, "E"); c.px(9, Y - 2, "E")        // eye patch
  c.ellipse(8, Y + 2, 2, 1, "A")                                                      // muzzle
  ear(c, Y, false, mood, f); ear(c, Y, true, mood, f)
  const eyeKind = mood === "happy" ? "happy" : mood === "sad" ? "sad" : mood === "idle" && f === 2 ? "blink" : "open"
  eye(c, 5, Y - 1, eyeKind, false); eye(c, 10, Y - 1, eyeKind, true)
  c.hline(7, Y + 2, 3, "k"); c.px(7, Y + 2, "#5a4c6e")                                // nose
  if (mood === "eat" && f % 2 === 0) { c.rect(7, Y + 3, 3, 2, "k"); c.px(8, Y + 4, "c"); c.hline(4, Y + 2, 2, "p"); c.hline(11, Y + 2, 2, "p") }
  else if (mood === "happy") { c.hline(7, Y + 3, 3, "k"); c.px(6, Y + 2, "k"); c.px(10, Y + 2, "k"); c.px(8, Y + 4, "c") }
  else if (mood === "sad") { c.hline(7, Y + 4, 3, "k") }
  else { c.px(8, Y + 3, "k"); c.px(9, Y + 4, "1") }
  if (mood !== "eat") { c.hline(3, Y + 2, 2, "p"); c.hline(12, Y + 2, 2, "p") }
  if (mood === "sad" && f > 0) c.px(4, Y + 1 + Math.min(f, 2), "t")
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`dog_${mood}`, { w: S, h: S, frames: 4, selout: "k" }, (c) => draw(c, c.frame, mood))
sheet("dog", ["dog_idle", "dog_happy", "dog_eat", "dog_sad"], { cols: 4, pad: 0 })
