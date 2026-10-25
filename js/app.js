/* =====================================================================
   Familiars — UI controller
   Screens: Home (stage + quests) · Nest · Shop · Village · Story
   Flows:   Hatch → Tutorial → Quest → Proof (AI-checked) → Reward → Evolution
            Gacha · Minigames + duels · Vacation mode
   All data comes from window.API (js/mockApi.js). No state lives here
   except what is currently on screen.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const TYPE_ICON = { food: 'food', social: 'chat', outdoor: 'tree', creative: 'brush' };
  const ic = (name, size = 16, c = 'currentColor', c2 = null) => Icons.svg(name, size, c, c2);
  const TYPE_NAME = { food: 'Food', social: 'Social', outdoor: 'Outdoor', creative: 'Creative' };
  const SCENE_BG = { morning: '#ffe6a8', waiting: '#dfe8ff', food: '#ffd1de', social: '#e4d8ff', outdoor: '#c9f0c4', creative: '#fff0b8', evolve: '#ffffff', night: '#3a2f5c' };
  const RAR = Animals.RARITIES;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const animal = p => Animals.A[p.species] || Animals.A.axolotl;
  const coinIc = (n = 14) => ic('coin', n, '#c9922a', '#ffcf4d');

  function drawIconOnCanvas(c, name, x, y, px, color, color2 = '#fff8ea') {
    const tmp = document.createElement('div'); tmp.innerHTML = Icons.svg(name, 8, color, color2);
    tmp.querySelectorAll('rect').forEach(r => { c.fillStyle = r.getAttribute('fill'); c.fillRect(x + r.getAttribute('x') * px, y + r.getAttribute('y') * px, px, px); });
  }

  let me = null;            // snapshot from API.getMe()
  let quests = [];
  let village = null;
  let currentTab = 'home';

  // ------------------------------------------------------------------
  // Toast / bubble / confetti / flash
  // ------------------------------------------------------------------
  let toastTimer;
  function toast(msg, ms = 2800) {
    const t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, ms);
  }
  let bubbleTimer;
  function say(text, ms = 3200) {
    const b = $('bubble'); b.textContent = text; b.classList.remove('hide');
    clearTimeout(bubbleTimer); bubbleTimer = setTimeout(() => b.classList.add('hide'), ms);
  }
  function flash() { const f = $('flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }

  const confetti = (() => {
    const cv = $('confetti'); const ctx = cv.getContext('2d');
    let parts = [], raf = null;
    function resize() { cv.width = innerWidth; cv.height = innerHeight; }
    addEventListener('resize', resize); resize();
    function burst(n = 90, colors = ['#ff6f9c', '#ffcf4d', '#6fe3b1', '#b79cff', '#5ab0ff', '#fff']) {
      for (let i = 0; i < n; i++) parts.push({ x: cv.width / 2 + (Math.random() - .5) * 120, y: cv.height * 0.35,
        vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, s: 6 + Math.random() * 8, c: colors[i % colors.length], life: 90 + Math.random() * 40 });
      if (!raf) tick();
    }
    function tick() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      parts = parts.filter(p => p.life > 0 && p.y < cv.height + 20);
      parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.45; p.vx *= 0.99; p.life--; ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); });
      raf = parts.length ? requestAnimationFrame(tick) : (ctx.clearRect(0, 0, cv.width, cv.height), null);
    }
    return { burst };
  })();

  // ------------------------------------------------------------------
  // Theme: every animal restyles the app (class scenery + its own colours)
  // ------------------------------------------------------------------
  function applyTheme() {
    if (!me || !me.pet) return;
    Sprites.applyAnimalTheme(me.pet.species);
    $('phone').dataset.rarity = Animals.normRarity(me.pet.rarity);
  }

  // ------------------------------------------------------------------
  // Stage: class scenery + the pet
  // ------------------------------------------------------------------
  const stage = (() => {
    const cv = $('stageCanvas'); const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height, PX = 10;
    let mode = 'idle', modeUntil = 0, blinkUntil = 0, nextBlink = performance.now() + 2000;
    const clouds = [{ x: 30, y: 24, w: 7 }, { x: 220, y: 50, w: 5 }, { x: 330, y: 18, w: 6 }];
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

    function cloud(c, t, col = '#ffffff') {
      const x = ((c.x + t / 90) % (W + 100)) - 60, y = c.y;
      R(x, y + 8, c.w * 8, 8, col); R(x + 8, y, (c.w - 2) * 8, 8, col); R(x + 16, y - 8, (c.w - 4) * 8, 8, col);
    }
    function sun(c = '#ffcf4d') { R(W - 70, 20, 32, 32, c); R(W - 78, 28, 48, 16, c); R(W - 62, 12, 16, 48, c); }
    function ground(top, base, dark) {
      R(0, H - 60, W, 60, top); R(0, H - 52, W, 52, base);
      ctx.fillStyle = dark;
      for (let x = 0; x < W; x += 24) { ctx.fillRect(x + (x / 24 % 2) * 6, H - 56, 4, 6); ctx.fillRect(x + 14, H - 50, 4, 4); }
    }
    const SCENES = {
      farm(t) {
        sun(); clouds.forEach(c => cloud(c, t));
        // barn
        R(18, 88, 84, 72, '#d9483b'); R(10, 80, 100, 10, '#7a2a24'); R(26, 64, 68, 18, '#d9483b'); R(34, 56, 52, 10, '#7a2a24');
        R(44, 116, 32, 44, '#fff8ea'); R(48, 120, 24, 40, '#7a2a24'); R(48, 120, 24, 3, '#fff8ea'); R(58, 120, 4, 40, '#fff8ea');
        ground('#d7e89a', '#b9d97a', '#8db356');
        // fence
        for (let x = 120; x < W; x += 30) R(x, H - 82, 6, 30, '#fff8ea');
        R(116, H - 76, W, 5, '#fff8ea'); R(116, H - 64, W, 5, '#fff8ea');
        // hay bale
        R(W - 70, H - 46, 44, 26, '#e8c24a'); R(W - 70, H - 38, 44, 3, '#c79a2a'); R(W - 70, H - 28, 44, 3, '#c79a2a');
      },
      wild(t) {
        clouds.forEach(c => cloud(c, t, '#f4fff9'));
        const tree = (x, h, c) => { for (let i = 0; i < 4; i++) R(x - 6 - i * 8, H - 60 - h + i * 18, 12 + i * 16, 20, c); R(x - 4, H - 70, 8, 14, '#6b4a2a'); };
        [[30, 110, '#3f8f52'], [80, 140, '#2f7a45'], [330, 130, '#2f7a45'], [380, 100, '#3f8f52'], [290, 90, '#4fa362']].forEach(([x, h, c]) => tree(x, h, c));
        ground('#8fd48a', '#6fbf73', '#3f8f52');
        [[120, '#e8574a'], [260, '#ffcf4d']].forEach(([x, c]) => { R(x, H - 42, 16, 8, c); R(x + 4, H - 44, 8, 2, c); R(x + 6, H - 34, 4, 8, '#fff8ea'); R(x + 3, H - 40, 2, 2, '#fff'); });
      },
      prairie(t) {
        R(W - 120, 30, 64, 64, '#ffe39a'); R(W - 128, 46, 80, 32, '#ffe39a'); R(W - 104, 22, 32, 80, '#ffe39a');
        // mesas
        R(0, H - 110, 120, 52, '#d9824a'); R(20, H - 126, 70, 18, '#d9824a'); R(0, H - 110, 120, 6, '#b8622d');
        R(260, H - 96, 140, 40, '#e09a5a'); R(290, H - 108, 80, 14, '#e09a5a');
        ground('#efd78a', '#e3c46a', '#c19a3d');
        // cactus
        R(150, H - 104, 14, 54, '#4f9e48'); R(136, H - 88, 8, 20, '#4f9e48'); R(136, H - 74, 16, 6, '#4f9e48'); R(170, H - 96, 8, 22, '#4f9e48'); R(162, H - 80, 16, 6, '#4f9e48');
        // bluebonnets
        for (let x = 20; x < W; x += 46) { R(x, H - 30, 6, 10, '#3f63c9'); R(x + 1, H - 34, 4, 4, '#ffffff'); R(x + 2, H - 20, 2, 8, '#4f9e48'); }
      },
      water(t) {
        sun(); clouds.forEach(c => cloud(c, t));
        ground('#a7dfa0', '#8fd48a', '#5fb35e');
        // pond
        R(40, H - 44, W - 80, 40, '#4aa6e8'); R(28, H - 36, W - 56, 26, '#4aa6e8'); R(60, H - 40, 60, 3, '#bfe6ff');
        const wave = Math.floor(t / 300) % 2;
        R(200 + wave * 6, H - 26, 30, 3, '#bfe6ff'); R(300 - wave * 6, H - 34, 24, 3, '#bfe6ff');
        // lily pads
        [[90, H - 26], [320, H - 20]].forEach(([x, y]) => { R(x, y, 22, 8, '#5fb35e'); R(x + 4, y - 2, 14, 2, '#5fb35e'); R(x + 16, y + 2, 4, 4, '#4aa6e8'); });
        R(108, H - 34, 6, 6, '#ff9fb8');
        // reeds
        for (let i = 0; i < 5; i++) { R(12 + i * 6, H - 90 + (i % 2) * 10, 3, 50, '#4f9e48'); R(11 + i * 6, H - 94 + (i % 2) * 10, 5, 10, '#8a5a3c'); }
      },
      legends(t) {
        // dusk
        for (let i = 0; i < 6; i++) R(0, i * 28, W, 28, ['#3b2a5e', '#5b3f8f', '#8a4f9e', '#c9618a', '#ff8f5e', '#ffb36b'][i]);
        // stars
        [[30, 14], [90, 30], [160, 10], [220, 24], [300, 12], [370, 36]].forEach(([x, y], i) => { if ((Math.floor(t / 400) + i) % 3) R(x, y, 3, 3, '#fff'); });
        // skyline + UT Tower
        ctx.fillStyle = '#2b2140';
        [[0, 60], [30, 90], [56, 70], [80, 110], [112, 64], [300, 86], [326, 120], [356, 72], [378, 96]].forEach(([x, h]) => ctx.fillRect(x, H - 56 - h, 26, h));
        R(190, H - 160, 26, 104, '#2b2140'); R(184, H - 120, 38, 8, '#2b2140'); R(194, H - 176, 18, 18, '#2b2140'); R(200, H - 186, 6, 10, '#2b2140');
        R(196, H - 150, 4, 6, '#ffcf4d'); R(206, H - 150, 4, 6, '#ffcf4d'); R(196, H - 136, 4, 6, '#ffcf4d'); R(206, H - 136, 4, 6, '#ffcf4d');
        // bats leaving the bridge
        for (let i = 0; i < 7; i++) { const bx = (i * 61 + t / 25) % (W + 40) - 20, by = 40 + ((i * 23) % 50) + Math.sin(t / 200 + i) * 6, f = Math.floor(t / 150 + i) % 2;
          R(bx, by, 4, 3, '#2b2140'); R(bx - 4, by - f * 2, 4, 2, '#2b2140'); R(bx + 4, by - f * 2, 4, 2, '#2b2140'); }
        ground('#7a5aa8', '#5d4690', '#3b2a5e');
        // Congress bridge arches
        R(0, H - 62, W, 6, '#bf5700');
        for (let x = 10; x < W; x += 60) { R(x, H - 56, 6, 10, '#bf5700'); R(x + 40, H - 56, 6, 10, '#bf5700'); }
      },
    };

    function frame(t) {
      ctx.clearRect(0, 0, W, H);
      Sprites.drawHabitat(ctx, me && me.pet ? me.pet.species : 'axolotl', W, H);
      if (!me || !me.pet) { requestAnimationFrame(frame); return; }

      if (t > nextBlink) { blinkUntil = t + 140; nextBlink = t + 1800 + Math.random() * 2500; }
      const away = me.vacation && me.vacation.active;
      const blink = t < blinkUntil || away;
      if (t > modeUntil) mode = 'idle';
      let anim = mode;
      if (anim === 'idle' && (me.mood < 35 || away)) anim = 'sad';

      let dy = Math.sin(t / 380) * 3, sx = 1, sy = 1;
      if (anim === 'happy') { const p = (t % 420) / 420; dy = -Math.abs(Math.sin(p * Math.PI)) * 26; sx = 1.06; sy = 0.94 + Math.abs(Math.sin(p * Math.PI)) * 0.12; }
      if (anim === 'eat') { sy = 1 + Math.sin(t / 60) * 0.08; sx = 1 - Math.sin(t / 60) * 0.06; }
      if (anim === 'sad') { dy = 4 + Math.sin(t / 900) * 1; sy = 0.96; }

      const w = 16 * PX, h = 16 * PX, x = (W - w) / 2, y = H - 56 - h + 6;
      ctx.fillStyle = 'rgba(43,33,64,.18)'; ctx.fillRect(x + 16, H - 58, w - 32, 6);
      ctx.save(); ctx.translate(x + w / 2, y + h + dy); ctx.scale(sx, sy); ctx.translate(-w / 2, -h);
      Sprites.drawPet(ctx, me.pet, 0, 0, PX, { blink, t, anim });
      ctx.restore();
      if (away) { ctx.fillStyle = '#2b2140'; ctx.font = '14px "Press Start 2P", monospace'; const zz = Math.floor(t / 500) % 3; ctx.fillText('z'.repeat(zz + 1), x + w - 10, y + 20 - zz * 6); }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return { set(m, ms = 1200) { mode = m; modeUntil = performance.now() + ms; } };
  })();

  // tap the pet
  $('stage').addEventListener('pointerdown', e => {
    if (!me || !me.pet) return;
    Audio8.cry(me.pet.species); stage.set('happy', 700);
    const r = $('stage').getBoundingClientRect();
    const h = document.createElement('span'); h.className = 'heart'; h.innerHTML = Math.random() < 0.7 ? ic('heart', 22, ['#ff6f9c', '#ffcf4d', '#6fe3b1'][Math.floor(Math.random() * 3)]) : ic('sparkle', 22, '#ffcf4d');
    h.style.left = (e.clientX - r.left - 10 + (Math.random() - .5) * 30) + 'px'; h.style.top = (e.clientY - r.top - 20) + 'px';
    $('stage').appendChild(h); setTimeout(() => h.remove(), 900);
    if (Math.random() < 0.35) say(petLine());
  });

  const CLASS_LINES = {
    farm: ['Is it snack time? It is always snack time.', 'I counted the chickens. Twice.', 'Barn life is good life.'],
    wild: ['I heard a squirrel. We should follow it.', 'Trees are just tall quests.', 'Let us go somewhere with leaves.'],
    prairie: ['Sun is up. Let us run somewhere.', 'Bluebonnets! Photo! Now!', 'Wide open spaces, wide open quests.'],
    water: ['Splash first, questions later.', 'Turtle Pond? Turtle Pond.', 'I am chill. You should go outside though.'],
    legends: ['Keep Austin weird.', 'The bats are flying tonight.', 'Legends do not wait. Quest.'],
  };
  function petLine() {
    const p = me.pet, n = p.name, a = animal(p);
    const l = (CLASS_LINES[a.cls] || CLASS_LINES.water).concat([`${n} is a ${a.name}. ${a.flavor}`]);
    if (me.vacation && me.vacation.active) return `${n} misses you... (on vacation, mood ${me.mood})`;
    if (me.hunger < 30) l.push(`${n} is STARVING. Food quest please.`);
    if (me.mood < 35) return `${n} feels lonely. A quest would help.`;
    return l[Math.floor(Math.random() * l.length)];
  }

  // ------------------------------------------------------------------
  // Speech (ElevenLabs TTS via server, browser voice fallback)
  // ------------------------------------------------------------------
  let speaking = null;
  async function speak(text, pet = me.pet, mood = 'neutral') {
    if (speaking) { speaking.pause(); speaking = null; }
    const blob = await API.say(text, animal(pet).voice, mood);
    if (blob) { speaking = new Audio(URL.createObjectURL(blob)); speaking.play().catch(() => {}); return true; }
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text);
      const pitch = { cute: 1.6, hyper: 1.5, chill: 0.9, grumpy: 0.6, wise: 0.7, regal: 1.0, spooky: 0.5, cowboy: 0.8 }[animal(pet).voice] || 1.2;
      u.pitch = pitch; u.rate = 1.05; speechSynthesis.speak(u); return true;
    }
    return false;
  }

  // ------------------------------------------------------------------
  // Tabs
  // ------------------------------------------------------------------
  $('tabs').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    Audio8.play('tap'); showTab(b.dataset.tab);
  });
  async function showTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    ['home', 'zoo', 'shop', 'village', 'story'].forEach(t => $('screen-' + t).hidden = t !== tab);
    if (tab === 'home') renderQuests();
    if (tab === 'zoo') await renderZoo();
    if (tab === 'shop') await renderShop();
    if (tab === 'village') await renderVillage();
    if (tab === 'story') await renderStory();
    $('main').scrollTop = 0; window.scrollTo({ top: 0 });
  }

  // ------------------------------------------------------------------
  // Home
  // ------------------------------------------------------------------
  async function refreshMe() { me = await API.getMe(); renderTop(); applyTheme(); }

  function renderTop() {
    if (!me.pet) return;
    const a = animal(me.pet), rarity = Animals.normRarity(me.pet.rarity);
    $('petName').textContent = me.pet.name;
    $('petSub').innerHTML = `<b></b> · Lv ${me.level} <span class="resbadge">${cap(rarity)} ${Animals.RES[rarity]}px</span>`;
    $('petSub').querySelector('b').textContent = a.name;
    $('chipLevel').querySelector('b').textContent = me.level;
    $('chipStreak').querySelector('b').textContent = me.streak;
    $('xpLabel').textContent = `${me.xp} / ${me.xpNeeded}`;
    $('xpBar').style.width = Math.min(100, me.xp / me.xpNeeded * 100) + '%';
    $('moodBar').style.width = me.mood + '%';
    $('moodBar').style.background = me.mood < 35 ? 'var(--pink)' : '';
    $('hungerBar').style.width = me.hunger + '%';
    $('coins').textContent = me.coins;
    $('villageDot').hidden = !me.inboxCount;
    // vacation banner
    const v = me.vacation;
    $('vacBanner').hidden = !(v && v.active);
    if (v && v.active) {
      const h = Math.round(v.remainingMs / 36e5);
      $('vacTitle').textContent = `On vacation · ${h >= 48 ? Math.round(h / 24) + ' days' : h + ' h'} left`;
      $('vacText').textContent = `${me.pet.name} misses you. Mood ${me.mood}/100 and dropping. Duel requests are blocked.`;
    }
    // active blessings
    const buffs = $('activeBuffs'); buffs.innerHTML = '';
    (me.blessings || []).forEach(id => { const b = API.BLESSINGS.find(x => x.id === id); if (b) buffs.insertAdjacentHTML('beforeend', `<span class="tag bless">${ic(b.icon, 12)} ${esc(b.name)}</span>`); });
    if (me.activeCurse) buffs.insertAdjacentHTML('beforeend', `<span class="tag curse">${ic(me.activeCurse.icon, 12)} ${esc(me.activeCurse.name)} from ${esc(me.activeCurse.from)}</span>`);
    buffs.hidden = !buffs.children.length;
  }
  $('vacEnd').onclick = async () => { Audio8.play('reward'); await API.endVacation(); await refreshMe(); stage.set('happy', 2000); say(`${me.pet.name} is SO happy you are back!`); };

  // location: real GPS when allowed, otherwise the GDC building at UT (demo default)
  const UT = { lat: 30.2862, lng: -97.7365, label: 'near GDC, Austin' };
  let loc = null;
  function getLocation() {
    return new Promise(resolve => {
      if (!navigator.geolocation) return resolve(UT);
      const done = (v) => { resolve(v); };
      const t = setTimeout(() => done(UT), 4000);
      navigator.geolocation.getCurrentPosition(
        p => { clearTimeout(t); done({ lat: p.coords.latitude, lng: p.coords.longitude, label: 'near you' }); },
        () => { clearTimeout(t); done(UT); }, { timeout: 3500, maximumAge: 300000 });
    });
  }

  async function renderQuests() {
    if (!me || !me.pet) return;
    $('questSource').textContent = 'Finding real places nearby…';
    if (!loc) loc = await getLocation();
    quests = await API.getQuests(loc);
    const qi = API.questInfo();
    $('questLocText').textContent = loc ? loc.label : UT.label;
    $('questSource').textContent = qi.source === 'serpapi' ? `Real places via SerpApi${qi.writer === 'gemini' ? ', written by ' + me.pet.name + ' (Gemini)' : ''}. Tap the pin for new ones.` : 'Demo places (start the server for live SerpApi quests).';
    const list = $('questList'); list.innerHTML = '';
    quests.forEach(q => {
      const b = document.createElement('button');
      b.className = `quest type-${q.type}` + (q.status === 'done' ? ' done' : '');
      b.innerHTML = `<div class="ic">${ic(TYPE_ICON[q.type], 26, '#2b2140', '#fff8ea')}</div>
        <div><div class="title"></div><div class="meta"></div></div>
        <div class="xp">+${q.xp}<br>XP</div>`;
      b.querySelector('.title').textContent = q.title + (q.status === 'done' ? ' (done)' : '');
      b.querySelector('.meta').textContent = `${TYPE_NAME[q.type]} · ${q.place.name} · ${q.place.dist}`;
      if (q.cursed) b.insertAdjacentHTML('beforeend', `<span class="tag curse">${ic(me.activeCurse.icon, 12)} cursed</span>`);
      else if (q.blessed) b.insertAdjacentHTML('beforeend', `<span class="tag bless">${ic('sparkle', 12)} blessed</span>`);
      if (q.status === 'open') b.addEventListener('click', () => openQuest(q));
      list.appendChild(b);
    });
    await renderInbox();
  }
  $('questLoc').onclick = async () => {
    Audio8.play('tap'); $('questSource').textContent = 'Asking SerpApi for new places…';
    loc = await getLocation();
    const r = await API.refreshQuests(loc);
    if (!r.ok) { Audio8.play('error'); toast(r.message); }
    renderQuests();
  };

  // pixel minimap: you in the centre, the pin at the quest's real bearing and distance (no map tiles)
  function drawMinimap(q) {
    const cv = $('qMap'), c = cv.getContext('2d'), W = cv.width, H = cv.height;
    const p = q.place; const has = typeof p.bearing === 'number' && typeof p.distMi === 'number';
    $('qMapWrap').hidden = !has; if (!has) return;
    const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    R(0, 0, W, H, '#cfe9c2');
    for (let y = 0; y < H; y += 20) for (let x = 0; x < W; x += 20) if ((x / 20 + y / 20) % 2) R(x, y, 20, 20, '#c3e2b5');
    // a couple of fake blocks + a road toward the pin
    [[30, 20, 60, 30], [320, 90, 50, 30], [70, 95, 40, 22], [300, 18, 70, 26]].forEach(([x, y, w, h]) => { R(x, y, w, h, '#e9e3d4'); R(x, y + h - 4, w, 4, '#d6cfbd'); });
    const cx = W / 2, cy = H / 2;
    const scale = Math.min(1, 0.35 / Math.max(0.15, p.distMi));   // pin stays inside the box even when far
    const len = Math.min(cx - 24, 56 + p.distMi * 150 * scale);   // never closer than 56px so the pin clears the pet
    const a = (p.bearing - 90) * Math.PI / 180;
    const px = cx + Math.cos(a) * len, py = cy + Math.sin(a) * len * 0.75;
    c.strokeStyle = '#fff8ea'; c.lineWidth = 8; c.setLineDash([10, 8]); c.beginPath(); c.moveTo(cx, cy); c.lineTo(px, py); c.stroke(); c.setLineDash([]);
    // compass
    R(W - 26, 8, 2, 20, '#2b2140'); c.fillStyle = '#2b2140'; c.font = '8px "Press Start 2P", monospace'; c.fillText('N', W - 30, 38);
    // you
    Sprites.drawPet(c, me.pet, cx - 20, cy - 36, 2.5, { fx: false });
    c.font = '700 11px "Pixelify Sans", sans-serif'; c.fillStyle = '#2b2140'; c.fillText('you', cx - 10, cy + 16);
    // pin
    R(px - 7, py - 24, 14, 14, '#ff6f9c'); R(px - 4, py - 21, 8, 8, '#fff'); R(px - 3, py - 10, 6, 10, '#ff6f9c'); R(px - 7, py - 24, 14, 2, '#2b2140');
    const name = p.name.length > 22 ? p.name.slice(0, 21) + '…' : p.name;
    const tw = c.measureText(name).width + 10; const lx = Math.max(4, Math.min(W - tw - 4, px - tw / 2));
    R(lx, py + 4, tw, 16, '#fff8ea'); R(lx, py + 4, tw, 2, '#2b2140'); c.fillStyle = '#2b2140'; c.fillText(name, lx + 5, py + 16);
    $('qMapLbl').textContent = `${p.dist} · ${compass(p.bearing)}`;
  }
  const compass = b => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(b / 45) % 8];

  // ------------------------------------------------------------------
  // Chat with your pet (Gemini in character via the server; canned lines offline)
  // ------------------------------------------------------------------
  let chatHistory = [];
  const CHAT_CHIPS = ['Any hints?', 'Which quest first?', 'I am tired today', 'Tell me a secret', 'How are you?'];
  function chatBubble(role, text, thinking) {
    const d = document.createElement('div'); d.className = `msg ${role}` + (thinking ? ' thinking' : '');
    if (role === 'pet') { const cv = document.createElement('canvas'); cv.width = 36; cv.height = 36; Sprites.drawPet(cv.getContext('2d'), me.pet, 0, 0, 2.25, { fx: false, anim: thinking ? 'idle' : 'happy' }); d.appendChild(cv); }
    const s = document.createElement('span'); s.textContent = text; d.appendChild(s);
    $('chatLog').appendChild(d); $('chatLog').scrollTop = 1e6; return d;
  }
  function openChat() {
    Audio8.play('open');
    $('chatTitle').textContent = `Talk to ${me.pet.name}`;
    const log = $('chatLog'); log.innerHTML = '';
    if (!chatHistory.length) { const hi = `Hi! I'm ${me.pet.name}. Ask me about today's quests, or just talk. I get chatty.`; chatHistory.push({ role: 'pet', text: hi }); }
    chatHistory.forEach(m => chatBubble(m.role, m.text));
    const chips = $('chatChips'); chips.innerHTML = '';
    CHAT_CHIPS.forEach(t => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = () => sendChat(t); chips.appendChild(b); });
    $('ovChat').hidden = false; $('chatInput').focus();
  }
  async function sendChat(text) {
    text = (text || '').trim(); if (!text) return;
    $('chatInput').value = ''; Audio8.play('tap');
    chatHistory.push({ role: 'you', text }); chatBubble('you', text);
    const th = chatBubble('pet', '…', true); $('chatSend').disabled = true;
    const r = await API.chat(text, chatHistory.slice(-10, -1));
    th.remove(); $('chatSend').disabled = false;
    chatHistory.push({ role: 'pet', text: r.reply }); chatHistory = chatHistory.slice(-24);
    chatBubble('pet', r.reply); Audio8.play('squeak');
    stage.set(r.mood === 'sad' ? 'sad' : 'happy', 1500);
    speak(r.reply, me.pet, r.mood === 'excited' ? 'excited' : r.mood === 'sad' ? 'sad' : r.mood === 'happy' ? 'happy' : 'neutral');
  }
  $('btnTalk').addEventListener('pointerdown', e => e.stopPropagation());
  $('btnTalk').onclick = openChat;
  $('chatClose').onclick = () => { $('ovChat').hidden = true; Audio8.play('close'); if (speaking) { speaking.pause(); speaking = null; } };
  $('ovChat').addEventListener('click', e => { if (e.target === $('ovChat')) $('chatClose').onclick(); });
  $('chatForm').addEventListener('submit', e => { e.preventDefault(); sendChat($('chatInput').value); });

  async function renderInbox() {
    const v = await API.getVillage();
    const box = $('inboxList'); box.innerHTML = '';
    v.inbox.slice(0, 4).forEach(m => {
      const d = document.createElement('div');
      d.className = 'banner ' + (m.kind === 'challenge' ? 'challenge' : m.kind === 'note' ? 'note' : '');
      let icon, title, text, btn;
      if (m.kind === 'curse') { icon = ic(m.curse.icon, 26); title = `${m.from} cursed you`; text = `${m.curse.name}: ${m.curse.desc}`; btn = 'Accept'; }
      else if (m.kind === 'bless') { icon = ic('sparkle', 26, '#c9922a'); title = `${m.from} blessed you`; text = m.blessing.desc; btn = 'Accept'; }
      else if (m.kind === 'challenge') { icon = ic('star', 26, '#2b2140'); title = `${m.from} challenged you`; text = `${m.pet.name}'s ${Minigames.gameFor(m.pet.species).name} · ${m.triesLeft} tries · win ${m.wager} coins`; btn = 'Play'; }
      else { icon = ic('chat', 26); title = m.from; text = m.text; btn = 'OK'; }
      d.innerHTML = `<span class="bigicon">${icon}</span><div class="grow"><b></b><span></span></div><button class="btn sm ${m.kind === 'challenge' ? 'pink' : 'lilac'}">${btn}</button>`;
      d.querySelector('b').textContent = title; d.querySelector('span:not(.bigicon)').textContent = text;
      d.querySelector('button').onclick = async () => {
        if (m.kind === 'challenge') return playChallenge(m);
        Audio8.play(m.kind === 'curse' ? 'curse' : m.kind === 'bless' ? 'bless' : 'tap');
        const r = await API.acceptInbox(m.id); await refreshMe(); renderQuests();
        if (m.kind === 'curse') say(r && r.shielded ? `Hex Shield! ${m.from}'s curse bounced off.` : `${me.pet.name} has been cursed. Ugh.`);
        if (m.kind === 'bless') say(`${me.pet.name} is glowing!`);
      };
      box.appendChild(d);
    });
  }

  // ------------------------------------------------------------------
  // Quest sheet + proof
  // ------------------------------------------------------------------
  let activeQuest = null, proof = null, proofTab = 'photo';

  function openQuest(q) {
    activeQuest = q; proof = null;
    Audio8.play('open');
    $('qTitle').textContent = q.title;
    $('qText').textContent = q.text;
    $('qPlace').textContent = q.place.name;
    $('qPlaceMeta').textContent = `${q.place.kind} · ${q.place.dist} away${q.place.rating ? ' · ' + q.place.rating + ' stars' : ''} · ${q.place.hint}`;
    $('qMaps').hidden = !q.place.mapsUrl; if (q.place.mapsUrl) $('qMaps').href = q.place.mapsUrl;
    drawMinimap(q);
    $('qXp').textContent = q.xp; $('qEgg').textContent = Math.round(q.eggChance * 100) + '%';
    $('qTags').innerHTML = (q.cursed ? `<span class="tag curse">${ic(me.activeCurse.icon, 12)} ${esc(me.activeCurse.name)} by ${esc(me.activeCurse.from)}</span> ` : '') +
      (q.blessings || []).map(id => { const b = API.BLESSINGS.find(x => x.id === id); return b ? `<span class="tag bless">${ic(b.icon, 12)} ${esc(b.name)}</span> ` : ''; }).join('');
    $('qReroll').disabled = !!q.rerolled;
    $('photoPreview').hidden = true; $('photoInput').value = '';
    $('voiceDone').hidden = true; $('recBars').hidden = true; $('voiceHint').hidden = false; $('recBtn').hidden = false; $('recBtn').textContent = 'Hold to record';
    const curse = q.cursed ? me.activeCurse : null;
    $('voiceHint').textContent = curse && curse.proof === 'voice' ? `Cursed: ${curse.desc}` : 'Hold to record. Say what you did. ElevenLabs transcribes it, the game master judges it.';
    $('tabPhoto').disabled = q.forcedProof === 'voice'; $('tabVoice').disabled = q.forcedProof === 'photo';
    setProofTab(q.forcedProof || (q.cursed ? 'voice' : 'photo'));
    $('qSubmit').disabled = true;
    $('ovQuest').hidden = false;
  }
  function closeQuest() { $('ovQuest').hidden = true; Audio8.play('close'); stopRecording(true); }
  $('qClose').onclick = closeQuest;
  $('ovQuest').addEventListener('click', e => { if (e.target === $('ovQuest')) closeQuest(); });
  $('tabPhoto').onclick = () => setProofTab('photo');
  $('tabVoice').onclick = () => setProofTab('voice');
  $('qSpeak').onclick = async () => { Audio8.play('tap'); const ok = await speak(activeQuest.text, me.pet, 'excited'); if (!ok) toast('No voice available on this device.'); };
  function setProofTab(t) {
    proofTab = t;
    $('tabPhoto').classList.toggle('active', t === 'photo'); $('tabVoice').classList.toggle('active', t === 'voice');
    $('proofPhoto').hidden = t !== 'photo'; $('proofVoice').hidden = t !== 'voice';
    $('qSubmit').disabled = !(proof && proof.type === t);
  }
  // photos are downscaled before upload (keeps the Gemini call fast and cheap)
  $('photoInput').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 1024 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const data = c.toDataURL('image/jpeg', 0.85); URL.revokeObjectURL(img.src);
      $('photoPreview').src = data; $('photoPreview').hidden = false; proof = { type: 'photo', data }; $('qSubmit').disabled = false; Audio8.play('accept');
    };
    img.onerror = () => toast('Could not read that image.');
    img.src = URL.createObjectURL(f);
  });

  // voice: hold-to-record with a real MediaRecorder → ElevenLabs Scribe (mock transcript if offline)
  let recStart = 0, recTimer = null, rec = null, recReady = null;
  function recBegin(e) {
    e.preventDefault(); if (recStart) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) { /* older browsers */ }
    recStart = Date.now(); Audio8.play('tick');
    $('recBars').hidden = false; $('voiceHint').hidden = true; $('voiceDone').hidden = true; $('recBtn').textContent = 'Recording… release to stop';
    recTimer = setInterval(() => { $('recBtn').textContent = `Recording ${fmt(Date.now() - recStart)} · release to stop`; }, 200);
    rec = null;
    recReady = (async () => {
      if (!navigator.mediaDevices || !window.MediaRecorder) return null;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const r = new MediaRecorder(stream); const chunks = [];
        r.ondataavailable = ev => ev.data.size && chunks.push(ev.data);
        r.done = new Promise(res => { r.onstop = () => { stream.getTracks().forEach(t => t.stop()); res(new Blob(chunks, { type: r.mimeType || 'audio/webm' })); }; });
        r.start(); rec = r; return r;
      } catch (err) { return null; }
    })();
  }
  function stopRecording(discard) {
    if (rec && rec.state === 'recording') rec.stop();
    if (discard) { recStart = 0; clearInterval(recTimer); }
  }
  async function recEnd() {
    if (!recStart) return;
    const len = Date.now() - recStart; recStart = 0; clearInterval(recTimer);
    $('recBars').hidden = true; $('recBtn').textContent = 'Record again';
    // don't hang on a pending mic-permission prompt: give it a moment, then fall back
    const pending = recReady;
    const r = await Promise.race([pending, sleep(500).then(() => null)]);
    if (r && r.state === 'recording') r.stop();
    else pending.then(late => { if (late && late.state === 'recording') late.stop(); });
    if (len < 600) { $('voiceHint').hidden = false; $('voiceHint').textContent = 'Too short. Hold the button and talk.'; Audio8.play('error'); return; }
    $('voiceHint').hidden = false; $('voiceHint').textContent = 'Transcribing…';
    let t = null, engine = 'mock';
    if (r) { const blob = await r.done; const res = await API.transcribe(blob); if (res && res.text) { t = res.text.trim(); engine = 'elevenlabs'; } }
    if (!t) {
      // offline demo: a believable transcript
      const q = activeQuest, place = q.place.name;
      t = ({ food: `Okay I am at ${place} for the ${q.title.toLowerCase()} quest. I ordered the thing with no name and it was actually incredible.`,
        social: `I am at ${place}. Did the ${q.title.toLowerCase()} quest: I talked to Priya, she is building a laundry-folding robot and loved it.`,
        outdoor: `Made it to ${place} for ${q.title.toLowerCase()}. It is beautiful out here, I took it all in and I am glad I walked.`,
        creative: `I am at ${place} doing ${q.title.toLowerCase()}. I picked one thing, it is mostly blue and I think it is about being tired.` })[q.type];
      const curse = activeQuest.cursed ? me.activeCurse.id : null;
      if (curse === 'pirate') t = 'Arr, matey. ' + t.replace(/\bI\b/g, 'this old sea dog') + ' Arr!';
      if (curse === 'shout') t = t.toUpperCase() + '!!!';
      if (curse === 'rhyme') t = 'I went to the place and I did the thing, then I told my pet and it started to sing.';
    }
    $('voiceHint').hidden = true;
    $('voiceLen').textContent = fmt(len) + (engine === 'elevenlabs' ? ' · ElevenLabs' : ' · offline mock');
    $('voiceTranscript').textContent = '"' + t + '"'; $('voiceDone').hidden = false;
    proof = { type: 'voice', data: { durationMs: len, transcript: t } }; $('qSubmit').disabled = false; Audio8.play('accept');
  }
  const fmt = ms => { const s = Math.round(ms / 1000); return `0:${String(s).padStart(2, '0')}`; };
  $('recBtn').addEventListener('pointerdown', recBegin);
  ['pointerup', 'pointercancel'].forEach(ev => $('recBtn').addEventListener(ev, recEnd));
  $('recBtn').addEventListener('contextmenu', e => e.preventDefault());

  $('qReroll').onclick = async () => {
    Audio8.play('tap'); const q = await API.rerollQuest(activeQuest.id); if (q) { openQuest(q); toast('New quest rolled.'); renderQuests(); }
  };

  $('qSubmit').onclick = async () => {
    if (!proof) return;
    const q = activeQuest, pf = proof; closeQuest();
    $('ovJudging').hidden = false;
    $('judgeLine').textContent = pf.type === 'photo' ? `Checking the photo against ${q.place.name}…` : 'Judging your voice note…';
    const jc = $('judgeCanvas').getContext('2d'); let jt = 0;
    const jraf = setInterval(() => { jc.clearRect(0, 0, 128, 160); jt += 60; Sprites.drawPet(jc, me.pet, 0, 24 + Math.sin(jt / 200) * 4, 8, { t: jt, blink: (jt % 1800) < 150 }); $('dots').textContent = '.'.repeat(1 + (Math.floor(jt / 300) % 3)); }, 60);
    const res = await API.completeQuest(q.id, pf);
    clearInterval(jraf); $('ovJudging').hidden = true;
    if (!res.ok) {
      Audio8.play('error'); stage.set('sad', 2500);
      if (res.rejected) return showInfo(`<div class="big reject">Proof rejected</div><p class="verdict"></p>${res.reasons && res.reasons.length ? '<ul class="reasons">' + res.reasons.map(r => `<li>${esc(r)}</li>`).join('') + '</ul>' : ''}<p class="sub">No XP this time. Try a different photo or voice note.</p>`,
        [['Try again', 'pink', () => openQuest(quests.find(x => x.id === q.id) || q)], ['Later', 'ghost', null]], el => { el.querySelector('.verdict').textContent = '"' + res.message + '"'; });
      return toast(res.message);
    }
    await rewardSequence(q, res);
    await refreshMe(); renderQuests();
    if (res.reaction) setTimeout(() => toast(res.reaction), 800);
  };

  function showInfo(html, buttons, after) {
    $('infoBody').innerHTML = html; const acts = $('infoActs'); acts.innerHTML = '';
    if (after) after($('infoBody'));
    return new Promise(resolve => {
      buttons.forEach(([label, cls, fn]) => {
        const b = document.createElement('button'); b.className = `btn ${cls} block`; b.textContent = label;
        b.onclick = () => { Audio8.play('tap'); $('ovInfo').hidden = true; if (fn) fn(); resolve(label); };
        acts.appendChild(b);
      });
      $('ovInfo').hidden = false;
    });
  }

  // ------------------------------------------------------------------
  // Reward sequence — one step per screen so the demo is controllable
  // ------------------------------------------------------------------
  const EGG_LINE = {
    legendary: 'A LEGENDARY egg. The Texas Longhorn lives in these. Tell everyone.',
    mythic: 'Mythic! Austin Legends and rare beasts hatch from this one.',
    rare: 'Rare! Sharper pixels incoming. Keep questing to hatch it.',
    uncommon: 'Uncommon. A step up from the barnyard.',
    common: 'Common, but every Familiar starts somewhere.',
  };
  function rewardSequence(q, res) {
    const steps = [];
    steps.push(() => {
      Audio8.play('reward'); stage.set(q.type === 'food' ? 'eat' : 'happy', 3000); confetti.burst(60);
      $('rwStep').innerHTML = `<div class="big">Quest complete!</div><p class="verdict"></p><div class="xpnum" id="xpCount">+0 XP</div>${res.blessed ? `<span class="tag bless">${ic('sparkle', 12)} blessed</span> ` : ''}${res.curseLifted ? '<span class="tag curse">curse broken</span>' : ''}<p class="sub">${coinIc()} +${res.coinsGained} coins${res.raidDamage ? ` · ${ic('monster', 14)} ${res.raidDamage} raid damage` : ''}${res.engine && res.engine !== 'mock' ? ` · judged by ${res.engine === 'gemini' ? 'Gemini' : 'the game master'}` : ''}</p>`;
      $('rwStep').querySelector('.verdict').textContent = '"' + res.message + '"';
      countUp($('xpCount'), res.xpGained);
    });
    if (res.levelUp) steps.push(() => {
      Audio8.play('bless'); confetti.burst(40);
      $('rwStep').innerHTML = `<div class="big">Level ${res.level}!</div><p class="sub">${esc(me.pet.name)} feels stronger.</p>`;
    });
    if (res.raidWins && res.raidWins.length) steps.push(() => {
      Audio8.play('legendary'); confetti.burst(160);
      $('rwStep').innerHTML = `<div class="big">Raid boss down!</div><div class="raid boss" style="height:72px">${ic('skull', 64, '#2b2140')}</div><p class="sub">${esc(res.raidWins.join(', '))} defeated. Reward eggs are in your nest.</p>`;
    });
    if (res.egg) steps.push(() => {
      const r = res.egg.rarity;
      Audio8.play(r === 'legendary' ? 'legendary' : 'reward');
      $('rwStep').innerHTML = `<div class="big">Egg drop!</div><canvas id="rwEgg" width="128" height="160"></canvas><div class="rarity ${r}">${r.toUpperCase()}${res.egg.shiny ? ' · SHINY' : ''}</div><p class="sub">${EGG_LINE[r]}</p>`;
      const eggEl = $('rwEgg'), c = eggEl.getContext('2d'); const t0 = performance.now();
      (function drop(t) { if (!eggEl.isConnected) return; const p = Math.min(1, (t - t0) / 700); const y = -140 + Math.sin(p * Math.PI / 2) * 160 + (p === 1 ? Math.abs(Math.sin(t / 120)) * -4 : 0); c.clearRect(0, 0, 128, 160); Sprites.drawEgg(c, r, 0, y, 8, 0, t); requestAnimationFrame(drop); })(t0);
      if (r === 'mythic' || r === 'legendary') { setTimeout(() => { $('rewardCard').classList.add('shake'); confetti.burst(r === 'legendary' ? 180 : 90); }, 700); setTimeout(() => $('rewardCard').classList.remove('shake'), 1200); }
    });
    if (res.evolution) steps.push(() => {
      flash(); Audio8.play('evolve'); stage.set('happy', 4000);
      const ev = res.evolution;
      const from = Object.assign({}, me.pet, { species: ev.from, rarity: ev.fromRarity }), to = Object.assign({}, me.pet, { species: ev.to, rarity: ev.toRarity });
      $('rwStep').innerHTML = `<div class="big">What?! ${esc(me.pet.name)} is evolving!</div><div class="evo"><canvas id="evoA" width="112" height="140"></canvas><span class="arrow">→</span><canvas id="evoB" width="112" height="140"></canvas></div><div class="big" style="font-size:12px">${esc(ev.toName)}</div><p class="sub">${esc(Animals.A[ev.to].flavor)}<br><b>Resolution upgrade: ${Animals.RES[ev.fromRarity]}px → ${Animals.RES[ev.toRarity]}px</b></p>`;
      Sprites.drawPet($('evoA').getContext('2d'), from, 0, 20, 7, { anim: 'sad' }); const cb = $('evoB').getContext('2d');
      let n = 0; const iv = setInterval(() => { cb.clearRect(0, 0, 112, 140); if (n++ % 2) Sprites.drawPet(cb, to, 0, 20, 7); else { cb.fillStyle = '#fff'; cb.fillRect(0, 0, 112, 140); } if (n > 9) { clearInterval(iv); const hv = setInterval(() => { if (!cb.canvas.isConnected) return clearInterval(hv); cb.clearRect(0, 0, 112, 140); Sprites.drawPet(cb, to, 0, 20, 7, { anim: 'happy', t: performance.now() }); }, 80); confetti.burst(140); } }, 120);
    });
    return new Promise(resolve => {
      let i = 0;
      const show = () => { $('rwNext').textContent = i === steps.length - 1 ? 'Continue' : 'Next'; steps[i](); };
      $('rwNext').onclick = () => { Audio8.play('tap'); i++; if (i >= steps.length) { $('ovReward').hidden = true; resolve(); } else show(); };
      $('ovReward').hidden = false; show();
    });
  }
  function countUp(el, target) {
    let v = 0; const step = Math.max(1, Math.round(target / 30));
    const iv = setInterval(() => { v = Math.min(target, v + step); el.textContent = `+${v} XP`; if (v % (step * 4) === 0) Audio8.play('xp'); if (v >= target) clearInterval(iv); }, 30);
  }

  // ------------------------------------------------------------------
  // Nest / collection / dex
  // ------------------------------------------------------------------
  let clsFilter = 'all';
  function petCard(p, opts = {}) {
    const d = document.createElement('div'); const r = Animals.normRarity(p.rarity || animal(p).rarity);
    d.className = `critter r-${r}` + (opts.locked ? ' locked' : '');
    const cv = document.createElement('canvas'); cv.width = 72; cv.height = 72; cv.style.width = '72px'; cv.style.height = '72px'; cv.className = 'pixel';
    Sprites.drawPet(cv.getContext('2d'), p, 0, 0, 4.5, { t: 0, fx: false });
    d.appendChild(cv);
    const a = animal(p);
    d.insertAdjacentHTML('beforeend', `<div class="nm"></div><div class="sp"></div><span class="rar ${r}">${r}</span>${p.isNew ? '<span class="new">NEW</span>' : ''}${p.shiny ? '<span class="shiny">SHINY</span>' : ''}`);
    d.querySelector('.nm').textContent = opts.locked ? '???' : (p.name || a.name);
    d.querySelector('.sp').textContent = opts.locked ? `${cap(r)} · ${Animals.RES[r]}px` : `${a.name}${p.active ? ' · active' : ''}`;
    return d;
  }
  async function renderZoo() {
    const z = await API.getZoo();
    const eg = $('eggGrid'); eg.innerHTML = ''; $('eggEmpty').hidden = z.eggs.length > 0;
    z.eggs.forEach(e => {
      const ready = e.progress >= e.needed;
      const d = document.createElement('div'); d.className = `critter eggcard r-${e.rarity}` + (ready ? ' ready' : '');
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; cv.style.width = '72px'; cv.style.height = '72px';
      Sprites.drawEgg(cv.getContext('2d'), e.rarity, 0, 0, 4, 0);
      d.appendChild(cv);
      d.insertAdjacentHTML('beforeend', `<span class="rar ${e.rarity}">${e.rarity}</span>${e.shiny ? '<span class="shiny">SHINY</span>' : ''}<div class="sp">${ready ? 'Ready to hatch!' : `${e.progress}/${e.needed} quests or wins`}</div><div class="meter pr"><i style="width:${e.progress / e.needed * 100}%"></i></div>`);
      d.onclick = () => ready ? hatchEgg(e) : (Audio8.play('tap'), toast(`Complete ${e.needed - e.progress} more quest${e.needed - e.progress > 1 ? 's' : ''} or minigame win${e.needed - e.progress > 1 ? 's' : ''} to hatch this egg.`));
      eg.appendChild(d);
    });
    // owned
    const all = (z.active ? [Object.assign({}, z.active, { active: true })] : []).concat(z.pets);
    const fl = $('clsFilters'); fl.innerHTML = '';
    ['all'].concat(RAR).forEach(k => {
      const b = document.createElement('button'); b.textContent = k === 'all' ? 'All' : cap(k); b.classList.toggle('on', clsFilter === k);
      b.onclick = () => { clsFilter = k; Audio8.play('tap'); renderZoo(); }; fl.appendChild(b);
    });
    const zg = $('zooGrid'); zg.innerHTML = '';
    const shown = all.filter(p => clsFilter === 'all' || Animals.normRarity(p.rarity) === clsFilter)
      .sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0) || RAR.indexOf(Animals.normRarity(b.rarity)) - RAR.indexOf(Animals.normRarity(a.rarity)));
    shown.forEach(p => { const d = petCard(p); d.onclick = () => openPet(p); zg.appendChild(d); });
    $('zooEmpty').hidden = all.length > 1;
    // dex
    const owned = new Set(all.map(p => p.species));
    const ids = Object.keys(Animals.A);
    $('dexCount').textContent = `${owned.size} / ${ids.length}`;
    const dg = $('dexGrid'); dg.innerHTML = '';
    ids.filter(id => clsFilter === 'all' || Animals.A[id].rarity === clsFilter)
      .sort((a, b) => RAR.indexOf(Animals.A[a].rarity) - RAR.indexOf(Animals.A[b].rarity))
      .forEach(id => { const has = owned.has(id); const d = petCard({ species: id, rarity: Animals.A[id].rarity, name: Animals.A[id].name }, { locked: !has });
        d.onclick = () => { Audio8.play('tap'); toast(has ? `${Animals.A[id].name}: ${Animals.A[id].flavor}` : `Unknown Familiar. Hatches from ${Animals.A[id].rarity} eggs.`); };
        dg.appendChild(d); });
  }

  function hatchEgg(egg) {
    const ov = $('ovEgg'), cv = $('eggCanvas'), c = cv.getContext('2d');
    let taps = 0; $('eggResult').hidden = true; $('eggHint').hidden = false; $('eggHint').textContent = 'Tap it!';
    $('eggTitle').textContent = `A ${egg.rarity} egg is hatching`;
    const draw = (cr) => { c.clearRect(0, 0, 192, 240); Sprites.drawEgg(c, egg.rarity, 0, 40, 12, cr, performance.now()); };
    draw(0); ov.hidden = false;
    cv.onclick = async () => {
      taps++; Audio8.play('crack'); cv.classList.remove('wob'); void cv.offsetWidth; cv.classList.add('wob'); draw(taps);
      $('eggHint').textContent = `${3 - taps} to go`;
      if (taps >= 3) {
        cv.onclick = null; flash(); Audio8.play(egg.rarity === 'legendary' ? 'legendary' : 'hatch'); confetti.burst(egg.rarity === 'legendary' ? 180 : 80);
        const pet = await API.hatchEgg(egg.id);
        setTimeout(() => Audio8.cry(pet.species), 700);
        const hv = setInterval(() => { if (ov.hidden) return clearInterval(hv); c.clearRect(0, 0, 192, 240); Sprites.drawPet(c, pet, 0, 40, 12, { anim: 'happy', t: performance.now() }); }, 80);
        const a = animal(pet);
        $('eggHint').hidden = true; $('eggResult').hidden = false;
        $('eggResultText').innerHTML = `<b>${esc(pet.name)}</b> the <b>${esc(a.name)}</b> joined your collection.${pet.isNew ? ' <b>New to your Dex!</b>' : ''}<br><span class="rar ${pet.rarity}">${pet.rarity}</span> ${pet.shiny ? '<span class="rar legendary">shiny</span>' : ''}<br><span class="sub">${Animals.RES[pet.rarity]}px sprite · minigame: ${esc(Minigames.gameFor(a.id).name)}</span>`;
      }
    };
    $('eggClose').onclick = () => { ov.hidden = true; renderZoo(); };
  }

  // pet detail: make active, play, challenge, hear voice
  let petAnim = null;
  function openPet(p) {
    Audio8.play('open');
    const a = animal(p), r = Animals.normRarity(p.rarity);
    $('petTitle').textContent = `${p.name} · ${a.name}`;
    $('petFacts').innerHTML = `<span class="rar ${r}">${r}</span><span class="chip">${Animals.RES[r]}px</span><span class="chip">${ic('star', 12)} ${esc(Minigames.gameFor(a.id).name)}${a.minigame === 'rodeo' ? ' (hard)' : ''}</span>${p.shiny ? '<span class="rar legendary">shiny</span>' : ''}`;
    $('petFlavor').textContent = a.flavor;
    const c = $('petBig').getContext('2d');
    clearInterval(petAnim); petAnim = setInterval(() => { if ($('ovPet').hidden) return clearInterval(petAnim); c.clearRect(0, 0, 192, 192); Sprites.drawPet(c, p, 0, 0, 12, { t: performance.now(), anim: 'idle', blink: performance.now() % 3000 < 150 }); }, 80);
    $('petActive').disabled = !!p.active; $('petActive').textContent = p.active ? 'Active' : 'Make active';
    $('petActive').onclick = async () => { await API.setActivePet(p.id); Audio8.play('reward'); $('ovPet').hidden = true; await refreshMe(); stage.set('happy', 1500); toast(`${p.name} is now your active Familiar. New look!`); renderZoo(); };
    $('petPlay').onclick = () => { $('ovPet').hidden = true; playPetGame(p); };
    $('petChallenge').onclick = () => { $('ovPet').hidden = true; pickFriendToChallenge(p); };
    $('petVoice').onclick = () => speak(`Hi! I'm ${p.name}, the ${a.name}. ${a.flavor}`, p, 'happy');
    $('ovPet').hidden = false;
  }
  $('petClose').onclick = () => { $('ovPet').hidden = true; Audio8.play('close'); };
  $('ovPet').addEventListener('click', e => { if (e.target === $('ovPet')) $('ovPet').hidden = true; });

  // ------------------------------------------------------------------
  // Minigames + duels
  // ------------------------------------------------------------------
  async function playPetGame(p) {
    const a = animal(p), diff = RAR.indexOf(Animals.normRarity(p.rarity)) + 1;
    const res = await Minigames.open({ engine: a.minigame, pet: p, difficulty: diff, title: `${p.name}'s ${Minigames.gameFor(a.id).name}`, subtitle: a.minigame === 'rodeo' ? 'Legendary trial' : `${cap(Animals.normRarity(p.rarity))} difficulty`, practice: true });
    const r = await API.reportMinigame(p.id, res.win);
    if (res.win && r.reward) { toast(`Win! +${r.reward.coins} coins${r.reward.warmed ? `, ${r.reward.warmed} egg${r.reward.warmed > 1 ? 's' : ''} warmed` : ''}. ${r.left} rewarded wins left today.`); confetti.burst(50); }
    else if (res.win) toast(r.message || 'Win!');
    await refreshMe();
    if (currentTab === 'zoo') renderZoo();
  }
  async function playChallenge(m) {
    const res = await Minigames.open({ engine: m.engine, pet: m.pet, difficulty: m.difficulty, title: `${m.from}'s duel`, subtitle: `${m.pet.name}'s ${Minigames.gameFor(m.pet.species).name}`, triesLeft: m.triesLeft });
    const r = await API.attemptChallenge(m.id, res.win);
    if (!r) return;
    if (r.done && r.win) { Audio8.play('reward'); confetti.burst(80); }
    toast(r.message, 3600);
    await refreshMe(); renderQuests();
    if (!r.done) setTimeout(() => showInfo(`<div class="big">So close</div><p class="sub">${esc(r.message)} Try ${esc(m.from)}'s challenge again?</p>`, [['Try again', 'pink', () => playChallenge(Object.assign({}, m, { triesLeft: r.triesLeft }))], ['Later', 'ghost', null]]), 300);
  }
  async function pickFriendToChallenge(p) {
    const v = await API.getVillage(); const a = animal(p);
    openPicker(`Challenge with ${p.name}`, `${Minigames.gameFor(a.id).name} at ${cap(Animals.normRarity(p.rarity))} difficulty. They get 3 tries.`,
      v.friends.map(f => ({ pet: f.pet, title: `${f.name} & ${f.pet.name}`, sub: f.vacation ? 'On vacation: duel requests blocked' : f.status, disabled: f.vacation,
        right: f.vacation ? 'away' : 'Send', onPick: async () => { const r = await API.sendChallenge(f.id, p.id); Audio8.play(r.ok ? 'accept' : 'error'); toast(r.message, 3600); } })));
  }

  // generic list picker
  function openPicker(title, sub, items) {
    Audio8.play('open');
    $('pickTitle').textContent = title; $('pickSub').textContent = sub || '';
    const l = $('pickList'); l.innerHTML = '';
    items.forEach(it => {
      const b = document.createElement('button'); b.disabled = !!it.disabled;
      let left = '';
      if (it.icon) left = `<span class="bigicon" style="width:44px;height:44px">${ic(it.icon, 28)}</span>`;
      b.innerHTML = `${left || '<span></span>'}<span><b></b><small></small></span><span class="lbl">${esc(it.right || '')}</span>`;
      if (it.pet) { const cv = document.createElement('canvas'); cv.width = 44; cv.height = 44; Sprites.drawPet(cv.getContext('2d'), it.pet, 0, 0, 2.75, { fx: false }); b.replaceChild(cv, b.firstChild); }
      b.querySelector('b').textContent = it.title; b.querySelector('small').textContent = it.sub || '';
      b.onclick = async () => { $('ovPick').hidden = true; await it.onPick(); };
      l.appendChild(b);
    });
    $('ovPick').hidden = false;
  }
  $('pickClose').onclick = () => { $('ovPick').hidden = true; Audio8.play('close'); };
  $('ovPick').addEventListener('click', e => { if (e.target === $('ovPick')) $('ovPick').hidden = true; });

  // ------------------------------------------------------------------
  // Shop + gacha
  // ------------------------------------------------------------------
  let shopSection = 'eggs', shop = null;
  $('shopTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; shopSection = b.dataset.s; Audio8.play('tap'); renderShop(); });

  async function renderShop() {
    shop = await API.getShop();
    document.querySelectorAll('#shopTabs button').forEach(b => b.classList.toggle('on', b.dataset.s === shopSection));
    const inv = shop.inventory;
    const nCurses = Object.values(inv.curses).reduce((a, b) => a + b, 0), nBless = Object.values(inv.blessings).reduce((a, b) => a + b, 0);
    $('wallet').innerHTML = `<span class="chip">${coinIc()} <b>${shop.coins}</b></span><span class="chip">${ic('orb', 14)} ${nCurses} curses</span><span class="chip">${ic('sparkle', 14, '#c9922a')} ${nBless} blessings</span><span class="chip">${ic('pin', 14, '#2b2140', '#ffcf4d')} ${inv.keys} raid keys</span>`;
    const g = shop.gacha;
    $('gachaOdds').textContent = `Odds: ${RAR.map(r => `${cap(r)} ${Math.round(g.rates[r] * 100)}%`).join(' · ')} · 1 in 16 shiny`;
    $('gachaPity').textContent = `Mythic+ guaranteed in ${g.pityMythicIn} · Legendary guaranteed in ${g.pityLegendaryIn} · x10 always has a Rare+`;
    $('gachaFree').disabled = !g.freeAvailable; $('gachaFree').textContent = g.freeAvailable ? 'Free daily pull' : 'Free pull used';
    $('gacha1').innerHTML = `Pull x1 · ${g.cost1}`; $('gacha10').innerHTML = `Pull x10 · ${g.cost10}`;

    const grid = $('shopGrid'); grid.innerHTML = '';
    const item = (canvasOrIcon, name, desc, price, own, onBuy, extra) => {
      const d = document.createElement('div'); d.className = 'item';
      d.innerHTML = `<div class="ph"></div><b></b><small></small>${own != null ? `<span class="own">Owned: ${own}</span>` : ''}<button class="btn sm"><span class="price">${coinIc(12)} ${price}</span></button>`;
      const ph = d.querySelector('.ph'); if (typeof canvasOrIcon === 'string') ph.innerHTML = ic(canvasOrIcon, 36); else ph.appendChild(canvasOrIcon);
      d.querySelector('b').textContent = name; d.querySelector('small').textContent = desc;
      const btn = d.querySelector('button'); btn.disabled = shop.coins < price;
      btn.onclick = async () => { const r = await onBuy(); if (!r.ok) { Audio8.play('error'); return toast(r.message); } Audio8.play('accept'); confetti.burst(25, ['#ffcf4d', '#fff']); await refreshMe(); renderShop(); };
      if (extra) d.appendChild(extra);
      grid.appendChild(d);
    };
    if (shopSection === 'eggs') RAR.forEach(r => {
      const cv = document.createElement('canvas'); cv.width = 48; cv.height = 48; Sprites.drawEgg(cv.getContext('2d'), r, 0, 0, 3, 0); cv.style.width = '48px';
      const pool = Animals.POOL[r].length;
      item(cv, `${cap(r)} egg`, `${pool} possible animal${pool > 1 ? 's' : ''} · ${Animals.RES[r]}px${r === 'legendary' ? ' · Longhorn!' : ''}`, shop.eggPrice[r], null, () => API.buy('egg', r).then(x => (x.ok && toast(`${cap(r)} egg added to your Nest. Quest or win minigames to hatch it.`), x)));
    });
    if (shopSection === 'blessings') shop.blessings.forEach(b => {
      const own = inv.blessings[b.id] || 0;
      let use = null;
      if (own) { use = document.createElement('button'); use.className = 'btn sm mint'; use.style.width = '100%'; use.textContent = 'Use on me';
        use.onclick = async () => { const r = await API.useBlessing(b.id); Audio8.play(r.ok ? 'bless' : 'error'); toast(r.message); confetti.burst(30, ['#ffcf4d', '#fff']); await refreshMe(); renderShop(); }; }
      item(b.icon, b.name, b.desc, b.price, own, () => API.buy('blessing', b.id), use);
    });
    if (shopSection === 'curses') shop.curses.forEach(c => item(c.icon, c.name, c.desc, c.price, inv.curses[c.id] || 0, () => API.buy('curse', c.id)));
    if (shopSection === 'keys') {
      item('pin', 'Raid key', 'Opens a raid. Bigger bosses need more keys, but drop rarer eggs.', shop.keyPrice, inv.keys, () => API.buy('key', 'key', 1));
      item('pin', 'Key bundle x3', 'Enough for the Lady Bird Kraken. Saves 50 coins.', 250, null, () => API.buy('key', 'key', 3));
    }
  }

  // the capsule machine
  const gachaMachine = (() => {
    const cv = $('gachaCanvas'), c = cv.getContext('2d'); let spin = 0, drop = null;
    const COLS = ['#ff6f9c', '#ffcf4d', '#6fe3b1', '#b79cff', '#5ab0ff', '#ff9a3c'];
    function draw(t) {
      if (!cv.isConnected || $('screen-shop').hidden) { requestAnimationFrame(draw); return; }
      c.clearRect(0, 0, 180, 210); const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
      // dome
      R(38, 14, 104, 8, '#2b2140'); R(26, 22, 128, 92, '#2b2140'); R(30, 22, 120, 88, '#dff3ff'); R(38, 18, 104, 6, '#dff3ff');
      for (let i = 0; i < 14; i++) {
        const shake = spin > 0 ? Math.sin(t / 30 + i) * 4 : Math.sin(t / 700 + i) * 1;
        const x = 38 + (i * 29) % 100, y = 54 + Math.floor(i / 5) * 18 + shake;
        R(x, y, 14, 14, '#2b2140'); R(x + 2, y + 2, 10, 5, COLS[i % COLS.length]); R(x + 2, y + 7, 10, 5, '#fff'); R(x + 3, y + 3, 3, 2, '#ffffffaa');
      }
      R(36, 30, 6, 20, '#ffffff');
      // body
      R(22, 110, 136, 92, '#2b2140'); R(26, 114, 128, 84, '#e8574a'); R(26, 114, 128, 6, '#ff8a7a');
      R(40, 130, 44, 44, '#2b2140'); R(44, 134, 36, 36, '#ffcf4d');
      // crank
      c.save(); c.translate(62, 152); c.rotate(spin > 0 ? (t / 80) : 0); R(-16, -3, 32, 6, '#2b2140'); R(-3, -16, 6, 32, '#2b2140'); c.restore();
      R(100, 150, 40, 30, '#2b2140'); R(104, 154, 32, 22, '#1a1428');
      R(100, 128, 40, 10, '#2b2140'); c.fillStyle = '#fff'; c.font = '8px "Press Start 2P", monospace'; c.fillText('PULL', 104, 136);
      if (drop) { const p = Math.min(1, (t - drop.t0) / 500); R(110, 150 + p * 14, 18, 14, '#2b2140'); R(112, 152 + p * 14, 14, 5, drop.col); R(112, 157 + p * 14, 14, 5, '#fff'); }
      if (spin > 0) spin--;
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
    return { pull(col) { spin = 50; drop = { t0: performance.now() + 700, col }; } };
  })();

  async function doPull(count, free) {
    const r = await API.pullGacha(count, free);
    if (!r.ok) { Audio8.play('error'); return toast(r.message); }
    const best = r.results.reduce((m, x) => Math.max(m, RAR.indexOf(x.rarity)), 0), bestR = RAR[best];
    Audio8.play('tap'); $('gachaPanel').classList.add('spin');
    gachaMachine.pull(Animals.RARITY_COLOR[bestR]);
    for (let i = 0; i < 6; i++) { setTimeout(() => Audio8.play('tick'), i * 110); }
    await sleep(1300); $('gachaPanel').classList.remove('spin');
    // rarity-coloured flash: the "it's gonna be good" moment
    const fl = $('gachaFlash'); fl.style.background = Animals.RARITY_COLOR[bestR]; fl.classList.remove('on'); void fl.offsetWidth; fl.classList.add('on');
    Audio8.play(best >= 4 ? 'legendary' : best >= 3 ? 'evolve' : best >= 2 ? 'reward' : 'accept');
    confetti.burst(best >= 3 ? 160 : 60, best >= 4 ? ['#ffcf4d', '#fff', '#ff9a3c'] : undefined);
    const caps = $('gachaCaps'); caps.innerHTML = '';
    caps.style.gridTemplateColumns = r.results.length === 1 ? '96px' : 'repeat(5, 1fr)'; caps.style.justifyContent = 'center';
    r.results.forEach((x, i) => {
      const d = document.createElement('div'); d.className = `cap ${x.rarity}`; d.style.animationDelay = (i * 0.12) + 's';
      const cv = document.createElement('canvas'); cv.width = 48; cv.height = 48; const cc = cv.getContext('2d');
      if (x.kind === 'egg') Sprites.drawEgg(cc, x.rarity, 0, 0, 3, 0);
      else drawIconOnCanvas(cc, x.kind === 'curse' ? x.item.icon : x.kind === 'blessing' ? x.item.icon : x.kind === 'key' ? 'pin' : 'coin', 8, 8, 4, '#2b2140', '#ffcf4d');
      d.appendChild(cv);
      d.insertAdjacentHTML('beforeend', `<span class="lb">${x.kind === 'egg' ? x.rarity + (x.shiny ? '*' : '') : x.kind === 'coins' ? '+' + x.amount : x.kind === 'key' ? 'key' : x.item.name.split(' ')[0]}</span>`);
      caps.appendChild(d);
    });
    $('gachaTitle').textContent = best >= 4 ? 'LEGENDARY!!' : best >= 3 ? 'MYTHIC!' : best >= 2 ? 'Rare pull!' : r.results.length > 1 ? '10 capsules!' : 'Capsule!';
    const eggs = r.results.filter(x => x.kind === 'egg').length, shiny = r.results.filter(x => x.shiny).length, pity = r.results.find(x => x.pity);
    $('gachaSub').textContent = `${eggs} egg${eggs === 1 ? '' : 's'} sent to your Nest${shiny ? `, ${shiny} SHINY` : ''}${pity ? ` (pity: ${pity.pity} guaranteed)` : ''}. Items went to your inventory.`;
    $('ovGacha').hidden = false;
    if (best >= 3) { $('gachaCard').classList.add('shake'); setTimeout(() => $('gachaCard').classList.remove('shake'), 500); }
    await refreshMe(); renderShop();
  }
  $('gachaFree').onclick = () => doPull(1, true);
  $('gacha1').onclick = () => doPull(1, false);
  $('gacha10').onclick = () => doPull(10, false);
  $('gachaOk').onclick = () => { $('ovGacha').hidden = true; Audio8.play('tap'); };

  // ------------------------------------------------------------------
  // Village
  // ------------------------------------------------------------------
  async function renderVillage() {
    village = await API.getVillage();
    const cv = $('villageCanvas'), c = cv.getContext('2d');
    Sprites.drawHabitat(c, me.pet.species, 400, 120);
    const pets = [me.pet].concat(village.friends.map(f => f.pet));
    const gap = 400 / pets.length;
    pets.forEach((p, i) => { const x = 8 + i * gap; Sprites.drawPet(c, p, x, 8, 5, { flip: i % 2 === 1, anim: i === 3 ? 'sad' : 'idle', fx: false }); c.fillStyle = '#2b2140'; c.font = '700 12px "Pixelify Sans", sans-serif'; c.fillText(p.name, x + 10, 108); });

    // raids
    const names = { me: 'You' }; village.friends.forEach(f => names[f.id] = f.name);
    const rl = $('raidList'); rl.innerHTML = '';
    village.raids.forEach(r => {
      const inRaid = r.members.includes('me'), dead = r.hp <= 0;
      const d = document.createElement('div'); d.className = 'panel raid';
      d.innerHTML = `<div class="row"><h2 class="grow"></h2><span class="chip" style="color:var(--ink)">${ic('pin', 14, '#2b2140', '#ffcf4d')} ${r.keys} key${r.keys > 1 ? 's' : ''}</span></div>
        <div class="boss">${dead ? ic('skull', 64, '#fff', '#2b2140') : ic('monster', 64, ['#ff6f9c', '#b79cff', '#5ab0ff'][village.raids.indexOf(r) % 3], '#ffcf4d')}</div>
        <div class="lbl" style="color:#fff">HP ${r.hp} / ${r.maxHp} · reward: ${esc(r.rewardText)}</div>
        <div class="meter hp"><i style="width:${r.hp / r.maxHp * 100}%"></i></div>
        <p style="font-size:15px;margin:8px 0" class="desc"></p>
        <div class="row"><div class="mem grow">${r.members.map(m => `<span class="${m === 'me' ? 'me' : ''}">${esc(names[m] || m)}</span>`).join('')}${r.members.length < r.needed ? `<span class="empty">${r.needed - r.members.length} more</span>` : ''}</div>${inRaid || dead ? '' : `<button class="btn sm pink">Join · ${r.keys} key${r.keys > 1 ? 's' : ''}</button>`}</div>`;
      d.querySelector('h2').textContent = r.name;
      d.querySelector('.desc').textContent = dead ? 'Defeated! Reward eggs delivered to every raid member.' : r.desc + ` Expires ${r.expires}.`;
      const jb = d.querySelector('button.pink');
      if (jb) jb.onclick = async () => {
        const res = await API.joinRaid(r.id);
        if (!res.ok) { Audio8.play('error'); return showInfo(`<div class="big">Need keys</div><p class="sub">${esc(res.message)}</p>`, [['Go to shop', 'pink', () => { shopSection = 'keys'; showTab('shop'); }], ['Later', 'ghost', null]]); }
        Audio8.play('hit'); d.classList.add('hit'); setTimeout(() => d.classList.remove('hit'), 400); toast('You joined the raid. Every quest you finish now hits the boss.'); await refreshMe(); renderVillage();
      };
      rl.appendChild(d);
    });

    // duels
    const dl = $('duelList'); dl.innerHTML = '';
    if (!village.duels.length) dl.innerHTML = '<div class="empty">No duels yet. Open a Familiar in your Nest and tap "Challenge friend".</div>';
    village.duels.forEach(du => {
      const st = du.status === 'pending' ? `${du.friendName} is trying…` : du.status === 'failed' ? `${du.friendName} failed 3x · you won ${du.prize}` : `${du.friendName} beat it on try ${du.triesUsed}`;
      dl.insertAdjacentHTML('beforeend', `<div class="duel"><span>${esc(du.petName)}'s ${esc(du.engineName)}</span><span class="st">${esc(st)}</span></div>`);
    });
    if (village.duels.some(d => d.status === 'pending')) setTimeout(() => { if (currentTab === 'village') { refreshMe(); renderVillage(); } }, 4000);

    // friends
    const list = $('friendList'); list.innerHTML = '';
    village.friends.forEach(f => {
      const d = document.createElement('div'); d.className = 'friend';
      d.appendChild(Sprites.petCanvas(f.pet, 4));
      const cursed = village.curses.find(x => x.id === f.cursedBy);
      d.insertAdjacentHTML('beforeend', `<div><div class="nm"></div><div class="st"></div><div class="acts"><button class="btn sm lilac" data-act="curse">${cursed ? ic(cursed.icon, 14) + ' cursed' : ic('orb', 14) + ' Curse'}</button><button class="btn sm" data-act="bless">${ic('sparkle', 14)} Bless</button><button class="btn sm mint" data-act="duel" ${f.vacation ? 'disabled' : ''}>${ic('star', 14)} Duel</button><button class="btn sm ghost" data-act="visit">${ic('hand', 14)} Visit</button></div></div>`);
      d.querySelector('.nm').textContent = `${f.name} & ${f.pet.name} · ${animal(f.pet).name} Lv ${f.level} · streak ${f.streak}`;
      d.querySelector('.st').textContent = (f.vacation ? '[vacation] ' : '') + f.status;
      d.querySelector('[data-act=curse]').onclick = () => openCursePicker(f);
      d.querySelector('[data-act=bless]').onclick = () => openBlessPicker(f);
      d.querySelector('[data-act=duel]').onclick = async () => {
        const z = await API.getZoo(); const pets = [z.active].concat(z.pets);
        openPicker(`Duel ${f.name}`, 'Pick which Familiar\'s minigame they have to beat. Rarer = harder. Legendary = rodeo.',
          pets.map(p => ({ pet: p, title: `${p.name} · ${animal(p).name}`, sub: `${Minigames.gameFor(p.species).name} · ${Animals.normRarity(p.rarity)}`, right: 'Send',
            onPick: async () => { const r = await API.sendChallenge(f.id, p.id); Audio8.play(r.ok ? 'accept' : 'error'); toast(r.message, 3600); renderVillage(); } })));
      };
      d.querySelector('[data-act=visit]').onclick = () => { Audio8.play('squeak'); toast(`${f.pet.name} did a little dance for you. ${f.name} got a notification.`); };
      list.appendChild(d);
    });
  }

  function openCursePicker(f) {
    const inv = village.inventory.curses;
    openPicker(`Curse ${f.name}'s ${f.pet.name}`, 'Uses a curse scroll. Buy more in the Shop. They break it by finishing a quest.',
      village.curses.map(c => ({ icon: c.icon, title: c.name, sub: c.desc, right: `x${inv[c.id] || 0}`, disabled: !inv[c.id],
        onPick: async () => { const r = await API.sendCurse(f.id, c.id); if (!r.ok) { Audio8.play('error'); return toast(r.message); } Audio8.play('curse'); toast(r.message); confetti.burst(40, ['#b79cff', '#2b2140', '#8e6bff']); await refreshMe(); renderVillage(); } })));
  }
  function openBlessPicker(f) {
    const inv = village.inventory.blessings;
    openPicker(`Bless ${f.name}'s ${f.pet.name}`, 'Double XP is free once a day per friend. Other blessings come from the Shop or the Lucky Capsule.',
      village.blessings.map(b => ({ icon: b.icon, title: b.name, sub: b.desc, right: b.id === 'double' ? `free / x${inv[b.id] || 0}` : `x${inv[b.id] || 0}`, disabled: b.id !== 'double' && !inv[b.id],
        onPick: async () => { const r = await API.sendBless(f.id, b.id); if (!r.ok) { Audio8.play('error'); return toast(r.message); } Audio8.play('bless'); toast(r.message); confetti.burst(30, ['#ffcf4d', '#fff']); await refreshMe(); } })));
  }

  // ------------------------------------------------------------------
  // Storybook
  // ------------------------------------------------------------------
  async function renderStory() {
    const b = await API.getStorybook(); if (!b) return;
    $('bookTitle').textContent = b.title; $('bookDate').textContent = b.date;
    const pages = $('bookPages'); pages.innerHTML = '';
    b.pages.forEach(p => {
      const d = document.createElement('div'); d.className = 'page';
      const cv = document.createElement('canvas'); cv.width = 84; cv.height = 84; const c = cv.getContext('2d');
      c.fillStyle = SCENE_BG[p.scene] || '#fff'; c.fillRect(0, 0, 84, 84);
      if (p.scene === 'night') { c.fillStyle = '#ffcf4d'; c.fillRect(60, 10, 12, 12); c.fillStyle = '#3a2f5c'; c.fillRect(56, 8, 10, 10); c.fillStyle = '#fff'; [[10, 12], [30, 6], [45, 20], [20, 30]].forEach(([x, y]) => c.fillRect(x, y, 2, 2)); }
      if (p.scene === 'morning') { c.fillStyle = '#ffcf4d'; c.fillRect(56, 8, 18, 18); }
      c.fillStyle = p.scene === 'night' ? '#2b2140' : '#8fd48a'; c.fillRect(0, 70, 84, 14);
      Sprites.drawPet(c, b.pet, 6, 10, 3.6, { flip: p.scene === 'social', anim: p.scene === 'night' ? 'sad' : 'idle', blink: p.scene === 'night', fx: false });
      if (TYPE_ICON[p.scene]) drawIconOnCanvas(c, TYPE_ICON[p.scene], 52, 30, 3, '#2b2140');
      d.appendChild(cv);
      d.insertAdjacentHTML('beforeend', `<div><p></p>${p.xp ? `<div class="pxp">+${p.xp} XP</div>` : ''}</div>`);
      d.querySelector('p').textContent = p.text;
      pages.appendChild(d);
    });
    $('bookCopy').textContent = 'Read aloud';
    $('bookCopy').onclick = async () => { Audio8.play('accept'); const ok = await speak(b.pages.map(p => p.text).join(' ').slice(0, 400)); if (!ok) toast('No voice available.'); };
    $('bookShare').onclick = () => { Audio8.play('bless'); confetti.burst(40); toast('Posted to the village. Leo already replied "no way".'); };
  }

  // ------------------------------------------------------------------
  // Tutorial — spotlight + the pet explains each part
  // ------------------------------------------------------------------
  function tutorialSteps() {
    const n = me.pet.name;
    return [
      { tab: 'home', sel: '#stage', text: `Hi, I'm ${n}! Tap me anytime for hearts. I live off your real-world adventures.` },
      { tab: 'home', sel: '.meters', text: 'XP levels me up. Mood and hunger drop if you ignore me, and go up when you do quests.' },
      { tab: 'home', sel: '#questList', text: 'Every day you get 3 quests at real places nearby. Prove them with a photo or a voice note. An AI checks it, so no faking!' },
      { tab: 'home', sel: '#inboxList', text: 'Friends send curses, blessings and minigame duels. Accept a curse and your next quest gets... weird.' },
      { tab: 'zoo', sel: '#eggGrid', text: 'Quests drop eggs. Common, Uncommon, Rare, Mythic, Legendary. Rarer animals are drawn with more pixels.' },
      { tab: 'zoo', sel: '#zooGrid', text: 'Tap any Familiar to make it active (the whole app restyles to match it), play its minigame, or duel a friend with it.' },
      { tab: 'shop', sel: '#gachaPanel', text: 'The Lucky Capsule. One free pull every day. Pity timer guarantees a Mythic and eventually a Legendary.' },
      { tab: 'shop', sel: '#shopGrid', text: 'Spend coins on eggs, blessings, curse scrolls and raid keys.' },
      { tab: 'village', sel: '#raidList', text: 'Team up with friends on boss raids. Bigger bosses need more keys and drop rarer eggs.' },
      { tab: 'home', sel: '#btnSettings', text: 'Going away? Turn on Vacation mode in settings. I will miss you, and nobody can duel you while you are gone. Have fun!' },
    ];
  }
  async function runTutorial() {
    const steps = tutorialSteps(); let i = 0;
    const root = document.createElement('div'); root.className = 'tut';
    root.innerHTML = `<div class="hole"></div><div class="tip"><canvas width="64" height="64"></canvas><div><div class="step"></div><p></p><div class="row"><button class="btn sm ghost" data-a="skip">Skip</button><button class="btn sm pink" data-a="next">Next</button></div></div></div>`;
    document.body.appendChild(root);
    const hole = root.querySelector('.hole'), tip = root.querySelector('.tip'), pc = root.querySelector('canvas').getContext('2d');
    const anim = setInterval(() => { pc.clearRect(0, 0, 64, 64); Sprites.drawPet(pc, me.pet, 0, 0, 4, { t: performance.now(), anim: 'happy', fx: false }); }, 90);
    return new Promise(resolve => {
      async function show() {
        const s = steps[i];
        if (s.tab !== currentTab) await showTab(s.tab);
        const el = document.querySelector(s.sel);
        if (el) el.scrollIntoView({ block: 'center' });
        await sleep(160);
        const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2 - 50, top: innerHeight / 2 - 50, width: 100, height: 100 };
        const pad = 6;
        Object.assign(hole.style, { left: (r.left - pad) + 'px', top: (r.top - pad) + 'px', width: (r.width + pad * 2) + 'px', height: Math.min(r.height + pad * 2, innerHeight * 0.5) + 'px' });
        const below = r.top + r.height / 2 < innerHeight / 2;
        tip.style.top = below ? Math.min(innerHeight - 170, r.top + Math.min(r.height, innerHeight * 0.5) + 16) + 'px' : 'auto';
        tip.style.bottom = below ? 'auto' : Math.max(12, innerHeight - r.top + 16) + 'px';
        tip.querySelector('.step').textContent = `TUTORIAL ${i + 1}/${steps.length}`;
        tip.querySelector('p').textContent = s.text;
        tip.querySelector('[data-a=next]').textContent = i === steps.length - 1 ? 'Let\'s go!' : 'Next';
        tip.style.animation = 'none'; void tip.offsetWidth; tip.style.animation = '';
        Audio8.play('tap');
      }
      async function end() { clearInterval(anim); root.remove(); await API.setTutorialDone(true); await showTab('home'); resolve(); }
      root.querySelector('[data-a=next]').onclick = () => { i++; if (i >= steps.length) { Audio8.play('reward'); confetti.burst(80); toast('Tutorial done. Your free Lucky Capsule pull is waiting in the Shop!', 3600); end(); } else show(); };
      root.querySelector('[data-a=skip]').onclick = end;
      show();
    });
  }

  // ------------------------------------------------------------------
  // Hatch (first run)
  // ------------------------------------------------------------------
  async function runHatch() {
    const ov = $('ovHatch'), cv = $('hatchCanvas'), c = cv.getContext('2d');
    let taps = 0;
    const draw = (cr) => { c.clearRect(0, 0, 192, 240); Sprites.drawEgg(c, 'common', 0, 40, 12, cr); };
    draw(0); ov.hidden = false;
    $('hatchName').placeholder = await API.suggestName();
    cv.onclick = () => {
      Audio8.unlock(); taps++; Audio8.play('crack'); cv.classList.remove('wob'); void cv.offsetWidth; cv.classList.add('wob'); draw(taps);
      $('hatchHint').textContent = `${3 - taps} tap${3 - taps === 1 ? '' : 's'} to go`;
      if (taps >= 3) {
        cv.onclick = null; flash(); Audio8.play('hatch'); setTimeout(() => Audio8.cry('axolotl'), 700); confetti.burst(100);
        const bc = { species: 'axolotl', rarity: 'common' }; let bt = 0;
        const biv = setInterval(() => { if (ov.hidden) return clearInterval(biv); c.clearRect(0, 0, 192, 240); bt += 100; Sprites.drawPet(c, bc, 0, 40, 12, { anim: 'happy', t: bt }); }, 100);
        $('hatchStep1').hidden = true; $('hatchStep2').hidden = false; $('hatchName').focus();
      }
    };
    $('hatchGo').onclick = async () => {
      const name = $('hatchName').value.trim() || $('hatchName').placeholder;
      await API.hatch({ name }); ov.hidden = true; Audio8.play('reward');
      if (DEV) { await unlockAll(); return; }
      await refreshMe(); renderQuests(); say(`Hi! I'm ${name}. Let me show you around!`, 3000); stage.set('happy', 1500);
      await sleep(1200); runTutorial();
    };
  }

  // ------------------------------------------------------------------
  // Settings + vacation
  // ------------------------------------------------------------------
  $('btnSettings').onclick = () => { Audio8.play('open'); $('tglSound').classList.toggle('on', Audio8.isEnabled()); $('tglLegend').classList.toggle('on', me.settings.forceLegendary); $('btnVacation').textContent = me.vacation && me.vacation.active ? 'End' : 'Plan'; $('ovSettings').hidden = false; };
  $('setClose').onclick = () => { $('ovSettings').hidden = true; Audio8.play('close'); };
  $('ovSettings').addEventListener('click', e => { if (e.target === $('ovSettings')) $('ovSettings').hidden = true; });
  $('tglSound').onclick = async () => { const on = !Audio8.isEnabled(); Audio8.setEnabled(on); $('tglSound').classList.toggle('on', on); await API.setSettings({ sound: on }); Audio8.play('tap'); };
  $('tglLegend').onclick = async () => { const on = !me.settings.forceLegendary; await API.setSettings({ forceLegendary: on }); $('tglLegend').classList.toggle('on', on); await refreshMe(); Audio8.play(on ? 'legendary' : 'tap'); };
  $('btnReset').onclick = async () => { await API.reset(); location.reload(); };
  const DEV = location.hash === '#dev' || /[?&]dev\b/.test(location.search);
  async function unlockAll() {
    await API.unlockAll(); await refreshMe(); Audio8.play('legendary'); confetti.burst(120, ['#ffcf4d', '#fff', '#ff9a3c']);
    $('ovSettings').hidden = true; toast('Tester account: everything unlocked. Check the Nest and the Shop.', 4000); showTab('zoo');
  }
  $('btnUnlock').onclick = unlockAll;
  $('btnTutorial').onclick = () => { $('ovSettings').hidden = true; runTutorial(); };
  $('btnFakeDuel').onclick = async () => { const r = await API.simulateIncomingChallenge(); Audio8.play(r.ok ? 'open' : 'error'); toast(r.message, 3600); $('ovSettings').hidden = true; await refreshMe(); showTab('home'); };
  $('btnSkip').onclick = async () => { $('ovSettings').hidden = true; const v = await API.skipVacationTime(12); if (!v) { toast('Start a vacation first.'); return; } Audio8.play('tick'); await refreshMe(); toast(`12 hours later... ${me.pet.name}'s mood is ${me.mood}.`); };
  $('btnVacation').onclick = async () => {
    $('ovSettings').hidden = true;
    if (me.vacation && me.vacation.active) { await API.endVacation(); await refreshMe(); toast('Welcome back!'); return; }
    openVacation();
  };
  let vacHours = 24;
  function vacPreview() {
    const end = Math.max(5, Math.round(me.mood - vacHours * 1.5));
    $('vacPreview').textContent = `Mood now ${me.mood}. After ${vacHours >= 24 ? Math.round(vacHours / 24) + ' day' + (vacHours >= 48 ? 's' : '') : vacHours + ' hours'} it will be about ${end}. ${end < 30 ? `${me.pet.name} will be really sad. Bring back a souvenir quest.` : ''}`;
  }
  function openVacation() {
    Audio8.play('open'); vacPreview();
    $('vacOpts').onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      document.querySelectorAll('#vacOpts button').forEach(x => x.classList.toggle('on', x === b));
      $('vacCustomRow').hidden = b.dataset.h !== 'custom';
      vacHours = b.dataset.h === 'custom' ? (+$('vacCustom').value || 1) * 24 : +b.dataset.h; vacPreview();
    };
    $('vacCustom').oninput = () => { vacHours = Math.max(1, Math.min(60, +$('vacCustom').value || 1)) * 24; vacPreview(); };
    $('ovVacation').hidden = false;
  }
  $('vacClose').onclick = () => { $('ovVacation').hidden = true; };
  $('vacGo').onclick = async () => { await API.startVacation(vacHours); $('ovVacation').hidden = true; Audio8.play('close'); await refreshMe(); showTab('home'); say(`Have fun... ${me.pet.name} will wait right here.`, 3500); };

  // ------------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------------
  (async function boot() {
    Icons.mount();
    await Sprites.loadAll('assets/sprites/');
    getLocation().then(l => { loc = l; });
    me = await API.getMe();
    Audio8.setEnabled(me.settings.sound !== false);
    if (!me.pet) { await runHatch(); return; }
    if (DEV && me.user.role !== 'admin') { await unlockAll(); return; }
    renderTop(); applyTheme(); renderQuests();
    if (!me.tutorialDone) setTimeout(runTutorial, 600);
    else setTimeout(() => say(petLine()), 900);
    setInterval(async () => { if (me && me.vacation) { await refreshMe(); } }, 60000);
  })();
})();
