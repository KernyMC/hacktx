/* =====================================================================
   Familiars — minigames (self-contained, no deps, no emoji)
   Minigames.open({ engine, pet, difficulty, title, subtitle, triesLeft, practice })
     -> Promise<{ win, score }>
   Engines: catch, hop, memory, timing, whack, dodge, rodeo (legendary).
   Draws on a 360x300 logical canvas; the pet is the player character via
   Sprites.drawPet(ctx, pet, x, y, px, opts). Injects CSS once (mg- prefix).
   ===================================================================== */
(function (global) {
  'use strict';

  const W = 360, H = 300;
  const C = {
    ink: '#2b2140', ink2: '#6f6386', panel: '#fff8ea', panel2: '#ffefcf',
    pink: '#ff6f9c', gold: '#ffcf4d', mint: '#6fe3b1', lilac: '#b79cff',
    sky: '#9fd3ff', sky2: '#d6edff', grass: '#8fd48a', grass2: '#5fb35e',
    red: '#ff5a5a', orange: '#ff9a4d', brown: '#b07a4f', brown2: '#7a4e33',
    stone: '#b4aec4', stone2: '#7c7591', sand: '#f3d9a4', sand2: '#e2bf7d', white: '#ffffff',
  };
  const FONT = "'Press Start 2P', 'Courier New', monospace";

  // ---------- small utils ----------
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  function sfx(name) { try { if (global.Audio8) global.Audio8.play(name); } catch (e) { /* ignore */ } }

  let actx = null;
  function beep(freq, dur) {
    try {
      if (global.Audio8 && global.Audio8.isEnabled && !global.Audio8.isEnabled()) return;
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume().catch(() => {});
      const t = actx.currentTime;
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.07, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch (e) { /* ignore */ }
  }

  function icon(name, size, color, color2) {
    try { if (global.Icons) return global.Icons.svg(name, size, color, color2); } catch (e) { /* ignore */ }
    return '';
  }

  // ---------- pixel drawing ----------
  function rect(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function box(c, x, y, w, h, fill, b) { b = b || 2; rect(c, x, y, w, h, C.ink); rect(c, x + b, y + b, w - 2 * b, h - 2 * b, fill); }

  const PAL = {
    k: C.ink, p: C.pink, w: C.white, g: C.grass, G: C.grass2, y: C.gold, b: C.brown, B: C.brown2,
    s: C.stone, S: C.stone2, r: C.red, o: C.orange, l: C.lilac, m: C.mint, c: C.sky,
    n: C.sand, N: C.sand2, i: C.sky2, u: '#3f8f4a', d: '#4b3024',
  };
  const SPR = {
    berry: ['....kG..', '...kGG..', '.kkkkkk.', 'kppppwpk', 'kppppppk', 'kppppppk', '.kppppk.', '..kkkk..'],
    cookie: ['..kkkk..', '.kyyyyk.', 'kyyByyyk', 'kyyyyByk', 'kyByyyyk', 'kyyyByyk', '.kyyyyk.', '..kkkk..'],
    star: ['...kk...', '..kyyk..', 'kkkyykkk', 'kyyyyyyk', '.kyywyk.', '.kyyyyk.', 'kyykkyyk', 'kkk..kkk'],
    fish: ['........', '..kkk..k', '.kllllkk', 'klwkllll', 'klllllll', '.kllllkk', '..kkk..k', '........'],
    rock: ['..kkkk..', '.kssssk.', 'ksswsssk', 'kssssSsk', 'kssssSSk', 'kSsSSSSk', '.kSSSSk.', '..kkkk..'],
    bomb: ['.....ky.', '....k.yo', '..kkkk..', '.kkkkkk.', 'kkwkkkkk', 'kwkkkkkk', 'kkkkkkkk', '.kkkkkk.'],
    flame: ['...k....', '..kok...', '..kook..', '.koyok..', 'kooyyok.', 'koyyyok.', '.kyyyk..', '..kkk...'],
    acorn: ['...kk...', '.kkBBkk.', 'kBBBBBBk', 'kkkkkkkk', '.kbbbbk.', '.kbbwbk.', '..kbbk..', '...kk...'],
    critter: ['..kkkk..', '.kllllk.', 'kllllllk', 'klkllklk', 'kllppllk', 'kllllllk', 'kllllllk', 'kllllllk'],
    heart: ['.kk..kk.', 'kppkkppk', 'kpwppppk', 'kppppppk', '.kppppk.', '..kppk..', '...kk...', '........'],
    bush: ['..kkkk..', '.kggggk.', 'kggwgggk', 'kgggggGk', 'kgGgggGk', 'kGGGGGGk'],
  };
  function spr(c, name, x, y, s) {
    const g = SPR[name];
    for (let r = 0; r < g.length; r++) {
      const row = g[r];
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '.') continue;
        c.fillStyle = PAL[ch];
        c.fillRect(Math.round(x + i * s), Math.round(y + r * s), Math.ceil(s), Math.ceil(s));
      }
    }
  }
  // draw sprite centered at cx, cy
  function sprC(c, name, cx, cy, s) { const g = SPR[name]; spr(c, name, cx - g[0].length * s / 2, cy - g.length * s / 2, s); }

  let warnedPet = false;
  // pet drawn with its feet at (cx, by)
  function drawPet(c, pet, cx, by, px, o) {
    const x = cx - 8 * px, y = by - 16 * px;
    c.save();
    try {
      if (global.Sprites && typeof global.Sprites.drawPet === 'function') {
        global.Sprites.drawPet(c, pet, x, y, px, o || {});
        c.restore();
        return;
      }
    } catch (e) {
      if (!warnedPet) { warnedPet = true; console.warn('Minigames: Sprites.drawPet failed', e); }
    }
    c.restore();
    // fallback blob
    box(c, x + 2 * px, y + 4 * px, 12 * px, 12 * px, C.lilac, Math.max(1, px));
    rect(c, x + 5 * px, y + 8 * px, px, 2 * px, C.ink);
    rect(c, x + 10 * px, y + 8 * px, px, 2 * px, C.ink);
  }

  function drawClouds(c, t, speed, y0) {
    const xs = [30, 150, 260, 380];
    for (let i = 0; i < xs.length; i++) {
      const x = ((xs[i] - t * speed * (0.6 + i * 0.15)) % 440 + 440) % 440 - 50;
      const y = y0 + (i % 2) * 22;
      rect(c, x, y + 6, 48, 10, C.white);
      rect(c, x + 8, y, 26, 8, C.white);
      rect(c, x + 4, y + 16, 40, 2, C.sky2);
    }
  }
  function drawSkyGround(c, t, groundY, opts) {
    opts = opts || {};
    if (!opts.groundOnly) {
      rect(c, 0, 0, W, H, opts.sky || C.sky);
      rect(c, 0, groundY - 40, W, 40, opts.sky2 || C.sky2);
      drawClouds(c, t, opts.cloudSpeed || 6, 18);
    }
    rect(c, 0, groundY, W, H - groundY, C.grass);
    rect(c, 0, groundY, W, 3, C.ink);
    rect(c, 0, groundY + 3, W, 4, C.grass2);
    const off = opts.scroll ? (opts.scroll % 24) : 0;
    for (let x = -off; x < W; x += 24) rect(c, x + 6, groundY + 14, 6, 3, C.grass2);
  }

  function text(c, str, x, y, size, col, align, outline) {
    c.font = size + 'px ' + FONT;
    c.textAlign = align || 'center';
    c.textBaseline = 'middle';
    if (outline) {
      c.fillStyle = C.ink;
      for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [2, 2]]) c.fillText(str, x + dx, y + dy);
    }
    c.fillStyle = col || C.ink;
    c.fillText(str, x, y);
  }

  // =====================================================================
  //  ENGINES
  //  make(G) sets G.mode ('score' | 'survive' | 'custom'), G.duration,
  //  G.target, G.hearts and returns { update, draw, down?, action?, key? }
  // =====================================================================

  // --- shared horizontal mover (catch, dodge) ---
  function mover(G, speed) {
    const m = { x: W / 2, flip: false, moving: false };
    m.update = function (dt) {
      const before = m.x;
      const dir = (G.input.right ? 1 : 0) - (G.input.left ? 1 : 0);
      if (dir) m.x += dir * speed * dt;
      else if (G.ptr.down) {
        const dx = G.ptr.x - m.x;
        const step = speed * 1.6 * dt;
        m.x += Math.abs(dx) < step ? dx : Math.sign(dx) * step;
      }
      m.x = clamp(m.x, 22, W - 22);
      const d = m.x - before;
      m.moving = Math.abs(d) > 0.2;
      if (d > 0.2) m.flip = false; else if (d < -0.2) m.flip = true;
    };
    return m;
  }

  const ENGINES = {
    // ------------------------------------------------------------------
    catch: {
      name: 'Snack Catch',
      desc: 'Slide left and right to catch falling snacks. Dodge the rocks!',
      controls: 'Drag, or arrow keys',
      make(G) {
        const d = G.d;
        G.mode = 'score'; G.duration = 20; G.target = 8 + d * 3; G.hearts = 3;
        const groundY = H - 34, px = 3;
        const me = mover(G, 210 + d * 18);
        const items = [];
        let spawn = 0.3;
        const fall = () => 80 + d * 20 + G.t * 3;
        return {
          update(dt) {
            me.update(dt);
            spawn -= dt;
            if (spawn <= 0) {
              spawn = rnd(0.6, 0.95) - d * 0.07;
              const rock = Math.random() < 0.16 + d * 0.05;
              items.push({ x: rnd(18, W - 18), y: -14, vy: fall() * rnd(0.85, 1.2), kind: rock ? 'rock' : pick(['berry', 'cookie', 'star', 'fish']), wob: rnd(0, 6) });
            }
            const top = groundY - 16 * px + 14;
            for (let i = items.length - 1; i >= 0; i--) {
              const it = items[i];
              it.y += it.vy * dt;
              if (it.y + 10 > top && it.y < groundY && Math.abs(it.x - me.x) < 26) {
                items.splice(i, 1);
                if (it.kind === 'rock') { G.burst(it.x, it.y, C.stone, 12); G.hurt(); }
                else { G.burst(it.x, it.y, it.kind === 'berry' ? C.pink : it.kind === 'fish' ? C.lilac : C.gold, 10); G.pop(it.x, it.y - 10, '+1', C.gold); sfx('xp'); G.petAnim('eat', 0.3); G.addScore(1); }
              } else if (it.y > groundY + 4) {
                items.splice(i, 1);
                if (it.kind === 'rock') { G.burst(it.x, groundY, C.stone2, 6); G.shake(2); }
                else G.burst(it.x, groundY, C.white, 4);
              }
            }
          },
          draw(c) {
            drawSkyGround(c, G.t, groundY);
            for (const it of items) sprC(c, it.kind, it.x + (it.kind === 'rock' ? Math.sin(G.t * 9 + it.wob) * 1.5 : 0), it.y, 3);
            rect(c, me.x - 20, groundY + 2, 40, 4, C.grass2);
            drawPet(c, G.pet, me.x, groundY + 2 + (me.moving ? -Math.abs(Math.sin(G.t * 16)) * 3 : 0), px, G.petOpts({ flip: me.flip }));
          },
        };
      },
    },

    // ------------------------------------------------------------------
    hop: {
      name: 'Hop Dash',
      desc: 'Tap to jump over everything coming your way. Survive the timer!',
      controls: 'Tap, Space or Up',
      make(G) {
        const d = G.d;
        G.mode = 'survive'; G.duration = 18; G.hearts = d <= 2 ? 3 : 2;
        const groundY = H - 50, px = 2.5, petX = 70;
        const maxJumps = d <= 2 ? 2 : 1;
        const grav = 1600, jumpV = 560;
        let py = 0, vy = 0, jumps = 0, invul = 0, scroll = 0, nextGap = 220, wasAir = false;
        const obs = [];
        const speed = () => 150 + d * 22 + G.t * 4;
        function jump() {
          if (jumps < maxJumps) {
            vy = jumps === 0 ? jumpV : jumpV * 0.85; jumps++; sfx('tap');
            G.burst(petX, groundY - py, C.white, 5);
          }
        }
        return {
          action: jump,
          down: jump,
          up() { if (vy > 220) vy *= 0.6; },
          update(dt) {
            const sp = speed();
            scroll += sp * dt;
            invul = Math.max(0, invul - dt);
            // physics
            vy -= grav * dt; py += vy * dt;
            if (py <= 0) { py = 0; vy = 0; jumps = 0; if (wasAir) G.burst(petX, groundY, C.grass2, 4); }
            wasAir = py > 0;
            // spawn by distance
            nextGap -= sp * dt;
            if (nextGap <= 0) {
              const types = ['bush'];
              if (d >= 2 || G.t > 8) types.push('rock');
              if (d >= 3) types.push('log');
              const ty = pick(types);
              const o = ty === 'bush' ? { w: 24, h: 18 } : ty === 'rock' ? { w: 22, h: 36 } : { w: 50, h: 20 };
              o.type = ty; o.x = W + 10; o.hit = false; o.passed = false;
              obs.push(o);
              const minGap = sp * (0.72 - d * 0.03);
              nextGap = rnd(minGap, minGap * 1.9) + o.w;
            }
            const top = groundY - py - 34, bottom = groundY - py, l = petX - 12, r = petX + 12;
            for (let i = obs.length - 1; i >= 0; i--) {
              const o = obs[i];
              o.x -= sp * dt;
              if (!o.hit && invul <= 0 && o.x < r && o.x + o.w > l && bottom > groundY - o.h + 3 && top < groundY) {
                o.hit = true; invul = 1.2; G.burst(o.x + o.w / 2, groundY - o.h, C.grass2, 10); G.hurt();
              }
              if (!o.passed && o.x + o.w < l) { o.passed = true; if (!o.hit) { G.score++; G.pop(petX, groundY - py - 50, '+1', C.gold); sfx('xp'); } }
              if (o.x + o.w < -10) obs.splice(i, 1);
            }
          },
          draw(c) {
            rect(c, 0, 0, W, H, C.sky);
            drawClouds(c, G.t, 10, 16);
            // parallax hills
            const hs = (scroll * 0.25) % 120;
            for (let x = -hs - 20; x < W + 120; x += 120) {
              rect(c, x, groundY - 46, 80, 46, C.lilac); rect(c, x + 14, groundY - 62, 52, 16, C.lilac);
              rect(c, x + 28, groundY - 70, 24, 8, C.lilac);
            }
            const ts = (scroll * 0.5) % 90;
            for (let x = -ts; x < W + 90; x += 90) { rect(c, x + 10, groundY - 26, 10, 26, C.brown2); rect(c, x, groundY - 46, 30, 24, C.grass2); rect(c, x + 4, groundY - 52, 22, 8, C.grass2); }
            drawSkyGround(c, 0, groundY, { scroll, groundOnly: true });
            for (const o of obs) {
              if (o.type === 'bush') spr(c, 'bush', o.x, groundY - o.h, 3);
              else if (o.type === 'rock') { spr(c, 'rock', o.x - 1, groundY - 24, 3); spr(c, 'rock', o.x + 2, groundY - 40, 2.5); }
              else { box(c, o.x, groundY - o.h, o.w, o.h, C.brown); rect(c, o.x + 6, groundY - o.h + 7, o.w - 12, 2, C.brown2); box(c, o.x + o.w - 14, groundY - o.h, 14, o.h, C.sand2); rect(c, o.x + o.w - 9, groundY - o.h + 7, 4, 6, C.brown); }
            }
            rect(c, petX - 14 + py * 0.05, groundY + 1, 28 - py * 0.1, 4, C.grass2);
            if (!(invul > 0 && Math.floor(invul * 12) % 2)) {
              drawPet(c, G.pet, petX, groundY + 2 - py, px, G.petOpts({ anim: py > 0 ? 'happy' : null }));
            }
          },
        };
      },
    },

    // ------------------------------------------------------------------
    memory: {
      name: 'Echo Pads',
      desc: 'Watch the pads light up, then repeat the tune in order.',
      controls: 'Tap pads, or arrows / 1-4',
      make(G) {
        const d = G.d;
        G.mode = 'custom'; G.noClock = true;
        G.target = [4, 5, 6, 7, 7][d - 1]; G.hearts = d <= 2 ? 2 : 1;
        const cols = [C.pink, C.gold, C.mint, C.sky];
        const dark = ['#c2577a', '#c69c34', '#4fae86', '#6e9fc6'];
        const notes = [523, 659, 784, 1047];
        const m = 12, gap = 10, pw = (W - 2 * m - gap) / 2, ph = (H - 2 * m - gap) / 2;
        const pads = [0, 1, 2, 3].map(i => ({ x: m + (i % 2) * (pw + gap), y: m + (i >> 1) * (ph + gap), lit: 0 }));
        const stepOn = 0.46 - d * 0.045, stepOff = 0.13;
        const limit = 3.2 - d * 0.25;
        const seq = [pick([0, 1, 2, 3])];
        let state = 'pause', timer = 0.7, idx = 0, inputT = limit, msg = 'WATCH';
        function lightPad(i, dur) { pads[i].lit = dur; beep(notes[i], Math.min(0.35, dur)); }
        function startShow() { state = 'show'; idx = 0; timer = 0.25; msg = 'WATCH'; }
        function press(i) {
          if (state !== 'input') return;
          lightPad(i, 0.2);
          const p = pads[i];
          G.burst(p.x + pw / 2, p.y + ph / 2, cols[i], 6);
          if (i === seq[idx]) {
            idx++; inputT = limit;
            if (idx >= seq.length) {
              G.score++; G.petAnim('happy', 0.8); G.pop(W / 2, H / 2 - 40, 'NICE', C.gold);
              if (G.score >= G.target) { G.end(true); return; }
              sfx('accept'); seq.push(pick([0, 1, 2, 3]));
              if (seq.length < 3) seq.push(pick([0, 1, 2, 3]));
              state = 'pause'; timer = 0.8; msg = 'NICE!';
            }
          } else fail();
        }
        function fail() {
          G.hurt();
          if (G.over) return;
          state = 'pause'; timer = 1.0; msg = 'AGAIN';
        }
        // first round already length 2
        seq.push(pick([0, 1, 2, 3]));
        G.timerFrac = () => state === 'input' ? inputT / limit : 1;
        G.hudLeft = () => 'Round ' + Math.min(G.score + 1, G.target) + ' / ' + G.target;
        return {
          down(x, y) {
            for (let i = 0; i < 4; i++) { const p = pads[i]; if (x >= p.x && x <= p.x + pw && y >= p.y && y <= p.y + ph) { press(i); return; } }
          },
          key(k) {
            const map = { ArrowUp: 0, ArrowRight: 1, ArrowLeft: 2, ArrowDown: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
            if (k in map) press(map[k]);
          },
          update(dt) {
            for (const p of pads) p.lit = Math.max(0, p.lit - dt);
            if (state === 'pause') { timer -= dt; if (timer <= 0) startShow(); }
            else if (state === 'show') {
              timer -= dt;
              if (timer <= 0) {
                if (idx < seq.length) { lightPad(seq[idx], stepOn); idx++; timer = stepOn + stepOff; }
                else { state = 'input'; idx = 0; inputT = limit; msg = 'YOUR TURN'; }
              }
            } else if (state === 'input') {
              inputT -= dt;
              if (inputT <= 0) { G.pop(W / 2, H / 2 - 40, 'TOO SLOW', C.pink); fail(); }
            }
          },
          draw(c) {
            rect(c, 0, 0, W, H, C.ink);
            for (let i = 0; i < 4; i++) {
              const p = pads[i], on = p.lit > 0;
              const yy = on ? p.y + 2 : p.y;
              if (!on) rect(c, p.x + 4, p.y + 4, pw, ph, '#1a1428');
              box(c, p.x, yy, pw, ph, on ? cols[i] : dark[i], 3);
              rect(c, p.x + 8, yy + 8, pw - 16, 4, on ? C.white : cols[i]);
              rect(c, p.x + 8, yy + 8, 4, ph - 30, on ? C.white : cols[i]);
              if (on) for (let k = 0; k < 6; k++) rect(c, p.x + 14 + ((k * 37) % (pw - 30)), yy + 20 + ((k * 23) % (ph - 40)), 4, 4, C.white);
            }
            // centre badge with the pet
            const cx = W / 2, cy = H / 2;
            box(c, cx - 50, cy - 46, 100, 92, C.panel, 3);
            drawPet(c, G.pet, cx, cy + 22, 3.6, G.petOpts());
            text(c, msg, cx, cy + 34, 7, state === 'input' ? C.pink : C.ink2);
          },
        };
      },
    },

    // ------------------------------------------------------------------
    timing: {
      name: 'Perfect Pounce',
      desc: 'Tap when the cursor is inside the green zone. It gets faster!',
      controls: 'Tap or Space',
      make(G) {
        const d = G.d;
        G.mode = 'score'; G.duration = 25; G.target = 4 + d; G.hearts = 3;
        const bx = 26, bw = W - 52, by = 216, bh = 30;
        let p = 0, dir = 1, speed = 0.5 + d * 0.11, zw = 0.3 - d * 0.03, zc = 0.5, cool = 0, jumpT = 0, flashT = 0, flashCol = C.mint;
        function newZone() { zc = rnd(zw / 2 + 0.04, 1 - zw / 2 - 0.04); }
        newZone();
        function tap() {
          if (cool > 0) return;
          cool = 0.3;
          const off = Math.abs(p - zc);
          const cx = bx + p * bw;
          if (off <= zw / 2) {
            const perfect = off <= zw * 0.15;
            G.burst(cx, by, perfect ? C.gold : C.mint, perfect ? 18 : 10);
            G.pop(cx, by - 26, perfect ? 'PERFECT' : 'GOOD', perfect ? C.gold : C.mint);
            sfx(perfect ? 'bless' : 'accept'); G.petAnim('happy', 0.6); jumpT = 0.45; flashT = 0.2; flashCol = C.mint;
            speed = Math.min(2.1, speed * 1.1); zw = Math.max(0.065, zw * 0.86);
            newZone();
            G.addScore(1);
          } else {
            G.pop(cx, by - 26, 'MISS', C.pink); flashT = 0.2; flashCol = C.pink;
            G.hurt();
          }
        }
        return {
          action: tap, down: tap,
          update(dt) {
            cool = Math.max(0, cool - dt); jumpT = Math.max(0, jumpT - dt); flashT = Math.max(0, flashT - dt);
            p += dir * speed * dt;
            if (p > 1) { p = 2 - p; dir = -1; sfx('tick'); }
            if (p < 0) { p = -p; dir = 1; sfx('tick'); }
          },
          draw(c) {
            drawSkyGround(c, G.t, 176);
            // platform + pet
            const jy = jumpT > 0 ? Math.sin((jumpT / 0.45) * Math.PI) * 34 : 0;
            box(c, W / 2 - 40, 168, 80, 12, C.panel2);
            drawPet(c, G.pet, W / 2, 170 - jy, 3.6, G.petOpts());
            // target pips
            for (let i = 0; i < G.target; i++) {
              const x = W / 2 - G.target * 9 + i * 18;
              box(c, x, 186, 14, 14, i < G.score ? C.gold : C.panel);
            }
            // bar
            rect(c, bx + 4, by + 4, bw, bh, C.ink);
            box(c, bx, by, bw, bh, flashT > 0 ? flashCol : C.panel2, 3);
            const zx = bx + (zc - zw / 2) * bw;
            rect(c, zx, by + 3, zw * bw, bh - 6, C.mint);
            rect(c, bx + (zc - zw * 0.15) * bw, by + 3, zw * 0.3 * bw, bh - 6, C.gold);
            rect(c, zx, by + 3, 2, bh - 6, C.grass2); rect(c, zx + zw * bw - 2, by + 3, 2, bh - 6, C.grass2);
            // cursor
            const cx = bx + p * bw;
            rect(c, cx - 3, by - 12, 6, bh + 24, C.ink);
            rect(c, cx - 1, by - 10, 2, bh + 20, C.pink);
            rect(c, cx - 7, by - 16, 14, 6, C.ink); rect(c, cx - 5, by - 14, 10, 2, C.pink);
            text(c, 'TAP IN THE GREEN', W / 2, by + bh + 22, 8, C.ink2);
          },
        };
      },
    },

    // ------------------------------------------------------------------
    whack: {
      name: 'Boop Burrows',
      desc: 'Tap critters as they pop up. Your pet is worth 3. Never tap a bomb!',
      controls: 'Tap, or keys 1-9',
      make(G) {
        const d = G.d;
        G.mode = 'score'; G.duration = 20; G.target = 10 + d * 3; G.hearts = 3;
        const xs = [66, 180, 294], ys = [104, 184, 264];
        const holes = [];
        for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) holes.push({ x: xs[q], y: ys[r], item: null });
        const upTime = 1.25 - d * 0.15;
        const maxUp = 2 + Math.floor(d / 2);
        let spawn = 0.5;
        function hit(h) {
          const it = h.item;
          if (!it || it.bonk || it.phase === 'down') return;
          const vis = visible(it);
          if (vis < 0.4) return;
          if (it.kind === 'bomb') {
            h.item = null;
            G.burst(h.x, h.y - 22, C.orange, 18); G.burst(h.x, h.y - 22, C.ink, 8); G.shake(8); G.hurt();
          } else {
            it.bonk = 0.35;
            const v = it.kind === 'pet' ? 3 : 1;
            G.burst(h.x, h.y - 28, it.kind === 'pet' ? C.gold : C.lilac, 10);
            G.pop(h.x, h.y - 52, '+' + v, C.gold);
            sfx(it.kind === 'pet' ? 'bless' : 'squeak'); G.shake(2);
            G.addScore(v);
          }
        }
        function visible(it) {
          if (it.phase === 'rise') return it.t / 0.12;
          if (it.phase === 'down') return 1 - it.t / 0.12;
          return 1;
        }
        return {
          down(x, y) {
            for (const h of holes) if (Math.abs(x - h.x) < 46 && y < h.y + 14 && y > h.y - 66) { hit(h); return; }
          },
          key(k) { const n = parseInt(k, 10); if (n >= 1 && n <= 9) hit(holes[n - 1]); },
          update(dt) {
            spawn -= dt;
            const up = holes.filter(h => h.item).length;
            if (spawn <= 0 && up < maxUp) {
              spawn = rnd(0.42, 0.8) - d * 0.05;
              const free = holes.filter(h => !h.item);
              if (free.length) {
                const h = pick(free);
                const r = Math.random();
                const kind = r < 0.12 + d * 0.03 ? 'bomb' : r < 0.28 + d * 0.03 ? 'pet' : 'critter';
                h.item = { kind, phase: 'rise', t: 0, stay: upTime * (kind === 'pet' ? 0.8 : 1) * rnd(0.85, 1.15), bonk: 0 };
              }
            }
            for (const h of holes) {
              const it = h.item;
              if (!it) continue;
              it.t += dt;
              if (it.bonk) { it.bonk -= dt; if (it.bonk <= 0) h.item = null; continue; }
              if (it.phase === 'rise' && it.t >= 0.12) { it.phase = 'up'; it.t = 0; }
              else if (it.phase === 'up' && it.t >= it.stay) { it.phase = 'down'; it.t = 0; }
              else if (it.phase === 'down' && it.t >= 0.12) h.item = null;
            }
          },
          draw(c) {
            rect(c, 0, 0, W, H, C.grass);
            for (let i = 0; i < 40; i++) rect(c, (i * 83) % W, (i * 47) % H, 6, 3, C.grass2);
            rect(c, 0, 0, W, 50, C.sky);
            drawClouds(c, G.t, 5, 8);
            rect(c, 0, 50, W, 3, C.ink);
            for (const h of holes) {
              // hole
              rect(c, h.x - 40, h.y - 8, 80, 18, C.ink);
              rect(c, h.x - 34, h.y - 12, 68, 4, C.ink);
              rect(c, h.x - 36, h.y - 6, 72, 12, '#1a1428');
              const it = h.item;
              if (it) {
                const vis = it.bonk ? 1 : clamp(visible(it), 0, 1);
                c.save();
                c.beginPath(); c.rect(h.x - 46, h.y - 80, 92, 80); c.clip();
                const lift = vis * 58;
                const base = h.y + 56 - lift;
                if (it.kind === 'pet') drawPet(c, G.pet, h.x, base - 4, 3, G.petOpts({ anim: it.bonk ? 'happy' : 'idle' }));
                else if (it.kind === 'bomb') { sprC(c, 'bomb', h.x, base - 24, 5); if (Math.floor(G.t * 10) % 2) rect(c, h.x + 12, base - 46, 4, 4, C.gold); }
                else {
                  sprC(c, 'critter', h.x, base - 22, 5.5);
                  if (it.bonk) { rect(c, h.x - 14, base - 30, 8, 3, C.ink); rect(c, h.x + 6, base - 30, 8, 3, C.ink); }
                }
                c.restore();
                if (it.bonk) for (let k = 0; k < 3; k++) { const a = G.t * 8 + k * 2.1; sprC(c, 'star', h.x + Math.cos(a) * 22, h.y - 62 + Math.sin(a) * 6, 1.5); }
              }
              // front lip
              rect(c, h.x - 40, h.y + 6, 80, 6, C.brown2);
              rect(c, h.x - 40, h.y + 10, 80, 3, C.ink);
            }
          },
        };
      },
    },

    // ------------------------------------------------------------------
    dodge: {
      name: 'Sky Fall',
      desc: 'Things are falling from the sky! Slide to dodge and survive.',
      controls: 'Drag, or arrow keys',
      make(G) {
        const d = G.d;
        G.mode = 'survive'; G.duration = 20; G.hearts = 3;
        const groundY = H - 30, px = 2.6;
        const me = mover(G, 230 + d * 15);
        const hz = [];
        let spawn = 0.6, invul = 0;
        G.hudLeft = () => 'Dodged ' + G.score;
        return {
          update(dt) {
            me.update(dt);
            invul = Math.max(0, invul - dt);
            spawn -= dt;
            if (spawn <= 0) {
              spawn = Math.max(0.16, rnd(0.5, 0.75) - d * 0.075 - G.t * 0.008);
              const big = d >= 4 && Math.random() < 0.12;
              const k = big ? 'rock' : pick(['rock', 'flame', 'acorn']);
              const aim = Math.random() < 0.3 ? me.x + rnd(-30, 30) : rnd(14, W - 14);
              hz.push({ x: clamp(aim, 12, W - 12), y: -20, vy: (110 + d * 26 + G.t * 4) * rnd(0.85, 1.2) * (big ? 0.8 : 1), vx: d >= 3 && Math.random() < 0.3 ? rnd(-50, 50) : 0, k, s: big ? 5 : 3, r: big ? 18 : 10 });
            }
            for (let i = hz.length - 1; i >= 0; i--) {
              const o = hz[i];
              o.y += o.vy * dt; o.x += o.vx * dt;
              if (o.x < 10 || o.x > W - 10) o.vx = -o.vx;
              const py = groundY - 18;
              if (invul <= 0 && Math.abs(o.x - me.x) < o.r + 12 && Math.abs(o.y - py) < o.r + 14) {
                hz.splice(i, 1); invul = 1.0;
                G.burst(o.x, o.y, o.k === 'flame' ? C.orange : C.stone, 14); G.hurt();
                continue;
              }
              if (o.y > groundY - 4) {
                hz.splice(i, 1); G.score++;
                G.burst(o.x, groundY, o.k === 'flame' ? C.orange : C.stone2, 5);
                if (o.s > 3) G.shake(4);
              }
            }
          },
          draw(c) {
            drawSkyGround(c, G.t, groundY, { sky: '#b9b0e8', sky2: '#d8d1f7' });
            for (const o of hz) {
              // landing shadow
              const k = clamp(o.y / groundY, 0, 1);
              rect(c, o.x - o.r * k, groundY + 2, o.r * 2 * k, 3, C.grass2);
              sprC(c, o.k, o.x, o.y, o.s);
            }
            if (!(invul > 0 && Math.floor(invul * 12) % 2)) drawPet(c, G.pet, me.x, groundY + 2 + (me.moving ? -Math.abs(Math.sin(G.t * 16)) * 3 : 0), px, G.petOpts({ flip: me.flip }));
          },
        };
      },
    },

    // ------------------------------------------------------------------
    rodeo: {
      name: 'Bull Rodeo',
      desc: 'Hold the left or right side to stay balanced. Keep the needle in the green!',
      controls: 'Hold left / right side, or arrow keys',
      legendary: true,
      make(G) {
        const d = G.d;
        G.mode = 'survive'; G.duration = 20; G.hearts = 1; G.noHearts = true;
        const s = rodeoInit(d);
        let bounce = 0, bounceV = 0, thrown = false, flyT = 0, buckFlash = 0, warnTick = 0;
        G.hudLeft = () => (s.out > 0 ? 'HOLD ON!' : 'Ride it!');
        return {
          update(dt) {
            if (thrown) { flyT += dt; return; }
            if (G.over) return;
            const input = (G.input.right ? 1 : 0) - (G.input.left ? 1 : 0);
            const ev = rodeoStep(s, dt, input, G.t);
            if (ev.jerk) { bounceV = 160 + Math.abs(ev.jerk) * 60; buckFlash = 0.15; G.shake(3 + Math.abs(ev.jerk) * 2); sfx('crack'); }
            bounceV -= 900 * dt; bounce += bounceV * dt;
            if (bounce < 0) { bounce = 0; bounceV = 60 + Math.random() * 90 * (1 + G.t / 10); }
            buckFlash = Math.max(0, buckFlash - dt);
            G.score = Math.floor(G.t);
            if (s.out > 0) { warnTick -= dt; if (warnTick <= 0) { sfx('tick'); warnTick = 0.12; } }
            if (s.out > 0.6) {
              thrown = true; flyT = 0; G.shake(10); G.burst(W / 2, 150, C.sand2, 20);
              G.end(false, 'THROWN!');
            }
          },
          draw(c) {
            // arena
            rect(c, 0, 0, W, H, C.sky);
            drawClouds(c, G.t, 4, 50);
            rect(c, 0, 168, W, H - 168, C.sand);
            for (let i = 0; i < 30; i++) rect(c, (i * 71) % W, 180 + (i * 29) % 110, 8, 3, C.sand2);
            rect(c, 0, 166, W, 3, C.ink);
            for (let x = 4; x < W; x += 36) { rect(c, x, 128, 8, 40, C.ink); rect(c, x + 2, 130, 4, 36, C.brown); }
            rect(c, 0, 136, W, 6, C.ink); rect(c, 0, 137, W, 4, C.brown);
            rect(c, 0, 152, W, 6, C.ink); rect(c, 0, 153, W, 4, C.brown);
            // meter
            const mx = 30, mw = W - 60, my = 14, mh = 22;
            rect(c, mx + 4, my + 4, mw, mh, C.ink);
            box(c, mx, my, mw, mh, C.red, 3);
            const sz = s.safe * mw / 2;
            rect(c, W / 2 - sz, my + 3, sz * 2, mh - 6, C.mint);
            rect(c, W / 2 - 1, my + 3, 2, mh - 6, C.grass2);
            const nx = W / 2 + clamp(s.n, -1, 1) * (mw / 2 - 4);
            rect(c, nx - 3, my - 6, 6, mh + 12, C.ink); rect(c, nx - 1, my - 4, 2, mh + 8, C.white);
            // danger fuse
            if (s.out > 0) {
              const f = clamp(s.out / 0.6, 0, 1);
              box(c, W / 2 - 60, my + mh + 8, 120, 10, C.panel);
              rect(c, W / 2 - 58, my + mh + 10, 116 * f, 6, Math.floor(G.t * 16) % 2 ? C.red : C.pink);
            }
            // bull + rider
            const tilt = clamp(s.n, -1.2, 1.2);
            const bx = W / 2, by = 236 - bounce * 0.35;
            rect(c, bx - 54, 240, 108, 6, C.sand2);
            c.save();
            c.translate(bx, by);
            c.rotate(tilt * 0.22 + Math.sin(G.t * 11) * 0.03);
            drawBull(c, G.t, buckFlash > 0);
            if (!thrown) {
              c.translate(-4, -46);
              c.rotate(tilt * 0.55);
              drawPet(c, G.pet, 0, 2, 2.6, G.petOpts({ anim: s.out > 0 ? 'sad' : 'idle', flip: tilt > 0.2 }));
            }
            c.restore();
            if (thrown) {
              const fx = bx + (s.n >= 0 ? 1 : -1) * flyT * 260, fy = by - 60 - flyT * 200 + flyT * flyT * 600;
              c.save(); c.translate(fx, fy); c.rotate(flyT * 12 * (s.n >= 0 ? 1 : -1));
              drawPet(c, G.pet, 0, 20, 2.6, G.petOpts({ anim: 'sad' })); c.restore();
            }
            // touch hints
            const L = G.input.left, R = G.input.right;
            box(c, 8, H - 40, 44, 32, L ? C.gold : C.panel);
            box(c, W - 52, H - 40, 44, 32, R ? C.gold : C.panel);
            for (let i = 0; i < 5; i++) {
              const hh = 2 + i * 4, yy = H - 24 - hh / 2;
              rect(c, 20 + i * 3, yy, 3, hh, C.ink);
              rect(c, W - 23 - i * 3, yy, 3, hh, C.ink);
            }
            rect(c, 35, H - 26, 8, 4, C.ink); rect(c, W - 43, H - 26, 8, 4, C.ink);
          },
        };
      },
    },
  };

  // rodeo physics, kept pure so it can be tuned/tested
  function rodeoInit(d) {
    return {
      d, n: 0, v: 0, out: 0, jt: 1.2,
      safe: 0.5 - d * 0.02,
      ph1: rnd(0, 6), ph2: rnd(0, 6), ph3: rnd(0, 6),
    };
  }
  function rodeoStep(s, dt, input, t) {
    const d = s.d;
    const ev = { jerk: 0 };
    const k = 0.8 + d * 0.07;              // instability: the needle wants to fall over
    const A = (0.6 + d * 0.11) * (1 + t / 22);   // bucking force grows over the ride
    const bull = A * (0.7 * Math.sin(1.7 * t + s.ph1) + 0.5 * Math.sin(2.9 * t + s.ph2) + 0.35 * Math.sin(5.3 * t + s.ph3));
    s.jt -= dt;
    if (s.jt <= 0) {
      s.jt = rnd(0.7, 1.5) - d * 0.06;
      const sign = Math.random() < 0.6 ? (s.n >= 0 ? 1 : -1) : (Math.random() < 0.5 ? -1 : 1);
      const j = sign * (0.5 + d * 0.08) * (1 + t / 25) * rnd(0.7, 1.3);
      s.v += j; ev.jerk = j;
    }
    const a = k * s.n + bull + input * 6.0 - 2.6 * s.v;
    s.v += a * dt;
    s.n += s.v * dt;
    if (s.n > 1.15) { s.n = 1.15; s.v = Math.min(0, s.v); }
    if (s.n < -1.15) { s.n = -1.15; s.v = Math.max(0, s.v); }
    if (Math.abs(s.n) > s.safe) s.out += dt; else s.out = 0;
    return ev;
  }

  function drawBull(c, t, flash) {
    const b = flash ? '#c98d5f' : C.brown;
    // legs
    const k = Math.sin(t * 14) * 3;
    rect(c, -40, -4, 12, 12 + k, C.ink); rect(c, -38, -4, 8, 10 + k, C.brown2);
    rect(c, 26, -4, 12, 12 - k, C.ink); rect(c, 28, -4, 8, 10 - k, C.brown2);
    // body
    box(c, -50, -40, 96, 40, b, 3);
    rect(c, -44, -14, 84, 6, C.brown2);
    rect(c, -10, -36, 20, 10, C.panel2); // saddle blanket
    rect(c, -10, -30, 20, 2, C.pink);
    // head
    box(c, 36, -50, 34, 30, b, 3);
    rect(c, 60, -36, 8, 10, C.pink);
    rect(c, 46, -42, 4, 4, C.ink);
    // horns
    rect(c, 38, -60, 6, 12, C.ink); rect(c, 40, -58, 2, 8, C.panel);
    rect(c, 62, -60, 6, 12, C.ink); rect(c, 64, -58, 2, 8, C.panel);
    // tail
    rect(c, -58, -36 + Math.sin(t * 9) * 4, 10, 4, C.ink);
  }

  // =====================================================================
  //  CSS
  // =====================================================================
  const CSS = `
.mg-overlay { z-index: 80; }
.mg-card { position: relative; padding: 12px; max-height: calc(100% - 16px); overflow: auto; overscroll-behavior: contain; }
.mg-head { display: flex; align-items: flex-start; gap: 10px; text-align: left; margin-bottom: 10px; padding-right: 2px; }
.mg-head .mg-titles { flex: 1; min-width: 0; }
.mg-head h2 { font-size: 11px; }
.mg-head .sub { font-size: 14px; }
.mg-x { flex: none; width: 34px; height: 34px; }
.mg-pet { width: 112px; height: 112px; display: block; margin: 4px auto 6px; }
.mg-legend { display: inline-block; font-family: var(--display, monospace); font-size: 9px; padding: 4px 8px; border: 3px solid var(--ink, #2b2140); background: var(--gold, #ffcf4d); margin-bottom: 6px; animation: glow 1s infinite alternate; }
.mg-how { font-size: 17px; margin: 4px 0 6px; }
.mg-ctrl { font-size: 13px; color: var(--ink-2, #6f6386); margin-bottom: 10px; }
.mg-meta { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.mg-pips { display: inline-flex; gap: 2px; align-items: center; }
.mg-hud { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; font-weight: 700; font-variant-numeric: tabular-nums; }
.mg-hud .mg-score { font-family: var(--display, monospace); font-size: 10px; }
.mg-hud .mg-hearts { display: inline-flex; gap: 2px; line-height: 0; }
.mg-hud .mg-time { font-family: var(--display, monospace); font-size: 10px; min-width: 40px; text-align: right; }
.mg-timer { margin-bottom: 8px; }
.mg-timer > i { transition: none; background: var(--mint, #6fe3b1); }
.mg-timer.low > i { background: var(--pink, #ff6f9c); }
.mg-canvas { display: block; width: 100%; height: auto; aspect-ratio: 360 / 300; border: 3px solid var(--ink, #2b2140); background: #9fd3ff; touch-action: none; user-select: none; -webkit-user-select: none; cursor: pointer; }
.mg-verdict { font-family: var(--display, monospace); font-size: 22px; line-height: 1.4; margin: 6px 0 2px; }
.mg-verdict.win { color: var(--pink, #ff6f9c); text-shadow: 3px 3px 0 var(--gold, #ffcf4d); }
.mg-verdict.lose { color: var(--ink-2, #6f6386); }
.mg-score-big { font-family: var(--display, monospace); font-size: 13px; margin: 6px 0 4px; }
.mg-res-sub { margin-bottom: 14px; }
.mg-shake { animation: shake .4s; }
`;
  let cssDone = false;
  function injectCSS() {
    if (cssDone || document.getElementById('mg-style')) { cssDone = true; return; }
    const st = document.createElement('style');
    st.id = 'mg-style';
    st.textContent = CSS;
    document.head.appendChild(st);
    cssDone = true;
  }

  // =====================================================================
  //  open()
  // =====================================================================
  function open(opts) {
    opts = opts || {};
    injectCSS();
    const key = ENGINES[opts.engine] ? opts.engine : 'catch';
    const E = ENGINES[key];
    const diff = clamp(Math.round(opts.difficulty || 1), 1, 5);
    const pet = opts.pet || { species: 'blob', rarity: 'common', name: 'Pet' };
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

    return new Promise((resolve) => {
      const ov = document.createElement('div');
      ov.className = 'overlay center mg-overlay';
      ov.setAttribute('role', 'dialog');
      ov.setAttribute('aria-modal', 'true');
      ov.innerHTML =
        '<div class="card mg-card">' +
          '<div class="mg-head"><div class="mg-titles"><h2>' + esc(opts.title || E.name) + '</h2>' +
          (opts.subtitle ? '<div class="sub">' + esc(opts.subtitle) + '</div>' : '') + '</div>' +
          '<button class="iconbtn mg-x" type="button" aria-label="Close">' + icon('close', 16, '#2b2140') + '</button></div>' +
          '<div class="mg-body"></div>' +
        '</div>';
      document.body.appendChild(ov);
      const card = ov.querySelector('.mg-card');
      const body = ov.querySelector('.mg-body');

      let screen = 'intro', raf = 0, last = 0, done = false, wall = 0;
      let previewCv = null, previewCtx = null, previewAnim = 'idle';
      let cv = null, ctx = null, game = null, eng = null;
      const offs = [];
      function on(el, ev, fn, o) { el.addEventListener(ev, fn, o); offs.push(() => el.removeEventListener(ev, fn, o)); }

      // ---------- game state ----------
      function newGame() {
        const G = {
          d: diff, pet, t: 0, score: 0, target: 0, hearts: 3, maxHearts: 3, duration: 20, mode: 'score',
          input: { left: false, right: false, kl: false, kr: false, pl: false, pr: false },
          ptr: { down: false, x: W / 2, y: H / 2 },
          parts: [], pops: [], shakeT: 0, shakeMag: 0, anim: null, animT: 0,
          phase: 'count', phaseT: 0, over: false, win: false, endMsg: '', invulHurt: 0,
        };
        G.shake = (m) => { G.shakeMag = Math.max(G.shakeMag * (G.shakeT > 0 ? 1 : 0), m); G.shakeT = 0.3; };
        G.burst = (x, y, col, n) => {
          for (let i = 0; i < (n || 8); i++) {
            const a = Math.random() * Math.PI * 2, sp = rnd(40, 160);
            G.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: rnd(0.35, 0.7), col, s: Math.random() < 0.5 ? 3 : 4 });
          }
          if (G.parts.length > 220) G.parts.splice(0, G.parts.length - 220);
        };
        G.pop = (x, y, str, col) => G.pops.push({ x, y, str, col, life: 0.8 });
        G.petAnim = (a, dur) => { G.anim = a; G.animT = dur; };
        G.petOpts = (o) => {
          o = o || {};
          let anim = G.animT > 0 ? G.anim : 'idle';
          if (G.phase === 'end') anim = G.win ? 'happy' : 'sad';
          if (o.anim && !(G.animT > 0) && G.phase !== 'end') anim = o.anim;
          return { t: wall, anim, flip: !!o.flip, blink: (wall % 3.4) < 0.12 };
        };
        G.addScore = (n) => {
          G.score += n;
          if (G.mode === 'score' && G.score >= G.target) G.end(true);
        };
        G.hurt = () => {
          if (G.over) return;
          G.hearts--; G.shake(7); sfx('hit'); G.petAnim('sad', 0.6);
          card.classList.remove('mg-shake'); void card.offsetWidth; card.classList.add('mg-shake');
          if (G.hearts <= 0) G.end(false);
        };
        G.end = (win, msg) => {
          if (G.over) return;
          G.over = true; G.win = !!win; G.phase = 'end'; G.phaseT = 0; G.endMsg = msg || (win ? 'WIN!' : 'OUCH!');
          if (win) { sfx(E.legendary ? 'legendary' : 'reward'); for (let i = 0; i < 4; i++) G.burst(rnd(60, W - 60), rnd(60, 160), pick([C.pink, C.gold, C.mint, C.lilac]), 12); }
          else sfx('error');
        };
        return G;
      }

      // ---------- screens ----------
      function petPreview(where, size) {
        previewCv = document.createElement('canvas');
        previewCv.className = 'mg-pet';
        const dpr = Math.min(3, window.devicePixelRatio || 1);
        previewCv.width = size * dpr; previewCv.height = size * dpr;
        previewCv.style.width = size + 'px'; previewCv.style.height = size + 'px';
        previewCtx = previewCv.getContext('2d');
        previewCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        previewCtx.imageSmoothingEnabled = false;
        previewCv._size = size;
        where.appendChild(previewCv);
      }
      function drawPreview() {
        if (!previewCtx) return;
        const s = previewCv._size;
        previewCtx.clearRect(0, 0, s, s);
        const px = s / 18;
        const hop = previewAnim === 'happy' ? Math.abs(Math.sin(wall * 6)) * s * 0.06 : 0;
        rect(previewCtx, s * 0.2, s - px * 1.5, s * 0.6, px, 'rgba(43,33,64,.18)');
        drawPet(previewCtx, pet, s / 2, s - px * 1.2 - hop, px, { t: wall, anim: previewAnim, blink: (wall % 3.4) < 0.12 });
      }

      function showIntro() {
        screen = 'intro'; previewAnim = 'idle';
        body.innerHTML = '';
        if (E.legendary) { const l = document.createElement('div'); l.className = 'mg-legend'; l.textContent = 'LEGENDARY TRIAL'; body.appendChild(l); }
        petPreview(body, 112);
        const pips = Array.from({ length: 5 }, (_, i) => icon('star', 14, i < diff ? '#ffcf4d' : '#d9cfe6')).join('');
        const wrap = document.createElement('div');
        wrap.innerHTML =
          '<div class="mg-how">' + esc(E.desc) + '</div>' +
          '<div class="mg-ctrl">' + esc(E.controls) + '</div>' +
          '<div class="mg-meta"><span class="chip"><span class="mg-pips" aria-label="Difficulty ' + diff + ' of 5">' + pips + '</span></span>' +
          (typeof opts.triesLeft === 'number' ? '<span class="chip">' + icon('heart', 14, '#ff6f9c', '#fff') + ' ' + opts.triesLeft + (opts.triesLeft === 1 ? ' try' : ' tries') + ' left</span>' : '') +
          (opts.practice ? '<span class="chip">Practice</span>' : '') + '</div>' +
          '<button class="btn pink block mg-start" type="button">Start</button>';
        body.appendChild(wrap);
        const b = wrap.querySelector('.mg-start');
        b.onclick = () => { sfx('accept'); startPlay(); };
        try { b.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
      }

      let hudScore, hudHearts, hudTime, hudBar, hudMeter, lastHud = '';
      function startPlay() {
        screen = 'play';
        previewCv = previewCtx = null;
        body.innerHTML =
          '<div class="mg-hud"><span class="mg-score"></span><span class="mg-hearts"></span><span class="mg-time"></span></div>' +
          '<div class="meter mg-timer"><i style="width:100%"></i></div>';
        hudScore = body.querySelector('.mg-score'); hudHearts = body.querySelector('.mg-hearts');
        hudTime = body.querySelector('.mg-time'); hudMeter = body.querySelector('.mg-timer'); hudBar = hudMeter.firstChild;
        cv = document.createElement('canvas');
        cv.className = 'mg-canvas';
        cv.setAttribute('aria-label', E.name);
        body.appendChild(cv);
        const cssW = cv.getBoundingClientRect().width || 330;
        const sc = Math.max(1, (cssW / W) * Math.min(3, window.devicePixelRatio || 1));
        cv.width = Math.round(W * sc); cv.height = Math.round(H * sc);
        ctx = cv.getContext('2d');
        ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
        ctx.imageSmoothingEnabled = false;
        game = newGame();
        eng = E.make(game);
        game.maxHearts = game.hearts;
        lastHud = '';
        bindCanvas();
        sfx('open');
      }

      function showResult() {
        screen = 'result';
        const G = game;
        previewAnim = G.win ? 'happy' : 'sad';
        body.innerHTML = '';
        const v = document.createElement('div');
        v.className = 'mg-verdict ' + (G.win ? 'win' : 'lose');
        v.textContent = G.win ? 'WIN!' : 'TRY AGAIN';
        body.appendChild(v);
        petPreview(body, 96);
        let targetTxt;
        if (key === 'rodeo') targetTxt = 'Rode ' + Math.min(G.score, G.duration) + 's of ' + G.duration + 's';
        else if (G.mode === 'survive') targetTxt = (key === 'hop' ? 'Cleared ' : 'Dodged ') + G.score + ' / survive ' + G.duration + 's';
        else if (key === 'memory') targetTxt = 'Rounds ' + G.score + ' / ' + G.target;
        else targetTxt = 'Score ' + G.score + ' / ' + G.target;
        let sub;
        if (opts.practice) sub = G.win ? 'Nice practice run. You are ready!' : 'Just practice. Give it another go!';
        else sub = G.win ? (E.legendary ? 'You tamed the bull! Legendary!' : esc(pet.name || 'Your pet') + ' is so proud of you!') : (G.endMsg === 'THROWN!' ? 'Thrown off! Hold the opposite side sooner.' : 'So close. Shake it off!');
        if (!G.win && typeof opts.triesLeft === 'number') sub += ' (' + opts.triesLeft + (opts.triesLeft === 1 ? ' try' : ' tries') + ' left)';
        const w = document.createElement('div');
        w.innerHTML = '<div class="mg-score-big">' + esc(targetTxt) + '</div><div class="sub mg-res-sub">' + sub + '</div>' +
          '<button class="btn ' + (G.win ? 'mint' : 'ghost') + ' block mg-cont" type="button">Continue</button>';
        body.appendChild(w);
        const b = w.querySelector('.mg-cont');
        b.onclick = () => { sfx('tap'); finish(G.win); };
        try { b.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
      }

      function finish(win) {
        if (done) return;
        done = true;
        cancelAnimationFrame(raf);
        offs.forEach(f => f()); offs.length = 0;
        unbindCanvas();
        ov.remove();
        resolve({ win: !!win, score: game ? game.score : 0 });
      }

      // ---------- input ----------
      const pointers = new Map();
      let canvasOffs = [];
      function toLocal(e) {
        const r = cv.getBoundingClientRect();
        return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
      }
      function syncPtrInput() {
        let l = false, r = false;
        pointers.forEach(p => { if (p.x < W / 2) l = true; else r = true; });
        if (key === 'rodeo') { game.input.pl = l; game.input.pr = r; }
        game.input.left = game.input.kl || game.input.pl;
        game.input.right = game.input.kr || game.input.pr;
      }
      function bindCanvas() {
        const add = (ev, fn) => { cv.addEventListener(ev, fn); canvasOffs.push(() => cv.removeEventListener(ev, fn)); };
        add('pointerdown', (e) => {
          e.preventDefault();
          try { cv.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
          const p = toLocal(e);
          pointers.set(e.pointerId, p);
          game.ptr.down = true; game.ptr.x = p.x; game.ptr.y = p.y;
          syncPtrInput();
          if (game.phase === 'play' && eng.down) eng.down(p.x, p.y);
        });
        add('pointermove', (e) => {
          if (!pointers.has(e.pointerId)) return;
          const p = toLocal(e);
          pointers.set(e.pointerId, p);
          game.ptr.x = p.x; game.ptr.y = p.y;
          syncPtrInput();
        });
        const up = (e) => {
          if (!pointers.has(e.pointerId)) return;
          pointers.delete(e.pointerId);
          game.ptr.down = pointers.size > 0;
          syncPtrInput();
          if (game.phase === 'play' && eng.up) eng.up();
        };
        add('pointerup', up); add('pointercancel', up); add('lostpointercapture', up);
        add('contextmenu', (e) => e.preventDefault());
      }
      function unbindCanvas() { canvasOffs.forEach(f => f()); canvasOffs = []; pointers.clear(); }

      on(window, 'keydown', (e) => {
        if (done) return;
        const k = e.key;
        if (k === 'Escape') { e.preventDefault(); sfx('close'); finish(false); return; }
        if (screen !== 'play') return;
        const nav = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Spacebar'];
        if (nav.includes(k)) e.preventDefault();
        if (k === 'ArrowLeft' || k === 'a' || k === 'A') game.input.kl = true;
        if (k === 'ArrowRight' || k === 'd' || k === 'D') game.input.kr = true;
        syncPtrInput();
        if (game.phase !== 'play' || e.repeat) return;
        if (eng.key) eng.key(k);
        if ((k === ' ' || k === 'Spacebar' || k === 'ArrowUp' || k === 'w' || k === 'W') && eng.action) eng.action();
      });
      on(window, 'keyup', (e) => {
        if (screen !== 'play' || !game) return;
        const k = e.key;
        if (k === 'ArrowLeft' || k === 'a' || k === 'A') game.input.kl = false;
        if (k === 'ArrowRight' || k === 'd' || k === 'D') game.input.kr = false;
        syncPtrInput();
        if ((k === ' ' || k === 'Spacebar' || k === 'ArrowUp' || k === 'w' || k === 'W') && eng.up && game.phase === 'play') eng.up();
      });
      on(window, 'blur', () => { if (game) { game.input.kl = game.input.kr = false; pointers.clear(); game.ptr.down = false; syncPtrInput(); } });
      ov.querySelector('.mg-x').onclick = () => { sfx('close'); finish(false); };

      // ---------- loop ----------
      function step(dt) {
        const G = game;
        G.phaseT += dt;
        if (G.phase === 'count') {
          const before = Math.ceil(1.8 - (G.phaseT - dt));
          const now = Math.ceil(1.8 - G.phaseT);
          if (now !== before && now > 0) sfx('tick');
          if (G.phaseT >= 1.8) { G.phase = 'play'; G.phaseT = 0; sfx('accept'); }
        } else if (G.phase === 'play') {
          G.t += dt;
          eng.update(dt);
          if (!G.over && !G.noClock && G.t >= G.duration) {
            if (G.mode === 'survive') G.end(G.hearts > 0, 'SURVIVED!');
            else G.end(G.score >= G.target, G.score >= G.target ? 'WIN!' : 'TIME UP');
          }
        } else if (G.phase === 'end') {
          if (key === 'rodeo') eng.update(dt);
          if (G.phaseT >= 1.4) { showResult(); return; }
        }
        G.animT = Math.max(0, G.animT - dt);
        G.shakeT = Math.max(0, G.shakeT - dt);
        for (let i = G.parts.length - 1; i >= 0; i--) {
          const p = G.parts[i];
          p.life -= dt; p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.life <= 0) G.parts.splice(i, 1);
        }
        for (let i = G.pops.length - 1; i >= 0; i--) { const p = G.pops[i]; p.life -= dt; p.y -= 40 * dt; if (p.life <= 0) G.pops.splice(i, 1); }
      }

      function render() {
        const G = game, c = ctx;
        c.save();
        if (G.shakeT > 0) {
          const m = G.shakeMag * (G.shakeT / 0.3);
          c.translate(Math.round(rnd(-m, m)), Math.round(rnd(-m, m)));
        }
        eng.draw(c);
        for (const p of G.parts) { c.globalAlpha = clamp(p.life * 2, 0, 1); rect(c, p.x, p.y, p.s, p.s, p.col); }
        c.globalAlpha = 1;
        for (const p of G.pops) { c.globalAlpha = clamp(p.life * 2, 0, 1); text(c, p.str, p.x, p.y, 10, p.col, 'center', true); }
        c.globalAlpha = 1;
        c.restore();
        if (G.phase === 'count') {
          rect(c, 0, 0, W, H, 'rgba(43,33,64,.35)');
          const n = Math.ceil(1.8 - G.phaseT);
          const label = n >= 2 ? 'READY' : 'SET';
          const sc = 1 + (1 - ((1.8 - G.phaseT) % 0.9) / 0.9) * 0.3;
          text(c, label, W / 2, H / 2, Math.round(22 * sc), C.gold, 'center', true);
        } else if (G.phase === 'play' && G.t < 0.5) {
          text(c, 'GO!', W / 2, H / 2, 28, C.mint, 'center', true);
        } else if (G.phase === 'end') {
          rect(c, 0, 0, W, H, G.win ? 'rgba(255,248,234,.25)' : 'rgba(43,33,64,.35)');
          const s = Math.min(1, G.phaseT * 5);
          text(c, G.endMsg, W / 2, H / 2 - 10, Math.round(26 * (0.6 + 0.4 * s)), G.win ? C.gold : C.pink, 'center', true);
        }
      }

      function updateHud() {
        const G = game;
        let frac, timeTxt;
        if (G.noClock) { frac = G.timerFrac ? G.timerFrac() : 1; timeTxt = ''; }
        else { const left = Math.max(0, G.duration - G.t); frac = left / G.duration; timeTxt = Math.ceil(left) + 's'; }
        const scoreTxt = G.hudLeft ? G.hudLeft() : (G.mode === 'survive' ? (key === 'hop' ? 'Cleared ' : 'Score ') + G.score : G.score + ' / ' + G.target);
        const hearts = G.noHearts ? '' : String(G.hearts);
        const sig = scoreTxt + '|' + hearts + '|' + timeTxt;
        if (sig !== lastHud) {
          lastHud = sig;
          hudScore.textContent = scoreTxt;
          hudTime.textContent = timeTxt;
          if (G.noHearts) hudHearts.innerHTML = '';
          else {
            let h = '';
            for (let i = 0; i < G.maxHearts; i++) h += icon('heart', 18, i < G.hearts ? '#ff6f9c' : '#d9cfe6', i < G.hearts ? '#fff' : '#d9cfe6');
            hudHearts.innerHTML = h;
          }
        }
        hudBar.style.width = (clamp(frac, 0, 1) * 100).toFixed(1) + '%';
        hudMeter.classList.toggle('low', frac < 0.25);
      }

      function loop(now) {
        if (done) return;
        raf = requestAnimationFrame(loop);
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
        last = now;
        wall += dt;
        try {
          if (screen === 'play' && game) {
            step(dt);
            if (screen === 'play') { render(); updateHud(); }
          }
          drawPreview();
        } catch (err) {
          console.error('Minigames loop error', err);
        }
      }

      showIntro();
      sfx('open');
      raf = requestAnimationFrame(loop);
    });
  }

  global.Minigames = {
    ENGINES: Object.fromEntries(Object.keys(ENGINES).map(k => [k, { name: ENGINES[k].name, desc: ENGINES[k].desc }])),
    open,
    _rodeo: { init: rodeoInit, step: rodeoStep }, // exposed for tuning/tests
  };
})(window);
