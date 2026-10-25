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

  // callers size icons as an 8-cell box of px; colour icons are 12 cells, so scale to fit that box (integer px, centred)
  function drawIconOnCanvas(c, name, x, y, px, color, color2 = '#fff8ea') {
    const tmp = document.createElement('div'); tmp.innerHTML = Icons.svg(name, 8, color, color2);
    const n = +(tmp.querySelector('svg').getAttribute('viewBox') || '0 0 8 8').split(' ')[2] || 8;
    const k = Math.max(1, Math.floor(px * 8 / n)), off = Math.floor((px * 8 - k * n) / 2);
    tmp.querySelectorAll('rect').forEach(r => { c.fillStyle = r.getAttribute('fill'); c.fillRect(x + off + r.getAttribute('x') * k, y + off + r.getAttribute('y') * k, k, k); });
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
      const curse = me.activeCurse && me.activeCurse.id;
      if (curse === 'hop' && anim === 'idle') { anim = 'happy'; mode = 'happy'; modeUntil = t + 100; }        // Hop Hex: cannot stop hopping
      if (curse === 'opera' && Math.floor(t / 900) !== Math.floor((t - 16) / 900)) {                            // Opera Night: notes keep floating up
        const n = document.createElement('span'); n.className = 'fx'; n.innerHTML = ic('note', 18, '#2b2140');
        n.style.left = (120 + Math.random() * 160) + 'px'; n.style.top = '90px'; $('stage').appendChild(n); setTimeout(() => n.remove(), 2200);
      }

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
    Audio8.pet(me.pet.species); stage.set('happy', 700);
    const r = $('stage').getBoundingClientRect();
    const h = document.createElement('span'); h.className = 'heart'; h.innerHTML = Math.random() < 0.7 ? ic('heart', 22, ['#ff6f9c', '#ffcf4d', '#6fe3b1'][Math.floor(Math.random() * 3)]) : ic('sparkle', 22, '#ffcf4d');
    h.style.left = (e.clientX - r.left - 10 + (Math.random() - .5) * 30) + 'px'; h.style.top = (e.clientY - r.top - 20) + 'px';
    $('stage').appendChild(h); setTimeout(() => h.remove(), 900);
    if (Math.random() < 0.35) say(petLine());
  });

  // one voice per species: what the pet says when tapped (plus mood/hunger lines in petLine)
  const SPECIES_LINES = {
    axolotl: ["I regrow limbs. You can regrow a streak.", "Gills up! Let us go somewhere wet.", "I am small. My plans are not."],
    cat: ["Second breakfast is a quest, right?", "I found the weird menu item. It was me.", "Knock something off a table for me."],
    dog: ["WHO are we meeting today?!", "I smell a hallway full of friends.", "Ball? Quest? Ball? Quest!"],
    bunny: ["Hop count so far: not enough.", "Clover is a food group.", "Ears up. Something fun is nearby."],
    chick: ["Peep. Peep. PEEP.", "Seeds are the currency of joy.", "Sunrise is in a few hours. I am ready."],
    hamster: ["Cheeks: loaded. Legs: ready.", "I stashed a snack somewhere in this app.", "Wheel time? No. Quest time."],
    frog: ["This puddle is a portal. Trust me.", "Ribbit means go outside.", "Lily pads are just tiny quests."],
    mouse: ["I know where the cheese is. Follow me.", "Tiny steps count as steps.", "Squeak if you are going out."],
    duckling: ["Bread is a lifestyle.", "Waddle with purpose.", "Splash first, ask later."],
    pig: ["Mud is a spa. Change my mind.", "Oink translates to: snacks.", "I rolled here on purpose."],
    sheep: ["Baa. That was a full sentence.", "Nap now, quest later. Fine, quest now.", "I am ninety percent cloud."],
    hedgehog: ["Prickly outside, marshmallow inside.", "Dig something up with me.", "Beetles are crunchy quests."],
    squirrel: ["I buried a snack in 2019. Help.", "Up the tree! No, the quest first.", "Acorn count: never enough."],
    turtle: ["I have seen four thousand finals weeks.", "Slow is a speed too.", "The Turtle Pond says hi."],
    prairiedog: ["LOOKOUT! Oh. It is a cloud.", "Standing tall. Watching you.", "Burrow later. Quest now."],
    goat: ["I will eat your homework. Then quest.", "Hills are just stairs for goats.", "Meh is a yes."],
    redpanda: ["Bamboo break, then adventure.", "My tail has rings. Count them later.", "I am fluffier than my problems."],
    penguin: ["Dressed for a gala. Where is it?", "Slide into something new today.", "Ice lanes are my runway."],
    fennec: ["I heard your snack wrapper. Yes, that one.", "These ears hear quests coming.", "Desert speed. Go."],
    otter: ["Hold my hand, hold my rock, let us go.", "River first. Everything else second.", "I kept the shiny rock for you."],
    raccoon: ["Washed my hands. Washed your phone. Sorry.", "Porch light is on. Quest is on.", "Trash is treasure with better PR."],
    capybara: ["Hot spring vibes only.", "Everyone is my friend. You too.", "Yuzu on my head. Peace in my heart."],
    owl: ["Hoot. Explain the painting again.", "Night quests are the best quests.", "Museums are quests with air conditioning."],
    roadrunner: ["Beep beep. Already finished. Twice.", "Catch me at the next quest.", "Anvils never land on me."],
    armadillo: ["Rolled into a ball. Rolled back out. Quest?", "Texas state small mammal reporting in.", "Shell on, worries off."],
    snowleopard: ["Ghost of the mountains, guest of Austin.", "Spots are earned. Go earn yours.", "Snow stalk, then nap."],
    chameleon: ["My mood is rainbow today.", "Blend in later. Stand out now.", "Colours shift. Quests stay."],
    bat: ["The bridge crowd flies at sunset. Join us.", "Screech means hello.", "Congress Avenue is my runway."],
    jackalope: ["Nobody believed you saw me. Now you own me.", "Antlers up. Cacti down.", "Hop, dash, repeat."],
    longhorn: ["Hook em. Then hook a quest.", "Burnt orange is a lifestyle.", "The rodeo waits for no one."],
    grackle: ["HEB parking lot. Prime real estate.", "I will scream. You will quest.", "Shiny thing? Mine."],
    salamander: ["Barton Springs or nothing.", "Golden means rare. Act accordingly.", "Cool water, warm heart."],
    hornedlizard: ["Puff up. Horns out. Quest time.", "Ants are a food group.", "Horny toad, not a toad. Long story."],
  };
  function petLine() {
    const p = me.pet, n = p.name, a = animal(p);
    const l = (SPECIES_LINES[p.species] || [`${n} is a ${a.name}.`]).concat([a.flavor]);
    if (me.vacation && me.vacation.active) return `${n} misses you... (on vacation, mood ${me.mood})`;
    if (me.hunger < 30) l.push(`${n} is STARVING. Food quest please.`);
    if (me.mood < 35) return `${n} feels lonely. A quest would help.`;
    return l[Math.floor(Math.random() * l.length)];
  }

  // ------------------------------------------------------------------
  // Speech: ElevenLabs TTS through the server, in the pet's own voice preset (Animals voice). No browser
  // fallback: when the server or the key is missing the pet simply stays quiet. Voice proofs stay off.
  // ------------------------------------------------------------------

  // Playback goes through WebAudio: the context is created/resumed synchronously inside the tap, so iOS
  // Safari still allows playback after the (async) fetch. An <audio> element created after an await is muted there.
  let speaking = null, voiceCtx = null;
  function unlockVoice() {
    try { voiceCtx = voiceCtx || new (window.AudioContext || window.webkitAudioContext)(); if (voiceCtx.state === 'suspended') voiceCtx.resume().catch(() => {}); } catch { voiceCtx = null; }
  }
  async function speak(text, pet = me.pet, mood = 'neutral') {
    unlockVoice();
    if (speaking) { try { speaking.stop(); } catch {} speaking = null; }
    const blob = await API.say(text, animal(pet).voice, mood);
    if (!blob) return false;
    try {
      const buf = await voiceCtx.decodeAudioData(await blob.arrayBuffer());
      const src = voiceCtx.createBufferSource(); src.buffer = buf; src.connect(voiceCtx.destination); src.start(); speaking = src;
    } catch (e) {
      // decode unsupported: fall back to an <audio> element (works everywhere but iOS after an await)
      const el = new Audio(URL.createObjectURL(blob)); el.play().catch(() => {}); speaking = { stop: () => el.pause() };
    }
    return true;
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
    $('stage').hidden = tab === 'village';
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
    // active curse: body attribute drives the CSS effects, the bar explains what is going on
    if (me.activeCurse) document.body.dataset.curse = me.activeCurse.id; else delete document.body.dataset.curse;
    const cb = $('cursebar'); cb.hidden = !me.activeCurse;
    if (me.activeCurse) cb.innerHTML = `${ic(me.activeCurse.icon, 18)} <span>CURSED: ${esc(me.activeCurse.name)} by ${esc(me.activeCurse.from)}</span> <small>${esc(me.activeCurse.desc)} Finish a quest to break it.</small>`;
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
    const qIcon = $('questLoc').querySelector('i[data-icon]'); if (qIcon) qIcon.innerHTML = Icons.svg('quests', 12, '#ff6f9c', '#fff');
    $('questSource').textContent = qi.source === 'serpapi' ? `Real places via SerpApi${qi.writer === 'gemini' ? ', written by ' + me.pet.name + ' (Gemini)' : ''}. Tap the pin for new ones.` : 'Demo places (start the server for live SerpApi quests).';
    const list = $('questList'); list.innerHTML = '';
    quests.forEach(q => {
      const b = document.createElement('button');
      b.className = `quest type-${q.type}` + (q.status === 'done' ? ' done' : '');
      b.innerHTML = `<div class="ic">${ic(TYPE_ICON[q.type], 24, '#2b2140', '#fff8ea')}</div>
        <div><div class="title"></div><div class="meta"></div></div>
        <div class="xp">+${q.xp}<br>XP</div>`;
      b.querySelector('.title').textContent = q.title + (q.status === 'done' ? ' (done)' : '');
      b.querySelector('.meta').textContent = `${TYPE_NAME[q.type]} · ${q.place.name} · ${q.place.dist}`;
      if (q.cursed) b.insertAdjacentHTML('beforeend', `<span class="tag curse">${ic(me.activeCurse.icon, 12)} ${esc(me.activeCurse.name)} mode</span>`);
      else if (q.blessed) { const names = (q.blessings || []).map(id => (API.BLESSINGS.find(x => x.id === id) || {}).badge).filter(Boolean); b.insertAdjacentHTML('beforeend', `<span class="tag bless">${ic('sparkle', 12)} ${esc(names.join(' · ') || 'blessed')}</span>`); }
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
    if (role === 'pet') {
      const cv = document.createElement('canvas'); cv.width = 36; cv.height = 36; d.appendChild(cv);
      const c = cv.getContext('2d'), t0 = performance.now();
      const paint = () => { c.clearRect(0, 0, 36, 36); Sprites.drawPet(c, me.pet, 0, 0, 2.25, { fx: false, anim: thinking ? 'idle' : 'happy', t: performance.now() - t0 }); };
      paint();
      if (thinking) { const iv = setInterval(() => { if (!d.isConnected) return clearInterval(iv); paint(); }, 120); }   // the pet keeps moving while it "types"
    }
    let st = null;
    if (thinking) {
      // animated typing indicator: bouncing pixel dots + a status line that changes if the reply is slow
      const box = document.createElement('span'); box.className = 'typing';
      box.innerHTML = '<span class="dots"><i></i><i></i><i></i></span><small class="tstat"></small>';
      st = box.querySelector('.tstat'); d.appendChild(box);
    } else {
      const s = document.createElement('span'); s.textContent = text; d.appendChild(s);
    }
    $('chatLog').appendChild(d); $('chatLog').scrollTop = 1e6;
    if (st) {
      const name = me.pet.name, steps = [[0, `${name} is typing`], [5000, `${name} is thinking hard`], [11000, `${name} is still on it, hang tight`]], t0 = performance.now();
      const tick = () => { if (!d.isConnected) return clearInterval(iv); const el = performance.now() - t0; st.textContent = steps.filter(s => el >= s[0]).pop()[1]; };
      const iv = setInterval(tick, 400); tick();
    }
    return d;
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
    chatBubble('pet', r.reply); Audio8.happy(me.pet.species);
    speak(r.reply, me.pet, ['excited', 'sad', 'happy'].includes(r.mood) ? r.mood : 'neutral');
    stage.set(r.mood === 'sad' ? 'sad' : 'happy', 1500);
  }
  $('btnTalk').addEventListener('pointerdown', e => e.stopPropagation());
  $('btnTalk').onclick = openChat;
  $('chatClose').onclick = () => { $('ovChat').hidden = true; Audio8.play('close'); if (speaking) { try { speaking.stop(); } catch {} speaking = null; } };
  $('ovChat').addEventListener('click', e => { if (e.target === $('ovChat')) $('chatClose').onclick(); });
  $('chatForm').addEventListener('submit', e => { e.preventDefault(); sendChat($('chatInput').value); });

  async function renderInbox() {
    const v = await API.getVillage();
    const box = $('inboxList'); box.innerHTML = '';
    v.inbox.slice(0, 4).forEach(m => {
      const d = document.createElement('div');
      d.className = 'banner ' + (m.kind === 'challenge' ? 'challenge' : m.kind === 'note' ? 'note' : '');
      let icon, title, text, btn;
      if (m.kind === 'curse') { icon = ic(m.curse.icon, 24); title = `${m.from} cursed you`; text = `${m.curse.name}: ${m.curse.desc}`; btn = 'Accept'; }
      else if (m.kind === 'bless') { icon = ic('sparkle', 24, '#c9922a'); title = `${m.from} blessed you`; text = m.blessing.desc; btn = 'Accept'; }
      else if (m.kind === 'challenge') { icon = ic('star', 24, '#2b2140'); title = `${m.from} challenged you`; text = `${m.pet.name}'s ${Minigames.gameFor(m.pet.species).name} · ${m.triesLeft} tries · win ${m.wager} coins`; btn = 'Play'; }
      else if (m.kind === 'gift') { icon = ic('gift', 24); title = m.title || 'A gift'; text = m.text || ''; btn = 'Open'; }
      else { icon = ic('chat', 24); title = m.from; text = m.text; btn = 'OK'; }
      d.innerHTML = `<span class="bigicon">${icon}</span><div class="grow"><b></b><span></span></div><button class="btn sm ${m.kind === 'challenge' ? 'pink' : 'lilac'}">${btn}</button>`;
      d.querySelector('b').textContent = title; d.querySelector('span:not(.bigicon)').textContent = text;
      d.querySelector('button').onclick = async () => {
        if (m.kind === 'challenge') return playChallenge(m);
        if (m.kind === 'gift') return openGift(m);
        Audio8.play(m.kind === 'curse' ? 'curse' : m.kind === 'bless' ? 'bless' : 'tap');
        const r = await API.acceptInbox(m.id); await refreshMe(); renderQuests();
        if (m.kind === 'curse') say(r && r.shielded ? `Hex Shield! ${m.from}'s curse bounced off.` : `${me.pet.name} has been cursed. Ugh.`);
        if (m.kind === 'bless') say(`${me.pet.name} is glowing!`);
      };
      box.appendChild(d);
    });
  }

  // welcome package / gifts: a box you open, items revealed one by one
  async function openGift(m) {
    Audio8.play('open');
    const label = it => it.kind === 'coins' ? `${it.amount} coins` : it.kind === 'key' ? `${it.qty || 1} raid key` : it.kind === 'egg' ? `${it.rarity || 'common'} egg`
      : `${(it.kind === 'curse' ? API.CURSES : API.BLESSINGS).find(x => x.id === it.id)?.name || it.id} ×${it.qty || 1}`;
    const iconOf = it => it.kind === 'coins' ? ic('coin', 24, '#c9922a', '#ffcf4d') : it.kind === 'key' ? ic('key', 24) : it.kind === 'egg' ? ic('egg', 24, '#5ab0ff')
      : ic((it.kind === 'curse' ? API.CURSES : API.BLESSINGS).find(x => x.id === it.id)?.icon || 'star', 28);
    const items = m.items || [];
    // a closed pixel gift box you tap; the lid pops and the items drop in one by one
    const html = `<div class="big">${esc(m.title || 'A gift')}</div><p class="sub" id="giftSub">${esc(m.from)} sent you this. Tap the box!</p><canvas id="giftBox" width="48" height="48" style="width:144px;height:144px;display:block;margin:4px auto;cursor:pointer"></canvas><div class="caps" id="giftCaps" style="grid-template-columns:repeat(3,1fr)" hidden></div>`;
    const drawBox = (c, open, bob) => {
      c.clearRect(0, 0, 48, 48); const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
      R(8, 20 + bob, 32, 24, '#2b2140'); R(10, 22 + bob, 28, 20, '#e8574a'); R(10, 22 + bob, 28, 3, '#ff8a7a'); R(22, 22 + bob, 4, 20, '#ffcf4d');
      if (!open) { R(6, 14 + bob, 36, 8, '#2b2140'); R(8, 16 + bob, 32, 4, '#c0392b'); R(22, 14 + bob, 4, 8, '#ffcf4d'); R(16, 8 + bob, 6, 6, '#ffcf4d'); R(26, 8 + bob, 6, 6, '#ffcf4d'); R(21, 10 + bob, 6, 5, '#c9922a'); }
      else { R(2, 2, 36, 8, '#2b2140'); R(4, 4, 32, 4, '#c0392b'); R(12, 20 + bob, 24, 2, '#fff6c0'); for (let i = 0; i < 6; i++) R(10 + i * 5, 12 + (i % 2) * 3, 2, 2, '#ffcf4d'); }
    };
    const p = showInfo(html, [['Take it all', 'pink', null]], el => {
      const cv = el.querySelector('#giftBox'), c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
      const btn = el.parentElement.querySelector('#infoActs button'); btn.disabled = true;
      let open = false, t0 = performance.now();
      const bob = setInterval(() => { if (!cv.isConnected) return clearInterval(bob); if (!open) drawBox(c, false, Math.round(Math.sin((performance.now() - t0) / 180) * 1.5)); }, 60);
      cv.onclick = () => {
        if (open) return; open = true; clearInterval(bob); Audio8.play('crack'); cv.style.animation = 'wobble .4s';
        setTimeout(() => {
          drawBox(c, true, 0); flash(); Audio8.play('hatch'); confetti.burst(60, ['#ffcf4d', '#fff', '#ff9a3c']);
          el.querySelector('#giftSub').textContent = 'Inside:'; const caps = el.querySelector('#giftCaps'); caps.hidden = false;
          items.forEach((it, i) => { const d = document.createElement('div'); d.className = 'cap common'; d.style.animationDelay = (i * 0.15) + 's'; d.innerHTML = `${iconOf(it)}<span class="lb">${esc(label(it))}</span>`; caps.appendChild(d); setTimeout(() => Audio8.play('xp'), i * 150); });
          btn.disabled = false;
        }, 350);
      };
    });
    await p;
    await API.acceptInbox(m.id); Audio8.play('reward'); confetti.burst(70, ['#ffcf4d', '#fff', '#ff9a3c']);
    await refreshMe(); renderQuests();
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
    renderQuestSheet(q);
    $('qTags').innerHTML = (q.cursed ? `<span class="tag curse">${ic(me.activeCurse.icon, 12)} ${esc(me.activeCurse.name)} by ${esc(me.activeCurse.from)}</span> ` : '') +
      (q.blessings || []).map(id => { const b = API.BLESSINGS.find(x => x.id === id); return b ? `<span class="tag bless">${ic(b.icon, 12)} ${esc(b.name)}</span> ` : ''; }).join('');
    $('qReroll').disabled = !!q.rerolled;
    $('photoPreview').hidden = true; $('photoInput').value = '';
    const curse = q.cursed ? me.activeCurse : null;
    const cap = captionBox(); cap.value = '';
    cap.placeholder = curse && curse.caption ? `Cursed: ${curse.caption}` : 'Tell the game master what you did (one or two sentences).';
    setProofTab('photo');
    $('qSubmit').disabled = true;
    $('ovQuest').hidden = false;
  }
  // the pet narrates in a speech bubble; the tiles show what this quest really pays (blessings and curses applied)
  function renderQuestSheet(q) {
    const pc = $('qPetCv').getContext('2d'); pc.clearRect(0, 0, 80, 80);
    Sprites.drawPet(pc, me.pet, 8, 8, 4, { anim: q.cursed ? 'sad' : 'happy', fx: false });
    const bl = q.blessings || [], curse = q.cursed ? me.activeCurse : null;
    const xp = q.xp * (bl.includes('double') ? 2 : 1);
    let coins = Math.round(xp / 2) * (bl.includes('coinrain') ? 2 : 1); if (curse && curse.id === 'tiny') coins = Math.round(coins / 2);
    const egg = bl.includes('lucky') ? 100 : Math.round(q.eggChance * 100);
    const tile = (icon, col, val, lbl, x, bad) => `<div class="qtile">${ic(icon, 20, col, '#fff')}<b>${val}</b><span>${lbl}</span>${x ? `<i class="x${bad ? ' bad' : ''}">${x}</i>` : ''}</div>`;
    $('qTiles').innerHTML =
      tile('star', '#ffc247', '+' + xp, 'XP', bl.includes('double') ? '2x' : '') +
      tile('coin', '#ffc247', '+' + coins, 'coins', bl.includes('coinrain') ? '2x' : (curse && curse.id === 'tiny' ? '1/2' : ''), curse && curse.id === 'tiny') +
      tile('egg', '#5ab0ff', egg + '%', 'egg drop', bl.includes('lucky') ? 'sure' : (bl.includes('rarityup') ? '+1' : ''));
    const TYPE_LBL = { food: 'Food quest', social: 'Social quest', outdoor: 'Outdoor quest', creative: 'Creative quest' };
    const steps = [
      ['Go to ' + q.place.name, `${q.place.dist} away · ${q.place.kind}`],
      [q.title, TYPE_LBL[q.type] || 'Quest'],
      ['Prove it with a photo', curse && curse.caption ? `Cursed caption: ${curse.caption}` : 'Plus a caption. The game master reads both.'],
    ];
    $('qSteps').innerHTML = steps.map(([t, s], i) => `<div class="qstep"><span class="n">${i + 1}</span><div class="grow"><div class="t">${esc(t)}</div><div class="s">${esc(s)}</div></div></div>`).join('');
  }
  function closeQuest() { $('ovQuest').hidden = true; Audio8.play('close'); }
  $('qClose').onclick = closeQuest;
  $('ovQuest').addEventListener('click', e => { if (e.target === $('ovQuest')) closeQuest(); });
  $('tabPhoto').onclick = () => setProofTab('photo');
  // voice notes and the read-aloud button are OFF: proof = photo + a typed caption the judge also reads
  $('tabVoice').hidden = true; $('proofVoice').hidden = true; $('tabPhoto').style.gridColumn = '1 / -1';
  $('qSpeak').onclick = async () => { Audio8.play('tap'); const ok = await speak(activeQuest.text, me.pet, 'excited'); if (!ok) toast('Voice failed. ' + (API.lastSayError || 'Is the server running with an ElevenLabs key?'), 6000); };
  function captionBox() {
    let t = $('qCaption');
    if (!t) {
      t = document.createElement('textarea'); t.id = 'qCaption'; t.maxLength = 240; t.rows = 2;
      t.style.cssText = 'width:100%;padding:8px 10px;border:3px solid var(--ink);background:#fff;font:inherit;font-size:15px;resize:none';
      $('proofPhoto').appendChild(t);
      t.addEventListener('input', () => { if (proof) proof.caption = t.value.trim(); });
    }
    return t;
  }
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
      $('photoPreview').src = data; $('photoPreview').hidden = false; proof = { type: 'photo', data, caption: captionBox().value.trim() }; $('qSubmit').disabled = false; Audio8.play('accept');
    };
    img.onerror = () => toast('Could not read that image.');
    img.src = URL.createObjectURL(f);
  });


  $('qReroll').onclick = async () => {
    Audio8.play('tap'); const q = await API.rerollQuest(activeQuest.id); if (q) { openQuest(q); toast('New quest rolled.'); renderQuests(); }
  };

  $('qSubmit').onclick = async () => {
    if (!proof) return;
    const q = activeQuest, pf = proof; closeQuest();
    $('ovJudging').hidden = false;
    $('judgeLine').textContent = `Checking the photo against ${q.place.name}…`;
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
    return new Promise(resolve => {
      buttons.forEach(([label, cls, fn]) => {
        const b = document.createElement('button'); b.className = `btn ${cls} block`; b.textContent = label;
        b.onclick = () => { Audio8.play('tap'); $('ovInfo').hidden = true; if (fn) fn(); resolve(label); };
        acts.appendChild(b);
      });
      if (after) after($('infoBody'));   // buttons exist by now, so `after` may disable/enable them
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
      Audio8.play('reward'); Audio8.happy(me.pet.species); stage.set(q.type === 'food' ? 'eat' : 'happy', 3000); confetti.burst(60);
      $('rwStep').innerHTML = `<div class="big">Quest complete!</div><p class="verdict"></p><div class="xpnum" id="xpCount">+0 XP</div>${res.blessed ? `<span class="tag bless">${ic('sparkle', 12)} ${esc((res.blessingsUsed || []).map(id => (API.BLESSINGS.find(x => x.id === id) || {}).badge || id).join(' · '))}</span> ` : ''}${res.curseLifted ? '<span class="tag curse">curse broken</span>' : ''}<p class="sub">${coinIc()} +${res.coinsGained} coins${res.raidDamage ? ` · ${ic('monster', 14)} ${res.raidDamage} raid damage` : ''}${res.engine && res.engine !== 'mock' ? ` · judged by ${res.engine === 'gemini' ? 'Gemini' : 'the game master'}` : ''}</p>`;
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
      const from = Object.assign({}, me.pet, { species: ev.from, rarity: ev.fromRarity, stage: ev.fromStage || 1 }), to = Object.assign({}, me.pet, { species: ev.to, rarity: ev.toRarity, stage: ev.toStage || 2 });
      $('rwStep').innerHTML = `<div class="big">What?! ${esc(me.pet.name)} is evolving!</div><div class="evo"><canvas id="evoA" width="112" height="140"></canvas><span class="arrow">→</span><canvas id="evoB" width="112" height="140"></canvas></div><div class="big" style="font-size:12px">${esc(ev.toName)}</div><p class="sub">Same ${esc(Animals.A[ev.to].name)}, all grown up.<br><b>Resolution upgrade: ${Animals.RES[ev.fromRarity]}px → ${Animals.RES[ev.toRarity]}px</b></p>`;
      Sprites.drawPet($('evoA').getContext('2d'), from, 0, 20, 7, { anim: 'sad' }); const cb = $('evoB').getContext('2d');
      // the evolved form comes from Sprites.drawEvolved (crown + aura, or the redrawn _2 sheet)
      const paint = (t, anim) => { const cv = Sprites.drawEvolved(ev.to, ev.toStage || 2, { t, anim, px: 5, rarity: ev.toRarity, shiny: me.pet.shiny }); cb.clearRect(0, 0, 112, 140); cb.imageSmoothingEnabled = false; const s = Math.min(112 / cv.width, 140 / cv.height); cb.drawImage(cv, (112 - cv.width * s) / 2, 140 - cv.height * s, cv.width * s, cv.height * s); };
      let n = 0; const iv = setInterval(() => { if (n++ % 2) paint(0, 'idle'); else { cb.fillStyle = '#fff'; cb.fillRect(0, 0, 112, 140); } if (n > 9) { clearInterval(iv); const hv = setInterval(() => { if (!cb.canvas.isConnected) return clearInterval(hv); paint(performance.now(), 'happy'); }, 80); confetti.burst(140); } }, 120);
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
  let clsFilter = 'all';   // Nest filter by rarity (Richard's visuals branch)
  function petCard(p, opts = {}) {
    const d = document.createElement('div'); const r = Animals.normRarity(p.rarity || animal(p).rarity);
    d.className = `critter r-${r}` + (opts.locked ? ' locked' : '');
    const cv = document.createElement('canvas'); cv.width = 72; cv.height = 72; cv.style.width = '72px'; cv.style.height = '72px'; cv.className = 'pixel';
    Sprites.drawPet(cv.getContext('2d'), p, 0, 0, 4.5, { t: 0, fx: false });
    d.appendChild(cv);
    const a = animal(p);
    d.insertAdjacentHTML('beforeend', `<div class="nm"></div><div class="sp"></div><span class="rar ${r}">${r}</span>${p.isNew ? '<span class="new">NEW</span>' : ''}${p.shiny ? '<span class="shiny">SHINY</span>' : ''}`);
    d.querySelector('.nm').textContent = opts.locked ? '???' : (p.name || a.name);
    d.querySelector('.sp').textContent = opts.locked ? `${cap(r)} · ${Animals.RES[r]}px` : `${a.name}${(p.stage || 1) >= 2 ? ' · stage 2' : ''}${p.active ? ' · active' : ''}`;
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
      d.insertAdjacentHTML('beforeend', `<span class="rar ${e.rarity}">${e.rarity}</span>${e.shiny ? '<span class="shiny">SHINY</span>' : ''}<div class="sp">${ready ? 'Ready to hatch!' : `${e.progress}/${e.needed} quests`}</div><div class="meter pr"><i style="width:${e.progress / e.needed * 100}%"></i></div>`);
      d.onclick = () => ready ? hatchEgg(e) : (Audio8.play('tap'), toast(`Complete ${e.needed - e.progress} more quest${e.needed - e.progress > 1 ? 's' : ''} to hatch this egg. Minigames do not count.`));
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
        cv.onclick = null; flash(); if (egg.rarity === 'legendary') Audio8.play('legendary'); confetti.burst(egg.rarity === 'legendary' ? 180 : 80);
        const pet = await API.hatchEgg(egg.id);
        Audio8.hatch(pet.species);
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
    $('petFacts').innerHTML = `<span class="rar ${r}">${r}</span>${(p.stage || 1) >= 2 ? '<span class="rar legendary">stage 2</span>' : ''}<span class="chip">${Animals.RES[r]}px</span><span class="chip">${ic('star', 12)} ${esc(Minigames.gameFor(a.id).name)}${a.minigame === 'rodeo' ? ' (hard)' : ''}</span>${p.shiny ? '<span class="rar legendary">shiny</span>' : ''}`;
    $('petFlavor').textContent = a.flavor;
    const c = $('petBig').getContext('2d');
    clearInterval(petAnim); petAnim = setInterval(() => { if ($('ovPet').hidden) return clearInterval(petAnim); c.clearRect(0, 0, 192, 192); Sprites.drawPet(c, p, 0, 0, 12, { t: performance.now(), anim: 'idle', blink: performance.now() % 3000 < 150 }); }, 80);
    $('petActive').disabled = !!p.active; $('petActive').textContent = p.active ? 'Active' : 'Make active';
    $('petActive').onclick = async () => { await API.setActivePet(p.id); Audio8.play('reward'); $('ovPet').hidden = true; await refreshMe(); stage.set('happy', 1500); toast(`${p.name} is now your active Familiar. New look!`); renderZoo(); };
    $('petPlay').onclick = () => { $('ovPet').hidden = true; playPetGame(p); };
    $('petChallenge').onclick = () => { $('ovPet').hidden = true; pickFriendToChallenge(p); };
    $('petVoice').hidden = true;
    $('ovPet').hidden = false;
  }
  $('petClose').onclick = () => { $('ovPet').hidden = true; Audio8.play('close'); };
  $('ovPet').addEventListener('click', e => { if (e.target === $('ovPet')) $('ovPet').hidden = true; });

  // ------------------------------------------------------------------
  // Minigames + duels
  // ------------------------------------------------------------------
  async function playPetGame(p) {
    const a = animal(p), diff = Math.min(5, RAR.indexOf(Animals.normRarity(p.rarity)) + 2);   // harder: a notch above the rarity tier
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
      if (it.icon) left = `<span class="bigicon" style="width:44px;height:44px">${ic(it.icon, 24)}</span>`;
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
    $('wallet').innerHTML = `<span class="chip">${coinIc()} <b>${shop.coins}</b></span><span class="chip">${ic('orb', 14)} ${nCurses} curses</span><span class="chip">${ic('sparkle', 14, '#c9922a')} ${nBless} blessings</span><span class="chip">${ic('key', 14)} ${inv.keys} raid keys</span>`;
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
      item('key', 'Raid key', 'Opens a raid. Bigger bosses need more keys, but drop rarer eggs.', shop.keyPrice, inv.keys, () => API.buy('key', 'key', 1));
      item('key', 'Key bundle x3', 'Enough for the Lady Bird Kraken. Saves 50 coins.', 250, null, () => API.buy('key', 'key', 3));
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
      else drawIconOnCanvas(cc, x.kind === 'curse' ? x.item.icon : x.kind === 'blessing' ? x.item.icon : x.kind === 'key' ? 'key' : 'coin', 8, 8, 4, '#2b2140', '#ffcf4d');
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
  // Raid bosses: one hand-drawn 24 x 20 sprite each (X outline, p body, d shade, e eye, k pupil, R accent, W white)
  const BOSSES = {
    hydra: { pal: { p: '#ff6f9c', d: '#c9426f', R: '#ffcf4d', e: '#fff', k: '#2b2140' }, rows: [
      '.XXXXX....XXXXX....XXXXX',
      'XpppppX..XpppppX..XpppppX',
      'XpekppX..XpekppX..XppkepX',
      'XpppppX..XpppppX..XpppppX',
      'XpdXdpX..XpdXdpX..XpdXdpX',
      '.XpppX....XpppX....XpppX.',
      '..XppX....XppX....XppX..',
      '...XppX...XppX...XppX...',
      '....XppX..XppX..XppX....',
      '.....XppXXppppXXppX.....',
      '....XppppppppppppppX....',
      '...XppRppppppRpppppRpX..',
      '...XppppppppppppppppppX.',
      '...XdpppppppppppppppdX..',
      '....XddddddddddddddX....',
      '.....XXXdddddddXXX......',
      '.......XdpX.XpdX........',
      '.......XXXX.XXXX........',
    ] },
    golem: { pal: { p: '#b79cff', d: '#7a5fd6', R: '#ffcf4d', e: '#fff', k: '#2b2140' }, rows: [
      '.......XXXXXXXXXX.......',
      '......XddddddddddX......',
      '......XdppppppppdX......',
      '......XdpekppekpdX......',
      '......XdppppppppdX......',
      '......XdpXXXXXXpdX......',
      '......XddddddddddX......',
      '...XXXXXXXXXXXXXXXXXX...',
      '..XpppppppXppppppXpppX..',
      '..XpRppRppXppRppRXpRpX..',
      '..XdddddddXddddddXdddX..',
      '..XXXXXXXXXXXXXXXXXXXX..',
      '..XppppXppppppppXppppX..',
      '..XpRppXppRppRppXppRpX..',
      '..XddddXddddddddXddddX..',
      '..XXXXXXXXXXXXXXXXXXXX..',
      '....XXXXX......XXXXX....',
      '....XdddX......XdddX....',
      '....XXXXX......XXXXX....',
    ] },
    kraken: { pal: { p: '#5ab0ff', d: '#2f6fc4', R: '#ffcf4d', e: '#fff', k: '#2b2140' }, rows: [
      '........XXXXXXXX........',
      '......XXppppppppXX......',
      '.....XppppppppppppX.....',
      '....XppppppppppppppX....',
      '....XppeeppppppeeppX....',
      '....XpekkppppppkkepX....',
      '....XppeeppppppeeppX....',
      '....XpppppXXXXpppppX....',
      '....XddppppppppppddX....',
      '.....XdddddddddddX......',
      '....XXdXXdXXdXXdXXdXX...',
      '...XpXXpXXpXXpXXpXXpX...',
      '..XpX.XpX.XpX.XpX.XpX...',
      '..XpX.XpX.XpX.XpX.XpX...',
      '.XpX..XpX.XpX.XpX..XpX..',
      '.XpX.XpX...XpX.XpX..XpX.',
      'XpX..XX.....XX..XX...XX.',
      'XX......................',
    ] },
  };
  function bossCanvas(id, k = 4) {
    const b = BOSSES[id] || BOSSES.hydra, cv = document.createElement('canvas');
    cv.width = Math.max(...b.rows.map(r => r.length)) * k; cv.height = b.rows.length * k; cv.className = 'bosspx';
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    b.rows.forEach((row, r) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch === '.') continue; c.fillStyle = ch === 'X' ? '#2b2140' : (b.pal[ch] || '#fff'); c.fillRect(x * k, r * k, k, k); } });
    return cv;
  }
  async function renderVillage() {
    village = await API.getVillage();
    const cv = $('villageCanvas'), c = cv.getContext('2d');
    cv.width = 400; cv.height = 150; cv.parentElement.style.height = '150px';
    Sprites.drawHabitat(c, me.pet.species, 400, 150);
    const pets = [me.pet].concat(village.friends.map(f => f.pet));
    const gap = 400 / pets.length, box = 80;           // every pet is drawn in a 16 x 5 box, names on their own line below
    pets.forEach((p, i) => {
      const x = Math.round(i * gap + (gap - box) / 2);
      Sprites.drawPet(c, p, x, 22, 5, { flip: i % 2 === 1, anim: i === 3 ? 'sad' : 'idle', fx: false });
      c.font = '700 13px "Pixelify Sans", sans-serif'; c.textAlign = 'center';
      c.fillStyle = 'rgba(18,13,40,.75)'; const tw = c.measureText(p.name).width; c.fillRect(x + box / 2 - tw / 2 - 4, 118, tw + 8, 18);
      c.fillStyle = '#fff'; c.fillText(p.name, x + box / 2, 131); c.textAlign = 'start';
    });

    // raids
    const names = { me: 'You' }; village.friends.forEach(f => names[f.id] = f.name);
    const rl = $('raidList'); rl.innerHTML = '';
    village.raids.forEach(r => {
      const inRaid = r.members.includes('me'), dead = r.hp <= 0;
      const d = document.createElement('div'); d.className = 'panel raid';
      d.innerHTML = `<div class="row"><h2 class="grow"></h2><span class="chip" style="color:var(--ink)">${ic('key', 14)} ${r.keys} key${r.keys > 1 ? 's' : ''}</span></div>
        <div class="boss">${dead ? ic('skull', 64, '#fff', '#2b2140') : ''}</div>
        <div class="lbl" style="color:#fff">HP ${r.hp} / ${r.maxHp} · reward: ${esc(r.rewardText)}</div>
        <div class="meter hp"><i style="width:${r.hp / r.maxHp * 100}%"></i></div>
        <p style="font-size:15px;margin:8px 0" class="desc"></p>
        <div class="row"><div class="mem grow">${r.members.map(m => `<span class="${m === 'me' ? 'me' : ''}">${esc(names[m] || m)}</span>`).join('')}${r.members.length < r.needed ? `<span class="empty">${r.needed - r.members.length} more</span>` : ''}</div>${inRaid || dead ? '' : `<button class="btn sm pink">Join · ${r.keys} key${r.keys > 1 ? 's' : ''}</button>`}</div>`;
      d.querySelector('h2').textContent = r.name;
      if (!dead) d.querySelector('.boss').appendChild(bossCanvas(r.id));
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
      d.querySelector('[data-act=visit]').onclick = () => { Audio8.cry(f.pet.species); toast(`${f.pet.name} did a little dance for you. ${f.name} got a notification.`); };
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
    $('bookCopy').textContent = 'Copy chapter';
    $('bookCopy').onclick = async () => { const text = `${b.title}\n\n` + b.pages.map(p => p.text).join('\n\n'); try { await navigator.clipboard.writeText(text); toast('Chapter copied.'); } catch (e) { toast('Select the text to copy it.'); } Audio8.play('accept'); };
    $('bookShare').onclick = () => { Audio8.play('bless'); confetti.burst(40); toast('Posted to the village. Leo already replied "no way".'); };
  }

  // ------------------------------------------------------------------
  // Tutorial — spotlight + the pet explains each part
  // ------------------------------------------------------------------
  function tutorialSteps() {
    const n = me.pet.name;
    // five steps: the pet, quests + proof, the social inbox, eggs, the shop
    return [
      { tab: 'home', sel: '#stage', text: `Hi, I'm ${n}! Tap me for hearts. I only grow when you go outside and do real quests.` },
      { tab: 'home', sel: '#questList', text: 'Three quests a day at real places nearby. Prove each one with a photo and a short caption. An AI game master checks it, so no faking!' },
      { tab: 'home', sel: '#inboxList', text: 'Open your welcome package. Friends send curses, blessings and minigame duels here too. Accept a curse and your next quest gets weird.' },
      { tab: 'zoo', sel: '#eggGrid', text: 'Quests drop eggs. The more eggs you keep warm, the longer each takes. Rarer animals hatch sharper: more pixels, more detail.' },
      { tab: 'shop', sel: '#gachaPanel', text: 'The Lucky Capsule: one free pull a day, with a pity timer for Mythic and Legendary. Spend coins on eggs, blessings, curses and raid keys. Now go!' },
    ];
  }
  async function runTutorial() {
    const steps = tutorialSteps(); let i = 0;
    const root = document.createElement('div'); root.className = 'tut';
    root.innerHTML = `<div class="hole"></div><div class="tip"><canvas width="64" height="64"></canvas><div><div class="step"></div><p></p><div class="row"><button class="btn sm ghost" data-a="skip">Skip</button><button class="btn sm pink" data-a="next">Next</button></div></div></div>`;
    document.body.appendChild(root);
    // the tutorial drives the scrolling itself: lock the page and swallow wheel/touch scrolls
    document.body.classList.add('tut-on');
    const block = e => { e.preventDefault(); };
    root.addEventListener('wheel', block, { passive: false }); root.addEventListener('touchmove', block, { passive: false });
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
      async function end() { clearInterval(anim); root.remove(); document.body.classList.remove('tut-on'); await API.setTutorialDone(true); await showTab('home'); resolve(); }
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
        cv.onclick = null; flash(); Audio8.hatch('axolotl'); confetti.burst(100);
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

  // Demo events (settings): every showable moment of the game, on demand, with its full animation
  const DEMO_EVENTS = [
    ['Welcome package', 'gift', 'lilac'], ['Friend curses you', 'curse', 'lilac'],
    ['Friend blesses you', 'bless', 'lilac'], ['Duel request', 'duel', 'lilac'],
    ['Egg ready to hatch', 'eggReady', 'mint'], ['Quest complete + egg', 'quest', 'mint'],
    ['Level up', 'levelUp', 'mint'], ['Evolution', 'evolve', 'mint'],
    ['Legendary egg drop', 'legendary', 'gold'], ['Raid boss defeated', 'raidWin', 'gold'],
    ['Full show: level up, evolution, legendary egg, raid win', 'all', 'pink wide'],
  ];
  const QUEST_DEMOS = { quest: { egg: true }, levelUp: { levelUp: true }, evolve: { evolve: true }, legendary: { legendary: true }, raidWin: { raidWin: true },
    all: { levelUp: true, evolve: true, legendary: true, raidWin: true } };
  const dg = $('demoEvents');
  DEMO_EVENTS.forEach(([label, kind, cls]) => {
    const b = document.createElement('button'); b.className = 'btn sm ' + cls; b.textContent = label;
    b.onclick = async () => {
      $('ovSettings').hidden = true; Audio8.play('tap');
      if (QUEST_DEMOS[kind]) {
        const res = await API.demoQuest(QUEST_DEMOS[kind]);
        if (!res.ok) return toast(res.message);
        showTab('home');
        await rewardSequence(res.quest, res); await refreshMe(); renderQuests();
        if (res.reaction) setTimeout(() => toast(res.reaction), 800);
        return;
      }
      if (kind === 'duel') { const r = await API.simulateIncomingChallenge(); Audio8.play(r.ok ? 'open' : 'error'); toast(r.message, 3600); await refreshMe(); return showTab('home'); }
      const r = await API.demoEvent(kind); await refreshMe();
      if (kind === 'eggReady') { toast('An egg is ready. Tap it in the Nest.', 3000); return showTab('zoo'); }
      Audio8.play(kind === 'curse' ? 'curse' : kind === 'bless' ? 'bless' : 'open');
      toast({ gift: 'A care package landed in your inbox.', curse: `${r.from} sent you a curse. Accept it on Home.`, bless: `${r.from} blessed you. Accept it on Home.` }[kind] || 'Done.', 3000);
      showTab('home');
    };
    dg.appendChild(b);
  });
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
