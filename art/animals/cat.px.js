// Snack Cat — common, N=20. Chibi orange tabby, 3/4 front view, light from top-left.
const N = 20, S = N - 2
const P = { b: "#f4a24a", d: "#c9702a", a: "#ffe8cc", c: "#ff9fb2", n: "#ff7c95" }
pal({ k: "#2b2140", w: "#ffffff", p: "#ff8fab", t: "#9fd8ff", c: P.c, n: P.n })
shades("01234", P.b, { spread: 0.7 }); pal({ 0: "#2b2140" })   // 1 shadow · 2 base · 3 light · 4 glint
shades("DE", P.d)                                             // tabby stripes
pal({ A: P.a, B: P.a })                                      // belly / paws (ink outline)

// Ellipse lit from the top-left: dark rim on the lower-right, a highlight patch up-left.
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
function ear(c, Y, right, sad) {
  // pointed ear on the head top (head top row is Y-5); mirrored for the right ear
  const X = (x) => right ? 16 - x : x, sh = right ? "1" : "2"
  if (sad) {
    for (const [x, y, k] of [[2, -6, "2"], [3, -6, sh], [2, -5, "2"], [3, -5, "c"], [4, -5, "c"], [5, -5, "2"], [3, -4, "2"], [4, -4, "2"], [5, -4, "2"]]) c.px(X(x), Y + y, k)
    return
  }
  for (const [x, y, k] of [[3, -8, sh], [3, -7, sh], [4, -7, "c"], [3, -6, sh], [4, -6, "c"], [5, -6, "2"], [3, -5, sh], [4, -5, "c"], [5, -5, "c"], [6, -5, "2"], [3, -4, "2"], [4, -4, "2"]]) c.px(X(x), Y + y, k)
}

function draw(c, f, mood) {
  const jump = mood === "happy" ? [0, -2, -3, -1][f] : 0
  const hy = (mood === "idle" && f === 1 ? -1 : 0) + (mood === "sad" ? 1 : 0) + (mood === "eat" && f % 2 === 0 ? 1 : 0)
  const oy = jump
  // tail (right side), twitch on idle f3, down when sad
  const tail = mood === "sad" ? [16, 16] : (mood === "idle" && f === 3) || mood === "happy" ? [16, 9] : [16, 10]
  c.line(13, 14 + oy, tail[0], tail[1] + oy, "2"); c.px(tail[0], tail[1] + oy, "E")
  // body + belly + paws
  blob(c, 8, 13 + oy, 5, 4)
  c.ellipse(8, 14 + oy, 2, 1, "B")
  c.rect(4, 16 + oy, 3, 2, "B"); c.rect(9, 16 + oy, 3, 2, "B"); c.px(6, 17 + oy, "A"); c.px(11, 17 + oy, "A")
  // ears (up when happy, down/out when sad)
  const Y = 7 + hy + oy
  ear(c, Y, false, mood === "sad"); ear(c, Y, true, mood === "sad")
  // head
  blob(c, 8, Y, 6, 5)
  // tabby stripes: forehead M + cheeks
  c.vline(8, Y - 4, 2, "E"); c.vline(6, Y - 4, 2, "E"); c.vline(10, Y - 4, 2, "E")
  c.vline(3, Y, 2, "E"); c.vline(13, Y, 2, "D")
  // muzzle, nose, mouth
  c.vline(8, Y + 2, 2, "n")
  const eyeKind = mood === "happy" ? "happy" : mood === "sad" ? "sad" : mood === "idle" && f === 2 ? "blink" : "open"
  eye(c, 5, Y - 1, eyeKind, false); eye(c, 10, Y - 1, eyeKind, true)
  if (mood === "eat" && f % 2 === 0) { c.rect(7, Y + 3, 3, 2, "k"); c.px(8, Y + 4, "n"); c.rect(4, Y + 2, 2, 1, "p"); c.rect(11, Y + 2, 2, 1, "p") }
  else if (mood === "happy") { c.hline(7, Y + 4, 3, "k"); c.px(6, Y + 3, "k"); c.px(10, Y + 3, "k") }
  else if (mood === "sad") { c.hline(7, Y + 4, 3, "1") }
  else { c.px(7, Y + 3, "k"); c.px(9, Y + 3, "k") }
  if (mood !== "eat") { c.hline(3, Y + 2, 2, "p"); c.hline(12, Y + 2, 2, "p") }
  if (mood === "sad" && f > 0) c.px(4, Y + 1 + Math.min(f, 2), "t")
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`cat_${mood}`, { w: S, h: S, frames: 4, selout: "k" }, (c) => draw(c, c.frame, mood))
sheet("cat", ["cat_idle", "cat_happy", "cat_eat", "cat_sad"], { cols: 4, pad: 0 })
