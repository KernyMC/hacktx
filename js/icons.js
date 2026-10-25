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

  // sanity check at load: every themed glyph is 9x9
  Object.entries(THEMES).forEach(([id, t]) => THEMED.forEach(k => {
    if (t[k].length !== 9 || t[k].some(r => r.length !== 9)) throw new Error(`Bad icon grid: ${id}.${k}`);
  }));

  function mount(root = document) {
    root.querySelectorAll('i[data-icon]').forEach(el => {
      const size = el.dataset.size || 16;
      el.innerHTML = svg(el.dataset.icon, size, el.dataset.color || 'currentColor', el.dataset.color2 || null);
    });
  }

  global.Icons = { svg, mount, setTheme, THEMES, names: Object.keys(G) };
})(window);
