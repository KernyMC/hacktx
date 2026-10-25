// Snack Cat — common, N=20. Chibi orange tabby: big pointed ears, forehead stripes, curled tail.
const N = 20, S = N - 2
const P = { b: "#f4a24a", d: "#c9702a", a: "#ffe8cc", c: "#ff9fb2", n: "#ff7c95" }
pal({ k: "#2b2140", w: "#ffffff", q: "#ff8fab", t: "#9fd3ff", M: "#c8405e", T: "#ff9fb8" })
pal({ c: P.c, A: P.a })
shades("123", P.b, { spread: 0.42, shift: 10, sat: 0.9 })   // 1 shadow · 2 base · 3 light
shades("DE", P.d)           // tabby stripes

// Ellipse lit from the top-left: dark rim on the lower-right, a highlight patch up-left.
function blob(c, cx, cy, rx, ry, o = {}) {
  const ax = rx + 0.5, ay = ry + 0.5, inside = (x, y) => (x / ax) ** 2 + (y / ay) ** 2 <= 1
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    if (!inside(x, y)) continue
    let col = o.mid || "2"
    if (!inside(x + 1, y + 1) && (x > 0 || y > 0)) col = o.dark || "1"
    else if (((x + rx * 0.5) / (ax * 0.36)) ** 2 + ((y + ry * 0.5) / (ay * 0.3)) ** 2 <= 1) col = o.lit || "3"
    c.px(cx + x, cy + y, col)
  }
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

function ear(c, Y, right, sad) {
  // pointed ear on the head top (head top row is Y-5); mirrored for the right ear
  const X = (x) => right ? 16 - x : x, sh = right ? "1" : "2"
  if (sad) {
    for (const [x, y, k] of [[2, -6, "2"], [3, -6, sh], [2, -5, "2"], [3, -5, "c"], [4, -5, "c"], [5, -5, "2"], [3, -4, "2"], [4, -4, "2"], [5, -4, "2"]]) c.px(X(x), Y + y, k)
    return
  }
  for (const [x, y, k] of [[3, -9, sh], [3, -8, sh], [4, -8, "2"], [3, -7, sh], [4, -7, "c"], [5, -7, "2"], [3, -6, sh], [4, -6, "c"], [5, -6, "2"], [6, -6, "2"],
    [3, -5, sh], [4, -5, "c"], [5, -5, "2"], [6, -5, "2"], [3, -4, "2"], [4, -4, "2"]]) c.px(X(x), Y + y, k)
}

function draw(c, f, mood) {
  const oy = mood === "happy" ? [0, -2, -3, -1][f] : 0
  const hy = (mood === "idle" && f === 1 ? -1 : 0) + (mood === "sad" ? 1 : 0) + (mood === "eat" && f % 2 === 0 ? 1 : 0)
  // tail (right side): curls up, twitches on idle f3, down when sad
  const tip = mood === "sad" ? [16, 16] : (mood === "idle" && f === 3) || mood === "happy" ? [16, 8] : [16, 9]
  c.line(13, 14 + oy, 15, 12 + oy, "2"); c.line(15, 12 + oy, tip[0], tip[1] + oy, "2"); c.px(tip[0], tip[1] + oy, "E")
  // body + belly + paws
  blob(c, 8, 13 + oy, 5, 4)
  c.ellipse(8, 14 + oy, 2, 1, "A")
  c.rect(4, 16 + oy, 3, 2, "A"); c.rect(9, 16 + oy, 3, 2, "A")
  // ears, head
  const Y = 7 + hy + oy
  ear(c, Y, false, mood === "sad"); ear(c, Y, true, mood === "sad")
  blob(c, 8, Y, 6, 5)
  // tabby stripes: forehead M + cheek stripes
  c.vline(8, Y - 4, 2, "E"); c.vline(6, Y - 4, 2, "E"); c.vline(10, Y - 4, 2, "E")
  c.vline(3, Y - 2, 2, "E"); c.vline(13, Y - 2, 2, "D")
  if (mood === "eat" && f % 2 === 0) { c.rect(4, Y + 1, 2, 2, "3"); c.rect(11, Y + 1, 2, 2, "2") }   // puffed cheeks
  face(c, 8, Y - 1, mood, f, S)
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`cat_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("cat", ["cat_idle", "cat_happy", "cat_eat", "cat_sad"], { cols: 4, pad: 0 })
