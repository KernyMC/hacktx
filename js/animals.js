/* =====================================================================
   Familiars — animal collection + shape rasterizer
   ---------------------------------------------------------------------
   Every animal is described once as a list of simple shapes (ellipses,
   polygons, rects) in a 100x100 box. The rasterizer turns that into a
   pixel sprite at a resolution that depends on RARITY:

     common 20px · uncommon 24px · rare 32px · mythic 40px · legendary 48px

   Higher tiers also unlock better pixel-art technique: more shading
   tones, dithering, coloured "sel-out" outlines, rim light, sparkles.
   So rarer pets literally look higher-fidelity.

   Drawn sprite sheets (assets/sprites/<species>.png) still win when they
   exist: sprites.js downsamples them to the same tier resolution.
   ===================================================================== */
(function (global) {
  'use strict';

  // ------------------------------------------------------------------
  // Tiers
  // ------------------------------------------------------------------
  const RARITIES = ['common', 'uncommon', 'rare', 'mythic', 'legendary'];
  const RES = { common: 20, uncommon: 24, rare: 32, mythic: 40, legendary: 48 };
  const TIER = { common: 0, uncommon: 1, rare: 2, mythic: 3, legendary: 4 };
  const RARITY_COLOR = { common: '#8fd48a', uncommon: '#6fe3b1', rare: '#5ab0ff', mythic: '#b79cff', legendary: '#ffcf4d' };
  // legacy saves used 'epic'
  const normRarity = r => (r === 'epic' ? 'mythic' : RES[r] ? r : 'common');

  // ------------------------------------------------------------------
  // Classes (habitat) — drive scenery + app theme
  // ------------------------------------------------------------------
  const CLASSES = {
    farm:    { name: 'Farm',    icon: 'home',    desc: 'Barnyard buddies. Love snacks and routines.',
               sky: ['#ffd9b0', '#fff3e0'], grass: '#b9d97a', grass2: '#8db356', accent: '#e8574a', panel2: '#ffe9cf' },
    wild:    { name: 'Wild',    icon: 'tree',    desc: 'Forest dwellers. Curious, sneaky, a bit feral.',
               sky: ['#a8d8c8', '#e6f6ef'], grass: '#6fbf73', grass2: '#3f8f52', accent: '#3f8f52', panel2: '#e3f4e4' },
    prairie: { name: 'Prairie', icon: 'flame',   desc: 'Hill Country sun-chasers. Fast and fearless.',
               sky: ['#ffc98a', '#fff0c9'], grass: '#e3c46a', grass2: '#c19a3d', accent: '#d9822b', panel2: '#fff0cc' },
    water:   { name: 'Water',   icon: 'orb',     desc: 'Pond and river folk. Chill until they are not.',
               sky: ['#9fd3ff', '#e6f6ff'], grass: '#7fd0c8', grass2: '#4aa6a6', accent: '#2f8fd8', panel2: '#e1f2ff' },
    legends: { name: 'Austin Legends', icon: 'star', desc: 'Special class. Only the rarest eggs. Keep Austin weird.',
               sky: ['#5b3f8f', '#ff9b5e'], grass: '#7a5aa8', grass2: '#4b3577', accent: '#bf5700', panel2: '#f6e3ff' },
  };

  // ------------------------------------------------------------------
  // Colour helpers
  // ------------------------------------------------------------------
  function hexToHsl(hex) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) {
      const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
    }
    return [h, s * 100, l * 100];
  }
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }
  // shade toward cool purple, highlight toward warm yellow (classic pixel-art hue shifting)
  function tone(hex, step, hueShift = 0) {
    let [h, s, l] = hexToHsl(hex);
    h += hueShift;
    if (step < 0) { h += (h > 60 && h < 250 ? 8 : -10) * -step; l -= 13 * -step; s = Math.min(100, s + 4 * -step); }
    if (step > 0) { h += (h > 60 && h < 250 ? -6 : 6) * step; l += 9 * step; s -= 4 * step; }
    return hslToRgb(h, Math.max(0, s), Math.max(4, Math.min(97, l)));
  }
  const rgbHex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');

  // ------------------------------------------------------------------
  // Shape constructors (100x100 box, y down, feet around y≈95)
  // ------------------------------------------------------------------
  const E = (x, y, rx, ry, r, o = {}) => Object.assign({ s: 'e', x, y, rx, ry, r }, o);
  const P = (pts, r, o = {}) => Object.assign({ s: 'p', pts, r }, o);
  const R = (x, y, w, h, r, o = {}) => Object.assign({ s: 'r', x, y, w, h, r }, o);

  // shared chibi pieces
  const feet = (r = 'b', y = 92) => [E(37, y, 8, 5, r), E(63, y, 8, 5, r)];
  const body = (o = {}) => [E(50, o.y || 75, o.rx || 23, o.ry || 18, o.r || 'b', { id: 'body' }),
    ...(o.belly === false ? [] : [E(50, (o.y || 75) + 4, o.brx || 13, o.bry || 11, o.br || 'a', { clip: 'body' })])];
  const head = (o = {}) => E(50, o.y || 44, o.rx || 30, o.ry || 25, o.r || 'b', { id: 'head' });
  const arms = (r = 'b', y = 74) => [E(29, y, 5, 7, r, { rot: 0.4 }), E(71, y, 5, 7, r, { rot: -0.4 })];
  const catEars = (r = 'b', inner = 'c') => [
    P([[23, 34], [26, 10], [44, 24]], r, { a: 'earL', pv: [32, 28] }), P([[77, 34], [74, 10], [56, 24]], r, { a: 'earR', pv: [68, 28] }),
    P([[28, 29], [29, 17], [38, 25]], inner, { a: 'earL', pv: [32, 28] }), P([[72, 29], [71, 17], [62, 25]], inner, { a: 'earR', pv: [68, 28] })];
  const roundEars = (r = 'b', inner = 'c', rr = 9, y = 22, dx = 26) => [
    E(50 - dx, y, rr, rr, r, { a: 'earL', pv: [50 - dx, y + 6] }), E(50 + dx, y, rr, rr, r, { a: 'earR', pv: [50 + dx, y + 6] }),
    E(50 - dx, y, rr * .55, rr * .55, inner, { a: 'earL', pv: [50 - dx, y + 6] }), E(50 + dx, y, rr * .55, rr * .55, inner, { a: 'earR', pv: [50 + dx, y + 6] })];
  const FACE = { eyes: [[39, 44], [61, 44]], nose: [50, 51], mouth: [50, 55], blush: [[30, 52], [70, 52]] };
  const face = o => Object.assign({}, FACE, o);

  // ------------------------------------------------------------------
  // The collection
  //   pal: b body · d markings · a belly/light · c extra (inner ear, beak, horns) · n nose
  //   minigame: catch | hop | memory | timing | whack | dodge | rodeo
  //   voice: ElevenLabs voice preset used for quest read-aloud
  // ------------------------------------------------------------------
  const A = {};
  function def(id, o) { A[id] = Object.assign({ id }, o); }

  // ---------- COMMON ----------
  def('axolotl', { name: 'Axolotl', rarity: 'common', cls: 'water', minigame: 'catch', voice: 'cute', starter: true,
    flavor: 'Small, pink, and permanently a little hungry. Every Familiar starts here.',
    pal: { b: '#ffb3c7', d: '#e86f9a', a: '#ffe0ea', c: '#ff6f9c', n: '#2b2140' },
    shapes: [
      E(80, 80, 13, 7, 'b', { rot: -0.5, a: 'tail', pv: [68, 82] }),
      ...feet('b'), ...body({ ry: 17 }),
      // gills: 3 fronds per side
      E(18, 30, 9, 4, 'c', { rot: 0.5, a: 'earL', pv: [26, 38] }), E(15, 41, 9, 4, 'c', { a: 'earL', pv: [26, 41] }), E(18, 52, 9, 4, 'c', { rot: -0.5, a: 'earL', pv: [26, 46] }),
      E(82, 30, 9, 4, 'c', { rot: -0.5, a: 'earR', pv: [74, 38] }), E(85, 41, 9, 4, 'c', { a: 'earR', pv: [74, 41] }), E(82, 52, 9, 4, 'c', { rot: 0.5, a: 'earR', pv: [74, 46] }),
      E(50, 45, 31, 23, 'b', { id: 'head' }),
    ],
    face: face({ eyes: [[36, 44], [64, 44]], nose: null, mouth: [50, 53] }) });

  def('cat', { name: 'Snack Cat', rarity: 'common', cls: 'farm', minigame: 'catch', voice: 'cute',
    flavor: 'Grew round and smug from every weird menu item you dared to try.',
    pal: { b: '#f4a24a', d: '#c9702a', a: '#ffe8cc', c: '#ff9fb2', n: '#ff7c95' },
    shapes: [
      E(82, 70, 5, 16, 'b', { rot: 0.5, a: 'tail', pv: [72, 84] }), E(88, 57, 5, 6, 'd', { a: 'tail', pv: [72, 84] }),
      ...feet('a'), ...body(), ...catEars(), head(),
      R(46, 19, 3, 9, 'd', { clip: 'head' }), R(38, 21, 3, 7, 'd', { clip: 'head' }), R(59, 21, 3, 7, 'd', { clip: 'head' }),
      E(50, 55, 11, 7, 'a', { clip: 'head' }),
    ], face: face({}) });

  def('dog', { name: 'Party Pup', rarity: 'common', cls: 'farm', minigame: 'timing', voice: 'hyper',
    flavor: 'Wags at strangers. Has never met a hallway it did not love.',
    pal: { b: '#e8c79a', d: '#9a6a43', a: '#fff4e2', c: '#ff7c95', n: '#2b2140' },
    shapes: [
      E(78, 72, 5, 10, 'b', { rot: 0.7, a: 'tail', pv: [70, 80] }),
      ...feet('a'), ...body(), head(),
      E(41, 40, 9, 9, 'd', { clip: 'head' }),
      E(50, 55, 13, 9, 'a', { clip: 'head' }),
      E(20, 44, 8, 15, 'd', { rot: 0.25, a: 'earL', pv: [24, 30] }), E(80, 44, 8, 15, 'd', { rot: -0.25, a: 'earR', pv: [76, 30] }),
      E(50, 61, 3, 3, 'c'),
    ], face: face({ nose: [50, 52] }) });

  def('bunny', { name: 'Clover Bun', rarity: 'common', cls: 'farm', minigame: 'hop', voice: 'cute',
    flavor: 'Hops to every quest. Has opinions about carrots.',
    pal: { b: '#f3eef6', d: '#c9bfd6', a: '#ffffff', c: '#ffa9c0', n: '#ff7c95' },
    shapes: [
      E(77, 84, 7, 6, 'a'),
      E(36, 18, 7, 18, 'b', { rot: -0.15, a: 'earL', pv: [38, 30] }), E(64, 18, 7, 18, 'b', { rot: 0.15, a: 'earR', pv: [62, 30] }),
      E(36, 18, 3.5, 13, 'c', { rot: -0.15, a: 'earL', pv: [38, 30] }), E(64, 18, 3.5, 13, 'c', { rot: 0.15, a: 'earR', pv: [62, 30] }),
      ...feet('b'), ...body(), E(50, 47, 28, 23, 'b', { id: 'head' }),
    ], face: face({ eyes: [[39, 47], [61, 47]], nose: [50, 54], mouth: [50, 58], blush: [[30, 55], [70, 55]] }) });

  def('chick', { name: 'Sunny Chick', rarity: 'common', cls: 'farm', minigame: 'catch', voice: 'hyper',
    flavor: 'Peeps at sunrise. Peeps at sunset. Peeps.',
    pal: { b: '#ffe066', d: '#f2b632', a: '#fff6bf', c: '#ff9a3c', n: '#2b2140' },
    shapes: [
      E(40, 94, 6, 3, 'c'), E(60, 94, 6, 3, 'c'),
      E(50, 58, 32, 34, 'b', { id: 'head' }), E(50, 72, 18, 16, 'a', { clip: 'head' }),
      E(20, 64, 7, 12, 'd', { rot: 0.4, a: 'wingL', pv: [24, 56] }), E(80, 64, 7, 12, 'd', { rot: -0.4, a: 'wingR', pv: [76, 56] }),
      E(46, 22, 4, 9, 'd', { rot: -0.4 }), E(54, 21, 4, 9, 'd', { rot: 0.4 }),
      P([[44, 52], [56, 52], [50, 60]], 'c'),
    ], face: face({ eyes: [[38, 46], [62, 46]], nose: null, mouth: null, blush: [[29, 54], [71, 54]] }) });

  def('hamster', { name: 'Pocket Hammy', rarity: 'common', cls: 'prairie', minigame: 'catch', voice: 'cute',
    flavor: 'Stores three snacks per cheek. Will not share.',
    pal: { b: '#f0b878', d: '#c98a4c', a: '#fff1dc', c: '#ffb3c0', n: '#ff7c95' },
    shapes: [
      ...roundEars('b', 'c', 8, 24, 24),
      E(38, 94, 6, 3, 'c'), E(62, 94, 6, 3, 'c'),
      E(50, 60, 36, 33, 'b', { id: 'head' }), E(50, 72, 24, 20, 'a', { clip: 'head' }),
      E(26, 58, 11, 10, 'a', { clip: 'head' }), E(74, 58, 11, 10, 'a', { clip: 'head' }),
      E(36, 79, 4, 4, 'c'), E(64, 79, 4, 4, 'c'),
    ], face: face({ eyes: [[38, 48], [62, 48]], nose: [50, 55], mouth: [50, 59], blush: [[26, 57], [74, 57]] }) });

  def('frog', { name: 'Puddle Frog', rarity: 'common', cls: 'water', minigame: 'hop', voice: 'chill',
    flavor: 'Thinks every puddle is a portal. Sometimes right.',
    pal: { b: '#7fd36a', d: '#4f9e48', a: '#e4f7b8', c: '#ff9fb2', n: '#2b2140' },
    shapes: [
      E(30, 92, 11, 5, 'b'), E(70, 92, 11, 5, 'b'),
      E(50, 70, 34, 24, 'b', { id: 'head' }), E(50, 80, 22, 13, 'a', { clip: 'head' }),
      E(33, 44, 12, 11, 'b'), E(67, 44, 12, 11, 'b'),
      E(36, 66, 3, 3, 'd', { clip: 'head' }), E(66, 74, 4, 3, 'd', { clip: 'head' }),
    ], face: face({ eyes: [[33, 44], [67, 44]], nose: null, mouth: [50, 64], blush: [[27, 60], [73, 60]], mouthType: 'wide' }) });

  def('mouse', { name: 'Crumb Mouse', rarity: 'common', cls: 'farm', minigame: 'whack', voice: 'cute',
    flavor: 'Tiny. Sneaky. Knows where the cheese is.',
    pal: { b: '#bfb8cc', d: '#8f86a3', a: '#ece8f2', c: '#ffa9c0', n: '#ff7c95' },
    shapes: [
      P([[70, 86], [92, 70], [94, 72], [72, 90]], 'c', { a: 'tail', pv: [70, 88] }),
      ...roundEars('b', 'c', 13, 24, 25),
      ...feet('c', 93), ...body(), head({ y: 48, rx: 27, ry: 23 }),
    ], face: face({ eyes: [[40, 48], [60, 48]], nose: [50, 55], mouth: [50, 59], blush: [[32, 56], [68, 56]] }) });

  def('duckling', { name: 'Splash Duck', rarity: 'common', cls: 'water', minigame: 'dodge', voice: 'hyper',
    flavor: 'Waddles with purpose. The purpose is bread.',
    pal: { b: '#fff1a8', d: '#e8c64a', a: '#ffffff', c: '#ff9a3c', n: '#2b2140' },
    shapes: [
      E(40, 94, 7, 3, 'c'), E(60, 94, 7, 3, 'c'),
      E(52, 74, 30, 19, 'b', { id: 'body' }), E(80, 66, 8, 5, 'b', { rot: -0.6, a: 'tail', pv: [74, 70] }),
      E(32, 74, 10, 8, 'd', { rot: 0.3, a: 'wingL', pv: [36, 68] }),
      E(46, 44, 23, 21, 'b', { id: 'head' }), E(48, 26, 3, 6, 'd'),
      E(46, 55, 13, 5, 'c'),
    ], face: face({ eyes: [[37, 42], [56, 42]], nose: null, mouth: null, blush: [[30, 50], [63, 50]] }) });

  // ---------- UNCOMMON ----------
  def('pig', { name: 'Mud Piglet', rarity: 'uncommon', cls: 'farm', minigame: 'catch', voice: 'grumpy',
    flavor: 'Rolled in every puddle on the way here. Proud of it.',
    pal: { b: '#ffb0c2', d: '#e7849e', a: '#ffd6e0', c: '#ff8aa6', n: '#b8466a' },
    shapes: [
      E(80, 72, 4, 4, 'd', { a: 'tail', pv: [76, 76] }), E(84, 68, 3, 3, 'd', { a: 'tail', pv: [76, 76] }),
      P([[22, 30], [26, 12], [40, 24]], 'd', { a: 'earL', pv: [30, 28] }), P([[78, 30], [74, 12], [60, 24]], 'd', { a: 'earR', pv: [70, 28] }),
      ...feet('d'), ...body(), head(),
      E(31, 75, 5, 6, 'a', { clip: 'body' }), E(74, 70, 4, 4, 'a', { clip: 'body' }),
      E(50, 54, 10, 7, 'c'), E(46, 54, 2, 2.5, 'n'), E(54, 54, 2, 2.5, 'n'),
    ], face: face({ eyes: [[38, 42], [62, 42]], nose: null, mouth: [50, 63], blush: [[29, 50], [71, 50]] }) });

  def('sheep', { name: 'Cloud Lamb', rarity: 'uncommon', cls: 'farm', minigame: 'timing', voice: 'chill',
    flavor: 'Mostly wool. Partly nap. Fully soft.',
    pal: { b: '#ffffff', d: '#5e5470', a: '#f1eef7', c: '#ffa9c0', n: '#2b2140' },
    shapes: [
      E(40, 94, 5, 4, 'd'), E(60, 94, 5, 4, 'd'),
      E(30, 74, 13, 12, 'b'), E(50, 80, 16, 13, 'b'), E(70, 74, 13, 12, 'b'), E(50, 66, 18, 14, 'b'),
      E(30, 34, 12, 11, 'b'), E(50, 26, 14, 12, 'b'), E(70, 34, 12, 11, 'b'), E(24, 52, 10, 10, 'b'), E(76, 52, 10, 10, 'b'),
      E(18, 46, 8, 4, 'd', { rot: 0.4, a: 'earL', pv: [26, 44] }), E(82, 46, 8, 4, 'd', { rot: -0.4, a: 'earR', pv: [74, 44] }),
      E(50, 50, 19, 18, 'd', { id: 'head' }), E(50, 34, 13, 7, 'b'),
    ], face: face({ eyes: [[42, 49], [58, 49]], nose: null, mouth: [50, 58], blush: [[36, 56], [64, 56]], eyeColor: '#ffffff', mouthColor: '#ffffff' }) });

  def('hedgehog', { name: 'Burr Hog', rarity: 'uncommon', cls: 'wild', minigame: 'whack', voice: 'grumpy',
    flavor: 'Prickly outside, absolute marshmallow inside.',
    pal: { b: '#f2d6b0', d: '#8a5a3c', a: '#fff1de', c: '#ffa9c0', n: '#2b2140' },
    shapes: [
      P([[12, 70], [14, 46], [8, 40], [20, 36], [18, 22], [30, 26], [34, 12], [44, 20], [52, 8], [58, 20], [68, 12], [72, 26], [84, 22], [82, 36], [94, 40], [86, 48], [90, 70]], 'd'),
      ...feet('b'), ...body({ rx: 22 }),
      E(50, 48, 25, 22, 'b', { id: 'head' }),
      E(33, 34, 4, 4, 'c'), E(67, 34, 4, 4, 'c'),
    ], face: face({ eyes: [[40, 47], [60, 47]], nose: [50, 55], mouth: [50, 59], blush: [[32, 55], [68, 55]] }) });

  def('squirrel', { name: 'Acorn Squirrel', rarity: 'uncommon', cls: 'wild', minigame: 'whack', voice: 'hyper',
    flavor: 'Buried a snack in 2019. Still looking.',
    pal: { b: '#d9824a', d: '#9c5128', a: '#ffe4c4', c: '#c96a3a', n: '#2b2140' },
    shapes: [
      E(82, 52, 14, 30, 'b', { rot: 0.25, a: 'tail', pv: [72, 82] }), E(84, 46, 8, 20, 'a', { rot: 0.25, a: 'tail', pv: [72, 82] }),
      P([[26, 30], [28, 8], [42, 24]], 'b', { a: 'earL', pv: [32, 28] }), P([[70, 30], [68, 8], [56, 24]], 'b', { a: 'earR', pv: [66, 28] }),
      R(27, 6, 2, 5, 'd', { a: 'earL', pv: [32, 28] }), R(67, 6, 2, 5, 'd', { a: 'earR', pv: [66, 28] }),
      ...feet('b'), ...body({ rx: 20 }), head({ rx: 26, ry: 23, y: 45 }),
      E(50, 55, 10, 7, 'a', { clip: 'head' }),
      E(50, 76, 6, 6, 'c'), E(50, 71, 6, 3, 'd'),
    ], face: face({ eyes: [[40, 44], [60, 44]], nose: [50, 52], mouth: [50, 56], blush: [[32, 52], [68, 52]] }) });

  def('turtle', { name: 'Pond Turtle', rarity: 'uncommon', cls: 'water', minigame: 'dodge', voice: 'wise',
    flavor: 'From the UT Turtle Pond. Has seen four thousand finals weeks.',
    pal: { b: '#9fd67a', d: '#5f8f3e', a: '#e6f4c8', c: '#b07a43', n: '#2b2140' },
    shapes: [
      E(26, 90, 9, 6, 'b'), E(74, 90, 9, 6, 'b'),
      E(50, 74, 36, 22, 'c', { id: 'shell' }),
      P([[50, 60], [60, 66], [60, 78], [50, 84], [40, 78], [40, 66]], 'd', { clip: 'shell' }),
      E(24, 72, 6, 6, 'd', { clip: 'shell' }), E(76, 72, 6, 6, 'd', { clip: 'shell' }), E(50, 94, 30, 4, 'a', { clip: 'shell' }),
      E(50, 42, 24, 21, 'b', { id: 'head' }),
    ], face: face({ eyes: [[41, 41], [59, 41]], nose: null, mouth: [50, 50], blush: [[34, 48], [66, 48]] }) });

  def('prairiedog', { name: 'Lookout Pup', rarity: 'uncommon', cls: 'prairie', minigame: 'whack', voice: 'hyper',
    flavor: 'Stands guard on the burrow. Screams at clouds.',
    pal: { b: '#d8a86a', d: '#a77a43', a: '#f7e1bd', c: '#ffb3c0', n: '#2b2140' },
    shapes: [
      ...feet('d', 94),
      E(50, 72, 20, 23, 'b', { id: 'body' }), E(50, 76, 12, 16, 'a', { clip: 'body' }),
      E(40, 64, 5, 8, 'b', { rot: 0.3 }), E(60, 64, 5, 8, 'b', { rot: -0.3 }),
      E(33, 25, 5, 5, 'd'), E(67, 25, 5, 5, 'd'),
      E(50, 38, 21, 19, 'b', { id: 'head' }), E(50, 47, 10, 7, 'a', { clip: 'head' }),
    ], face: face({ eyes: [[42, 36], [58, 36]], nose: [50, 44], mouth: [50, 48], blush: [[35, 44], [65, 44]] }) });

  def('goat', { name: 'Hill Goat', rarity: 'uncommon', cls: 'farm', minigame: 'timing', voice: 'grumpy',
    flavor: 'Will eat your homework. Literally.',
    pal: { b: '#f4efe6', d: '#8c7a66', a: '#ffffff', c: '#c9b28a', n: '#2b2140' },
    shapes: [
      P([[38, 26], [30, 6], [26, 10], [32, 28]], 'c'), P([[62, 26], [70, 6], [74, 10], [68, 28]], 'c'),
      E(18, 42, 11, 5, 'b', { rot: 0.3, a: 'earL', pv: [26, 40] }), E(82, 42, 11, 5, 'b', { rot: -0.3, a: 'earR', pv: [74, 40] }),
      ...feet('d'), ...body(), head({ rx: 26, ry: 24 }),
      P([[46, 64], [54, 64], [50, 76]], 'd'),
      E(50, 55, 9, 6, 'a', { clip: 'head' }),
    ], face: face({ eyes: [[40, 43], [60, 43]], nose: [50, 53], mouth: [50, 58], blush: [[31, 51], [69, 51]] }) });

  // ---------- RARE ----------
  def('redpanda', { name: 'Ember Panda', rarity: 'rare', cls: 'wild', minigame: 'memory', voice: 'cute',
    flavor: 'Fluffier than a bear, sneakier than a fox.',
    pal: { b: '#d9653b', d: '#6a2f2a', a: '#fff4ea', c: '#a8432a', n: '#2b2140' },
    shapes: [
      E(82, 66, 10, 22, 'b', { rot: 0.5, id: 'tail', a: 'tail', pv: [72, 84] }),
      R(70, 52, 30, 5, 'c', { clip: 'tail', a: 'tail', pv: [72, 84] }), R(64, 64, 30, 5, 'c', { clip: 'tail', a: 'tail', pv: [72, 84] }),
      P([[22, 32], [24, 12], [40, 22]], 'b', { a: 'earL', pv: [30, 28] }), P([[78, 32], [76, 12], [60, 22]], 'b', { a: 'earR', pv: [70, 28] }),
      P([[26, 28], [27, 17], [35, 23]], 'a', { a: 'earL', pv: [30, 28] }), P([[74, 28], [73, 17], [65, 23]], 'a', { a: 'earR', pv: [70, 28] }),
      ...feet('d'), ...body({ br: 'd', brx: 14 }), ...arms('d'), head(),
      E(31, 52, 10, 8, 'a', { clip: 'head' }), E(69, 52, 10, 8, 'a', { clip: 'head' }), E(50, 56, 9, 7, 'a', { clip: 'head' }),
      E(38, 33, 5, 3, 'a', { clip: 'head' }), E(62, 33, 5, 3, 'a', { clip: 'head' }),
      E(37, 48, 4, 7, 'c', { clip: 'head', rot: 0.4 }), E(63, 48, 4, 7, 'c', { clip: 'head', rot: -0.4 }),
    ], face: face({ eyes: [[39, 43], [61, 43]], nose: [50, 52], blush: null }) });

  def('penguin', { name: 'Tux Penguin', rarity: 'rare', cls: 'water', minigame: 'dodge', voice: 'regal',
    flavor: 'Dressed for a gala at all times. Slides into every room.',
    pal: { b: '#3c3f5c', d: '#23253a', a: '#ffffff', c: '#ffa53c', n: '#2b2140' },
    shapes: [
      E(40, 94, 8, 3, 'c'), E(60, 94, 8, 3, 'c'),
      E(18, 66, 6, 16, 'b', { rot: 0.35, a: 'wingL', pv: [24, 52] }), E(82, 66, 6, 16, 'b', { rot: -0.35, a: 'wingR', pv: [76, 52] }),
      E(50, 58, 32, 36, 'b', { id: 'head' }),
      E(50, 66, 22, 26, 'a', { clip: 'head' }), E(38, 42, 11, 10, 'a', { clip: 'head' }), E(62, 42, 11, 10, 'a', { clip: 'head' }),
      P([[45, 50], [55, 50], [50, 57]], 'c'),
    ], face: face({ eyes: [[40, 42], [60, 42]], nose: null, mouth: null, blush: [[33, 50], [67, 50]] }) });

  def('fennec', { name: 'Dune Fennec', rarity: 'rare', cls: 'prairie', minigame: 'memory', voice: 'hyper',
    flavor: 'Hears your snack wrapper from three blocks away.',
    pal: { b: '#f3d29c', d: '#c99a5c', a: '#fff7e6', c: '#ffb0b8', n: '#2b2140' },
    shapes: [
      E(80, 76, 7, 14, 'b', { rot: 0.8, a: 'tail', pv: [70, 82] }), E(88, 70, 5, 6, 'd', { a: 'tail', pv: [70, 82] }),
      P([[26, 42], [6, 2], [44, 28]], 'b', { a: 'earL', pv: [32, 34] }), P([[74, 42], [94, 2], [56, 28]], 'b', { a: 'earR', pv: [68, 34] }),
      P([[28, 36], [14, 12], [40, 29]], 'c', { a: 'earL', pv: [32, 34] }), P([[72, 36], [86, 12], [60, 29]], 'c', { a: 'earR', pv: [68, 34] }),
      ...feet('a'), ...body(), head({ y: 48, rx: 26, ry: 22 }),
      E(50, 58, 12, 8, 'a', { clip: 'head' }),
    ], face: face({ eyes: [[40, 47], [60, 47]], nose: [50, 55], mouth: [50, 59], blush: [[31, 55], [69, 55]] }) });

  def('otter', { name: 'River Otter', rarity: 'rare', cls: 'water', minigame: 'dodge', voice: 'chill',
    flavor: 'Holds hands while sleeping. Keeps a favourite rock.',
    pal: { b: '#9a6a48', d: '#6a4530', a: '#f0dcc4', c: '#b8d8ff', n: '#2b2140' },
    shapes: [
      E(80, 84, 6, 12, 'd', { rot: 1.0, a: 'tail', pv: [70, 86] }),
      E(26, 30, 5, 5, 'd'), E(74, 30, 5, 5, 'd'),
      ...feet('d'), ...body({ rx: 22 }), head({ rx: 28, ry: 23 }),
      E(50, 54, 17, 12, 'a', { clip: 'head' }),
      E(50, 74, 9, 6, 'c'), E(34, 72, 5, 6, 'b'), E(66, 72, 5, 6, 'b'),
    ], face: face({ eyes: [[39, 42], [61, 42]], nose: [50, 50], mouth: [50, 55], whiskers: true }) });

  def('raccoon', { name: 'Trash Bandit', rarity: 'rare', cls: 'wild', minigame: 'whack', voice: 'spooky',
    flavor: 'Washes everything before eating it. Including your phone.',
    pal: { b: '#9c98a8', d: '#3a364a', a: '#eceaf2', c: '#5e5a6e', n: '#2b2140' },
    shapes: [
      E(80, 66, 9, 22, 'b', { rot: 0.5, id: 'tail', a: 'tail', pv: [70, 84] }),
      R(70, 52, 30, 5, 'd', { clip: 'tail', a: 'tail', pv: [70, 84] }), R(62, 64, 30, 5, 'd', { clip: 'tail', a: 'tail', pv: [70, 84] }),
      P([[22, 32], [26, 12], [40, 24]], 'b', { a: 'earL', pv: [30, 28] }), P([[78, 32], [74, 12], [60, 24]], 'b', { a: 'earR', pv: [70, 28] }),
      P([[27, 28], [28, 18], [36, 24]], 'a', { a: 'earL', pv: [30, 28] }), P([[73, 28], [72, 18], [64, 24]], 'a', { a: 'earR', pv: [70, 28] }),
      ...feet('d'), ...body(), head(),
      E(50, 54, 13, 9, 'a', { clip: 'head' }), E(50, 33, 4, 8, 'a', { clip: 'head' }),
      P([[20, 40], [44, 38], [50, 46], [56, 38], [80, 40], [74, 50], [56, 48], [50, 50], [44, 48], [26, 50]], 'd', { clip: 'head' }),
    ], face: face({ eyes: [[38, 44], [62, 44]], nose: [50, 52], mouth: [50, 57], eyeColor: '#ffffff', blush: [[29, 55], [71, 55]] }) });

  def('capybara', { name: 'Chill Capy', rarity: 'rare', cls: 'water', minigame: 'timing', voice: 'chill',
    flavor: 'Friends with everyone. Wears a yuzu as a hat.',
    pal: { b: '#b8865a', d: '#8a5f3a', a: '#d4a87a', c: '#ffb43c', n: '#4a3226' },
    shapes: [
      ...feet('d'),
      R(22, 54, 56, 38, 'b', { id: 'body' }), E(50, 54, 28, 10, 'b'),
      E(30, 30, 5, 4, 'd'), E(70, 30, 5, 4, 'd'),
      R(24, 30, 52, 32, 'b', { id: 'head' }), E(50, 30, 26, 6, 'b'),
      E(50, 52, 16, 9, 'a'), E(45, 50, 2, 2, 'n'), E(55, 50, 2, 2, 'n'),
      E(50, 20, 9, 8, 'c'), R(49, 10, 2, 4, 'd'), E(54, 11, 4, 2, 'd', { rot: -0.4 }),
    ], face: face({ eyes: [[37, 40], [63, 40]], nose: null, mouth: [50, 57], blush: [[30, 47], [70, 47]], sleepy: true }) });

  def('owl', { name: 'Night Owl', rarity: 'rare', cls: 'wild', minigame: 'memory', voice: 'wise',
    flavor: 'Hatched from late-night ideas and museum tickets.',
    pal: { b: '#8a6ac2', d: '#5a3f8f', a: '#f4e9ff', c: '#ffcf4d', n: '#2b2140' },
    shapes: [
      E(40, 94, 6, 3, 'c'), E(60, 94, 6, 3, 'c'),
      P([[22, 30], [20, 10], [38, 22]], 'b', { a: 'earL', pv: [28, 26] }), P([[78, 30], [80, 10], [62, 22]], 'b', { a: 'earR', pv: [72, 26] }),
      E(16, 64, 8, 18, 'd', { rot: 0.25, a: 'wingL', pv: [22, 50] }), E(84, 64, 8, 18, 'd', { rot: -0.25, a: 'wingR', pv: [78, 50] }),
      E(50, 58, 34, 36, 'b', { id: 'head' }),
      E(37, 42, 13, 12, 'a', { clip: 'head' }), E(63, 42, 13, 12, 'a', { clip: 'head' }),
      E(50, 76, 18, 15, 'a', { clip: 'head', id: 'chest' }),
      P([[42, 72], [46, 76], [50, 72], [54, 76], [58, 72]], 'd', { clip: 'chest' }), P([[42, 80], [46, 84], [50, 80], [54, 84], [58, 80]], 'd', { clip: 'chest' }),
      P([[46, 50], [54, 50], [50, 58]], 'c'),
    ], face: face({ eyes: [[37, 42], [63, 42]], nose: null, mouth: null, blush: null, bigEyes: true }) });

  def('roadrunner', { name: 'Road Runner', rarity: 'rare', cls: 'prairie', minigame: 'hop', voice: 'hyper',
    flavor: 'Beep beep. Already finished your quest. Twice.',
    pal: { b: '#6f86b8', d: '#3f4f7a', a: '#e8e2f0', c: '#ff9a3c', n: '#2b2140' },
    shapes: [
      P([[64, 70], [96, 50], [98, 58], [70, 80]], 'd', { a: 'tail', pv: [66, 76] }),
      P([[40, 22], [30, 4], [46, 16], [44, 2], [54, 18]], 'd'),
      R(40, 86, 3, 10, 'c'), R(58, 86, 3, 10, 'c'),
      E(52, 72, 22, 16, 'b', { id: 'body' }), E(46, 76, 12, 10, 'a', { clip: 'body' }),
      E(64, 70, 8, 5, 'd', { clip: 'body' }), E(56, 64, 3, 2, 'a', { clip: 'body' }), E(70, 76, 3, 2, 'a', { clip: 'body' }),
      E(46, 40, 20, 18, 'b', { id: 'head' }), E(42, 48, 9, 6, 'a', { clip: 'head' }),
      P([[24, 44], [6, 50], [24, 50]], 'c'),
    ], face: face({ eyes: [[40, 38], [54, 38]], nose: null, mouth: null, blush: [[34, 46], [58, 46]] }) });

  // ---------- MYTHIC ----------
  def('armadillo', { name: 'Armored Dillo', rarity: 'mythic', cls: 'prairie', minigame: 'dodge', voice: 'cowboy',
    flavor: 'Texas state small mammal. Rolls into a ball when judged.',
    pal: { b: '#c9a6a0', d: '#8f6a66', a: '#f1ddd6', c: '#ffb0b8', n: '#2b2140' },
    shapes: [
      P([[80, 80], [96, 88], [80, 86]], 'd', { a: 'tail', pv: [78, 82] }),
      ...feet('d'),
      E(54, 70, 32, 22, 'b', { id: 'shell' }),
      R(30, 50, 3, 40, 'd', { clip: 'shell' }), R(42, 46, 3, 44, 'd', { clip: 'shell' }), R(54, 46, 3, 44, 'd', { clip: 'shell' }), R(66, 46, 3, 44, 'd', { clip: 'shell' }), R(78, 50, 3, 40, 'd', { clip: 'shell' }),
      E(54, 52, 26, 5, 'a', { clip: 'shell' }),
      P([[22, 24], [18, 6], [32, 20]], 'b', { a: 'earL', pv: [26, 24] }), P([[46, 22], [50, 4], [52, 22]], 'b', { a: 'earR', pv: [48, 24] }),
      E(36, 40, 18, 16, 'a', { id: 'head' }), P([[22, 42], [6, 52], [24, 54]], 'a'), E(7, 52, 3, 3, 'n'),
    ], face: face({ eyes: [[30, 38], [44, 38]], nose: null, mouth: [24, 50], blush: [[26, 46], [46, 46]] }) });

  def('snowleopard', { name: 'Frost Leopard', rarity: 'mythic', cls: 'wild', minigame: 'memory', voice: 'regal',
    flavor: 'Ghost of the mountains. Somehow ended up in Austin.',
    pal: { b: '#e9edf5', d: '#5c6478', a: '#ffffff', c: '#ffb0c0', n: '#ff7c95' },
    shapes: [
      E(84, 64, 8, 24, 'b', { rot: 0.4, id: 'tail', a: 'tail', pv: [74, 84] }),
      E(86, 52, 3, 3, 'd', { clip: 'tail', a: 'tail', pv: [74, 84] }), E(82, 66, 3, 3, 'd', { clip: 'tail', a: 'tail', pv: [74, 84] }), E(90, 44, 4, 4, 'd', { clip: 'tail', a: 'tail', pv: [74, 84] }),
      E(26, 24, 9, 9, 'b', { a: 'earL', pv: [28, 30] }), E(74, 24, 9, 9, 'b', { a: 'earR', pv: [72, 30] }),
      E(26, 24, 5, 5, 'c', { a: 'earL', pv: [28, 30] }), E(74, 24, 5, 5, 'c', { a: 'earR', pv: [72, 30] }),
      ...feet('a'), ...body(),
      E(34, 70, 3, 3, 'd', { clip: 'body' }), E(64, 66, 3, 3, 'd', { clip: 'body' }), E(70, 78, 3, 3, 'd', { clip: 'body' }),
      head(),
      E(30, 36, 3, 3, 'd', { clip: 'head' }), E(70, 36, 3, 3, 'd', { clip: 'head' }), E(50, 26, 3, 3, 'd', { clip: 'head' }), E(42, 30, 2, 2, 'd', { clip: 'head' }), E(58, 30, 2, 2, 'd', { clip: 'head' }),
      E(50, 55, 12, 8, 'a', { clip: 'head' }),
    ], face: face({ eyes: [[39, 44], [61, 44]], eyeColor: '#4aa6e8', whiskers: true }) });

  def('chameleon', { name: 'Prism Chameleon', rarity: 'mythic', cls: 'wild', minigame: 'memory', voice: 'spooky', shift: true,
    flavor: 'Changes colour with its mood. Its mood is always "rainbow".',
    pal: { b: '#7fd36a', d: '#3f9a6a', a: '#d8f7a8', c: '#ffcf4d', n: '#2b2140' },
    shapes: [
      E(78, 82, 10, 10, 'b', { id: 'curl' }), E(78, 82, 5, 5, 'x', { clip: 'curl' }),
      ...feet('d'),
      E(50, 72, 28, 18, 'b', { id: 'body' }), E(50, 80, 18, 8, 'a', { clip: 'body' }),
      P([[30, 58], [40, 52], [50, 58], [60, 52], [70, 58]], 'd', { clip: 'body' }),
      P([[32, 34], [50, 14], [70, 34]], 'd'),
      E(50, 44, 27, 21, 'b', { id: 'head' }),
      E(30, 44, 10, 10, 'c'), E(70, 44, 10, 10, 'c'),
    ], face: face({ eyes: [[30, 44], [70, 44]], nose: null, mouth: [50, 56], blush: [[40, 52], [60, 52]], mouthType: 'wide' }) });

  def('bat', { name: 'Congress Bat', rarity: 'mythic', cls: 'legends', minigame: 'dodge', voice: 'spooky',
    flavor: 'One of 1.5 million under the Congress Ave Bridge. The loudest one.',
    pal: { b: '#6b5a8f', d: '#3a2d5a', a: '#b6a2d8', c: '#ff9fb8', n: '#2b2140' },
    shapes: [
      P([[40, 56], [6, 30], [10, 48], [2, 56], [14, 62], [10, 74], [36, 70]], 'd', { a: 'wingL', pv: [40, 60] }),
      P([[60, 56], [94, 30], [90, 48], [98, 56], [86, 62], [90, 74], [64, 70]], 'd', { a: 'wingR', pv: [60, 60] }),
      P([[28, 34], [24, 6], [46, 26]], 'b', { a: 'earL', pv: [34, 30] }), P([[72, 34], [76, 6], [54, 26]], 'b', { a: 'earR', pv: [66, 30] }),
      P([[31, 28], [29, 14], [41, 25]], 'c', { a: 'earL', pv: [34, 30] }), P([[69, 28], [71, 14], [59, 25]], 'c', { a: 'earR', pv: [66, 30] }),
      E(42, 92, 4, 3, 'd'), E(58, 92, 4, 3, 'd'),
      E(50, 74, 16, 16, 'b', { id: 'body' }), E(50, 78, 9, 9, 'a', { clip: 'body' }),
      E(50, 46, 22, 19, 'b', { id: 'head' }),
    ], face: face({ eyes: [[42, 44], [58, 44]], nose: null, mouth: [50, 53], blush: [[35, 51], [65, 51]], fangs: true }) });

  def('jackalope', { name: 'Jackalope', rarity: 'mythic', cls: 'legends', minigame: 'hop', voice: 'cowboy',
    flavor: 'A Texas myth with antlers. Nobody believes you saw it. Now you own one.',
    pal: { b: '#c9a27a', d: '#8f6a48', a: '#fff1de', c: '#efe0c0', n: '#ff7c95' },
    shapes: [
      E(78, 84, 7, 6, 'a'),
      P([[36, 22], [26, 2], [30, 2], [36, 12], [38, 4], [42, 6], [40, 22]], 'c'), P([[64, 22], [74, 2], [70, 2], [64, 12], [62, 4], [58, 6], [60, 22]], 'c'),
      E(26, 26, 6, 15, 'b', { rot: -0.7, a: 'earL', pv: [34, 32] }), E(74, 26, 6, 15, 'b', { rot: 0.7, a: 'earR', pv: [66, 32] }),
      E(26, 26, 3, 10, 'd', { rot: -0.7, a: 'earL', pv: [34, 32] }), E(74, 26, 3, 10, 'd', { rot: 0.7, a: 'earR', pv: [66, 32] }),
      ...feet('b'), ...body(), E(50, 47, 27, 22, 'b', { id: 'head' }),
      E(50, 57, 10, 7, 'a', { clip: 'head' }),
    ], face: face({ eyes: [[40, 46], [60, 46]], nose: [50, 54], mouth: [50, 58], blush: [[31, 54], [69, 54]] }) });

  // ---------- LEGENDARY ----------
  def('longhorn', { name: 'Texas Longhorn', rarity: 'legendary', cls: 'legends', minigame: 'rodeo', voice: 'cowboy',
    flavor: 'The one and only. Hook em. Burnt orange, gold-tipped horns, absolutely unbothered.',
    pal: { b: '#c8692a', d: '#7a3a14', a: '#fff1de', c: '#f3e2bf', n: '#ffcf4d', x: '#2b2140' },
    shapes: [
      E(80, 74, 4, 12, 'd', { rot: 0.4, a: 'tail', pv: [74, 70] }), E(85, 84, 4, 5, 'd', { a: 'tail', pv: [74, 70] }),
      ...feet('d'), ...body({ rx: 25, ry: 19 }),
      // the horns: wide, curved up, dark tips
      P([[34, 30], [14, 30], [2, 22], [0, 14], [8, 20], [20, 22], [36, 22]], 'c'),
      P([[66, 30], [86, 30], [98, 22], [100, 14], [92, 20], [80, 22], [64, 22]], 'c'),
      P([[2, 22], [0, 14], [5, 18]], 'd'), P([[98, 22], [100, 14], [95, 18]], 'd'),
      E(22, 40, 9, 5, 'b', { rot: 0.4, a: 'earL', pv: [30, 38] }), E(78, 40, 9, 5, 'b', { rot: -0.4, a: 'earR', pv: [70, 38] }),
      E(50, 44, 24, 24, 'b', { id: 'head' }),
      P([[44, 22], [56, 22], [54, 48], [50, 54], [46, 48]], 'a', { clip: 'head' }),
      E(50, 60, 15, 10, 'a', { id: 'snout' }), E(45, 60, 2, 2, 'd'), E(55, 60, 2, 2, 'd'),
      E(50, 68, 4, 3, 'n', { id: 'ring' }), E(50, 68, 2, 1.5, 'x', { clip: 'ring' }),
    ], face: face({ eyes: [[39, 42], [61, 42]], nose: null, mouth: null, blush: [[33, 50], [67, 50]] }) });

  // ------------------------------------------------------------------
  // Pools + lookups
  // ------------------------------------------------------------------
  const POOL = {};
  RARITIES.forEach(r => { POOL[r] = Object.keys(A).filter(k => A[k].rarity === r && !A[k].starter); });
  // quest type → evolution target for the starter axolotl
  const EVOLVE_TO = { food: 'cat', social: 'dog', outdoor: 'turtle', creative: 'owl' };

  // ------------------------------------------------------------------
  // Rasterizer
  // ------------------------------------------------------------------
  const ROLE_SHADED = { b: 1, d: 1, a: 1, c: 1 };
  const CACHE = new Map();

  function rot(px, py, cx, cy, ang) {
    const s = Math.sin(ang), c = Math.cos(ang), dx = px - cx, dy = py - cy;
    return [cx + dx * c - dy * s, cy + dx * s + dy * c];
  }
  function animAngle(tag, anim, f) {
    const wave = [0, 1, 0, -1][f];
    if (tag === 'tail') return wave * (anim === 'happy' ? 0.35 : anim === 'sad' ? 0.05 : 0.16);
    if (tag === 'earL' || tag === 'earR') {
      const s = tag === 'earL' ? -1 : 1;
      if (anim === 'sad') return s * 0.35;
      if (anim === 'happy') return s * (f % 2 ? -0.12 : 0.05);
      return f === 3 ? s * 0.1 : 0;
    }
    if (tag === 'wingL' || tag === 'wingR') {
      const s = tag === 'wingL' ? 1 : -1;
      if (anim === 'sad') return s * 0.15;
      return s * wave * (anim === 'happy' ? 0.5 : 0.18);
    }
    return 0;
  }
  // apply animation transform to a shape, returning a test function + light function
  function prep(sh, anim, f) {
    const ang = sh.a ? animAngle(sh.a, anim, f) : 0;
    if (sh.s === 'e') {
      let x = sh.x, y = sh.y; const r0 = (sh.rot || 0) + ang;
      if (ang && sh.pv) [x, y] = rot(x, y, sh.pv[0], sh.pv[1], ang);
      const c = Math.cos(-r0), s = Math.sin(-r0);
      return { sh, local(px, py) { const dx = px - x, dy = py - y; const lx = (dx * c - dy * s) / sh.rx, ly = (dx * s + dy * c) / sh.ry; return [lx, ly]; },
        hit(px, py) { const [lx, ly] = this.local(px, py); return lx * lx + ly * ly <= 1; },
        light(px, py) { const dx = (px - x) / sh.rx, dy = (py - y) / sh.ry; return -(0.5 * dx + 0.86 * dy); } };
    }
    let pts = sh.s === 'r' ? [[sh.x, sh.y], [sh.x + sh.w, sh.y], [sh.x + sh.w, sh.y + sh.h], [sh.x, sh.y + sh.h]] : sh.pts;
    if (ang && sh.pv) pts = pts.map(p => rot(p[0], p[1], sh.pv[0], sh.pv[1], ang));
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    pts.forEach(([px, py]) => { x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); });
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hw = Math.max(1, (x1 - x0) / 2), hh = Math.max(1, (y1 - y0) / 2);
    return { sh, hit(px, py) {
      if (px < x0 || px > x1 || py < y0 || py > y1) return false;
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    }, light(px, py) { return -(0.5 * (px - cx) / hw + 0.86 * (py - cy) / hh); } };
  }

  function palette(a, rarity, opts) {
    let hueShift = 0;
    if (a.shift) hueShift = Math.floor(((opts.t || 0) / 180) % 12) * 30;   // chameleon cycles colours
    if (opts.shiny) hueShift += 160;
    const tier = TIER[rarity];
    const out = {};
    Object.entries(a.pal).forEach(([k, hex]) => {
      const sh = (k === 'n' || k === 'x') ? 0 : hueShift;
      out[k] = { 0: tone(hex, 0, sh), '-1': tone(hex, -1, sh), '-2': tone(hex, -2, sh), 1: tone(hex, tier >= 3 ? 1.2 : 1, sh) };
    });
    out.o = { 0: [43, 33, 64] };
    out.e = { 0: hexRgb((a.face && a.face.eyeColor) || '#2b2140') };
    out.w = { 0: [255, 255, 255] };
    out.k = { 0: tier >= 2 ? [255, 143, 171] : [255, 158, 184] };
    out.m = { 0: hexRgb((a.face && a.face.mouthColor) || '#2b2140') };
    out.M = { 0: [200, 60, 90] };
    out.t = { 0: [140, 200, 255] };
    out.g = { 0: [255, 215, 102] };
    return out;
  }
  function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }

  /**
   * Rasterize an animal into an N×N canvas (cached).
   * opts: { anim, t, blink, shiny }
   */
  function sprite(id, rarityIn, opts = {}) {
    const a = A[id]; if (!a) return null;
    const rarity = normRarity(rarityIn || a.rarity);
    const N = RES[rarity], tier = TIER[rarity];
    const anim = opts.anim || 'idle';
    const fps = anim === 'happy' ? 8 : anim === 'sad' ? 3 : anim === 'eat' ? 6 : 4;
    const f = Math.floor((opts.t || 0) / (1000 / fps)) % 4;
    const hueStep = a.shift ? Math.floor(((opts.t || 0) / 180) % 12) : 0;
    const key = `${id}|${rarity}|${anim}|${f}|${opts.blink ? 1 : 0}|${opts.shiny ? 1 : 0}|${hueStep}`;
    if (CACHE.has(key)) return CACHE.get(key);

    const shapes = a.shapes.map(sh => prep(sh, anim, f));
    const byId = {}; shapes.forEach(p => { if (p.sh.id) byId[p.sh.id] = p; });
    const role = new Array(N * N).fill(null), lit = new Float32Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const px = (i + 0.5) / N * 100, py = (j + 0.5) / N * 100;
      for (let s = shapes.length - 1; s >= 0; s--) {
        const p = shapes[s];
        if (!p.hit(px, py)) continue;
        if (p.sh.clip && !(byId[p.sh.clip] && byId[p.sh.clip].hit(px, py))) continue;
        if (p.sh.r === 'x') { role[j * N + i] = null; lit[j * N + i] = -9; break; }  // cut-out (holes)
        role[j * N + i] = p.sh.r; lit[j * N + i] = p.light(px, py); break;
      }
    }
    // eat anim: little chomp squash is done by the stage; here we draw the open mouth
    const at = (i, j) => (i < 0 || j < 0 || i >= N || j >= N) ? null : role[j * N + i];
    const put = (i, j, r) => { if (i >= 0 && j >= 0 && i < N && j < N) { role[j * N + i] = r; lit[j * N + i] = 0; } };
    drawFace(a, N, tier, anim, f, opts, put, at);

    // tones
    const pal = palette(a, rarity, opts);
    const img = new ImageData(N, N), d = img.data;
    const outline = new Uint8Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      if (role[j * N + i]) continue;
      if (at(i - 1, j) || at(i + 1, j) || at(i, j - 1) || at(i, j + 1)) outline[j * N + i] = 1;
    }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const k = j * N + i; let c = null;
      const r = role[k];
      if (r) {
        const P = pal[r] || pal.o; let step = 0;
        if (ROLE_SHADED[r]) {
          const L = lit[k], dith = (i + j) % 2 === 0;
          if (L < -0.42) step = -1;
          if (tier >= 2 && L < -0.3 && L >= -0.42 && dith) step = -1;
          if (tier >= 3 && L < -0.78) step = -2;
          if (tier >= 1 && L > 0.55) step = 1;
          if (tier >= 2 && L > 0.45 && L <= 0.55 && dith) step = 1;
          // internal contour between different roles (rare+): darken the lower/right side
          if (tier >= 2) { const up = at(i, j - 1), lf = at(i - 1, j); if ((up && up !== r && ROLE_SHADED[up] && r !== 'a') || (lf && lf !== r && ROLE_SHADED[lf] && r !== 'a')) step = Math.min(step, -1); }
          // legendary rim light: gold on the bottom-right silhouette edge
          if (tier >= 4 && (outline[k + 1] || (j + 1 < N && outline[k + N]))) c = pal.g[0];
        }
        if (!c) c = P[step] || P[0];
      } else if (outline[k]) {
        if (tier >= 2) {
          // sel-out: outline takes a dark version of the neighbouring colour
          const nb = at(i + 1, j) || at(i - 1, j) || at(i, j + 1) || at(i, j - 1);
          const P = pal[nb];
          c = (P && P['-2'] && ROLE_SHADED[nb]) ? mix(P['-2'], [43, 33, 64], tier >= 3 ? 0.55 : 0.7) : pal.o[0];
          if (j < N * 0.45 && tier >= 3 && ROLE_SHADED[nb]) c = mix(P['-1'], [43, 33, 64], 0.45);   // softer top edge
        } else c = pal.o[0];
      }
      if (c) { d[k * 4] = c[0]; d[k * 4 + 1] = c[1]; d[k * 4 + 2] = c[2]; d[k * 4 + 3] = 255; }
    }
    const cv = document.createElement('canvas'); cv.width = N; cv.height = N;
    cv.getContext('2d').putImageData(img, 0, 0);
    if (CACHE.size > 1500) CACHE.clear();
    CACHE.set(key, cv);
    return cv;
  }
  function mix(a, b, t) { return [0, 1, 2].map(i => Math.round(a[i] * (1 - t) + b[i] * t)); }

  function drawFace(a, N, tier, anim, f, opts, put, at) {
    const F = a.face || FACE;
    const gx = x => Math.floor(x / 100 * N), gy = y => Math.floor(y / 100 * N);
    // eye size grows with resolution
    let ew = N <= 16 ? 1 : N <= 24 ? 2 : N <= 32 ? 2 : 3, eh = N <= 16 ? 2 : N <= 20 ? 2 : N <= 32 ? 3 : 4;
    if (F.bigEyes) { ew += 1; eh += N >= 32 ? 1 : 0; }
    const blink = opts.blink || (F.sleepy && anim === 'idle' && f !== 1);
    (F.eyes || []).forEach(([x, y]) => {
      const ex = gx(x) - Math.floor((ew - 1) / 2), ey = gy(y) - Math.floor((eh - 1) / 2);
      if (F.bigEyes && N >= 24) {  // owl: ring of white around pupils
        for (let j = -1; j <= eh; j++) for (let i = -1; i <= ew; i++) put(ex + i, ey + j, 'w');
      }
      if (blink) { for (let i = 0; i < ew + (N >= 32 ? 1 : 0); i++) put(ex + i, ey + eh - 1, 'o'); return; }
      if (anim === 'happy' && N >= 24) {   // ^ ^ eyes
        put(ex, ey + 1, 'e'); for (let i = 1; i < ew; i++) put(ex + i, ey, 'e'); if (ew >= 2) put(ex + ew, ey + 1, 'e');
        return;
      }
      for (let j = 0; j < eh; j++) for (let i = 0; i < ew; i++) put(ex + i, ey + j, 'e');
      if (anim === 'sad' && N >= 24) put(ex + ew - 1, ey, at(ex + ew, ey) || 'b');   // droopy lid
      if (ew >= 2 && eh >= 2) put(ex, ey, 'w');
      if (N >= 40) put(ex + ew - 1, ey + eh - 2, 'w');
      if (anim === 'sad' && N >= 24 && x < 50) put(ex, ey + eh, 't');
    });
    if (F.nose) { const nx = gx(F.nose[0]), ny = gy(F.nose[1]); put(nx, ny, 'n'); if (N >= 32) put(nx - 1, ny, 'n'); if (N >= 40) put(nx, ny - 1, 'n'), put(nx - 1, ny - 1, 'n'); }
    if (F.mouth) {
      const mx = gx(F.mouth[0]), my = gy(F.mouth[1]);
      if (anim === 'eat' && f % 2 === 0) { put(mx - 1, my, 'M'); put(mx, my, 'M'); put(mx - 1, my + 1, 'M'); put(mx, my + 1, 'M'); }
      else if (F.mouthType === 'wide') { for (let i = -2; i <= 1; i++) put(mx + i, my, 'm'); if (N >= 32) { put(mx - 3, my - 1, 'm'); put(mx + 2, my - 1, 'm'); } }
      else if (N < 24) put(mx, my, 'm');
      else if (anim === 'sad') { put(mx - 1, my, 'm'); put(mx, my, 'm'); put(mx - 2, my + 1, 'm'); put(mx + 1, my + 1, 'm'); }
      else { put(mx - 2, my - 1, 'm'); put(mx - 1, my, 'm'); put(mx, my, 'm'); put(mx + 1, my - 1, 'm'); if (anim === 'happy') { put(mx - 1, my + 1, 'M'); put(mx, my + 1, 'M'); } }
    }
    if (F.fangs && N >= 24) { const mx = gx(F.mouth[0]), my = gy(F.mouth[1]); put(mx - 2, my + 1, 'w'); put(mx + 1, my + 1, 'w'); }
    if (F.blush) F.blush.forEach(([x, y]) => {
      const bx = gx(x), by = gy(y), bw = N < 24 ? 1 : N < 40 ? 2 : 3;
      for (let i = 0; i < bw; i++) put(bx - Math.floor(bw / 2) + i, by, 'k');
    });
    if (F.whiskers && N >= 32) {
      const ny = gy((F.nose || [50, 52])[1]);
      [[-1, 0], [-1, 2]].forEach(([dx, dy]) => { for (let i = 0; i < 3; i++) { put(gx(22) + i, ny + dy - (i === 0 ? 1 : 0) * 0, 'o'); put(gx(78) - i, ny + dy, 'o'); } });
    }
  }

  // ------------------------------------------------------------------
  // Drawing helpers for the app
  // ------------------------------------------------------------------
  /** Draw an animal into a box of `size` css px at x,y (bottom-aligned, square). */
  function draw(ctx, pet, x, y, size, opts = {}) {
    const a = A[pet.species]; if (!a) return false;
    const rarity = normRarity(pet.rarity || a.rarity);
    const cv = sprite(pet.species, rarity, Object.assign({ shiny: pet.shiny }, opts));
    ctx.save(); ctx.imageSmoothingEnabled = false;
    if (opts.flip) { ctx.translate(x + size, y); ctx.scale(-1, 1); ctx.drawImage(cv, 0, 0, size, size); }
    else ctx.drawImage(cv, x, y, size, size);
    ctx.restore();
    if (opts.fx !== false) sparkles(ctx, rarity, x, y, size, opts.t || 0);
    return true;
  }
  // mythic: drifting motes · legendary: 4-point gold twinkles
  function sparkles(ctx, rarity, x, y, size, t) {
    const tier = TIER[rarity]; if (tier < 3) return;
    const u = Math.max(1, Math.round(size / 48));
    ctx.save();
    const n = tier === 4 ? 5 : 3;
    for (let i = 0; i < n; i++) {
      const ph = (t / 900 + i / n) % 1;
      const sx = x + size * (0.12 + ((i * 37) % 76) / 100), sy = y + size * (0.85 - ph * 0.75);
      const a = Math.sin(ph * Math.PI);
      ctx.globalAlpha = a;
      if (tier === 4) {
        ctx.fillStyle = '#ffe9a3';
        ctx.fillRect(sx, sy - u * 2, u, u * 5); ctx.fillRect(sx - u * 2, sy, u * 5, u);
        ctx.fillStyle = '#fff'; ctx.fillRect(sx, sy, u, u);
      } else { ctx.fillStyle = '#d9c8ff'; ctx.fillRect(sx, sy, u * 2, u * 2); }
    }
    ctx.restore();
  }

  global.Animals = { A, RARITIES, RES, TIER, RARITY_COLOR, CLASSES, POOL, EVOLVE_TO, normRarity, sprite, draw, sparkles, hexRgb };
})(window);
