// 9x9 icons per pet. o = outline, a = accent, f = light; the active skin supplies the colors.
export type IconSet = { home: string[]; quests: string[]; shop: string[]; book: string[]; coin: string[] };

// 5x5 emblems stamped onto the shared book and coin shapes ("a" = light pixel, "f" = outline detail).
const emblems: Record<string, string[]> = {
  heart: [".a.a.", "aaaaa", "aaaaa", ".aaa.", "..a.."],
  seed: ["..a..", ".aaa.", ".afa.", ".aaa.", "..a.."],
  acorn: [".aaa.", "aaaaa", ".fff.", ".fff.", "..f.."],
  clover: ["aa.aa", "aa.aa", "..a..", "aa.aa", "aa.aa"],
  drop: ["..a..", ".aaa.", "aafaa", "aaaaa", ".aaa."],
  leaf: ["..aaa", ".aafa", "aafa.", "afa..", "a...."],
  star: ["..a..", ".aaa.", "aaaaa", ".aaa.", ".a.a."],
  flame: ["..a..", ".aa..", ".aaa.", "aafaa", ".aaa."],
  shell: ["..a..", ".aaa.", "afafa", "aaaaa", ".a.a."],
  gem: [".aaa.", "afaaa", "aaaaa", ".aaa.", "..a.."],
};

const stamp = (e: string[]) => e.map((r) => [...r].map((c) => (c === "a" ? "f" : c === "f" ? "o" : "a")).join(""));

const coin = (e: string[]) => ["..ooooo..", ".oaaaaao.", ...stamp(e).map((r) => `oa${r}ao`), ".oaaaaao.", "..ooooo.."];
const book = (e: string[]) => [".oooooooo", "oaaaaaaao", ...stamp(e).map((r) => `oa${r}ao`), "offfffffo", "ooooooooo"];

const set = (home: string[], quests: string[], shop: string[], emblem: string): IconSet => ({
  home,
  quests,
  shop,
  book: book(emblems[emblem]),
  coin: coin(emblems[emblem]),
});

export const icons: Record<string, IconSet> = {
  mochi: set(
    ["...ooo...", "..oafao..", ".oaaaaao.", "oaaaaaaao", "oaaoooaao", "oaaofoaao", "oaaofoaao", ".ooooooo.", "........."],
    [".ooooooo.", ".offfffo.", ".ofafafo.", ".ofaaafo.", ".offaffo.", ".offfffo.", ".ofaaafo.", ".offfffo.", ".ooooooo."],
    ["..ooooo..", "..offfo..", ".ooooooo.", ".ofafafo.", ".oafafao.", ".ofafafo.", ".oafafao.", ".offfffo.", ".ooooooo."],
    "heart",
  ),
  pip: set(
    [".........", "...ooo...", "..offfo..", "..offfo..", "ooaoooaoo", "oaaaaaaao", ".oaaaaao.", "..ooooo..", "........."],
    [".ooooooo.", ".oaaaaao.", ".oafffao.", ".oafofao.", ".oafffao.", ".oaaaaao.", ".ofofofo.", ".offfffo.", ".ooooooo."],
    ["..o...o..", "..oo.oo..", ".ooooooo.", ".oaaaaao.", "oaafffaao", "oaafafaao", "oaafffaao", "oaaaaaaao", ".ooooooo."],
    "seed",
  ),
  nib: set(
    ["..ooooo..", ".oafafao.", "oaaaaaaao", "ooooooooo", ".offfffo.", ".offoffo.", ".offoffo.", ".offoffo.", ".ooooooo."],
    ["......oo.", "....ooao.", "..ooaafo.", ".oaaafao.", ".oaafaao.", "oaafaao..", "oafaoo...", "ofoo.....", "o........"],
    ["..ooooo..", ".o.....o.", ".o.....o.", "ooooooooo", "oafafafao", "oaaaaaaao", "oafafafao", ".oaaaaao.", "..ooooo.."],
    "acorn",
  ),
  clover: set(
    [".........", "...ooo...", "..oaaao..", ".oaaaaao.", "oaaoooaao", "oaoooooao", "oaoooooao", "ooooooooo", "........."],
    ["..offfo..", "...ofo...", "...ooo...", ".oaaaaao.", ".oaoaaao.", "..oaaao..", "..oaoao..", "...oao...", "....o...."],
    [".........", "ooooooooo", "oafafafao", "ooooooooo", "oafafafao", "ooooooooo", ".o.....o.", ".........", "........."],
    "clover",
  ),
  puddle: set(
    [".........", ".........", "...ooo...", "..offfo..", "...ooo...", ".oooooo..", "oaaaoaaao", "oaaaaaaao", ".ooooooo."],
    [".........", "oo.....oo", "ofo...ofo", ".ofo.ofo.", "..oaaao..", "..oaaao..", "...oao...", "...oao...", "....o...."],
    ["..o...o..", ".oao.oao.", "ooooooooo", "oaaaaaaao", "oaaaaaaao", "oaaoooaao", "oaaaaaaao", ".ooooooo.", "........."],
    "drop",
  ),
  sprout: set(
    ["....o....", "...ooo...", "..ooaoo..", ".ooaaaoo.", "ooaaaaaoo", ".offfffo.", ".offoffo.", ".offoffo.", ".ooooooo."],
    ["..ooo....", ".o...o...", "ooooooo.o", "oaaaaaooo", "oaaaaao..", "oaffaao..", "oaaaaao..", ".ooooo...", "........."],
    [".ooooooo.", ".offfffo.", ".ofaaafo.", ".ofafafo.", ".ofaaafo.", ".offfffo.", ".oaaaaao.", ".oaaaaao.", ".ooooooo."],
    "leaf",
  ),
  lumi: set(
    ["...ooo...", "..oaao...", ".oaao....", ".oao.....", ".oao..o..", ".oaao.o.o", "..oaaoo..", "...ooo...", "........."],
    ["ooooooooo", "offfffffo", "ofafffffo", "offffaffo", "offffffao", "offaffffo", "offfffffo", "ofafffffo", "ooooooooo"],
    ["...ooo...", "..o...o..", ".ooooooo.", ".offfffo.", ".ofaaafo.", ".ofaaafo.", ".offfffo.", ".ooooooo.", "...ooo..."],
    "star",
  ),
  ember: set(
    ["....o....", "...oao...", "..oaafo..", "..oafao..", ".oaafaao.", ".oaaaaao.", "ooooooooo", "o.o...o.o", "........."],
    ["...o.....", "..oao....", "..oafo...", "...oao...", "....oo...", "....oo...", "....oo...", "....oo...", "....oo..."],
    ["...ooo...", "..o.o.o..", ".ooooooo.", "oaaaaaaao", "oaafffaao", "oaafafaao", "oaaaaaaao", "oaaaaaaao", ".ooooooo."],
    "flame",
  ),
  marina: set(
    ["....o....", "...oao...", "..oafao..", ".oafaao..", ".oafaaao.", "oafaaaao.", "oaaaaaaao", ".ooooooo.", "........."],
    ["....oo...", "....ff...", "...offo..", "..offfo..", "..ofafo..", "..ofafo..", "..offfo..", "..offfo..", "..ooooo.."],
    [".ooooooo.", "oaaaaaaao", "oafffffao", "ooooooooo", "oaaafaaao", "oaaoooaao", "oaaaaaaao", "oaaaaaaao", ".ooooooo."],
    "shell",
  ),
  aurora: set(
    ["ooooooooo", ".oaaaaao.", "..ooooo..", "..of.fo..", "..of.fo..", "..of.fo..", "..of.fo..", ".ooooooo.", "ooooooooo"],
    ["...ooo...", "..ofafo..", ".ofaaafo.", "ofaafaafo", ".ofaaafo.", "..ofafo..", "...ooo...", "...o.o...", "..o...o.."],
    ["...ooo...", "..oaaao..", ".oafaaao.", "oaafaaaao", ".oaaaaao.", "..oaaao..", "...oao...", "....o....", "........."],
    "gem",
  ),
};
