// Sunny Chick — common, N=20. A round yellow fluffball: tuft, stubby wings, orange beak and feet.
const N = 20, S = N - 2
const P = { b: "#ffe066", d: "#f2b632", a: "#fff6bf", c: "#ff9a3c", n: "#2b2140" }
pal({ k: "#2b2140", w: "#ffffff", q: "#ff8fab", t: "#9fd3ff", M: "#c8405e", T: "#ff9fb8" })
pal({ A: P.a, c: P.c, C: "#d9782a" })
shades("123", P.b, { spread: 0.36, shift: 0, sat: 0.8 })   // 1 shadow · 2 base · 3 light
pal({ D: P.d, E: "#f8cf62" })                               // wings / tuft

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

function wing(c, Y, right, mood, f) {
  const X = (x) => right ? 16 - x : x
  if (mood === "happy") { c.poly([X(0), Y - 4, X(3), Y - 1, X(3), Y + 3, X(1), Y + 1], f % 2 ? "E" : "D"); return }   // flapping up
  const dy = mood === "sad" ? 2 : (mood === "idle" && f === 3 && !right) ? -1 : 0
  blob(c, X(2), Y + 1 + dy, 1, 3, { mid: "D", dark: "D", lit: right ? "D" : "E" })
}

function draw(c, f, mood) {
  const oy = mood === "happy" ? [0, -2, -3, -1][f] : 0
  const hy = (mood === "idle" && f === 1 ? -1 : 0) + (mood === "sad" ? 1 : 0) + (mood === "eat" && f % 2 === 0 ? 1 : 0)
  const Y = 9 + hy + oy      // body centre
  // feet
  c.hline(5, 17 + oy, 2, "c"); c.hline(10, 17 + oy, 2, "c"); c.px(4, 17 + oy, "C"); c.px(12, 17 + oy, "C")
  // round body (head and body are one egg), belly, tuft, wings
  blob(c, 8, Y, 6, 7)
  c.ellipse(8, Y + 4, 3, 2, "A")
  c.px(8, Y - 8, "E"); c.px(7, Y - 9, "E"); c.px(9, Y - 9, "D")
  wing(c, Y, false, mood, f); wing(c, Y, true, mood, f)
  // beak just below the eyes, then the standard face on top
  const ey = Y - 3
  c.hline(7, ey + 3, 3, "c"); c.px(8, ey + 4, "C")
  if (mood === "eat" && f % 2 === 0) { c.rect(4, ey + 2, 2, 2, "3"); c.rect(11, ey + 2, 2, 2, "2") }
  face(c, 8, ey, mood, f, S)
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`chick_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("chick", ["chick_idle", "chick_happy", "chick_eat", "chick_sad"], { cols: 4, pad: 0 })
