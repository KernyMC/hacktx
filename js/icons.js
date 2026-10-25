/* =====================================================================
   Familiars — pixel icons (8x8 grids → inline SVG). No emoji anywhere.
   '#' = main colour (currentColor by default), '+' = secondary colour.
   Usage:  <i data-icon="flame"></i>   → Icons.mount() swaps them for SVG
           Icons.svg('flame', 16)      → SVG string
   ===================================================================== */
(function (global) {
  'use strict';

  const G = {
    home: [
      '...##...', '..####..', '.######.', '########', '.##..##.', '.##..##.', '.##.###.', '.######.'],
    egg: [
      '...##...', '..####..', '.######.', '.######.', '########', '########', '.######.', '..####..'],
    village: [
      '.#....#.', '###..###', '#+#..#+#', '###..###', '...##...', '..####..', '..#++#..', '..####..'],
    book: [
      '########', '#......#', '#.####.#', '#......#', '#.####.#', '#......#', '#.####.#', '########'],
    star: [
      '...##...', '...##...', '.######.', '########', '.######.', '..####..', '.##..##.', '#......#'],
    flame: [
      '....#...', '...##...', '..###...', '.####.#.', '.#####..', '##+####.', '#++++##.', '.#++##..'],
    coin: [
      '..####..', '.#++++#.', '#+#++#+#', '#+#++++#', '#+#++++#', '#+#++#+#', '.#++++#.', '..####..'],
    gear: [
      '.#.##.#.', '########', '.##..##.', '##....##', '##....##', '.##..##.', '########', '.#.##.#.'],
    pin: [
      '..####..', '.######.', '.##++##.', '.##++##.', '.######.', '..####..', '...##...', '...##...'],
    camera: [
      '........', '..##....', '########', '#..##..#', '#.####.#', '#.####.#', '#..##..#', '########'],
    mic: [
      '...##...', '..####..', '..####..', '..####..', '..####..', '.#.##.#.', '..####..', '...##...'],
    food: [
      '.######.', '########', '#+#+#+##', '########', '.######.', '..####..', '..#..#..', '.##..##.'],
    chat: [
      '.######.', '########', '#+#+#+##', '########', '########', '.######.', '.##.....', '.#......'],
    tree: [
      '...##...', '..####..', '.######.', '..####..', '.######.', '########', '...##...', '...##...'],
    brush: [
      '......##', '.....###', '....###.', '...###..', '..###...', '.###....', '###.....', '##......'],
    skull: [
      '.######.', '########', '#+####+#', '########', '.######.', '..#.#.#.', '..####..', '.#.##.#.'],
    note: [
      '.....##.', '....####', '....##..', '....##..', '....##..', '..####..', '.#####..', '..###...'],
    frog: [
      '.##..##.', '#+##+##.', '########', '########', '#..##..#', '########', '.######.', '#......#'],
    monster: [
      '#..##..#', '##.##.##', '########', '#+####+#', '########', '##.##.##', '.######.', '#.#..#.#'],
    orb: [
      '..####..', '.#+###+.', '#++#####', '#+######', '########', '########', '.######.', '..####..'],
    sparkle: [
      '...##...', '...##...', '.#.##.#.', '########', '########', '.#.##.#.', '...##...', '...##...'],
    hand: [
      '..#.#...', '..#.#.#.', '.##.#.#.', '.#####..', '######..', '.#####..', '..####..', '...###..'],
    heart: [
      '.##..##.', '########', '########', '########', '.######.', '..####..', '...##...', '........'],
    check: [
      '.......#', '......##', '.....##.', '#...##..', '##.##...', '.###....', '..#.....', '........'],
    close: [
      '##....##', '.##..##.', '..####..', '...##...', '...##...', '..####..', '.##..##.', '##....##'],
    reroll: [
      '..#####.', '.#.....#', '#.....##', '#....###', '#.......', '#.....#.', '.#...#..', '..###...'],
  };

  // ------------------------------------------------------------------
  // Per-animal themes: each Familiar has its own home / quests / shop glyphs and an emblem stamped onto a
  // shared book and coin (ported from the other prototype's icons.ts). 9x9 grids: 'o' ink outline,
  // 'a' accent and 'f' light, coloured from the animal's palette. Icons.setTheme(id) switches them on.
  // ------------------------------------------------------------------
  const stamp = e => e.map(r => [...r].map(c => (c === 'a' ? 'f' : c === 'f' ? 'o' : 'a')).join(''));
  const coin = e => ['..ooooo..', '.oaaaaao.', ...stamp(e).map(r => `oa${r}ao`), '.oaaaaao.', '..ooooo..'];
  const book = e => ['.oooooooo', 'oaaaaaaao', ...stamp(e).map(r => `oa${r}ao`), 'offfffffo', 'ooooooooo'];
  const set = (emblem, home, quests, shop) => ({ home, quests, shop, book: book(emblem), coin: coin(emblem) });

  const THEMES = {
    axolotl: set(['a.a.a', 'aa.aa', '.aaa.', 'aa.aa', 'a.a.a'],
      ['...ooo...', '.ooaaaoo.', 'oaaaaaaao', 'oaaoooaao', 'oao...oao', 'oao...oao', 'offfffffo', 'ofafafafo', 'ooooooooo'],
      ['.....ooo.', '....ofafo', '.oo.oaffo', 'ofao.ooo.', 'oaao.....', '.oo..ooo.', '....ofaao', '....oaaao', '.....ooo.'],
      ['...ooo...', '..oafao..', '.oafafao.', 'oafafafao', 'oafafafao', 'oaaaaaaao', '.oaaaaao.', '..ooooo..', '...ooo...']),
    cat: set(['.a.a.', 'a...a', '.aaa.', 'aaaaa', '.aaa.'],
      ['o.......o', 'oo.....oo', 'oao...oao', 'ooaoooaoo', 'oaaaaaaao', 'offfffffo', 'oaaaaaaao', 'oaaaaaaao', 'ooooooooo'],
      ['.........', '...oooo..', 'o.oaaaaao', 'ooaaaofao', 'oaaaaaaao', 'ooaaaaaao', 'o.oaaaaao', '...oooo..', '.........'],
      ['.........', '.ooooooo.', 'offfffffo', '.ooooooo.', '.oaaaaao.', '.oafffao.', '.oaaaaao.', '.ooooooo.', '.........']),
    dog: set(['aa...', 'aaa..', '.aaa.', '..aaa', '...aa'],
      ['....o....', '...oao...', '..oaaao..', '.oaaaaao.', 'ooooooooo', '.offfffo.', '.ofooofo.', '.ofo.ofo.', '.ooo.ooo.'],
      ['..ooooo..', '.oaaaaao.', 'oafaaaaao', 'oaafaaaao', 'oaaafaaao', 'oaaaafaao', 'oaaaaafao', '.oaaaaao.', '..ooooo..'],
      ['.........', '.........', '..of.fo..', '...off...', '..of.fo..', 'ooooooooo', 'oaaaaaaao', '.oaaaaao.', '..ooooo..']),
    bunny: set(['..a.a', '...a.', '.aaa.', 'aaa..', 'a....'],
      ['.........', '...ooo...', '.ooaaaoo.', 'oaaaaaaao', 'oaaoooaao', 'oaof.foao', 'oao...oao', 'oao...oao', 'ooooooooo'],
      ['......o.o', '.....oo..', '....oaao.', '...oaafo.', '..oaafo..', '.oafao...', 'oafao....', 'oao......', 'oo.......'],
      ['...ooo...', '..o...o..', '.o.....o.', 'ooooooooo', 'oafafafao', 'oaaaaaaao', 'oafafafao', '.oaaaaao.', '..ooooo..']),
    chick: set(['a.a.a', '.aaa.', 'aaaaa', '.aaa.', 'a.a.a'],
      ['...ooo...', '..offfo..', '..offfo..', '.oofffoo.', 'oafafafao', 'oaaaaaaao', 'oafafafao', '.ooooooo.', '.........'],
      ['.......oo', '......ofo', '.....ofao', '....ofao.', '...ofao..', '..ofao...', '.oaao....', 'oao......', 'oo.......'],
      ['...o.o...', '...ooo...', '..oaaao..', '.oaaaaao.', 'oaafffaao', 'oaafafaao', 'oaafffaao', 'oaaaaaaao', '.ooooooo.']),
    hamster: set(['..a..', '.afa.', '.afa.', '.afa.', '..a..'],
      ['..ooooo..', '.oaaaaao.', 'oaofffoao', 'oaf.o.fao', 'oafooofao', 'oaf.o.fao', 'oaofffoao', '.oaoooao.', 'oo.....oo'],
      ['....o....', '...oao...', '..oafao..', '..oafao..', '.oaafaao.', '.oaafaao.', '..oafao..', '...oao...', '....o....'],
      ['..ooooo..', '..offfo..', '.ooooooo.', '.oaaaaao.', '.oafafao.', '.oaafaao.', '.oafafao.', '.oaaaaao.', '.ooooooo.']),
    frog: set(['..a..', '.aaa.', 'aafaa', 'aaaaa', '.aaa.'],
      ['.........', '.........', '...ooo...', '..offfo..', '...ooo...', '.oooooo..', 'oaaaoaaao', 'oaaaaaaao', '.ooooooo.'],
      ['.........', 'oo.....oo', 'ofo...ofo', '.ofo.ofo.', '..oaaao..', '..oaaao..', '...oao...', '...oao...', '....o....'],
      ['..o...o..', '.oao.oao.', 'ooooooooo', 'oaaaaaaao', 'oaaaaaaao', 'oaaoooaao', 'oaaaaaaao', '.ooooooo.', '.........']),
    mouse: set(['....a', '...aa', '..afa', '.aaaa', 'aafaa'],
      ['ooooooooo', 'offfffffo', 'offoooffo', 'ofo...ofo', 'ofo...ofo', 'ofo...ofo', 'ofo...ofo', 'ofo...ofo', 'ooooooooo'],
      ['.........', '......oo.', '....ooao.', '..ooaaao.', '.oaafaao.', 'oaaaaafao', 'oafaaaaao', 'oaaaafaao', 'ooooooooo'],
      ['..ooo....', '.oaaao...', 'oafaaoo..', 'oaaaaaoo.', 'oaafaaaao', 'oaaaaafao', 'oafaaaaao', '.oaaaaao.', '..ooooo..']),
    duckling: set(['.aaa.', 'aaaaa', 'aaaaa', '.aaa.', '.aaa.'],
      ['.........', '...ooo...', '..offfo..', '..offfo..', 'ooaoooaoo', 'oaaaaaaao', '.oaaaaao.', '..ooooo..', '.........'],
      ['.ooooooo.', '.oaaaaao.', '.oafffao.', '.oafofao.', '.oafffao.', '.oaaaaao.', '.ofofofo.', '.offfffo.', '.ooooooo.'],
      ['..o...o..', '..oo.oo..', '.ooooooo.', '.oaaaaao.', 'oaafffaao', 'oaafafaao', 'oaafffaao', 'oaaaaaaao', '.ooooooo.']),
    pig: set(['.a.a.', 'aaaaa', 'aaaaa', '.aaa.', '..a..'],
      ['...ooo...', '..oafao..', '.oaaaaao.', 'oaaaaaaao', 'oaaoooaao', 'oaaofoaao', 'oaaofoaao', '.ooooooo.', '.........'],
      ['.ooooooo.', '.offfffo.', '.ofafafo.', '.ofaaafo.', '.offaffo.', '.offfffo.', '.ofaaafo.', '.offfffo.', '.ooooooo.'],
      ['..ooooo..', '..offfo..', '.ooooooo.', '.ofafafo.', '.oafafao.', '.ofafafo.', '.oafafao.', '.offfffo.', '.ooooooo.']),
    sheep: set(['.aa..', 'aaaa.', 'aaaaa', 'aaaaa', '.a.a.'],
      ['....o....', '...ooo...', '..ooaoo..', '.ooaaaoo.', 'ooaaaaaoo', '.offfffo.', '.offoffo.', '.offoffo.', '.ooooooo.'],
      ['..ooo....', '.o...o...', 'ooooooo.o', 'oaaaaaooo', 'oaaaaao..', 'oaffaao..', 'oaaaaao..', '.ooooo...', '.........'],
      ['.ooooooo.', '.offfffo.', '.ofaaafo.', '.ofafafo.', '.ofaaafo.', '.offfffo.', '.oaaaaao.', '.oaaaaao.', '.ooooooo.']),
    hedgehog: set(['..f..', '.aaa.', 'aa.aa', 'aaaaa', '.aaa.'],
      ['.........', '.........', '...ooo...', '..oafao..', '.oaafaao.', 'oafaaafao', 'oaafafaao', 'oaaaaaaao', 'ooooooooo'],
      ['..ooooo..', '.oafaaao.', 'oaaaafaao', 'oafaaaaao', 'ooooooooo', '...ofo...', '...ofo...', '..offfo..', '..ooooo..'],
      ['....o....', '...ooo...', '..o...o..', '.ooooooo.', 'oaaaaaaao', 'oafaafaao', 'oaaaaaaao', 'oaafaaafo', '.ooooooo.']),
    squirrel: set(['.aaa.', 'aaaaa', '.fff.', '.fff.', '..f..'],
      ['..ooooo..', '.oafafao.', 'oaaaaaaao', 'ooooooooo', '.offfffo.', '.offoffo.', '.offoffo.', '.offoffo.', '.ooooooo.'],
      ['......oo.', '....ooao.', '..ooaafo.', '.oaaafao.', '.oaafaao.', 'oaafaao..', 'oafaoo...', 'ofoo.....', 'o........'],
      ['..ooooo..', '.o.....o.', '.o.....o.', 'ooooooooo', 'oafafafao', 'oaaaaaaao', 'oafafafao', '.oaaaaao.', '..ooooo..']),
    turtle: set(['.aaa.', 'afafa', 'aaaaa', 'afafa', '.aaa.'],
      ['.........', '.........', '...ooo...', '..oaaao..', '.oaafaao.', 'oaaaaaaao', 'ooooooooo', 'f.f.f.f.f', '.f.f.f.f.'],
      ['.........', '....o....', '..ooaoo..', 'ooaaaaaoo', '..ooaoo.o', '..oaaao.o', '..oaaao.o', '...ooo..o', '........o'],
      ['....o....', '...oao...', '..oafao..', '.oaafaao.', '.oafafao.', 'oaafafaao', 'oafafafao', '.oaafaao.', '..ooooo..']),
    prairiedog: set(['aa.aa', 'aa.aa', '..a..', 'aa.aa', 'aa.aa'],
      ['.........', '...ooo...', '..oaaao..', '.oaaaaao.', 'oaaoooaao', 'oaoooooao', 'oaoooooao', 'ooooooooo', '.........'],
      ['..offfo..', '...ofo...', '...ooo...', '.oaaaaao.', '.oaoaaao.', '..oaaao..', '..oaoao..', '...oao...', '....o....'],
      ['.........', 'ooooooooo', 'oafafafao', 'ooooooooo', 'oafafafao', 'ooooooooo', '.o.....o.', '.........', '.........']),
    goat: set(['..a..', '.aaa.', '.aaa.', 'aaaaa', '..f..'],
      ['....o....', '...ofo...', '...oao...', '..oaaao..', '..oaaaoo.', '.oaaaaaao', '.oaafaaao', 'oaaaaafao', 'ooooooooo'],
      ['.ooooooo.', '.offfffo.', '.ofooofo.', '.offfffo.', '.ofooofo.', '.offfffo.', '.ofoofo..', '.offfo...', '.oooo....'],
      ['.........', '.........', 'ooooooooo', 'oafafafao', 'oaaaaaaao', 'ooooooooo', 'oafafafao', 'oaaaaaaao', 'ooooooooo']),
    redpanda: set(['..a..', '.aa..', '.aaa.', 'aafaa', '.aaa.'],
      ['....o....', '...oao...', '..oaafo..', '..oafao..', '.oaafaao.', '.oaaaaao.', 'ooooooooo', 'o.o...o.o', '.........'],
      ['...o.....', '..oao....', '..oafo...', '...oao...', '....oo...', '....oo...', '....oo...', '....oo...', '....oo...'],
      ['...ooo...', '..o.o.o..', '.ooooooo.', 'oaaaaaaao', 'oaafffaao', 'oaafafaao', 'oaaaaaaao', 'oaaaaaaao', '.ooooooo.']),
    penguin: set(['..a..', 'a.a.a', '.aaa.', 'a.a.a', '..a..'],
      ['.........', '.........', '...ooo...', '.oofffoo.', 'ofofffofo', 'offofoffo', 'ofoo.oofo', 'ofo...ofo', 'ooo...ooo'],
      ['.........', '.........', 'o.......o', 'oo.....oo', 'oaoooooao', 'oaaofoaao', 'oaoooooao', 'oo.....oo', 'o.......o'],
      ['...ooooo.', '..offffoo', '.offffoao', 'oooooofao', 'offffofao', 'offffofao', 'offffofo.', 'offffoo..', 'ooooo....']),
    fennec: set(['a...a', 'aa.aa', 'aaaaa', 'aaaaa', '.aaa.'],
      ['...o.....', '..oao....', '..oao.o..', 'o.oaooao.', 'oaoaoao..', '.oaaao...', '..oao....', 'ooooooooo', 'fffffffff'],
      ['......o..', '...o...o.', 'o...o..o.', 'oo..o..o.', 'oao.o..o.', 'oo..o..o.', 'o...o..o.', '...o...o.', '......o..'],
      ['.........', 'o.......o', 'oo.ooo.oo', 'ooaafaaoo', 'oafaaafao', 'ooaafaaoo', 'oo.ooo.oo', 'o.......o', '.........']),
    otter: set(['..a..', '.aaa.', 'afafa', 'aaaaa', '.a.a.'],
      ['....o....', '...oao...', '..oafao..', '.oafaao..', '.oafaaao.', 'oafaaaao.', 'oaaaaaaao', '.ooooooo.', '.........'],
      ['....oo...', '....ff...', '...offo..', '..offfo..', '..ofafo..', '..ofafo..', '..offfo..', '..offfo..', '..ooooo..'],
      ['.ooooooo.', 'oaaaaaaao', 'oafffffao', 'ooooooooo', 'oaaafaaao', 'oaaoooaao', 'oaaaaaaao', 'oaaaaaaao', '.ooooooo.']),
    raccoon: set(['aaaaa', 'afafa', 'aaaaa', 'a...a', '.....'],
      ['...ooo...', '.ooooooo.', 'ofafafafo', 'ooooooooo', '.oafafao.', '.oafafao.', '.oafafao.', '.oafafao.', '.ooooooo.'],
      ['..ooooo..', '..offfo..', '..ofafo..', '..offfo..', '..ofafo..', '..offfo..', '..ofofo..', '..offfo..', '..ooooo..'],
      ['..o..o...', '..ofofo..', '...o.o...', '.........', 'ooooooooo', 'ofafafafo', '.oaaaaao.', '..ooooo..', '.........']),
    capybara: set(['...ff', '.aaa.', 'aaaaa', 'aafaa', '.aaa.'],
      ['..o.o.o..', '...o.o.o.', '..o.o.o..', 'ooooooooo', 'offfffffo', 'oaaaaaaao', 'oaaaaaaao', '.ooooooo.', '.........'],
      ['.....oo..', '....ofo..', '..oooo...', '.oaaaao..', 'oaafaaao.', 'oaaaaaao.', 'oaaaaaao.', '.oaaaao..', '..oooo...'],
      ['.........', '.o.....o.', '..ooooo..', '.oaaaaao.', '.offfffo.', '.oaaaaao.', '.oaaaaao.', '.offfffo.', '..ooooo..']),
    owl: set(['..a..', '.aaa.', 'aaaaa', '.aaa.', '.a.a.'],
      ['...ooo...', '..oaao...', '.oaao....', '.oao.....', '.oao..o..', '.oaao.o.o', '..oaaoo..', '...ooo...', '.........'],
      ['ooooooooo', 'offfffffo', 'ofafffffo', 'offffaffo', 'offffffao', 'offaffffo', 'offfffffo', 'ofafffffo', 'ooooooooo'],
      ['...ooo...', '..o...o..', '.ooooooo.', '.offfffo.', '.ofaaafo.', '.ofaaafo.', '.offfffo.', '.ooooooo.', '...ooo...']),
    roadrunner: set(['...aa', '..aa.', '.aaaa', '..aa.', '.aa..'],
      ['.........', '.........', '..ooooo..', '..oaaao..', '.oaaaaaoo', 'oaaafaaao', 'ooooooooo', 'ofofofofo', 'ooooooooo'],
      ['.........', 'ooo......', '...oooo..', 'oo.oaaao.', '.o.oafaao', 'oo.oaaaao', '...oooooo', 'ooo......', '.........'],
      ['....o....', '...oao...', '..oafao..', '.oaafaao.', 'oaaafaaao', '.oaaaaao.', '..oafao..', '...oao...', '....o....']),
    armadillo: set(['.aaa.', 'aaaaa', 'fffff', 'aaaaa', 'fffff'],
      ['.........', '...ooo...', '..oaaao..', '.oaoaoao.', 'oaoaoaoao', 'oaoaoaoao', 'oaoaoaoao', 'ooooooooo', '.........'],
      ['..ooooo..', '.oaoaoao.', 'oaoaoaoao', 'oaoaoaoao', 'oaoaoaoao', 'oaoaoaoao', 'oaoaoaoao', '.oaoaoao.', '..ooooo..'],
      ['....o....', '...oao...', 'ooooaoooo', 'oaaafaaao', '.oafffao.', '..oafao..', '.oaaoaao.', 'oao...oao', 'oo.....oo']),
    snowleopard: set(['.aaa.', 'afaaa', 'aaaaa', '.aaa.', '..a..'],
      ['ooooooooo', '.oaaaaao.', '..ooooo..', '..of.fo..', '..of.fo..', '..of.fo..', '..of.fo..', '.ooooooo.', 'ooooooooo'],
      ['...ooo...', '..ofafo..', '.ofaaafo.', 'ofaafaafo', '.ofaaafo.', '..ofafo..', '...ooo...', '...o.o...', '..o...o..'],
      ['...ooo...', '..oaaao..', '.oafaaao.', 'oaafaaaao', '.oaaaaao.', '..oaaao..', '...oao...', '....o....', '.........']),
    chameleon: set(['.aaa.', 'a...a', 'a.a.a', 'a..aa', '.aa..'],
      ['...ooo...', '..oaaao..', '.oafaaao.', 'oaaafaaao', 'oaaaafaao', '.oaaaaao.', '..ooaoo..', '....o....', '....o....'],
      ['.......o.', '......ofo', '.......o.', '......o..', '....oo...', 'ooooo....', 'oaaao....', 'oaaao....', 'ooooo....'],
      ['.........', '..ooooo..', '.oaaaaao.', 'oafffffao', 'oafooofao', 'oafo.ofao', 'oao...oao', 'ooo...ooo', '.........']),
    bat: set(['a...a', 'aa.aa', 'aaaaa', 'a.a.a', '.....'],
      ['.........', 'ooooooooo', 'oaaaaaaao', 'ooooooooo', 'oao.o.oao', 'oo.....oo', 'o.......o', 'fffffffff', 'ofofofofo'],
      ['...ooo...', '..ofao...', '.ofao....', '.ofo.....', '.ofo.....', '.ofao....', '..ofao...', '...ooo...', '.........'],
      ['......oo.', '.....ooo.', '....oo...', '...oo....', '..ooo....', '.oaaoo...', 'oafaaao..', 'oaaaao...', '.oooo....']),
    jackalope: set(['a.a.a', 'a.a.a', '.aaa.', '..a..', '..a..'],
      ['....oo...', '...oaao..', '..oaaaao.', '.oaaaaaao', 'ooooooooo', 'ofofooofo', 'ofofoaofo', 'ofofooofo', 'ooooooooo'],
      ['.........', '..ooo....', 'ooooooooo', 'offfffffo', 'offoooffo', 'ofoaaaofo', 'offoooffo', 'offfffffo', 'ooooooooo'],
      ['ooooooooo', 'offfffffo', 'ofooooofo', 'ofoaaaofo', 'ofoaaaofo', 'ofooooofo', 'offfffffo', 'ofoofoofo', 'ooooooooo']),
    longhorn: set(['a...a', 'aaaaa', '.aaa.', '.aaa.', '..a..'],
      ['....o....', '...ooo...', '...oao...', '..ooooo..', '..oafao..', '..oaaao..', '..oafao..', '.ooaaaoo.', 'ooooooooo'],
      ['..ooooo..', '.o.....o.', 'o.......o', '.o.....o.', '..ooooo..', '....o....', '....o....', '...o.....', '..o......'],
      ['.........', '.........', '...ooo...', '..oaaao..', '..oaaao..', '..offfo..', 'ooooooooo', 'oaaaaaaao', '.ooooooo.']),
    grackle: set(['..aaa', '.aa..', 'aaaa.', '.aa..', '.a.a.'],
      ['..ooooo..', '..offfo..', '....o....', '....o....', '....o....', 'ooooooooo', 'oaaaaaaao', 'oafaaafao', 'ooooooooo'],
      ['o........', 'oo.......', '.ooooooo.', '.oaaaaao.', '.oafafao.', '..ooooo..', '..o...o..', '.ofo.ofo.', '..o...o..'],
      ['..o.o.o..', '..ofofo..', '..ofofo..', '.ooooooo.', '.oaaaaao.', '.oaafaao.', '.oaaaaao.', '..oaaao..', '...ooo...']),
    salamander: set(['aa.aa', '.aaa.', 'aafaa', 'aaaaa', '.aaa.'],
      ['.........', 'oooooo...', 'offfffo..', '.....o...', '.....o...', 'ooooooooo', 'oaafaaaao', 'oaaaafaao', 'ooooooooo'],
      ['.........', '.........', '.ooo.ooo.', 'oafaoafao', 'oaaoooaao', '.ooo.ooo.', '.........', '.........', '.........'],
      ['..ooooo..', '.oaaaaao.', 'oaafffaao', 'oaf...fao', 'oaf...fao', 'oaf...fao', 'oaafffaao', '.oaaaaao.', '..ooooo..']),
    hornedlizard: set(['a.a.a', 'a.a.a', 'aaaaa', 'afafa', 'aaaaa'],
      ['......ooo', '.....ofao', '......ooo', '.........', '..ooooo..', '.oaaaaao.', 'oaafaaaao', 'oaaaaafao', 'ooooooooo'],
      ['..o...o..', '...o.o...', '...ooo...', '..oaaao..', '...ooo...', '..oaaao..', '.oaaaaao.', '..oaaao..', '.o.ooo.o.'],
      ['..ooooo..', '..oaaao..', '..oafao..', '..oaaao..', '..oafao..', '..oaaaooo', '.oaaaaaao', 'oaaaaaaao', 'ooooooooo']),
  };
  // ------------------------------------------------------------------
  // Full-colour 12x12 icons (same look as the sprites: ink outline, highlight, shade). They replace the
  // old one-colour 8x8 glyphs everywhere; the colour arguments of svg() are ignored for them.
  // 'o' = ink outline, '.' = transparent, other letters come from the icon's own palette.
  // ------------------------------------------------------------------
  const INK = '#2b2140';
  const COLOR = {
    gift: { p: { a: '#FF6F9C', b: '#C9426F', c: '#FFD23F', d: '#E39A12' }, g: [
      '..oo....oo..',
      '.ocdo..odco.',
      '.occdoodcco.',
      'oooooccooooo',
      'oaaaacdaaabo',
      'oaaaacdaaabo',
      'oooooccooooo',
      '.oaaacdaabo.',
      '.oaaacdaabo.',
      '.oaaacdaabo.',
      '.obbbcdbbbo.',
      '.oooooooooo.'] },
    key: { p: { a: '#FFC247', b: '#C9922A', w: '#FFF3C4' }, g: [
      '............',
      '............',
      '............',
      '.oooo.......',
      'oawwao......',
      'oaooaoooooo.',
      'oaooaaaaaabo',
      'oaaabobbobbo',
      '.oooo.oo.oo.',
      '............',
      '............',
      '............'] },
  egg: { p: { a: '#FFE9B8', b: '#E2BE7A', c: '#FF8C42', w: '#FFFFFF' }, g: [
    '....oooo....',
    '...owwaao...',
    '..owwaaaao..',
    '..owaacaao..',
    '.oaaaccaaao.',
    '.oaaaaaaaao.',
    '.oacaaaacbo.',
    '.occaaaaabo.',
    '.oaaaaaccbo.',
    '..obaaacbo..',
    '...obbbbo...',
    '....oooo....'] },
  coin: { p: { a: '#FFC247', b: '#C9922A', c: '#E39A12', w: '#FFF3C4' }, g: [
    '...oooooo...',
    '..oaaaaaao..',
    '.oawwaaaaao.',
    'oawaaacaaabo',
    'oawaaccaaabo',
    'oaacccccabbo',
    'oaaaccccabbo',
    'oaaacaacabbo',
    'oaaaaaaaabbo',
    '.oaaaaaabbo.',
    '..obbbbbbo..',
    '...oooooo...'] },
  star: { p: { a: '#FFD23F', b: '#E39A12', w: '#FFF8D6' }, g: [
    '.....oo.....',
    '....owao....',
    '....oaao....',
    'ooooowaaoooo',
    'oaaawaaaaabo',
    '.oaaaaaaabo.',
    '..oaaaaabo..',
    '..oaaaaabo..',
    '.oaaabbaabo.',
    '.oaabooobbo.',
    'oabbo..obbbo',
    'oooo....oooo'] },
  flame: { p: { a: '#FF5A36', c: '#FFA43A', e: '#FFE680' }, g: [
    '.....o......',
    '....oao.....',
    '....oaao..o.',
    '...oaaao.oao',
    '..oaacaaooao',
    '..oaccaaaaao',
    '.oacccaacaao',
    '.oaccecccaao',
    'oaacceecccao',
    'oaaceeeecaao',
    '.oaaccccaao.',
    '..oooooooo..'] },
  pin: { p: { a: '#FF6F9C', b: '#C9426F', w: '#FFF8EA' }, g: [
    '...oooooo...',
    '..oaaaaaao..',
    '.oawaaaaabo.',
    '.oaaaooaabo.',
    '.oaaowwoabo.',
    '.oaaowwoabo.',
    '.oaaaooaabo.',
    '..oaaaaabo..',
    '...oaaabo...',
    '....oabo....',
    '.....oo.....',
    '............'] },
  home: { p: { a: '#E0533F', b: '#A8362A', c: '#FFE9B8', w: '#5AB0FF', d: '#A0582A' }, g: [
    '.....oo.....',
    '....oaao....',
    '...oaaaao...',
    '..oaaaaabo..',
    '.oaaaaaaabo.',
    'oooooooooooo',
    '.occcccccco.',
    '.ocwwcccddo.',
    '.ocwwcccddo.',
    '.occcccdddo.',
    '.occcccdddo.',
    '.oooooooooo.'] },
  village: { p: { a: '#FF6F9C', b: '#5AB0FF', c: '#FFE9B8', w: '#FFF8EA', d: '#A0582A', e: '#6FE3B1' }, g: [
    '...oo.......',
    '..oaao......',
    '.oaaaao..oo.',
    'oaaaaaaoobbo',
    'oooooooooooo',
    '.occcco.occo',
    '.owwcco.owco',
    '.owwcco.occo',
    '.occddo.oddo',
    '.occddo.oddo',
    'oooooooooooo',
    'eeeeeeeeeeee'] },
  book: { p: { a: '#7A5FD6', b: '#4E3A9E', c: '#FFC247', w: '#FFF8EA' }, g: [
    '.ooooooooo..',
    'oaaaaaaaaao.',
    'oaawaaaaaabo',
    'oaaacccaaabo',
    'oaacwwwcaabo',
    'oaaacccaaabo',
    'oaaaaaaaaabo',
    'oaaaaaaaaabo',
    'obbbbbbbbbbo',
    'owwwwwwwwwo.',
    'obbbbbbbbbbo',
    'oooooooooooo'] },
  gear: { p: { a: '#D7D1E6', b: '#8D86A3' }, g: [
    '....oooo....',
    '.oo.oaao.oo.',
    'oaaooaaooabo',
    'oaaaaaaaaabo',
    '.oaaoooaabo.',
    'ooaao..oaboo',
    'oaaao..oabbo',
    '.oaaoooaabo.',
    'oaaaaaaaabbo',
    'obaooaaoobbo',
    '.oo.obbo.oo.',
    '....oooo....'] },
  camera: { p: { a: '#5AB0FF', b: '#2F6FC4', c: '#2b2140', w: '#FFF8EA', e: '#FF6F9C' }, g: [
    '............',
    '...oooo.....',
    'oooowwoooooo',
    'oaaaaaaaaeao',
    'oaaaooooaaao',
    'oaaowwbboaao',
    'oaaowbbboabo',
    'oaaobbbboabo',
    'oaaaooooaabo',
    'obbbbbbbbbbo',
    'oooooooooooo',
    '............'] },
  mic: { p: { a: '#FF6F9C', b: '#C9426F', w: '#FFF8EA' }, g: [
    '....oooo....',
    '...oawaao...',
    '...oaaabo...',
    '...obbbbo...',
    '...oaaabo...',
    '...obbbbo...',
    '.o.oaaabo.o.',
    '.oo.oooo.oo.',
    '..oo....oo..',
    '...oooooo...',
    '.....oo.....',
    '...oooooo...'] },
  food: { p: { a: '#E8A84A', b: '#B8782A', w: '#FFF3C4', c: '#6FE3B1', d: '#7A3E1E', e: '#FFD23F' }, g: [
    '............',
    '...oooooo...',
    '..oaaaaaao..',
    '.oawaawaaao.',
    '.oaaaaaaabo.',
    '.oooooooooo.',
    '.occcccccco.',
    '.oddddddddo.',
    '.oeeeeeeeeo.',
    '.oaaaaaaabo.',
    '..oooooooo..',
    '............'] },
  chat: { p: { a: '#FFF8EA', b: '#D9CBB0', c: '#FF6F9C' }, g: [
    '............',
    '.oooooooooo.',
    'oaaaaaaaaaao',
    'oaaaaaaaaabo',
    'oaccaccaccbo',
    'oaccaccaccbo',
    'oaaaaaaaaabo',
    'obbbbbbbbbbo',
    '.ooobbooooo.',
    '...obbo.....',
    '...obo......',
    '...oo.......'] },
  tree: { p: { a: '#6FE3B1', b: '#3F8F52', w: '#C8F7DF', d: '#A0582A' }, g: [
    '....oooo....',
    '..ooaaaaoo..',
    '.oawwaaaaao.',
    '.owaaaaaabo.',
    'oaaaaaaaaabo',
    'oaaaaaaaabbo',
    '.oaaaaabbbo.',
    '..oobbbboo..',
    '....oddo....',
    '....oddo....',
    '...oddddo...',
    '...oooooo...'] },
  brush: { p: { a: '#A0582A', b: '#D7D1E6', c: '#FF6F9C', d: '#C9426F' }, g: [
    '.........oo.',
    '........oaao',
    '.......oaao.',
    '......oaao..',
    '.....oaao...',
    '....obbo....',
    '...obbbo....',
    '..occco.....',
    '.occcdo.....',
    '.occddo.....',
    'occdoo......',
    'oooo........'] },
  skull: { p: { w: '#F4EFE6', b: '#C9BFAE', e: '#FF6F9C' }, g: [
    '...oooooo...',
    '..owwwwwwo..',
    '.owwwwwwwwo.',
    '.owwwwwwwbo.',
    '.owoowwoobo.',
    '.oweowwoebo.',
    '.owwwwwwwbo.',
    '..owwoowbo..',
    '..owwwwwbo..',
    '..owowowoo..',
    '...oooooo...',
    '............'] },
  note: { p: { a: '#5AB0FF', b: '#2F6FC4', w: '#C9E5FF' }, g: [
    '....oooooooo',
    '....oaaaaaao',
    '....oaoooooo',
    '....oao...oo',
    '....oao..oao',
    '....oao..oao',
    '..oooao..oao',
    '.oawaao.ooao',
    'oaaaabooawao',
    'oaaabbooaabo',
    '.oooo..oooo.',
    '............'] },
  frog: { p: { a: '#6FE3B1', b: '#3F8F52', w: '#FFF8EA', c: '#FF6F9C' }, g: [
    '.oooo..oooo.',
    'owwooaaowwoo',
    'owoooaaoowoo',
    'oaaaaaaaaaao',
    'oaaaaaaaaabo',
    'ocaaaaaaacbo',
    'oaoaaaaaoabo',
    'oaaooooooabo',
    '.oaaaaaaabo.',
    '..obbbbbbo..',
    '.obo....obo.',
    '.oo......oo.'] },
  monster: { p: { a: '#B79CFF', b: '#7A5FD6', w: '#FFF8EA', c: '#FFD23F' }, g: [
    '.o........o.',
    'oco......oco',
    '.oaoooooobo.',
    '.oaaaaaaabo.',
    'oaawwaawwabo',
    'oaawoaawoabo',
    'oaaaaaaaaabo',
    'oaawowowoabo',
    'oaaaaaaaaabo',
    'oaaaaaaaabbo',
    'oaoaoaoabobo',
    'o.o.o.o.o.o.'] },
  orb: { p: { a: '#9B7BFF', b: '#5A3FC0', w: '#FFFFFF', c: '#6FE3B1', d: '#FFC247', e: '#A0582A' }, g: [
    '...oooooo...',
    '..oaaaaaao..',
    '.oawwaaaaao.',
    '.owaaacaabo.',
    '.oaaaccaabo.',
    '.oaaaaaabbo.',
    '..oaaabbbo..',
    '...oooooo...',
    '..oddddddo..',
    '.oeeeeeeeeo.',
    '.oooooooooo.',
    '............'] },
  sparkle: { p: { a: '#FFD23F', b: '#E39A12', w: '#FFFFFF', c: '#FF6F9C' }, g: [
    '.....oo.....',
    '.....oao..o.',
    '....oaao.oco',
    '....owao..o.',
    '.oooowaoooo.',
    'oaaawwwaaabo',
    '.oooowaoooo.',
    '....oaao....',
    '.o..oabo....',
    'oco.oabo....',
    '.o...oo.....',
    '............'] },
  hand: { p: { a: '#FFD2B0', b: '#E0A07A', c: '#FF6F9C' }, g: [
    '...o.o.o....',
    '..oaoaoao...',
    '..oaoaoao.o.',
    '..oaoaoaooao',
    '..oaaaaaoaao',
    '.ooaaaaaaabo',
    'oaoaaaaaaabo',
    'oaaaaaaaaabo',
    '.oaaaaaaabo.',
    '..oaaaaabo..',
    '...occcco...',
    '...oooooo...'] },
  heart: { p: { a: '#FF6F9C', b: '#C9426F', w: '#FFFFFF' }, g: [
    '............',
    '.oooo..oooo.',
    'oawwaooaaaao',
    'oawaaaaaaabo',
    'oaaaaaaaaabo',
    'oaaaaaaaaabo',
    '.oaaaaaaabo.',
    '..oaaaaabo..',
    '...oaaabo...',
    '....oabo....',
    '.....oo.....',
    '............'] },
  quests: { p: { a: '#F6E7C3', b: '#D9C08A', c: '#BF5700', d: '#FF6F9C' }, g: [
    '.oooooooooo.',
    'obaaaaaaaabo',
    '.obaaaaaabo.',
    '.oaccaaaao..',
    '.oaaaaaaao..',
    '.oacccaaao..',
    '.oaaaaaoooo.',
    '.oaccaaoddo.',
    '.oaaaaaoddo.',
    'obaaaaaaoob.',
    'obbbbbbbbbo.',
    '.oooooooooo.'] },
  reroll: { p: { w: '#FFF8EA', b: '#D9CBB0', c: '#FF6F9C' }, g: [
    '............',
    '.oooooooooo.',
    'owwwwwwwwwbo',
    'owccwwwwccbo',
    'owccwwwwccbo',
    'owwwwccwwwbo',
    'owwwwccwwwbo',
    'owccwwwwccbo',
    'owccwwwwccbo',
    'owwwwwwwwwbo',
    'obbbbbbbbbbo',
    '.oooooooooo.'] },
  check: { p: { a: '#6FE3B1', b: '#3F8F52' }, g: [
    '............',
    '.........ooo',
    '........oabo',
    '.......oabo.',
    'ooo...oabo..',
    'oaao.oabo...',
    '.oaaoabo....',
    '..oaabo.....',
    '...obo......',
    '....o.......',
    '............',
    '............'] },
  };

  const THEMED = ['home', 'quests', 'shop', 'book', 'coin'];
  let theme = null;   // { grids, a, f } once setTheme() ran

  // accent = body colour, or the darker marking colour when the body is near-white (bunny, sheep...)
  function setTheme(id) {
    const t = THEMES[id], an = global.Animals && global.Animals.A[id];
    if (!t || !an) { theme = null; return false; }
    const n = parseInt(an.pal.b.slice(1), 16), light = ((n >> 16 & 255) + (n >> 8 & 255) + (n & 255)) / 3 > 215;
    theme = { grids: t, a: light ? an.pal.d : an.pal.b, f: an.pal.a };
    return true;
  }

  function svg(name, size = 16, color = 'currentColor', color2 = null) {
    let g = G[name] || G.star, fill = ch => (ch === '+' ? (color2 || '#ffffff') : color);
    if (COLOR[name] && !(theme && THEMED.includes(name))) {
      const c = COLOR[name]; g = c.g; fill = ch => (ch === 'o' ? INK : c.p[ch]);
    }
    if (theme && THEMED.includes(name)) {
      g = theme.grids[name];
      const pal = { o: '#2b2140', a: theme.a, f: theme.f };
      fill = ch => pal[ch];
    }
    let rects = '';
    g.forEach((row, y) => { for (let x = 0; x < row.length; x++) {
      const ch = row[x]; if (ch === '.') continue;
      rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill(ch)}"/>`;
    } });
    return `<svg class="pxi" width="${size}" height="${size}" viewBox="0 0 ${g.length} ${g.length}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
  }

  // sanity check at load: every colour icon is 12x12 with known letters, every themed glyph is 9x9
  Object.entries(COLOR).forEach(([id, c]) => {
    if (c.g.length !== 12 || c.g.some(r => r.length !== 12 || [...r].some(ch => ch !== '.' && ch !== 'o' && !c.p[ch]))) throw new Error(`Bad colour icon: ${id}`);
  });
  Object.entries(THEMES).forEach(([id, t]) => THEMED.forEach(k => {
    if (t[k].length !== 9 || t[k].some(r => r.length !== 9)) throw new Error(`Bad icon grid: ${id}.${k}`);
  }));

  function mount(root = document) {
    root.querySelectorAll('i[data-icon]').forEach(el => {
      const size = el.dataset.size || 16;
      el.innerHTML = svg(el.dataset.icon, size, el.dataset.color || 'currentColor', el.dataset.color2 || null);
    });
  }

  global.Icons = { svg, mount, setTheme, THEMES, COLOR, names: [...new Set(Object.keys(G).concat(Object.keys(COLOR)))] };
})(window);
