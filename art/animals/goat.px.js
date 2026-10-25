// Hill Goat — uncommon, N=24. Cream kid goat: swept-back horns, long droopy ears, chin tuft, dark hooves.
const N = 24, S = N - 2
const P = { b: "#f4efe6", d: "#8c7a66", a: "#ffffff", c: "#c9b28a", n: "#2b2140" }
pal({ k: "#2b2140", w: "#ffffff", q: "#ff8fab", t: "#9fd3ff", M: "#c8405e", T: "#ff9fb8" })
pal({ 1: "#cdbfae", 2: P.b, 3: P.a }); ramps("123")          // cream coat
pal({ D: P.d, E: "#a89481", c: P.c, C: "#9a8460", g: "#d9d4c8" })   // hooves · horns · paper

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
  // long ear hanging from the side of the head; flaps out when happy, limp when sad
  const X = (x) => right ? 20 - x : x
  if (mood === "happy") { c.poly([X(4), Y - 3, X(6), Y - 1, X(2), Y + 1, X(0), Y - 1], "2"); c.px(X(1), Y - 1, "1"); return }
  const dy = mood === "sad" ? 2 : (mood === "idle" && f === 3 && !right ? 1 : 0)
  blob(c, X(2), Y + dy, 1, 3, { lit: right ? "2" : "3" }); c.px(X(2), Y - 3 + dy, "2"); c.px(X(3), Y - 3 + dy, "2")
}
function horn(c, Y, right) {
  const X = (x) => right ? 20 - x : x
  for (const [x, y] of [[7, -7], [6, -8], [5, -9], [5, -10], [6, -8], [6, -7]]) c.px(X(x), Y + y, right ? "C" : "c")
  c.px(X(7), Y - 8, right ? "C" : "c"); c.px(X(4), Y - 10, right ? "C" : "c")
}

function draw(c, f, mood) {
  const oy = mood === "happy" ? [0, -2, -3, -1][f] : 0
  const hy = (mood === "idle" && f === 1 ? -1 : 0) + (mood === "sad" ? 1 : 0) + (mood === "eat" && f % 2 === 0 ? 1 : 0)
  // tiny tail, body, hooves
  c.px(16, 14 + oy, "2"); c.px(17, 13 + oy, mood === "sad" ? "2" : "3"); if (mood !== "sad") c.px(17, 12 + oy, "2"); else c.px(17, 14 + oy, "2")
  blob(c, 10, 16 + oy, 6, 5)
  c.rect(5, 19 + oy, 3, 3, "D"); c.rect(12, 19 + oy, 3, 3, "D"); c.px(5, 19 + oy, "E"); c.px(12, 19 + oy, "E")
  // horns, ears, head, chin tuft
  const Y = 9 + hy + oy
  horn(c, Y, false); horn(c, Y, true)
  ear(c, Y, false, mood, f); ear(c, Y, true, mood, f)
  blob(c, 10, Y, 6, 6)
  c.poly([9, Y + 6, 12, Y + 6, 10, Y + 9], "3"); c.px(10, Y + 7, "1")
  if (mood === "eat") { c.rect(12, Y + 2, 4, 3, "w"); c.hline(13, Y + 3, 2, "g"); if (f % 2) c.px(12, Y + 2, "k") }   // homework
  if (mood === "eat" && f % 2 === 0) { c.rect(5, Y + 1, 2, 2, "3"); c.rect(15, Y + 1, 2, 2, "2") }
  face(c, 10, Y - 1, mood, f, S)
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`goat_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("goat", ["goat_idle", "goat_happy", "goat_eat", "goat_sad"], { cols: 4, pad: 0 })
