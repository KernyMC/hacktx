import type { Sprite } from "@/game/sprite";

export { lumi, sprout } from "@/game/art/rares";

// Pocket Device: tiny lilac blob with a big-eyed stare and an antenna.
export const blip: Sprite = {
  palette: {
    o: "#2b2d42",
    b: "#b9a3ff",
    s: "#8f74e8",
    h: "#e4dcff",
    w: "#ffffff",
    p: "#ff7a7a",
    y: "#ffe680",
  },
  rows: [
    "................................",
    "................................",
    "................................",
    "................................",
    "..............oooo..............",
    ".............owyyyo.............",
    ".............oyyyyo.............",
    "..............oooo..............",
    "...............oo...............",
    "...............oo...............",
    "...........oooooooooo...........",
    ".........oohhbbbbbbbboo.........",
    ".......oohhhbbbbbbbbbbboo.......",
    "......ohhbbbbbbbbbbbbbbbso......",
    ".....ohbbbbbbbbbbbbbbbbbbso.....",
    ".....obbbboooobbbboooobbbso.....",
    ".....obbbbwwoobbbbwwoobbbso.....",
    ".....obbbbwwoobbbbwwoobbbso.....",
    ".....obbbboooobbbboooobbbso.....",
    ".....obbbbboobbbbbboobbbbso.....",
    ".....obbppbbbbboobbbbbppbso.....",
    ".....obbbbbbbbbbbbbbbbbbsso.....",
    ".....osbbbbbbbbbbbbbbbbssso.....",
    "......ossbbbbbbbbbbbbbssso......",
    ".......ossssbbbbbbbbssssoo......",
    ".........oossssssssssoo.........",
    "...........oooooooooo...........",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ],
  blink: {
    15: ".....obbbbbbbbbbbbbbbbbbbso.....",
    16: ".....obbbbbbbbbbbbbbbbbbbso.....",
    17: ".....obbbboooobbbboooobbbso.....",
    18: ".....obbbbbbbbbbbbbbbbbbbso.....",
    19: ".....obbbbbbbbbbbbbbbbbbbso.....",
  },
};


export const plant: Sprite = {
  palette: { o: "#3b2417", g: "#6abe30", l: "#a8e063", d: "#3f7a3a", t: "#c96f4a", u: "#8f4a30" },
  rows: [
    "...oooooo...",
    "..ollllggo..",
    ".ollggggggo.",
    "ollgggggggdo",
    "olggggggggdo",
    "oggggggggddo",
    ".ogggggdddo.",
    "..ooddddoo..",
    ".oooooooooo.",
    ".otttttttuo.",
    "..ottttuuo..",
    "..ottttuuo..",
    "..oooooooo..",
  ],
};

export const moon: Sprite = {
  palette: { m: "#fff3a8", n: "#ffd6a5" },
  rows: [
    "...mmmm...",
    ".mmmmm....",
    ".mmmn.....",
    "mmmn......",
    "mmmn......",
    "mmmn......",
    "mmmn......",
    ".mmmn.....",
    ".mmmmm....",
    "...mmmm...",
  ],
};

export const twinkle: Sprite = {
  palette: { y: "#fff3a8", w: "#ffffff" },
  rows: ["..y..", "..y..", "yywyy", "..y..", "..y.."],
};

export const bowl: Sprite = {
  palette: { o: "#2b2d42", c: "#ff7a7a", b: "#ffe680" },
  rows: [
    "...obbbbo...",
    ".oooooooooo.",
    ".occcccccco.",
    "..occcccco..",
    "...oooooo...",
  ],
};

// 9x9 icons; o = ink, a = accent, f = light. Each direction supplies the colors.
export const icons = {
  home: [
    "....o....",
    "...ooo...",
    "..ooaoo..",
    ".ooaaaoo.",
    "ooaaaaaoo",
    ".offfffo.",
    ".offoffo.",
    ".offoffo.",
    ".ooooooo.",
  ],
  quests: [
    ".ooooooo.",
    ".offfffo.",
    ".ofaaafo.",
    ".offfffo.",
    ".ofaaafo.",
    ".offfffo.",
    ".ofaaffo.",
    ".offfffo.",
    ".ooooooo.",
  ],
  shop: [
    "...ooo...",
    "..o...o..",
    ".ooooooo.",
    ".offfffo.",
    ".offaffo.",
    ".ofaaafo.",
    ".offaffo.",
    ".offfffo.",
    ".ooooooo.",
  ],
  pets: [
    ".oo...oo.",
    "oaao.oaao",
    "oafaoaaao",
    "oaaaaaaao",
    ".oaaaaao.",
    "..oaaao..",
    "...oao...",
    "....o....",
    ".........",
  ],
  water: [
    "....o....",
    "...oao...",
    "...oao...",
    "..oaaao..",
    ".oafaaao.",
    ".oafaaao.",
    ".oaaaaao.",
    "..oaaao..",
    "...ooo...",
  ],
  walk: [
    "..oooo...",
    "..oaao...",
    "..oaao...",
    "..oaao...",
    "..oaaooo.",
    "..oaaaaao",
    "..oaaaaao",
    "..ooooooo",
    ".........",
  ],
  tidy: [
    "....o....",
    "....o....",
    "...oao...",
    ".ooafaoo.",
    "oaafffaao",
    ".ooafaoo.",
    "...oao...",
    "....o....",
    "....o....",
  ],
};

export const lamp: Sprite = {
  palette: { o: "#120f26", y: "#ffd6a5", p: "#ffb38a", s: "#5b4b9a" },
  rows: [
    "..oooo..",
    ".oyyyyo.",
    "oyyyyppo",
    "oooooooo",
    "...os...",
    "...os...",
    "...os...",
    "...os...",
    "..osso..",
    ".oooooo.",
  ],
};
