/* =====================================================================
   Familiars — procedural 8-bit pet sprites
   ---------------------------------------------------------------------
   Every pet is a 16x16 grid of role characters + a palette.
   The AI never draws pixels: it only picks species / hue / hat / name.
   That keeps every pet consistent, cute and instant to render.

   Grid legend:
     .  transparent        o  outline (dark)
     b  body               d  body shade (darker)     l  body highlight
     a  accent (belly / muzzle / moss)                e  eye pupil
     w  eye highlight      k  blush                   m  mouth
   Hat overlay legend:
     g gold   p pink   h purple   r red   s silver   x dark outline
   ===================================================================== */
(function (global) {
  'use strict';

  const SIZE = 16;

  // ------------------------------------------------------------------
  // Species bodies
  // ------------------------------------------------------------------
  const BODIES = {
    // Stage 1 — every Familiar hatches as a blob
    blob: [
      '................',
      '................',
      '................',
      '......oooo......',
      '....oobllboo....',
      '...obbllbbbbo...',
      '..obbbbbbbbbbo..',
      '..obbwebbbwebo..',
      '..obbeebbbeebo..',
      '..obkbbbbbbkbo..',
      '..obbbbmmbbbbo..',
      '...obbbbbbbbo...',
      '....oobbbboo....',
      '......oooo......',
      '................',
      '................',
    ],
    // Food quests → Dumpling Dragon (chubby, horns, little wings, belly)
    dragon: [
      '...oo......oo...',
      '...olo....olo...',
      '...oboooooobo...',
      '..obbbllbbbbbo..',
      '.oobbbbbbbbbboo.',
      'odbobwebbbwebodo',
      'oddbbeebbbeebddo',
      '.odbkbbbbbbkbdo.',
      '..obbbbmmbbbbo..',
      '..obbaaaaaabbo..',
      '..obbaaaaaabbo..',
      '...obbaaaabbo...',
      '....oobbbboo....',
      '..oo..oooo......',
      '.odo............',
      '..o.............',
    ],
    // Social quests → Fairy Fox (pointy ears, white muzzle, bushy tail)
    fox: [
      '..o..........o..',
      '.olo........olo.',
      '.obbo......obbo.',
      '.obdbo....obdbo.',
      '.obbbboooobbbbo.',
      '.obbbbbbbbbbbbo.',
      '..obwebbbbwebo..',
      '..obeebbbbeebo..',
      '..obkbaaaabkbo..',
      '...obaamaaabo...',
      '...obbaaaabbo...',
      '....obbbbbbo..o.',
      '....obbbbbbo.oao',
      '.....obbbbo.oabo',
      '......oooo..obbo',
      '.............oo.',
    ],
    // Outdoor quests → Moss Golem (square, rocky shade, moss patches)
    golem: [
      '................',
      '....oooooooo....',
      '...oaabbbbbaao..',
      '..obaabbbbbaabo.',
      '..obbbbbbbbbbbo.',
      '..obbwebbbbwebo.',
      '..obbeebbbbeebo.',
      '..obdbbbbbbbbdo.',
      '..obdbbmmmbbbdo.',
      '.oobbbbbbbbbbboo',
      'odbbbdbbbbbdbbdo',
      'odbbbdbbbbbdbbdo',
      'oobbbdbbbbbdbboo',
      '..obbbbooobbbbo.',
      '..oddddo.oddddo.',
      '..oooooo.oooooo.',
    ],
    // Creative quests → Night Owl (big ringed eyes, ear tufts, wings)
    owl: [
      '..oo........oo..',
      '..obo......obo..',
      '..obbooooooobbo.',
      '..obbbbbbbbbbbo.',
      '.obbwwwbbbwwwbbo',
      '.obwweewbwweewbo',
      '.obwweewbwweewbo',
      '.obbwwwbmbwwwbbo',
      'odbbbbbbbbbbbbdo',
      'odbbbaabaabbbbdo',
      'odbbaabaabaabbdo',
      'odbbbaabaabbbbdo',
      '.odbbbaabaabbdo.',
      '..obbbbbbbbbbo..',
      '...oobbbbbbo....',
      '....oo.oo.oo....',
    ],
  };

  // ------------------------------------------------------------------
  // Hats / accessories (overlay, drawn on top)
  // ------------------------------------------------------------------
  const HATS = {
    none: null,
    crown: [
      '......x..x..x...',
      '......xgxxgxxg..',
      '......xggggggx..',
      '.......xxxxxx...',
    ],
    bow: [
      '....xx....xx....',
      '...xppxxxxppx...',
      '...xpppxrpppx...',
      '....xppxxpxx....',
      '.....xx..xx.....',
    ],
    wizard: [
      '........x.......',
      '.......xhx......',
      '......xhhhx.....',
      '.....xhhhhhx....',
      '....xhhhhhhhx...',
      '...xxxxxxxxxxx..',
    ],
    sprout: [
      '.......x........',
      '......xax.......',
      '.....xaxax......',
      '......xax.......',
      '.......x........',
    ],
  };

  // row index where the top of each species' head is (hat bottom sits here)
  const HAT_ROW = { blob: 3, dragon: 3, fox: 4, golem: 1, owl: 2 };

  // ------------------------------------------------------------------
  // Palettes (HSL hue → body / shade / highlight). Rarity tints the accent.
  // ------------------------------------------------------------------
  function hsl(h, s, l) { return `hsl(${h} ${s}% ${l}%)`; }

  function makePalette(hue, rarity) {
    const sat = rarity === 'legendary' ? 85 : 70;
    return {
      o: '#2b2140',
      b: hsl(hue, sat, 72),
      d: hsl(hue, sat, 56),
      l: hsl(hue, sat, 88),
      a: rarity === 'legendary' ? '#ffd766' : hsl((hue + 40) % 360, 60, 90),
      e: '#2b2140',
      w: '#ffffff',
      k: hsl((hue + 330) % 360, 90, 78),
      m: '#2b2140',
      // hat colours
      g: '#ffcf4d', p: '#ff6f9c', h: '#8e6bff', r: '#ff5c5c', s: '#cfd8e6', x: '#2b2140',
    };
  }

  // Legendary pets shimmer: body highlight cycles slightly
  function paletteAt(pet, t) {
    const pal = makePalette(pet.hue, pet.rarity);
    if (pet.rarity === 'legendary') {
      const wob = (Math.sin(t / 250) + 1) / 2;
      pal.l = hsl((pet.hue + wob * 40) % 360, 90, 90);
    }
    return pal;
  }

  // ------------------------------------------------------------------
  // 16-bit sprite sheets (optional). When a sheet is registered for a
  // species it replaces the procedural grid. Sheet contract:
  //   rows = animations, columns = frames, every cell frameW × frameH.
  //   meta = { frameW, frameH, baseHue, anims: { idle:{row,frames,fps}, happy:{…}, eat:{…}, sad:{…} } }
  // Palette variants: ctx.filter hue-rotate(pet.hue - baseHue).
  // ------------------------------------------------------------------
  const SHEETS = {};
  function registerSheet(species, image, meta) {
    SHEETS[species] = { image, meta };
  }
  function loadSheet(species, url, meta) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { registerSheet(species, img, meta); resolve(img); };
      img.onerror = reject;
      img.src = url;
    });
  }
  function drawFromSheet(ctx, sheet, pet, x, y, px, opts) {
    const { image, meta } = sheet;
    const anim = meta.anims[opts.anim] || meta.anims.idle;
    const t = opts.t || 0;
    const frame = Math.floor(t / (1000 / (anim.fps || 6))) % anim.frames;
    const sx = frame * meta.frameW, sy = anim.row * meta.frameH;
    const w = SIZE * px, h = SIZE * px;          // sheets are drawn into the same 16-cell box
    ctx.imageSmoothingEnabled = false;
    const shift = (pet.hue || 0) - (meta.baseHue || 0);
    ctx.save();
    if (shift) ctx.filter = `hue-rotate(${shift}deg)`;
    if (opts.flip) { ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(image, sx, sy, meta.frameW, meta.frameH, 0, 0, w, h); }
    else ctx.drawImage(image, sx, sy, meta.frameW, meta.frameH, x, y, w, h);
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // Rendering
  // ------------------------------------------------------------------
  /**
   * Draw a pet into a canvas 2D context.
   * @param ctx      canvas context (imageSmoothingEnabled is forced off)
   * @param pet      { species, hue, rarity, hat }
   * @param x, y     top-left in canvas px
   * @param px       pixel size (one grid cell = px × px)
   * @param opts     { blink:boolean, t:number, flip:boolean }
   */
  // Drawn sheets are downsampled to the rarity tier resolution so "rarer = sharper" holds for them too.
  // Off by default: downsampled 80px sheets lose their outline and clash with the procedural set.
  // Set Sprites.USE_SHEETS = true to use assets/sprites/<species>.png when present.
  const TIER_CACHE = new Map();
  function drawSheetAtTier(ctx, sheet, pet, x, y, px, opts) {
    const N = global.Animals.RES[global.Animals.normRarity(pet.rarity)];
    const { image, meta } = sheet;
    const anim = meta.anims[opts.anim] || meta.anims.idle;
    const frame = Math.floor((opts.t || 0) / (1000 / (anim.fps || 6))) % anim.frames;
    const key = pet.species + "|" + N + "|" + anim.row + "|" + frame;
    let cv = TIER_CACHE.get(key);
    if (!cv) {
      cv = document.createElement("canvas"); cv.width = N; cv.height = N;
      const c = cv.getContext("2d"); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
      c.drawImage(image, frame * meta.frameW, anim.row * meta.frameH, meta.frameW, meta.frameH, 0, 0, N, N);
      // harden alpha so edges stay pixel-crisp
      const d = c.getImageData(0, 0, N, N); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0; c.putImageData(d, 0, 0);
      TIER_CACHE.set(key, cv);
    }
    const w = SIZE * px;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    if (opts.flip) { ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(cv, 0, 0, w, w); } else ctx.drawImage(cv, x, y, w, w);
    ctx.restore();
    if (opts.fx !== false) global.Animals.sparkles(ctx, global.Animals.normRarity(pet.rarity), x, y, w, opts.t || 0);
  }

  function drawPet(ctx, pet, x, y, px, opts = {}) {
    if (global.Animals && global.Animals.A[pet.species]) {
      if (SHEETS[pet.species] && api.USE_SHEETS) drawSheetAtTier(ctx, SHEETS[pet.species], pet, x, y, px, opts);
      else global.Animals.draw(ctx, pet, x, y, SIZE * px, opts);
      return;
    }
    if (SHEETS[pet.species]) { drawFromSheet(ctx, SHEETS[pet.species], pet, x, y, px, opts); return; }
    const grid = BODIES[pet.species] || BODIES.blob;
    const pal = paletteAt(pet, opts.t || 0);
    ctx.imageSmoothingEnabled = false;
    for (let r = 0; r < SIZE; r++) {
      const row = grid[r];
      for (let c = 0; c < SIZE; c++) {
        let ch = row[c];
        if (ch === '.') continue;
        if (opts.blink && (ch === 'e' || ch === 'w')) ch = 'b';
        ctx.fillStyle = pal[ch] || '#f0f';
        const cx = opts.flip ? SIZE - 1 - c : c;
        ctx.fillRect(x + cx * px, y + r * px, px, px);
      }
    }
    const hat = HATS[pet.hat];
    if (hat) {
      // hats sit on the head row of each species (between ears / horns)
      const headRow = HAT_ROW[pet.species] ?? 3;
      const hatY = headRow - hat.length + 1;
      hat.forEach((row, r) => {
        for (let c = 0; c < SIZE; c++) {
          const ch = row[c];
          if (!ch || ch === '.') continue;
          ctx.fillStyle = pal[ch] || '#f0f';
          const cx = opts.flip ? SIZE - 1 - c : c;
          ctx.fillRect(x + cx * px, y + (hatY + r) * px, px, px);
        }
      });
    }
  }

  /** Render a pet to a standalone canvas element (for lists / cards). */
  function petCanvas(pet, px = 4, opts = {}) {
    const cv = document.createElement('canvas');
    // 4 extra rows of headroom so tall hats are not clipped
    cv.width = SIZE * px; cv.height = (SIZE + 4) * px;
    cv.className = 'pixel';
    drawPet(cv.getContext('2d'), pet, 0, 4 * px, px, opts);
    return cv;
  }

  // ------------------------------------------------------------------
  // Eggs
  // ------------------------------------------------------------------
  const EGG = [
    '......oooo......',
    '.....obllbo.....',
    '....obblbbbo....',
    '...obbbbbbbbo...',
    '...obbbbbbbbo...',
    '..obbbbbbbbbbo..',
    '..obbbbbbbbbbo..',
    '..obbbbbbbbbbo..',
    '..obbbbbbbbbbo..',
    '..obbbbbbbbbbo..',
    '...obbbbbbbbo...',
    '...obbbbbbbbo...',
    '....obbbbbbo....',
    '.....oooooo.....',
    '................',
    '................',
  ];
  const EGG_CRACKS = [
    [[5, 6], [6, 7], [7, 6], [8, 7]],
    [[4, 9], [5, 10], [6, 9], [7, 10], [8, 9]],
    [[9, 4], [10, 5], [11, 4], [3, 5], [2, 6]],
  ];
  const RARITY_HUE = { common: 110, uncommon: 165, rare: 205, mythic: 275, epic: 275, legendary: 45 };

  function drawEgg(ctx, rarity, x, y, px, cracks = 0, t = 0) {
    const pet = { hue: RARITY_HUE[rarity] || 150, rarity };
    const pal = paletteAt(pet, t);
    ctx.imageSmoothingEnabled = false;
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const ch = EGG[r][c];
      if (ch === '.') continue;
      ctx.fillStyle = pal[ch];
      ctx.fillRect(x + c * px, y + r * px, px, px);
    }
    // speckles for rarity
    const spots = { legendary: 10, mythic: 8, epic: 8, rare: 5, uncommon: 3 }[rarity] || 2;
    ctx.fillStyle = pal.d;
    for (let i = 0; i < spots; i++) {
      const r = 3 + ((i * 7) % 9), c = 4 + ((i * 5) % 8);
      if (EGG[r][c] === 'b') ctx.fillRect(x + c * px, y + r * px, px, px);
    }
    ctx.fillStyle = '#2b2140';
    for (let i = 0; i < cracks && i < EGG_CRACKS.length; i++)
      EGG_CRACKS[i].forEach(([r, c]) => ctx.fillRect(x + c * px, y + r * px, px, px));
  }

  // ------------------------------------------------------------------
  // Species metadata (what the UI shows)
  // ------------------------------------------------------------------
  const SPECIES = {
    axolotl: { name: 'Axolotl',      evolvesFrom: null,       flavor: 'Small, pink, and permanently a little hungry. Every Familiar starts here.' },
    cat:     { name: 'Snack Cat',    evolvesFrom: 'food',     flavor: 'Grew round and smug from every weird menu item you dared to try.' },
    dog:     { name: 'Party Pup',    evolvesFrom: 'social',   flavor: 'Wags at strangers. Has never met a hallway it did not love.' },
    golem:   { name: 'Moss Golem',   evolvesFrom: 'outdoor',  flavor: 'Made of trail dust and sunlight. Slow, sturdy, cheerful.' },
    owl:     { name: 'Night Owl',    evolvesFrom: 'creative', flavor: 'Hatched from late-night ideas and museum tickets.' },
  };
  // natural hue of each species' art (sheets are hue-rotated relative to this)
  const BASE_HUE = { axolotl: 340, cat: 30, dog: 30, golem: 120, owl: 230 };
  // procedural fallbacks for species whose 16-bit sheet has not loaded
  BODIES.axolotl = BODIES.blob; BODIES.cat = BODIES.dragon; BODIES.dog = BODIES.fox;
  HAT_ROW.axolotl = 3; HAT_ROW.cat = 3; HAT_ROW.dog = 4;

  // default 16-bit sheet layout (assets/sprites/<species>.png, 4x4 cells of 80px)
  const SHEET_META = { frameW: 80, frameH: 80, anims: {
    idle:  { row: 0, frames: 4, fps: 5 },
    happy: { row: 1, frames: 4, fps: 8 },
    eat:   { row: 2, frames: 4, fps: 6 },
    sad:   { row: 3, frames: 4, fps: 3 },
  } };
  function loadAll(base = 'assets/sprites/', list = ['axolotl', 'cat', 'dog']) {
    return Promise.allSettled(list.map(sp => loadSheet(sp, base + sp + '.png', Object.assign({ baseHue: BASE_HUE[sp] }, SHEET_META))));
  }

  const QUEST_TYPE_TO_SPECIES = { food: 'cat', social: 'dog', outdoor: 'golem', creative: 'owl' };

  // sanity check grids at load (hackathon-proof)
  Object.entries(BODIES).forEach(([k, g]) => {
    if (g.length !== SIZE || g.some(r => r.length !== SIZE)) throw new Error('Bad sprite grid: ' + k);
  });

  const api = { USE_SHEETS: false, SIZE, BODIES, HATS, SPECIES, QUEST_TYPE_TO_SPECIES, RARITY_HUE,
    BASE_HUE, SHEET_META, makePalette, drawPet, petCanvas, drawEgg, registerSheet, loadSheet, loadAll, SHEETS };
  if (global.Animals) api.SPECIES = global.Animals.A;
  global.Sprites = api;
})(window);
