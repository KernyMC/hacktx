// Clover Bun — common, N=20. Chibi white bunny: tall ears with pink insides, big feet, cotton tail.
const N = 20, S = N - 2
const P = { b: "#f3eef6", d: "#c9bfd6", a: "#ffffff", c: "#ffa9c0", n: "#ff7c95" }
pal({ k: "#2b2140", w: "#ffffff", q: "#ff8fab", t: "#9fd3ff", M: "#c8405e", T: "#ff9fb8" })
pal({ c: P.c, g: "#6fc46a", G: "#3f8f44" })
pal({ 1: P.d, 2: P.b, 3: "#ffffff" }); ramps("123")   // light fur: hand ramp (shadow lavender, pure white light)

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

function ear(c, Y, right, mood, f) {
  // tall ear standing on the head (head top row is Y-4); flops sideways when sad; one twitches on idle f3
  const X = (x) => right ? 16 - x : x
  if (mood === "sad") {
    c.poly([X(3), Y - 5, X(6), Y - 4, X(2), Y + 4, X(0), Y + 2], "2"); c.line(X(3), Y - 3, X(1), Y + 2, "c")
    c.line(X(1), Y + 3, X(2), Y + 3, "1"); return
  }
  const lean = (mood === "idle" && f === 3 && !right) || mood === "happy" ? 1 : 0
  for (let y = 0; y < 8; y++) {
    const x = X(4 + Math.round(lean * (7 - y) / 7))
    const inner = X(x === X(4) ? 5 : 5 + lean)
    c.px(x, Y - 11 + y, right ? "1" : "2"); c.px(X(x === X(4) ? 5 : 5 + lean), Y - 11 + y, right ? "2" : "1")
    if (y > 0 && y < 7) c.px(inner, Y - 11 + y, "c")
    if (y === 0) c.px(x, Y - 11, right ? "2" : "3")
  }
}

function draw(c, f, mood) {
  const oy = mood === "happy" ? [0, -2, -3, -1][f] : 0
  const hy = (mood === "idle" && f === 1 ? -1 : 0) + (mood === "sad" ? 1 : 0) + (mood === "eat" && f % 2 === 0 ? 1 : 0)
  const Y = 9 + hy + oy
  // cotton tail, body, big feet
  c.circ(14, 14 + oy, 1, "3"); c.px(15, 15 + oy, "1")
  blob(c, 8, 14 + oy, 5, 3)
  c.rect(2, 16 + oy, 5, 2, "2"); c.rect(10, 16 + oy, 5, 2, "2"); c.hline(3, 17 + oy, 4, "1"); c.hline(11, 17 + oy, 4, "1")
  c.hline(2, 16 + oy, 2, "3"); c.hline(10, 16 + oy, 2, "3")
  // ears then head
  ear(c, Y, false, mood, f); ear(c, Y, true, mood, f)
  blob(c, 8, Y, 6, 4)
  if (mood === "eat" && f % 2 === 0) { c.rect(4, Y + 1, 2, 2, "3"); c.rect(11, Y + 1, 2, 2, "2"); c.hline(10, Y + 4, 2, "g"); c.px(10, Y + 3, "G") }   // cheeks + clover
  face(c, 8, Y - 1, mood, f, S)
  if (mood === "idle" || (mood === "eat" && f % 2)) c.px(8, Y + 3, "w")           // buck tooth
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`bunny_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("bunny", ["bunny_idle", "bunny_happy", "bunny_eat", "bunny_sad"], { cols: 4, pad: 0 })
