// Clover Bun — common, N=20. Chibi white bunny: long ears with pink insides, big feet, cotton tail.
const N = 20, S = N - 2
const P = { b: "#f3eef6", d: "#c9bfd6", a: "#ffffff", c: "#ffa9c0", n: "#ff7c95" }
pal({ k: "#2b2140", w: "#ffffff", p: "#ff8fab", t: "#9fd8ff", c: P.c, n: P.n, g: "#6fc46a", G: "#3f8f44" })
pal({ 0: "#6b5f80", 1: P.d, 2: P.b, 3: "#ffffff", 4: "#ffffff" }); ramps("01234")   // light fur: hand ramp

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
  if (kind === "sad") { c.hline(x, y, 2, "1"); c.hline(x, y + 1, 2, "k"); return }
  c.rect(x, y, 2, 2, "k"); c.px(x, y, "w")
}
function ear(c, Y, right, mood, f) {
  // tall ear standing on the head top (row Y-4); droops sideways when sad; one twitches on idle f3
  const X = (x) => right ? 16 - x : x, sh = right ? "1" : "2"
  if (mood === "sad") {
    c.poly([X(5), Y - 4, X(7), Y - 4, X(3), Y + 2, X(1), Y + 1], "2"); c.line(X(5), Y - 3, X(2), Y, "c")
    c.line(X(2), Y + 1, X(3), Y + 1, "1"); return
  }
  const lean = (mood === "idle" && f === 3 && !right) || (mood === "happy") ? 1 : 0
  const x0 = X(4), x1 = X(4 + (right ? -lean : lean))
  // 2-wide ear, 7 tall, rounded tip
  for (let y = 0; y < 7; y++) {
    const x = Math.round(x0 + (x1 - x0) * (6 - y) / 6)
    c.px(x, Y - 10 + y, sh); c.px(x + (right ? -1 : 1), Y - 10 + y, y === 0 ? sh : right ? "2" : "1")
    if (y > 0 && y < 6) c.px(x + (right ? 0 : 1), Y - 10 + y, "c")
  }
  if (!right) c.px(x0, Y - 10, "3")
}

function draw(c, f, mood) {
  const oy = mood === "happy" ? [0, -2, -3, -1][f] : 0
  const hy = (mood === "idle" && f === 1 ? -1 : 0) + (mood === "sad" ? 1 : 0) + (mood === "eat" && f % 2 === 0 ? 1 : 0)
  const Y = 9 + hy + oy
  // cotton tail, body, feet
  c.circ(14, 14 + oy, 1, "3"); c.px(15, 15 + oy, "1")
  blob(c, 8, 14 + oy, 5, 3)
  c.rect(2, 16 + oy, 5, 2, "2"); c.rect(10, 16 + oy, 5, 2, "2"); c.hline(3, 17 + oy, 3, "1"); c.hline(11, 17 + oy, 3, "1")
  c.px(2, 16 + oy, "3"); c.px(10, 16 + oy, "3")
  // ears then head
  ear(c, Y, false, mood, f); ear(c, Y, true, mood, f)
  blob(c, 8, Y, 6, 4)
  // face
  const eyeKind = mood === "happy" ? "happy" : mood === "sad" ? "sad" : mood === "idle" && f === 2 ? "blink" : "open"
  eye(c, 5, Y - 1, eyeKind, false); eye(c, 10, Y - 1, eyeKind, true)
  c.hline(8, Y + 1, 1, "n"); c.px(8, Y + 2, "n")                                 // nose
  if (mood === "eat" && f % 2 === 0) {
    c.rect(7, Y + 3, 3, 1, "k"); c.hline(7, Y + 3, 1, "k"); c.px(8, Y + 3, "w"); c.hline(3, Y + 2, 2, "p"); c.hline(12, Y + 2, 2, "p")
    c.px(4, Y + 4, "g"); c.px(5, Y + 4, "g"); c.px(5, Y + 3, "G")                 // clover leaf
  }
  else if (mood === "happy") { c.hline(7, Y + 3, 3, "k"); c.px(6, Y + 2, "k"); c.px(10, Y + 2, "k") }
  else if (mood === "sad") { c.hline(7, Y + 4, 3, "k") }
  else { c.px(7, Y + 3, "k"); c.px(9, Y + 3, "k"); c.px(8, Y + 3, "w") }           // buck tooth
  if (mood !== "eat") { c.hline(3, Y + 2, 2, "p"); c.hline(12, Y + 2, 2, "p") }
  if (mood === "sad" && f > 0) c.px(4, Y + 1 + Math.min(f, 2), "t")
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`bunny_${mood}`, { w: S, h: S, frames: 4, selout: "k" }, (c) => draw(c, c.frame, mood))
sheet("bunny", ["bunny_idle", "bunny_happy", "bunny_eat", "bunny_sad"], { cols: 4, pad: 0 })
