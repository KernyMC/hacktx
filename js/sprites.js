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
  // pxl sheets (assets/sprites/manifest.json) are drawn at native resolution; a species without a sheet
  // falls back to the procedural animal. Set Sprites.USE_SHEETS = false to force procedural everywhere.
  const TIER_CACHE = new Map();
  function drawSheetAtTier(ctx, sheet, pet, x, y, px, opts) {
    const N = global.Animals.RES[global.Animals.normRarity(pet.rarity)];
    const { image, meta } = sheet;
    const anim = meta.anims[opts.anim] || meta.anims.idle;
    const frame = Math.floor((opts.t || 0) / (1000 / (anim.fps || 6))) % anim.frames;
    const key = pet.species + "|" + N + "|" + anim.row + "|" + frame + (pet.shiny ? "|s" : "");
    let cv = TIER_CACHE.get(key);
    if (!cv && meta.frameW === N) {
      // native-resolution pxl sheet: copy the cell as-is (shiny pets get a hue shift)
      cv = document.createElement("canvas"); cv.width = N; cv.height = N;
      const c = cv.getContext("2d"); c.imageSmoothingEnabled = false;
      if (pet.shiny) c.filter = "hue-rotate(160deg)";
      c.drawImage(image, frame * meta.frameW, anim.row * meta.frameH, meta.frameW, meta.frameH, 0, 0, N, N);
      TIER_CACHE.set(key, cv);
    }
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

  // ------------------------------------------------------------------
  // Evolution: the same animal, upgraded. Built from the pet's own native-resolution frame:
  // richer palette, a crown on top of the head (found by scanning the frame) and a pulsing aura
  // from its silhouette. Stage 3 = bigger crown with a gem, stronger colours, gold aura.
  // ------------------------------------------------------------------
  const CROWNS = {
    2: ['w.w.w', 'g.g.g', 'ggggg', 'yyyyy'],
    3: ['w..w..w', 'g..g..g', 'g.ggg.g', 'ggrgrgg', 'ggggggg', 'yyyyyyy'],
  };
  const EVO_CACHE = new Map();
  // returns { body, halo, pad }: canvases of (N + 2*pad)^2 native pixels; halo is the aura silhouette
  function evolvedParts(pet, stage, opts) {
    const rarity = global.Animals.normRarity(pet.rarity || global.Animals.A[pet.species].rarity);
    const N = global.Animals.RES[rarity], pad = Math.ceil(N / 5), M = N + 2 * pad;
    const anim = opts.anim || 'idle', frame = Math.floor((opts.t || 0) / 125) % 8;
    const key = [pet.species, rarity, stage, anim, frame, opts.flip ? 1 : 0, opts.blink ? 1 : 0, pet.shiny ? 1 : 0].join('|');
    let parts = EVO_CACHE.get(key);
    if (parts) return parts;

    const body = document.createElement('canvas'); body.width = body.height = M;
    const b = body.getContext('2d'); b.imageSmoothingEnabled = false;
    // a redrawn "<species>_2" sheet is the base when there is one (it already wears its own crown)
    const own = !!(SHEETS[pet.species + '_2'] && api.USE_SHEETS);
    drawPet(b, Object.assign({}, pet, { stage: own ? 2 : 1 }), pad, pad, N / SIZE, Object.assign({}, opts, { fx: false }));
    // richer palette: push every pixel away from its grey (works where ctx.filter does not, e.g. older Safari)
    const img = b.getImageData(0, 0, M, M), d = img.data, sat = stage >= 3 ? 1.55 : 1.3;
    let top = M, left = M, right = -1;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const m = (d[i] + d[i + 1] + d[i + 2]) / 3;
      for (let k = 0; k < 3; k++) d[i + k] = Math.max(0, Math.min(255, m + (d[i + k] - m) * sat));
      const px = (i / 4) % M, py = Math.floor(i / 4 / M);
      // head top: highest opaque pixel in the middle half (skips tails and side ears)
      if (px > pad + N / 4 && px < pad + N * 3 / 4) {
        if (py < top) { top = py; left = px; right = px; } else if (py === top) right = px;
      }
    }
    b.putImageData(img, 0, 0);
    const crown = CROWNS[stage >= 3 ? 3 : 2], k = Math.max(1, Math.round(N / 20));
    const cx = Math.round((left + right) / 2 - (crown[0].length * k) / 2), cy = Math.max(0, top - crown.length * k + k);
    const cpal = { w: '#fff6c0', g: '#ffcf4d', y: '#a8661a', r: '#ff4a6a' };
    if (!own) crown.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') { b.fillStyle = cpal[ch]; b.fillRect(cx + c * k, cy + r * k, k, k); } }));

    // aura: the silhouette grown by 1-2 px, in the animal's accent (gold at stage 3)
    const sil = document.createElement('canvas'); sil.width = sil.height = M;
    const s = sil.getContext('2d'); s.drawImage(body, 0, 0);
    s.globalCompositeOperation = 'source-in';
    s.fillStyle = stage >= 3 ? '#ffcf4d' : global.Animals.A[pet.species].pal.c; s.fillRect(0, 0, M, M);
    const halo = document.createElement('canvas'); halo.width = halo.height = M;
    const h = halo.getContext('2d'), r = stage >= 3 ? 2 : 1;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx || dy) h.drawImage(sil, dx, dy);

    // native px the crown + aura reach above the normal box
    parts = { body, halo, pad, N, over: Math.max(0, pad - (own ? top : cy) + r) };
    if (EVO_CACHE.size > 400) EVO_CACHE.clear();
    EVO_CACHE.set(key, parts);
    return parts;
  }
  // draws the upgraded pet so its body fills a box of `size` css px at x,y (crown and aura spill outside it).
  // fit: shrink the body just enough that the crown stays inside the box, feet where they were (drawPet).
  function drawUpgrade(ctx, pet, stage, x, y, size, opts, fit) {
    const { body, halo, pad, N, over } = evolvedParts(pet, stage, opts), t = opts.t || 0;
    const s = fit ? size / (N + over) : size / N;
    if (fit) { x += (size - N * s) / 2; y += over * s; }
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 0.45 + 0.35 * Math.sin(t / 260);
    ctx.drawImage(halo, x - pad * s, y - pad * s, body.width * s, body.height * s);
    ctx.globalAlpha = 1;
    ctx.drawImage(body, x - pad * s, y - pad * s, body.width * s, body.height * s);
    ctx.restore();
    if (opts.fx !== false && stage >= 3) global.Animals.sparkles(ctx, 'legendary', x, y, size, t);
  }

  /**
   * An evolved animal on its own canvas, 1.5x the normal pet box (SIZE * px), with room for crown + aura.
   * stage 1 returns the plain pet at normal size. opts: { t, anim, px = 6, rarity, shiny, blink, flip }.
   * The canvas is reused per (animal, stage, px): draw it right away with ctx.drawImage.
   */
  const EVO_OUT = new Map();
  function drawEvolved(animalId, stage = 2, opts = {}) {
    const px = opts.px || 6, pet = { species: animalId, rarity: opts.rarity, shiny: opts.shiny, stage };
    const key = animalId + '|' + stage + '|' + px;
    let cv = EVO_OUT.get(key);
    if (stage < 2) {
      cv = cv || document.createElement('canvas'); cv.width = cv.height = SIZE * px;
      drawPet(cv.getContext('2d'), Object.assign(pet, { stage: 1 }), 0, 0, px, opts);
    } else {
      const size = SIZE * px * 1.5, { pad, N } = evolvedParts(pet, stage, opts), edge = Math.ceil(pad * size / N);
      cv = cv || document.createElement('canvas'); cv.width = cv.height = size + 2 * edge;
      drawUpgrade(cv.getContext('2d'), pet, stage, edge, edge, size, opts);
    }
    EVO_OUT.set(key, cv);
    return cv;
  }

  function drawPet(ctx, pet, x, y, px, opts = {}) {
    if (global.Animals && global.Animals.A[pet.species]) {
      // Evolved pets (stage >= 2) use their own "<species>_2" sheet when one exists (redrawn art);
      // otherwise the same animal upgraded in place: richer palette, crown and aura (drawUpgrade).
      const stage = pet.stage || 1, evolved = stage >= 2;
      if (evolved && !SHEETS[pet.species + '_2']) { drawUpgrade(ctx, pet, stage, x, y, SIZE * px, opts, true); return; }
      const sheetKey = evolved ? pet.species + '_2' : pet.species;
      if (SHEETS[sheetKey] && api.USE_SHEETS) drawSheetAtTier(ctx, SHEETS[sheetKey], Object.assign({}, pet, { species: sheetKey }), x, y, px, opts);
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
  // Sheets drawn with pxl (tools/pack_sprites.js writes manifest.json: { id: { cell: N } }, 4 cols × 4 rows of N×N cells).
  // Legacy 80px ChatGPT sheets are still accepted when a species is missing from the manifest.
  async function loadAll(base = 'assets/sprites/', list = []) {
    let manifest = {};
    try { const r = await fetch(base + 'manifest.json', { cache: 'no-cache' }); if (r.ok) manifest = await r.json(); } catch (e) { /* static host without manifest */ }
    const jobs = Object.entries(manifest).map(([sp, m]) => loadSheet(sp, base + sp + '.png', Object.assign({}, SHEET_META, { frameW: m.cell, frameH: m.cell, baseHue: BASE_HUE[sp] })));
    list.filter(sp => !manifest[sp]).forEach(sp => jobs.push(loadSheet(sp, base + sp + '.png', Object.assign({ baseHue: BASE_HUE[sp] }, SHEET_META))));
    return Promise.allSettled(jobs);
  }

  const QUEST_TYPE_TO_SPECIES = { food: 'cat', social: 'dog', outdoor: 'golem', creative: 'owl' };

  // sanity check grids at load (hackathon-proof)
  Object.entries(BODIES).forEach(([k, g]) => {
    if (g.length !== SIZE || g.some(r => r.length !== SIZE)) throw new Error('Bad sprite grid: ' + k);
  });

  // ------------------------------------------------------------------
  // Habitats: one low-res pixel scene per animal (HW x HH, same aspect as the 400x230 stage) that follows
  // the device clock. Ported from the other prototype's habitat.ts / habitats.ts.
  // ------------------------------------------------------------------
  const HW = 174, HH = 100;
  // dawn 5-8, day 8-17, sunset 17-20, night 20-5
  function phaseAt(hour) {
    if (hour >= 5 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 17) return 'day';
    if (hour >= 17 && hour < 20) return 'sunset';
    return 'night';
  }
  const SKY = {
    dawn: ['#6b6bb8', '#c98ac8', '#ffb8b0', '#ffd9a8'],
    day: ['#4fa8f0', '#6cc0ff', '#93d4ff', '#c4ebff'],
    sunset: ['#3e2f7a', '#a04a8a', '#ec6a6a', '#ffb36b'],
    night: ['#0c0d28', '#141640', '#1d1f55', '#2a2a6a'],
  };
  const TINT = { dawn: ['#ff9ac0', 0.18], day: ['#ffffff', 0], sunset: ['#ff7a4a', 0.28], night: ['#141a48', 0.58] };
  const hrgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  function mixHex(a, b, t) {
    const [x, y] = [hrgb(a), hrgb(b)];
    return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  // small seeded RNG so a scene looks the same on every render
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0; let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function drawRows(ctx, rows, pal, x, y) {
    rows.forEach((row, r) => { for (let c = 0; c < row.length; c++) {
      const ch = row[c]; if (ch === '.' || !pal[ch]) continue;
      ctx.fillStyle = pal[ch]; ctx.fillRect(x + c, y + r, 1, 1);
    } });
  }
  function disc(ctx, cx, cy, r, color) {
    ctx.fillStyle = color;
    for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); ctx.fillRect(cx - w, cy + y, w * 2 + 1, 1); }
  }
  function skyBands(ctx, colors) {
    const band = Math.ceil(HH / colors.length);
    for (let y = 0; y < HH; y++) {
      const i = Math.min(colors.length - 1, Math.floor(y / band)), next = colors[Math.min(colors.length - 1, i + 1)];
      const edge = (i + 1) * band - y;   // rows left before the next band
      for (let x = 0; x < HW; x++) {
        const dither = edge <= 3 && (x + y) % (edge === 1 ? 1 : edge === 2 ? 2 : 4) === 0;
        ctx.fillStyle = dither ? next : colors[i]; ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  const CLOUD = ['....wwww........', '..wwwwwwww.www..', '.wwwwwwwwwwwwww.', 'wwwwwwwwwwwwwwww', '.ssssssssssssss.'];
  function celestial(ctx, phase, skyTop) {
    const r = rng(7);
    if (phase === 'night') {
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = i % 5 === 0 ? '#fff3a8' : '#ffffff';
        const x = Math.floor(r() * HW), y = Math.floor(r() * 60);
        ctx.fillRect(x, y, 1, 1);
        if (i % 9 === 0) { ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); }
      }
      disc(ctx, 140, 16, 7, '#fff6d0'); disc(ctx, 143, 14, 6, skyTop);   // bite out of the moon
      return;
    }
    const [x, y, rad, ring, core] = { dawn: [30, 46, 8, '#ffd9a8', '#fff3d6'], day: [140, 14, 6, '#ffe066', '#fff6c0'], sunset: [140, 48, 10, '#ff9a5a', '#ffd08a'] }[phase];
    disc(ctx, x, y, rad + 2, ring); disc(ctx, x, y, rad, core);
    if (phase !== 'sunset') {
      const pal = { w: phase === 'dawn' ? '#ffe6ee' : '#ffffff', s: phase === 'dawn' ? '#e8b0c8' : '#d6e8f5' };
      drawRows(ctx, CLOUD, pal, 18, 12); drawRows(ctx, CLOUD, pal, 92, 22);
    }
  }

  // ---- props (rows + palette) ----
  const P = (rows, palette) => ({ rows, palette });
  const PR = {
    flower: P(['.p.', 'pyp', '.p.', '.g.'], { p: '#ff8fb8', y: '#fff3a8', g: '#3f7a3a' }),
    daisy: P(['.w.', 'wyw', '.w.', '.g.'], { w: '#ffffff', y: '#ffd23f', g: '#3f7a3a' }),
    bluebonnet: P(['.b.', 'bwb', 'bbb', '.g.'], { b: '#3f63c9', w: '#ffffff', g: '#3f7a3a' }),
    hibiscus: P(['r.r', '.y.', 'r.r'], { r: '#ff4a6a', y: '#ffe066' }),
    grass: P(['g.g', '.g.'], { g: '#2f6e2c' }),
    dryGrass: P(['y.y', '.y.'], { y: '#b8923a' }),
    clover: P(['g.g', '.g.', 'g.g'], { g: '#4c9a3c' }),
    spore: P(['s'], { s: '#d8ff9a' }),
    leaf: P(['oo', '.o'], { o: '#e8702a' }),
    bubble: P(['.w.', 'w.w', '.w.'], { w: '#c8f4ff' }),
    sparkle: P(['.y.', 'yWy', '.y.'], { y: '#fff3a8', W: '#ffffff' }),
    snow: P(['w'], { w: '#ffffff' }),
    pebble: P(['.oo', 'ooo'], { o: '#9a8a7a' }),
    crumb: P(['y'], { y: '#e8b060' }),
    steam: P(['w.', '.w', 'w.', '.w'], { w: '#f4f4ff' }),
    sunflower: P(['..yyy..', '.yyyyy.', 'yyobbyy', 'yybbbyy', '.yyyyy.', '..yyy..', '...g...', '..gg...', '...g...', '...gg..', '...g...', '...g...'],
      { y: '#ffd23f', o: '#6b3e26', b: '#8a5232', g: '#3f7a3a' }),
    mushroom: P(['.rrrr.', 'rwrrwr', 'rrrrrr', '..cc..', '..cc..'], { r: '#e04a3c', w: '#fff3e0', c: '#f4e3c3' }),
    burrow: P(['..oooooo..', '.oddddddo.', 'oddddddddo', 'oddddddddo'], { o: '#6b4a2a', d: '#2a1a10' }),
    mound: P(['...oooo...', '.oooddooo.', 'oooooooooo'], { o: '#b8864a', d: '#3a2414' }),
    lilypad: P(['..ggggggg..', '.ggggg.gggg', 'ggggggggggg', '.ggggggggg.'], { g: '#4c9a3c' }),
    lotus: P(['.p.p.', 'ppwpp', '.ppp.'], { p: '#ff9ac8', w: '#ffffff' }),
    reeds: P(['b...b', 'b.b.b', 'b.b.g', 'g.g.g', 'g.g.g', 'g.g.g', 'ggggg'], { b: '#6b3e26', g: '#3f7a3a' }),
    cottage: P(['......rrrrrr......', '.....rrrrrrrr..cc.', '....rrrrrrrrrr.cc.', '...rrrrrrrrrrrrrr.', '..rrrrrrrrrrrrrrrr',
      '...wwwwwwwwwwwwww.', '...wwyywwwwwwyyww.', '...wwyywwddwwyyww.', '...wwwwwwddwwwwww.', '...wwwwwwddwwwwww.'],
      { r: '#c8443c', c: '#6b3e26', w: '#f6e7c1', y: '#ffe066', d: '#6b3e26' }),
    barn: P(['.......dddd.......', '.....dddddddd.....', '...dddddddddddd...', '.dddddddddddddddd.', 'dddddddddddddddddd',
      '.rrrrrrrrrrrrrrrr.', '.rrwwrrrrrrrrwwrr.', '.rrwwrrwwwwrrwwrr.', '.rrrrrrwrrwrrrrrr.', '.rrrrrrwwwwrrrrrr.',
      '.rrrrrrwrrwrrrrrr.', '.rrrrrrwwwwrrrrrr.'], { d: '#7a2a24', r: '#c8443c', w: '#f6e7c1' }),
    coop: P(['...dddd...', '.dddddddd.', 'dddddddddd', '.wwwwwwww.', '.wwwoowww.', '.wwwoowww.', '.w......w.'],
      { d: '#8a5232', w: '#f2d9a0', o: '#3a2414' }),
    hay: P(['yyyyyyy', 'yoyyyoy', 'yyyyyyy', 'yoyyyoy', 'yyyyyyy'], { y: '#e8c24a', o: '#c79a2a' }),
    fence: P(['o..o..o..o..o..o..o..o', 'oooooooooooooooooooooo', 'o..o..o..o..o..o..o..o', 'oooooooooooooooooooooo', 'o..o..o..o..o..o..o..o'], { o: '#d9a066' }),
    chimney: P(['oooo', 'obbo', 'obbo', 'obbo', 'obbo', 'obbo'], { o: '#5b2a2a', b: '#8a3b3b' }),
    lava: P(['..yy..', '.yaay.', 'yaaaay', 'aaaaaa'], { y: '#fff09a', a: '#ff6a2a' }),
    autumnTree: P(['...oooo...', '.oooaaooo.', 'ooaaaaaaoo', 'oaaaaaaaao', '.ooaaaaoo.', '...oddo...', '....dd....', '....dd....'],
      { o: '#c0471f', a: '#f2a03d', d: '#5a2418' }),
    oak: P(['...gggggg...', '.gggggggggg.', 'gggggggllggg', 'gglggggggggg', '.gggggggggg.', '...ggtgg....', '.....t......', '.....t......', '.....t......'],
      { g: '#4f8a3a', l: '#6fae4a', t: '#5a3d26' }),
    yuzuTree: P(['...gggggg...', '.ggyggggygg.', 'gggggggggggg', 'ggggyggggyg.', '.gggggggggg.', '...ggtgg....', '.....t......', '.....t......', '.....t......'],
      { g: '#3f7a3a', y: '#ffc43c', t: '#6b4a2a' }),
    pine: P(['...g...', '..ggg..', '.ggggg.', '..ggg..', '.ggggg.', 'ggggggg', '..ggg..', '.ggggg.', 'ggggggg', '...t...', '...t...'],
      { g: '#2f6e45', t: '#5a3d26' }),
    snowPine: P(['...w...', '..www..', '.gwggg.', '..ggg..', '.wwggg.', 'ggggggg', '..wgg..', '.wwwgg.', 'ggggggg', '...t...', '...t...'],
      { g: '#2f5e4a', w: '#ffffff', t: '#5a3d26' }),
    palm: P(['gg..g.gg.', '.gggggg..', 'gg.gg.ggg', 'g..t...g.', '...t.....', '...t.....', '....t....', '....t....', '....t....', '....t....'],
      { g: '#3f9a4a', t: '#8a5a32' }),
    cactus: P(['...g...', '..ggg..', '..ggg.g', 'g.ggg.g', 'g.ggggg', 'ggggg..', '..ggg..', '..ggg..', '..ggg..', '..ggg..'], { g: '#4f9e48' }),
    rock: P(['..ooo..', '.oolloo', 'ooooooo', 'ddddddd'], { o: '#8a8aa0', l: '#c0c0d0', d: '#6a6a80' }),
    bigRock: P(['....oooo....', '..ooollooo..', '.oooooloooo.', 'oooooooooooo', 'dddddddddddd'], { o: '#8a8aa0', l: '#c0c0d0', d: '#6a6a80' }),
    limestone: P(['..wwwwww...', '.wwwlwwwww.', 'wwwwwwwwwww', 'ddddddddddd'], { w: '#e8dcc0', l: '#fff4dc', d: '#b8a888' }),
    coral: P(['p...p..p', 'pp.pp.pp', '.ppp.pp.', '..pppp..', '...pp...', '...pp...'], { p: '#ff7a9a' }),
    fanCoral: P(['.oooo.', 'oyoyoo', 'oyyyyo', '.oyyo.', '..oo..', '..oo..'], { o: '#b05cff', y: '#e0b8ff' }),
    kelp: P(['g.', 'gg', '.g', 'gg', 'g.', 'gg', '.g', 'gg', 'g.', 'gg', '.g', 'gg'], { g: '#3f8a5a' }),
    shell: P(['.www.', 'wpwpw', 'wwwww'], { w: '#fff0f5', p: '#ffb3cc' }),
    pillar: P(['gggggggg', '.wwwwww.', '..wsws..', '..wsws..', '..wsws..', '..wsws..', '..wsws..', '..wsws..', '..wsws..', '..wsws..', '..wsws..', '.wwwwww.', 'gggggggg'],
      { g: '#f4c542', w: '#fff8e6', s: '#e6dcff' }),
    bigCloud: P(['.....wwwww..........', '...wwwwwwwww...www..', '..wwwwwwwwwwwwwwwww.', '.wwwwwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwwwwwww', '.ssssssssssssssssss.'],
      { w: '#ffffff', s: '#d6dcff' }),
    roofTile: P(['oooooooo', 'rrrrrrro', 'rrrrrrro'], { o: '#2a1c3a', r: '#4a3a6a' }),
    igloo: P(['....wwwwww....', '..wwswwwwsww..', '.wwwwwwwwwwww.', 'wswwwwswwwwwsw', 'wwwwwddddwwwww', 'wwwswddddwswww', 'wwwwwddddwwwww'],
      { w: '#f4f8ff', s: '#c8d8f0', d: '#3a4a6a' }),
    iceberg: P(['....ww......', '..wwwwsw....', '.wwwwwwwww..', 'wwwwswwwwwww', 'ssssssssssss'], { w: '#f4fbff', s: '#a8d0f0' }),
    trashcan: P(['.oooo.', 'oooooo', 'gggggg', 'glgglg', 'glgglg', 'glgglg', 'gggggg'], { o: '#3a4a5a', g: '#5a6a7a', l: '#8a9aaa' }),
    lamp: P(['yyy', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', 'ooo'], { y: '#ffe066', o: '#2a2a3a' }),
    bench: P(['bbbbbbbbbb', '..........', 'bbbbbbbbbb', '.o......o.', '.o......o.'], { b: '#8a5a32', o: '#3a2a1a' }),
    hydrant: P(['.rr.', 'rrrr', '.rr.', 'rrrr', '.rr.', '.rr.'], { r: '#e04a3c' }),
    foodTruck: P(['wwwwwwwwwwwwwww.....', 'wddddddddddddddw....', 'wdyyyyyyyyyyydwwww..', 'wdyyyyyyyyyyydwbbww.', 'wddddddddddddddwbbww',
      'wwwwwwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwwwwwww', '..oo..........oo....', '..oo..........oo....'],
      { w: '#f6f0e0', d: '#ff6f9c', y: '#ffe9a3', b: '#7ab8e8', o: '#2a2a3a' }),
    cheese: P(['....y', '..yyy', '.yoyy', 'yyyyy', 'yyoyy'], { y: '#ffd23f', o: '#e0a020' }),
    hole: P(['.oooo.', 'oddddo', 'oddddo', 'oddddo'], { o: '#6b4a3a', d: '#1a1010' }),
    window: P(['oooooooooo', 'osssosssso', 'osssosssso', 'oooooooooo', 'osssosssso', 'osssosssso', 'oooooooooo'], { o: '#8a5a32', s: '#9fd3ff' }),
    shelf: P(['yy.rr.bbb.yy', 'yy.rr.bbb.yy', 'oooooooooooo'], { y: '#ffd23f', r: '#e04a3c', b: '#7ab8e8', o: '#6b4a2a' }),
    books: P(['r.bb.g', 'rybbyg', 'rybbyg', 'rrbbgg', 'oooooo'], { r: '#c8443c', b: '#3f63c9', g: '#3f8a5a', y: '#ffe066', o: '#5a3d26' }),
    lantern: P(['.o.', 'yyy', 'yyy', '.o.'], { o: '#2a2a3a', y: '#ffe066' }),
    campfire: P(['..y..', '.yay.', 'yaaay', 'oo.oo'], { y: '#fff09a', a: '#ff6a2a', o: '#6b3e26' }),
    windmill: P(['....o....', 'o...o...o', '.o..o..o.', '..o.o.o..', 'ooooooooo', '..o.o.o..', '.o.ooo.o.', 'o...o...o', '...o.o...', '...o.o...',
      '..o...o..', '..o...o..', '.o.....o.', '.o.....o.'], { o: '#4a4a5a' }),
    tower: P(['....y....', '...ooo...', '...owo...', '..ooooo..', '..owwwo..', '..owowo..', '..owwwo..', '..owowo..', '..owwwo..', '.ooooooo.',
      '.owwwwwo.', '.owowowo.', '.owwwwwo.', '.owowowo.', '.owwwwwo.', 'ooooooooo', 'owwwwwwwo', 'owowowowo', 'owwwwwwwo'],
      { o: '#b8946a', w: '#f0dcb4', y: '#ffcf4d' }),
    bamboo: P(Array.from({ length: 44 }, (_, i) => (i % 7 === 0 ? 'ddd' : i % 7 === 3 ? 'gggl' : '.gl')), { g: '#5aa04a', l: '#8ad06a', d: '#3f7a3a' }),
    vine: P(Array.from({ length: 34 }, (_, i) => (i % 4 === 0 ? 'gg.' : i % 4 === 2 ? '.gg' : '.g.')), { g: '#2f7a3a' }),
    bigLeaf: P(['..gg..', '.gggg.', 'gglggg', '.gggg.', '..gg..', '...g..'], { g: '#2f8a3a', l: '#6fce5a' }),
    wheelTrack: P(['ffffffffffff'], { f: '#c9a070' }),
    ladderRail: P(['o.....o', 'ooooooo', 'o.....o', 'o.....o', 'ooooooo', 'o.....o'], { o: '#8a5a32' }),
    seed: P(['.o.', 'oso', '.o.'], { o: '#2a2a2a', s: '#f4f4f4' }),
    bread: P(['.yy.', 'yyyy'], { y: '#e8b060' }),
    apple: P(['.g.', 'rrr', 'rrr', '.r.'], { g: '#3f7a3a', r: '#e04a3c' }),
    acorn: P(['.oo.', 'oooo', '.aa.', '.aa.'], { o: '#6b3e26', a: '#c98a4c' }),
    carrot: P(['g.g', '.g.', 'ooo', '.o.', '.o.'], { g: '#3f9a4a', o: '#ff8a2a' }),
    guitar: P(['....oo', '...oo.', '..oo..', '.rrr..', 'rrwrr.', 'rrrr..', '.rr...'], { o: '#3a2a1a', r: '#bf5700', w: '#2a1a10' }),
    skull: P(['.www.', 'wkwkw', 'wwwww', '.w.w.'], { w: '#f6f0e0', k: '#2a2a3a' }),
    flag: P(['ooooooo', 'owwwbbo', 'owwwbbo', 'orrrrro', 'orrrrro', 'o......', 'o......', 'o......', 'o......'],
      { o: '#4a4a5a', w: '#ffffff', b: '#2a4a9a', r: '#c8443c' }),
  };

  // ---- layer helpers ----
  const S = (p, x, y, glow) => Object.assign({ kind: 'sprite', x, y, glow }, PR[p]);
  const SC = (p, y0, y1, count, seed, glow) => Object.assign({ kind: 'scatter', y0, y1, count, seed, glow }, PR[p]);
  const HL = (color, y, amp, freq, seed) => ({ kind: 'hills', color, y, amp, freq, seed });
  const RC = (color, x, y, w, h) => ({ kind: 'rect', color, x, y, w, h });
  const BL = (color, x, y, r) => ({ kind: 'blob', color, x, y, r });
  const WA = (color, y) => ({ kind: 'water', color, y });
  const LIGHTS = (y, sag) => ({ kind: 'lights', y, sag });
  const INDOOR = { dawn: ['#e8c8a8', '#e8c8a8', '#dcb898', '#dcb898'], day: ['#f6dcb4', '#f6dcb4', '#ecd0a4', '#ecd0a4'],
    sunset: ['#e8b890', '#e8b890', '#dca880', '#dca880'], night: ['#6a5070', '#6a5070', '#5a4462', '#5a4462'] };
  const WATER_SKY = { dawn: ['#2a4f8a', '#3a6fa8', '#5a90c0', '#7cb0d0'], day: ['#1f6fb0', '#2f8fc8', '#4fb0d8', '#7cd0e8'],
    sunset: ['#3a3a8a', '#5a4a9a', '#8a5aa0', '#c07a9a'], night: ['#081430', '#0c1c40', '#102650', '#163060'] };

  // ground: main ground colour (drives --grass in the app theme)
  const HABITATS = {
    // Pink-rock lake bottom: Xochimilco canals, underwater
    axolotl: { noSky: true, sky: WATER_SKY, ground: '#c98aa0', layers: [
      { kind: 'rays' },
      HL('#8a5a7a', 70, 6, 0.06, 2), HL('#c98aa0', 82, 3, 0.09, 5),
      S('kelp', 12, 58), S('kelp', 16, 62), S('kelp', 150, 60), S('kelp', 156, 64),
      S('coral', 28, 76), S('coral', 128, 78), S('fanCoral', 140, 76), S('shell', 110, 92), S('pebble', 50, 94), S('pebble', 70, 90),
      SC('bubble', 8, 70, 12, 17)] },
    // Austin food-truck lot with string lights
    cat: { ground: '#8a8a9a', layers: [
      HL('#6a7a9a', 56, 3, 0.2, 2), ...[6, 26, 46, 120, 140, 156].map((x, i) => RC(i % 2 ? '#5a6a8a' : '#4a5a7a', x, 40 - (i % 3) * 6, 16, 34)),
      RC('#8a8a9a', 0, 74, HW, 26), RC('#6a6a7a', 0, 74, HW, 2),
      S('foodTruck', 4, 62), S('foodTruck', 150, 63), LIGHTS(30, 8),
      S('bench', 122, 82), ...[[60, 90], [110, 94], [40, 96]].map(([x, y]) => S('crumb', x, y))] },
    // City park: fetch lawn, oak, bench, hydrant
    dog: { ground: '#6abe30', layers: [
      HL('#8ccf6a', 60, 4, 0.04, 3), S('oak', 8, 50), S('oak', 150, 52), HL('#6abe30', 72, 2, 0.07, 1),
      S('bench', 128, 70), S('hydrant', 30, 70), RC('#d9c08a', 0, 92, HW, 3),
      SC('grass', 74, 98, 30, 4), SC('daisy', 76, 96, 6, 9)] },
    // Clover hill with a burrow
    bunny: { ground: '#6abe30', layers: [
      HL('#9fd27a', 58, 4, 0.03, 5), BL('#79c25a', 136, 96, 50), HL('#6abe30', 80, 3, 0.06, 1),
      S('burrow', 138, 60), S('carrot', 20, 76), S('carrot', 30, 80),
      SC('clover', 80, 97, 30, 12), SC('daisy', 82, 96, 6, 13)] },
    // Farmyard sunrise: coop, sunflowers, fence
    chick: { ground: '#9cc85a', layers: [
      HL('#b8d86a', 58, 3, 0.04, 2), ...[4, 16, 150, 162].map((x, i) => S('sunflower', x, 50 + (i % 2) * 4)),
      S('coop', 128, 58), RC('#9cc85a', 0, 70, HW, 30), S('fence', 26, 64), S('fence', 104, 64),
      SC('seed', 76, 96, 10, 3), SC('grass', 74, 98, 18, 8)] },
    // Sunflower patch harvest (seed hoard)
    hamster: { ground: '#a8b84a', layers: [
      HL('#c8c06a', 58, 3, 0.05, 7), ...[0, 10, 20, 30, 134, 144, 154, 164].map((x, i) => S('sunflower', x, 44 + (i % 3) * 5)),
      RC('#a8b84a', 0, 70, HW, 30), S('wheelTrack', 40, 92), S('wheelTrack', 120, 92),
      SC('seed', 72, 98, 16, 21), SC('dryGrass', 72, 98, 14, 22)] },
    // Lily pond
    frog: { ground: '#3a8fb0', layers: [
      HL('#3f7a3a', 56, 5, 0.07, 4), HL('#2f6e2c', 62, 3, 0.11, 2), WA('#3a8fb0', 66),
      S('lilypad', 10, 74), S('lotus', 13, 72), S('lilypad', 140, 80), S('lilypad', 50, 92), S('lilypad', 110, 70),
      S('reeds', 166, 60), S('reeds', 2, 59), S('lotus', 143, 78)] },
    // Pantry: shelves, cheese, mouse hole
    mouse: { noSky: true, sky: INDOOR, ground: '#a8784a', layers: [
      ...[0, 22, 44, 66, 88, 110, 132, 154].map(x => RC('#e8cca0', x, 0, 2, 74)),
      S('shelf', 14, 22), S('shelf', 140, 30), S('shelf', 14, 44), S('window', 80, 14),
      RC('#a8784a', 0, 74, HW, 26), RC('#7a5432', 0, 74, HW, 2), S('hole', 150, 68), S('cheese', 20, 86), S('cheese', 120, 92),
      SC('crumb', 78, 98, 14, 5)] },
    // River bank with reeds and bread crumbs
    duckling: { ground: '#6abe30', layers: [
      HL('#7cb84a', 58, 4, 0.05, 2), WA('#4aa6e8', 66), S('reeds', 4, 59), S('reeds', 12, 61), S('reeds', 160, 60),
      HL('#8ccf6a', 84, 2, 0.08, 6), S('bread', 40, 88), S('bread', 128, 92), SC('crumb', 84, 98, 10, 2), SC('grass', 86, 99, 14, 3)] },
    // Mud farm: barn, hay, puddles
    pig: { ground: '#a8865a', layers: [
      HL('#8ccf6a', 56, 4, 0.04, 8), S('barn', 128, 46), S('hay', 110, 66), HL('#a8865a', 72, 2, 0.06, 3),
      BL('#7a5432', 40, 88, 10), BL('#7a5432', 130, 92, 8), BL('#8a6440', 70, 96, 6), S('fence', 0, 64), SC('grass', 76, 99, 10, 2)] },
    // Rolling cloud-hills with a cottage
    sheep: { ground: '#8ccf6a', layers: [
      S('bigCloud', 10, 30), S('bigCloud', 120, 24), HL('#b0e08a', 56, 6, 0.04, 2), HL('#8ccf6a', 70, 4, 0.05, 6),
      S('cottage', 130, 52), S('fence', 0, 66), S('fence', 22, 66), SC('daisy', 76, 96, 8, 21), SC('grass', 74, 98, 22, 9)] },
    // Autumn hedge garden
    hedgehog: { ground: '#a8783a', layers: [
      HL('#5a8a3a', 54, 6, 0.08, 4), BL('#4a7a2a', 14, 62, 16), BL('#4a7a2a', 160, 60, 18), HL('#a8783a', 74, 2, 0.08, 2),
      S('autumnTree', 30, 52), S('mushroom', 120, 72), S('mushroom', 136, 76), S('apple', 52, 86), S('apple', 150, 90),
      SC('leaf', 76, 98, 26, 14)] },
    // Mossy oak forest floor
    squirrel: { ground: '#4c7a3a', layers: [
      RC('#2f4a2a', 0, 30, HW, 70), ...[6, 40, 128, 160].map((x, i) => RC(i % 2 ? '#4a3220' : '#5a3d26', x, 0, 9 - (i % 2) * 2, 82)),
      BL('#2a5a2a', 12, 6, 20), BL('#336b2e', 86, 0, 26), BL('#2a5a2a', 160, 8, 22),
      HL('#4c7a3a', 80, 3, 0.09, 2), S('mushroom', 22, 77), S('acorn', 112, 80), S('acorn', 60, 88), S('mushroom', 146, 79),
      SC('spore', 40, 80, 20, 9, true), SC('grass', 82, 98, 22, 10)] },
    // UT Turtle Pond with the Tower behind
    turtle: { ground: '#3a8fb0', layers: [
      S('tower', 140, 30), HL('#5a8a4a', 56, 3, 0.06, 4), HL('#3f7a3a', 62, 2, 0.1, 2), WA('#3a8fb0', 66),
      S('bigRock', 14, 72), S('rock', 140, 80), S('lilypad', 60, 90), S('lotus', 63, 88), S('reeds', 166, 60), S('reeds', 2, 60)] },
    // Short-grass prairie with burrow mounds
    prairiedog: { ground: '#c8a85a', layers: [
      HL('#d8c07a', 60, 3, 0.03, 2), HL('#c8a85a', 72, 2, 0.05, 6),
      S('mound', 14, 70), S('mound', 140, 72), S('mound', 110, 84), SC('dryGrass', 74, 98, 30, 4), SC('bluebonnet', 76, 96, 5, 7)] },
    // Rocky peaks and ledges
    goat: { ground: '#8a8aa0', layers: [
      HL('#6a6a88', 40, 22, 0.035, 1.2), HL('#7a7a94', 58, 10, 0.06, 3.3), S('snowPine', 10, 46), S('snowPine', 156, 48),
      HL('#8a8aa0', 74, 3, 0.08, 2), S('bigRock', 20, 76), S('rock', 140, 82), S('limestone', 110, 90), SC('grass', 80, 99, 10, 7)] },
    // Bamboo grove in maple season
    redpanda: { sky: { day: ['#e8a070', '#f0b884', '#f8d0a0', '#ffe8c0'] }, ground: '#a85a2a', layers: [
      ...[2, 10, 18, 148, 158, 166].map((x, i) => S('bamboo', x, 4 + (i % 3) * 6)),
      HL('#8a4a2a', 64, 4, 0.08, 2), S('autumnTree', 30, 56), S('autumnTree', 130, 58), HL('#a85a2a', 80, 2, 0.1, 6),
      SC('leaf', 82, 98, 22, 14)] },
    // Icy shore with an igloo
    penguin: { ground: '#e8f4ff', layers: [
      WA('#3a7ab8', 56), S('iceberg', 20, 52), S('iceberg', 140, 50), HL('#e8f4ff', 68, 3, 0.05, 2),
      S('igloo', 136, 62), HL('#d6e8f8', 86, 2, 0.08, 4), SC('snow', 0, 80, 40, 3)] },
    // Sand dunes with an oasis palm
    fennec: { sky: { day: ['#6cb8f0', '#93d0ff', '#c4e4ff', '#ffe8b8'] }, ground: '#e8c886', layers: [
      HL('#e0b070', 56, 8, 0.03, 1), HL('#f0d29a', 68, 5, 0.05, 4), S('palm', 140, 50), S('palm', 152, 54), BL('#4aa6e8', 150, 70, 5),
      HL('#e8c886', 80, 3, 0.07, 2), S('cactus', 18, 66), SC('pebble', 86, 98, 8, 9)] },
    // Canyon river with rocks and kelp
    otter: { ground: '#4aa6c8', layers: [
      RC('#a87a5a', 0, 30, 30, 60), RC('#a87a5a', 144, 26, 30, 64), RC('#c08a62', 0, 30, 30, 3), RC('#c08a62', 144, 26, 30, 3),
      HL('#5a8a4a', 58, 2, 0.1, 3), WA('#4aa6c8', 64), S('bigRock', 24, 74), S('rock', 130, 84), S('kelp', 60, 86), S('kelp', 116, 86),
      SC('bubble', 70, 98, 6, 5)] },
    // Back alley: bricks, trash cans, street lamp
    raccoon: { ground: '#5a5a6a', layers: [
      RC('#8a4a3a', 0, 20, HW, 56), ...Array.from({ length: 8 }, (_, r) => RC('#6a3a2a', 0, 24 + r * 7, HW, 1)),
      RC('#5a5a6a', 0, 76, HW, 24), RC('#3a3a4a', 0, 76, HW, 2),
      S('trashcan', 16, 68), S('trashcan', 24, 70), S('trashcan', 150, 69), S('lamp', 128, 64, true), S('skull', 46, 92)] },
    // Hot spring with a yuzu tree
    capybara: { ground: '#7cb84a', layers: [
      HL('#5a8a4a', 56, 5, 0.05, 3), S('yuzuTree', 4, 50), S('yuzuTree', 150, 52), HL('#7cb84a', 72, 2, 0.06, 1),
      BL('#8a8a9a', 87, 88, 20), BL('#7ad0d8', 87, 88, 17), SC('steam', 70, 84, 8, 4), S('rock', 50, 78), S('rock', 118, 80)] },
    // Moonlit rooftop with a library window
    owl: { sky: { day: ['#5a7ad0', '#7a98e0', '#a0b8f0', '#c8d8ff'] }, ground: '#4a3a6a', layers: [
      HL('#2a2a5a', 64, 2, 0.2, 1), ...[4, 28, 52, 120, 144].map((x, i) => RC('#3a3a6a', x, 52 - (i % 3) * 4, 18, 24)),
      ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap(row => Array.from({ length: 23 }, (_, i) => S('roofTile', i * 8 - (row % 2) * 4, 74 + row * 3))),
      S('chimney', 150, 66), S('books', 20, 69), S('lantern', 140, 70, true), SC('sparkle', 4, 50, 6, 3)] },
    // Desert highway between mesas
    roadrunner: { ground: '#d8a86a', layers: [
      RC('#c0703a', 0, 46, 50, 30), RC('#c0703a', 10, 38, 30, 10), RC('#d0804a', 120, 50, 54, 26), RC('#d0804a', 132, 42, 30, 10),
      HL('#d8a86a', 70, 2, 0.05, 2), RC('#4a4a5a', 0, 84, HW, 10), ...Array.from({ length: 10 }, (_, i) => RC('#ffe066', i * 18 + 4, 88, 8, 2)),
      S('cactus', 30, 66), S('cactus', 140, 68), SC('dryGrass', 74, 82, 10, 5)] },
    // Hill Country: bluebonnets, limestone, live oak
    armadillo: { ground: '#7cb84a', layers: [
      HL('#6a9a5a', 54, 6, 0.04, 2), S('oak', 10, 46), HL('#8cc05a', 66, 4, 0.05, 5), S('limestone', 140, 64), S('limestone', 18, 80),
      HL('#7cb84a', 80, 2, 0.07, 1), SC('bluebonnet', 80, 97, 22, 7), SC('flower', 82, 97, 5, 8)] },
    // Snowy peaks and pines
    snowleopard: { ground: '#eaf2ff', layers: [
      HL('#a8b8d8', 38, 20, 0.04, 1.1), HL('#ffffff', 40, 20, 0.04, 1.1), HL('#c0cce4', 56, 10, 0.07, 2.4),
      S('snowPine', 6, 52), S('snowPine', 16, 56), S('snowPine', 150, 54), S('snowPine', 160, 50),
      HL('#eaf2ff', 72, 3, 0.06, 3), S('rock', 130, 82), SC('snow', 0, 90, 50, 11)] },
    // Rainforest canopy with vines and hibiscus
    chameleon: { ground: '#3f8a3a', layers: [
      RC('#2a5a2a', 0, 30, HW, 70), BL('#2f7a3a', 20, 4, 26), BL('#3f8a3a', 90, -4, 30), BL('#2f7a3a', 160, 6, 26),
      ...[30, 60, 118, 144].map((x, i) => S('vine', x, 8 + i * 3)), S('bigLeaf', 6, 60), S('bigLeaf', 160, 62),
      HL('#3f8a3a', 78, 3, 0.09, 2), SC('hibiscus', 40, 76, 8, 6), SC('bigLeaf', 80, 96, 6, 3)] },
    // Congress Ave Bridge over Lady Bird Lake at dusk
    bat: { sky: { day: ['#5b3f8f', '#8a4f9e', '#c9618a', '#ff8f5e'] }, ground: '#3a5a8a', layers: [
      ...[[0, 20], [14, 30], [28, 18], [40, 38], [56, 24], [116, 30], [130, 44], [146, 22], [160, 34]].map(([x, h]) => RC('#2b2140', x, 56 - h, 13, h)),
      SC('lantern', 22, 50, 10, 4, true), WA('#3a5a8a', 62), RC('#bf5700', 0, 56, HW, 4),
      ...[8, 40, 72, 104, 136, 168].map(x => RC('#8a3f00', x, 60, 4, 10)), S('guitar', 20, 86)] },
    // Dusk prairie: campfire, wanted myth, mesquite
    jackalope: { sky: { day: ['#6a8ad0', '#9ab0e8', '#e8b8a0', '#ffd8a8'] }, ground: '#b8a060', layers: [
      HL('#8a7a5a', 56, 6, 0.05, 3), S('oak', 140, 50), HL('#b8a060', 72, 3, 0.06, 1), S('campfire', 30, 80, true),
      S('limestone', 120, 82), SC('dryGrass', 74, 98, 20, 4), SC('bluebonnet', 80, 98, 6, 9), SC('sparkle', 10, 40, 4, 8)] },
    // Ranch: windmill, fence, UT Tower on the horizon
    longhorn: { ground: '#c8a85a', layers: [
      S('tower', 80, 26), HL('#a8885a', 58, 3, 0.04, 2), S('windmill', 146, 44), S('flag', 14, 50),
      HL('#c8a85a', 70, 2, 0.05, 6), S('fence', 0, 66), S('fence', 22, 66), S('fence', 130, 66), S('fence', 152, 66),
      S('hay', 120, 80), SC('bluebonnet', 80, 98, 10, 5), SC('dryGrass', 76, 98, 20, 6)] },
  };

  function renderHabitat(ctx, hab, phase) {
    const [tc, tt] = TINT[phase];
    const t = c => (tt ? mixHex(c, tc, tt) : c);
    const tp = p => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, t(v)]));
    const sky = (hab.sky && hab.sky[phase]) || SKY[phase];
    skyBands(ctx, sky);
    if (!hab.noSky) celestial(ctx, phase, sky[0]);
    for (const l of hab.layers) {
      switch (l.kind) {
        case 'hills': {
          const rim = t(mixHex(l.color, '#ffffff', 0.22));
          for (let x = 0; x < HW; x++) {
            const top = Math.round(l.y - l.amp * (Math.sin(x * l.freq + l.seed) * 0.6 + Math.sin(x * l.freq * 2.3 + l.seed * 1.7) * 0.4));
            ctx.fillStyle = t(l.color); ctx.fillRect(x, top, 1, HH - top);
            ctx.fillStyle = rim; ctx.fillRect(x, top, 1, 1);
          }
          break;
        }
        case 'rect': ctx.fillStyle = t(l.color); ctx.fillRect(l.x, l.y, l.w, l.h); break;
        case 'blob': disc(ctx, l.x, l.y, l.r, t(l.color)); break;
        case 'water': {
          ctx.fillStyle = t(l.color); ctx.fillRect(0, l.y, HW, HH - l.y);
          const r = rng(l.y);
          ctx.fillStyle = t(mixHex(l.color, '#ffffff', 0.35));
          for (let y = l.y + 2; y < HH; y += 4) for (let i = 0; i < 6; i++) ctx.fillRect(Math.floor(r() * HW), y, 3 + Math.floor(r() * 4), 1);
          break;
        }
        // glow sprites (lamps, lava, fire) keep their colours at night
        case 'sprite': drawRows(ctx, l.rows, l.glow ? l.palette : tp(l.palette), l.x, l.y); break;
        case 'scatter': {
          const r = rng(l.seed), pal = l.glow ? l.palette : tp(l.palette);
          for (let i = 0; i < l.count; i++) drawRows(ctx, l.rows, pal, Math.floor(r() * (HW - 3)), l.y0 + Math.floor(r() * (l.y1 - l.y0)));
          break;
        }
        case 'rays':
          if (phase === 'night') break;
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          for (const x0 of [24, 70, 120]) for (let y = 0; y < 70; y++) ctx.fillRect(x0 + Math.floor(y / 3), y, 6, 1);
          break;
        case 'lights': {
          ctx.fillStyle = t('#3a2a3a');
          for (let x = 0; x < HW; x++) ctx.fillRect(x, l.y + Math.round(Math.sin((x / HW) * Math.PI * 3) ** 2 * l.sag), 1, 1);
          const cols = ['#ffe066', '#ff6f9c', '#6fe3b1', '#5ab0ff'];
          for (let x = 3, i = 0; x < HW; x += 7, i++) {
            ctx.fillStyle = cols[i % cols.length];
            ctx.fillRect(x, l.y + 1 + Math.round(Math.sin((x / HW) * Math.PI * 3) ** 2 * l.sag), 2, 2);
          }
          break;
        }
      }
    }
  }

  // Cached per animal + phase; one drawImage per frame. Scaled to cover W x H, bottom-aligned (ground stays visible).
  const HAB_CACHE = new Map();
  function habitatCanvas(animalId, phase) {
    const key = animalId + '|' + phase;
    let cv = HAB_CACHE.get(key);
    if (!cv) {
      cv = document.createElement('canvas'); cv.width = HW; cv.height = HH;
      renderHabitat(cv.getContext('2d'), HABITATS[animalId] || HABITATS.axolotl, phase);
      HAB_CACHE.set(key, cv);
    }
    return cv;
  }
  function drawHabitat(ctx, animalId, W, H, phase = phaseAt(new Date().getHours())) {
    const cv = habitatCanvas(animalId, phase), k = Math.max(W / HW, H / HH);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cv, (W - HW * k) / 2, H - HH * k, HW * k, HH * k);
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // App theme: icons, CSS colours and habitat for one animal, following the device clock.
  // ------------------------------------------------------------------
  let themeId = null, themePhase = null, themeTimer = null;
  function applyAnimalTheme(animalId, phase) {
    const a = global.Animals && global.Animals.A[animalId];
    if (!a) return false;
    const ph = phase || phaseAt(new Date().getHours());
    const hab = HABITATS[animalId] || HABITATS.axolotl;
    const sky = (hab.sky && hab.sky[ph]) || SKY[ph];
    const [tc, tt] = TINT[ph];
    const ground = tt ? mixHex(hab.ground, tc, tt) : hab.ground;
    const st = document.documentElement.style;
    // the top bar sits on --sky: keep it pastel so ink text stays readable at night
    st.setProperty('--sky', mixHex(sky[3], '#fff4dc', 0.55)); st.setProperty('--sky-top', sky[0]);
    st.setProperty('--grass', mixHex(ground, '#fff4dc', 0.25)); st.setProperty('--grass-2', mixHex(ground, '#2b2140', 0.25));
    st.setProperty('--accent', a.pal.d); st.setProperty('--panel-2', mixHex(a.pal.a, '#ffe6b8', 0.5));
    st.setProperty('--pet', a.pal.b); st.setProperty('--pet-2', a.pal.d); st.setProperty('--pet-3', a.pal.a);
    document.body.dataset.animal = animalId; document.body.dataset.phase = ph;
    const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.content = sky[0];
    if (global.Icons) { global.Icons.setTheme(animalId); global.Icons.mount(); }
    themeId = animalId; themePhase = ph;
    // re-theme when the clock crosses into the next phase
    if (!themeTimer && !phase) themeTimer = setInterval(() => {
      if (themeId && phaseAt(new Date().getHours()) !== themePhase) applyAnimalTheme(themeId);
    }, 60000);
    return true;
  }

  const api = { USE_SHEETS: true, SIZE, BODIES, HATS, SPECIES, QUEST_TYPE_TO_SPECIES, RARITY_HUE,
    BASE_HUE, SHEET_META, makePalette, drawPet, petCanvas, drawEgg, registerSheet, loadSheet, loadAll, SHEETS,
    HABITATS, phaseAt, drawHabitat, habitatCanvas, applyAnimalTheme, drawEvolved };
  global.applyAnimalTheme = applyAnimalTheme;
  if (global.Animals) api.SPECIES = global.Animals.A;
  global.Sprites = api;
})(window);
