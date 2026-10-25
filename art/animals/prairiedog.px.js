// Lookout Pup — uncommon, N=24. Prairie dog standing tall: upright body, paws at the chest, tiny ears.
const N = 24, S = N - 2
const P = { b: "#d8a86a", d: "#a77a43", a: "#f7e1bd", c: "#ffb3c0", n: "#2b2140" }
pal({ k: "#2b2140", w: "#ffffff", q: "#ff8fab", t: "#9fd3ff", M: "#c8405e", T: "#ff9fb8" })
pal({ A: P.a, c: P.c, D: P.d, E: "#c4955a", y: "#ffd84a" })
shades("123", P.b, { spread: 0.36, shift: 0, sat: 0.8 })   // 1 shadow · 2 base · 3 light

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

function draw(c, f, mood) {
  const oy = mood === "happy" ? [0, -2, -3, -1][f] : 0
  const hy = (mood === "idle" && f === 1 ? -1 : 0) + (mood === "sad" ? 1 : 0) + (mood === "eat" && f % 2 === 0 ? 1 : 0)
  // stubby tail, tall body, belly, feet
  c.line(15, 19 + oy, 17, mood === "sad" ? 21 + oy : 17 + oy, "D"); c.px(17, mood === "sad" ? 21 + oy : 17 + oy, "E")
  blob(c, 10, 15 + oy, 5, 6)
  c.ellipse(10, 16 + oy, 3, 4, "A")
  c.rect(6, 20 + oy, 3, 2, "D"); c.rect(12, 20 + oy, 3, 2, "D"); c.px(6, 20 + oy, "E"); c.px(12, 20 + oy, "E")
  // paws: at the chest (idle/sad), raised when happy, holding a seed when eating
  if (mood === "happy") { c.rect(4, 9 + oy, 2, 2, "2"); c.rect(14, 9 + oy, 2, 2, "1"); c.px(4, 11 + oy, "1"); c.px(15, 11 + oy, "1") }
  else if (mood === "eat") { c.rect(8, 11 + hy + oy, 2, 2, "2"); c.rect(11, 11 + hy + oy, 2, 2, "1"); c.px(10, 11 + hy + oy, "y") }
  else { c.rect(7, 12 + oy, 2, 2, "2"); c.rect(11, 12 + oy, 2, 2, "1") }
  // ears, head, cheeks
  const Y = 6 + hy + oy, edy = mood === "sad" ? 1 : 0
  c.rect(4, Y - 4 + edy + (mood === "idle" && f === 3 ? -1 : 0), 2, 2, "D"); c.rect(14, Y - 4 + edy, 2, 2, "D")
  blob(c, 10, Y, 6, 5)
  c.ellipse(10, Y + 2, 3, 1, "A")
  if (mood === "eat" && f % 2 === 0) { c.rect(5, Y + 1, 2, 2, "3"); c.rect(15, Y + 1, 2, 2, "2") }
  face(c, 10, Y - 1, mood, f, S)
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`prairiedog_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("prairiedog", ["prairiedog_idle", "prairiedog_happy", "prairiedog_eat", "prairiedog_sad"], { cols: 4, pad: 0 })
