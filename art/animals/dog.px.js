// Party Pup — common, N=20. Chibi tan puppy: big floppy brown ears, eye patch, party collar, wagging tail.
const N = 20, S = N - 2
const P = { b: "#e8c79a", d: "#9a6a43", a: "#fff4e2", c: "#ff7c95", n: "#2b2140" }
pal({ k: "#2b2140", w: "#ffffff", q: "#ff8fab", t: "#9fd3ff", M: "#c8405e", T: "#ff9fb8" })
pal({ A: P.a, r: "#4a8fe0", y: "#ffd84a" })
shades("123", P.b, { spread: 0.42, shift: 10, sat: 0.9 })   // 1 shadow · 2 base · 3 light
shades("CDE", P.d, { spread: 0.4, shift: 6 })    // ears / patch

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
  // big floppy ear hanging beside the head; flies up when jumping, droops when sad
  const X = (x) => right ? 16 - x : x
  if (mood === "happy" && f > 0) { c.poly([X(1), Y - 6, X(4), Y - 4, X(3), Y + 1, X(0), Y - 1], "D"); c.line(X(1), Y - 5, X(1), Y - 2, "E"); return }
  const dy = mood === "sad" ? 2 : 0
  blob(c, X(1), Y + dy, 1, 4, { mid: "D", dark: "C", lit: right ? "D" : "E" })
  c.hline(X(1), Y - 4 + dy, 1, "D"); c.px(X(2), Y - 4 + dy, "D")
  if (mood === "idle" && f === 3 && !right) c.px(0, Y - 2, "D")
}

function draw(c, f, mood) {
  const oy = mood === "happy" ? [0, -2, -3, -1][f] : 0
  const hy = (mood === "idle" && f === 1 ? -1 : 0) + (mood === "sad" ? 1 : 0) + (mood === "eat" && f % 2 === 0 ? 1 : 0)
  // wagging tail on the right
  const wag = mood === "sad" ? [16, 16] : (mood === "happy" || (mood === "idle" && f === 3)) ? (f % 2 ? [16, 9] : [16, 11]) : [16, 11]
  c.line(13, 14 + oy, wag[0], wag[1] + oy, "2"); c.px(wag[0], wag[1] + oy, "3")
  // body, belly, paws
  blob(c, 8, 13 + oy, 5, 4)
  c.ellipse(8, 15 + oy, 2, 1, "A")
  c.rect(4, 16 + oy, 3, 2, "2"); c.rect(9, 16 + oy, 3, 2, "2"); c.hline(4, 17 + oy, 2, "A"); c.hline(10, 17 + oy, 2, "A")
  // collar with a tag
  const cy = 12 + oy + (mood === "sad" ? 1 : 0)
  c.hline(5, cy, 7, "r"); c.px(8, cy + 1, "y")
  // head, markings, ears
  const Y = 7 + hy + oy
  blob(c, 8, Y, 6, 5)
  c.ellipse(11, Y - 1, 2, 2, "D"); c.px(10, Y - 3, "E"); c.px(9, Y - 2, "E")        // eye patch
  c.ellipse(8, Y + 2, 2, 1, "A")                                                      // muzzle
  ear(c, Y, false, mood, f); ear(c, Y, true, mood, f)
  if (mood === "eat" && f % 2 === 0) { c.rect(4, Y + 1, 2, 2, "3"); c.rect(11, Y + 1, 2, 2, "2") }
  face(c, 8, Y - 1, mood, f, S)
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`dog_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("dog", ["dog_idle", "dog_happy", "dog_eat", "dog_sad"], { cols: 4, pad: 0 })
