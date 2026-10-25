// Mud Piglet — uncommon, N=24. Round pink piglet: folded ears, big snout, curly tail, mud splashes.
const N = 24, S = N - 2
const P = { b: "#ffb0c2", d: "#e7849e", a: "#ffd6e0", c: "#ff8aa6", n: "#b8466a" }
pal({ k: "#2b2140", w: "#ffffff", q: "#ff8fab", t: "#9fd3ff", M: "#c8405e", T: "#ff9fb8" })
pal({ A: P.a, c: P.c, n: P.n, u: "#8a5a3c", U: "#b07a52" })
shades("123", P.b, { spread: 0.38, shift: 10, sat: 0.9 })   // 1 shadow · 2 base · 3 light
shades("DE", P.d, { spread: 0.3 })                           // ears / tail / hooves

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
  // folded triangular ear on the head top (head top row is Y-6); perks up when happy, droops when sad
  const X = (x) => right ? 20 - x : x
  const dy = mood === "happy" ? -1 : mood === "sad" ? 2 : (mood === "idle" && f === 3 && !right ? -1 : 0)
  c.poly([X(3), Y - 4 + dy, X(4), Y - 10 + dy, X(9), Y - 5 + dy], "E")
  c.poly([X(4), Y - 5 + dy, X(5), Y - 8 + dy, X(7), Y - 6 + dy], "D")
  if (right) c.line(X(4), Y - 9 + dy, X(8), Y - 5 + dy, "D")
}

function draw(c, f, mood) {
  const oy = mood === "happy" ? [0, -2, -3, -1][f] : 0
  const hy = (mood === "idle" && f === 1 ? -1 : 0) + (mood === "sad" ? 1 : 0) + (mood === "eat" && f % 2 === 0 ? 1 : 0)
  // curly tail on the right (hangs when sad)
  if (mood === "sad") { c.line(16, 17 + oy, 17, 20 + oy, "D") }
  else { for (const [x, y] of [[16, 16], [17, 15], [18, 14], [18, 13], [17, 12], [17, 13]]) c.px(x, y + oy, "D"); if (mood === "happy" || (mood === "idle" && f === 3)) c.px(18, 12 + oy, "D") }
  // body, mud, hooves
  blob(c, 10, 16 + oy, 7, 5)
  c.ellipse(13, 19 + oy, 3, 1, "u"); c.px(11, 18 + oy, "u"); c.px(16, 18 + oy, "U"); c.hline(5, 19 + oy, 2, "U")
  c.rect(5, 20 + oy, 3, 2, "D"); c.rect(12, 20 + oy, 3, 2, "D"); c.px(5, 20 + oy, "E"); c.px(12, 20 + oy, "E")
  // ears, head, snout
  const Y = 9 + hy + oy
  ear(c, Y, false, mood, f); ear(c, Y, true, mood, f)
  blob(c, 10, Y, 7, 6)
  c.ellipse(10, Y + 2, 3, 1, "c"); c.hline(8, Y + 3, 5, "D")           // snout (nostrils come from the face's "w")
  if (mood === "eat" && f % 2 === 0) { c.rect(4, Y + 1, 2, 2, "3"); c.rect(15, Y + 1, 2, 2, "2") }
  face(c, 10, Y - 1, mood, f, S)
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`pig_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("pig", ["pig_idle", "pig_happy", "pig_eat", "pig_sad"], { cols: 4, pad: 0 })
