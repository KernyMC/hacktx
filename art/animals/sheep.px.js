// Cloud Lamb — uncommon, N=24. A puff of wool with a soft grey face, dark ears and legs, wool cap.
const N = 24, S = N - 2
const P = { b: "#ffffff", d: "#5e5470", a: "#f1eef7", c: "#ffa9c0", n: "#2b2140" }
pal({ k: "#2b2140", w: "#ffffff", q: "#ff8fab", t: "#9fd3ff", M: "#c8405e", T: "#ff9fb8" })
pal({ 1: "#cfc6e0", 2: P.a, 3: P.b }); ramps("123")          // wool: lavender shadow, pure white light
pal({ C: "#463d5a", D: P.d, E: "#9a8fb3", F: "#b5aacd", c: P.c })   // face / legs / ears

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

function puffs(c, pts, k) { for (const [x, y, r] of pts) c.circ(x, y, r, k) }

function draw(c, f, mood) {
  const oy = mood === "happy" ? [0, -2, -3, -1][f] : 0
  const hy = (mood === "idle" && f === 1 ? -1 : 0) + (mood === "sad" ? 1 : 0) + (mood === "eat" && f % 2 === 0 ? 1 : 0)
  // legs
  c.rect(6, 19 + oy, 2, 3, "D"); c.rect(13, 19 + oy, 2, 3, "D"); c.px(6, 19 + oy, "E"); c.px(13, 19 + oy, "E")
  // woolly body: a blob plus bumps along the edge
  blob(c, 10, 14 + oy, 8, 5)
  puffs(c, [[3, 12 + oy, 1], [17, 13 + oy, 1], [4, 17 + oy, 1], [10, 19 + oy, 1], [16, 17 + oy, 1], [8, 10 + oy, 1], [13, 10 + oy, 1]], "2")
  puffs(c, [[4, 13 + oy, 1], [16, 15 + oy, 1], [11, 19 + oy, 1]], "1"); c.px(3, 11 + oy, "3"); c.px(4, 16 + oy, "3")
  // ears (perk up when happy, droop when sad)
  const Y = 9 + hy + oy, edy = mood === "happy" ? -1 : mood === "sad" ? 1 : 0
  c.ellipse(4, Y + edy, 2, 1, "D"); c.ellipse(16, Y + edy, 2, 1, "C"); c.px(3, Y + edy, "E"); c.px(15, Y + edy, "D")
  if (mood === "idle" && f === 3) c.px(2, Y - 1, "D")
  // face then the wool cap on top of the head
  blob(c, 10, Y + 1, 5, 4, { mid: "E", dark: "D", lit: "F" })
  blob(c, 10, Y - 4, 6, 3)
  puffs(c, [[5, Y - 3, 1], [15, Y - 3, 1], [8, Y - 6, 1], [12, Y - 6, 1]], "2"); c.px(4, Y - 4, "3"); c.px(7, Y - 7, "3"); c.px(16, Y - 2, "1")
  if (mood === "eat" && f % 2 === 0) { c.rect(6, Y + 2, 1, 2, "F"); c.rect(14, Y + 2, 1, 2, "E") }
  face(c, 10, Y, mood, f, S)
}

for (const mood of ["idle", "happy", "eat", "sad"])
  anim(`sheep_${mood}`, { w: S, h: S, frames: 4, outline: "k" }, (c) => draw(c, c.frame, mood))
sheet("sheep", ["sheep_idle", "sheep_happy", "sheep_eat", "sheep_sad"], { cols: 4, pad: 0 })
