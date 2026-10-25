/* =====================================================================
   Familiars — mock API + local state
   ---------------------------------------------------------------------
   This is the ONLY file the backend team needs to replace.
   Every function returns a Promise and mirrors a planned HTTP endpoint
   (see SPECS.md → API contract). The UI never touches state directly.

   Real AI already wired (server/server.js, same origin):
     POST /api/proof/verify      photo/voice judge (Gemini or heuristics)
     POST /api/speech/transcribe ElevenLabs Scribe
     POST /api/speech/say        ElevenLabs TTS
   When the server is not running (plain static hosting) everything
   falls back to local mocks so the demo never breaks.
   ===================================================================== */
(function (global) {
  'use strict';

  const KEY = 'familiars.v2';
  const API_BASE = global.FAMILIARS_API || '';
  const EVOLVE_AT = 2;          // quests completed before the axolotl evolves (demo-tuned)
  const EGG_NEEDS = 2;          // quests (or minigame wins) to incubate an egg
  const LEVEL_XP = lvl => 100 + (lvl - 1) * 60;
  const HOUR = 3600 * 1000;
  const VACATION_DECAY = 1.5;   // mood points lost per hour away
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const rnd = (a) => a[Math.floor(Math.random() * a.length)];
  const uid = () => Math.random().toString(36).slice(2, 9);
  const clone = o => JSON.parse(JSON.stringify(o));
  const RAR = ['common', 'uncommon', 'rare', 'mythic', 'legendary'];
  const tierOf = r => Math.max(0, RAR.indexOf(r));

  // ------------------------------------------------------------------
  // Seed content (real places around UT Austin / GDC)
  // In production these come from SerpApi (Maps / Places / Events) and
  // the quest text from Muse Spark in the pet's voice.
  // ------------------------------------------------------------------
  const QUEST_POOL = [
    { type: 'food', title: 'Weirdest thing on the menu',
      place: { name: 'Kerbey Lane Cafe', kind: 'Diner', dist: '0.4 mi', rating: 4.5, hint: 'open until midnight' },
      text: '{pet} smells pancakes!! Go to {place} and order the single weirdest item on the menu. No chickening out.',
      xp: 120, eggChance: 0.6 },
    { type: 'social', title: 'Talk to a stranger',
      place: { name: 'GDC Atrium', kind: 'Hackathon floor', dist: '0 mi', rating: null, hint: 'you are literally here' },
      text: 'Find someone wearing a HackTX shirt you have never talked to and ask what they are building. {pet} wants gossip.',
      xp: 100, eggChance: 0.5 },
    { type: 'outdoor', title: 'Say hi to the turtles',
      place: { name: 'UT Turtle Pond', kind: 'Park', dist: '0.3 mi', rating: 4.8, hint: 'best light before sunset' },
      text: 'Walk to {place} and count the turtles. {pet} thinks there are at least seven. Prove it with a photo.',
      xp: 90, eggChance: 0.45 },
    { type: 'creative', title: 'Doodle the drag',
      place: { name: 'The Drag (Guadalupe St)', kind: 'Street', dist: '0.2 mi', rating: null, hint: 'murals everywhere' },
      text: 'Find a mural on {place} and sketch it in under 3 minutes. Ugly is allowed. {pet} will frame it.',
      xp: 110, eggChance: 0.5 },
    { type: 'food', title: 'Boba roulette',
      place: { name: 'Tapioca House', kind: 'Boba', dist: '0.3 mi', rating: 4.3, hint: 'try the taro' },
      text: 'Go to {place}. Close your eyes, point at the menu, drink whatever you hit. {pet} is thirsty.',
      xp: 95, eggChance: 0.5 },
    { type: 'social', title: 'Compliment a stranger\'s laptop stickers',
      place: { name: 'WEL Grand Hallway', kind: 'Hallway', dist: '0.1 mi', rating: null, hint: 'sponsor tables are here' },
      text: 'Find the best laptop sticker in {place} and tell its owner. Record the conversation for {pet}.',
      xp: 80, eggChance: 0.4 },
    { type: 'outdoor', title: 'Tower sunset',
      place: { name: 'UT Tower lawn', kind: 'Landmark', dist: '0.4 mi', rating: 4.9, hint: 'sunset 6:48pm' },
      text: 'Lie on the grass at {place} and take a photo of the Tower. {pet} wants to see orange.',
      xp: 100, eggChance: 0.55 },
    { type: 'creative', title: 'Museum speedrun',
      place: { name: 'Blanton Museum of Art', kind: 'Museum', dist: '0.6 mi', rating: 4.7, hint: 'free on Thursdays' },
      text: 'Go into {place}, pick ONE artwork, and explain it to {pet} in a 20-second voice note.',
      xp: 130, eggChance: 0.65 },
    { type: 'outdoor', title: 'Bat bridge at dusk',
      place: { name: 'Congress Ave Bridge', kind: 'Bridge', dist: '1.8 mi', rating: 4.7, hint: 'bats fly out around sunset' },
      text: 'Go to {place} at sunset and watch the bats leave. {pet} wants a photo of the bat cloud.',
      xp: 125, eggChance: 0.6 },
    { type: 'food', title: 'Breakfast taco duel',
      place: { name: 'Veracruz All Natural', kind: 'Food truck', dist: '1.1 mi', rating: 4.8, hint: 'migas taco is famous' },
      text: 'Order a migas taco at {place} and rate it out loud from 1 to 10. {pet} trusts your palate.',
      xp: 110, eggChance: 0.55 },
  ];

  // proof: which proof type the curse forces ('voice' | 'photo' | null)
  const CURSES = [
    { id: 'pirate',      name: 'Pirate Voice', icon: 'skull',   price: 30, proof: 'voice', desc: 'Their quest reads like a pirate and the voice note must be in pirate voice.' },
    { id: 'rhyme',       name: 'Rhyme Time',   icon: 'note',    price: 30, proof: 'voice', desc: 'Their proof voice note has to rhyme.' },
    { id: 'hop',         name: 'Hop Hex',      icon: 'frog',    price: 25, proof: null,    desc: 'They have to hop the last 10 steps to the quest location.' },
    { id: 'shout',       name: 'Megaphone',    icon: 'chat',    price: 30, proof: 'voice', desc: 'Quest text is ALL CAPS and the voice note must be shouted.' },
    { id: 'shakespeare', name: 'Ye Olde Bard', icon: 'book',    price: 35, proof: 'voice', desc: 'Quest text turns Shakespearean. Proof must be spoken like a bard.' },
    { id: 'backwards',   name: 'Backwords',    icon: 'reroll',  price: 35, proof: null,    desc: 'Quest text is scrambled backwards. Good luck reading it.' },
    { id: 'opera',       name: 'Opera Night',  icon: 'note',    price: 40, proof: 'voice', desc: 'The voice note must be sung like an opera.' },
    { id: 'mime',        name: 'Mime Time',    icon: 'hand',    price: 35, proof: 'photo', desc: 'Voice proofs are banned. Photo only, and they must be doing a silly pose.' },
    { id: 'whisper',     name: 'Library Hex',  icon: 'mic',     price: 25, proof: 'voice', desc: 'Voice note must be whispered like they are in a library.' },
    { id: 'tiny',        name: 'Tiny Coins',   icon: 'coin',    price: 45, proof: null,    desc: 'Their next quest pays half the coins. Petty, but effective.' },
  ];
  const BLESSINGS = [
    { id: 'double',   name: 'Double XP',     icon: 'star',    price: 40, desc: 'Next quest gives 2x XP.' },
    { id: 'lucky',    name: 'Lucky Clover',  icon: 'egg',     price: 50, desc: 'Next quest is guaranteed to drop an egg.' },
    { id: 'rarityup', name: 'Golden Touch',  icon: 'sparkle', price: 90, desc: 'Next egg dropped is one rarity higher.' },
    { id: 'coinrain', name: 'Coin Rain',     icon: 'coin',    price: 35, desc: 'Next quest pays 3x coins.' },
    { id: 'shield',   name: 'Hex Shield',    icon: 'orb',     price: 45, desc: 'Blocks the next curse someone sends.' },
    { id: 'incubate', name: 'Warm Nest',     icon: 'flame',   price: 40, desc: 'All eggs in the nest get +1 incubation right now.' },
    { id: 'reroll',   name: 'Fresh Start',   icon: 'reroll',  price: 20, desc: 'Gives every open quest a new free reroll.' },
    { id: 'cheer',    name: 'Picnic',        icon: 'heart',   price: 25, desc: 'Mood and hunger instantly full.' },
  ];
  const EGG_PRICE = { common: 80, uncommon: 150, rare: 320, mythic: 750, legendary: 2400 };
  const KEY_PRICE = 100;
  const GACHA = { cost1: 100, cost10: 900, rates: { common: 0.52, uncommon: 0.27, rare: 0.14, mythic: 0.06, legendary: 0.01 },
    pityMythic: 20, pityLegendary: 60, shinyChance: 1 / 16 };

  const FRIENDS_SEED = [
    { id: 'f1', name: 'Leo', pet: { name: 'Pip',     species: 'dog',     rarity: 'rare' },     level: 5, streak: 9,  status: 'On a quest at Caffe Medici', vacation: false },
    { id: 'f2', name: 'Ana', pet: { name: 'Boulder', species: 'turtle',  rarity: 'uncommon' }, level: 4, streak: 3,  status: 'Just hatched a rare egg', vacation: false },
    { id: 'f3', name: 'Sam', pet: { name: 'Hoot',    species: 'owl',     rarity: 'mythic' },   level: 3, streak: 12, status: 'On vacation in Marfa until Tuesday', vacation: true },
    { id: 'f4', name: 'Mia', pet: { name: 'Ziggy',   species: 'fennec',  rarity: 'rare' },     level: 6, streak: 21, status: 'Top of the leaderboard. Insufferable.', vacation: false },
  ];

  const RAIDS_SEED = [
    { id: 'hydra', name: 'The Procrastination Hydra', hp: 300, maxHp: 300, keys: 1, members: ['f1', 'f2'], needed: 3,
      reward: { egg: 'rare' }, rewardText: 'Rare egg for everyone', expires: 'tonight 11:59pm',
      desc: 'A three-headed beast made of unread notifications. Each completed quest by a raid member deals damage.' },
    { id: 'golem', name: 'The Deadline Golem', hp: 600, maxHp: 600, keys: 2, members: ['f4'], needed: 3,
      reward: { egg: 'mythic' }, rewardText: 'Mythic egg for everyone', expires: 'Sunday 11:30am',
      desc: 'Made of stacked due dates. Hits harder every hour you wait.' },
    { id: 'kraken', name: 'The Lady Bird Kraken', hp: 1200, maxHp: 1200, keys: 3, members: [], needed: 4,
      reward: { egg: 'legendary' }, rewardText: 'Legendary egg (Longhorn chance)', expires: 'this weekend',
      desc: 'Lives under Lady Bird Lake. Only a full squad of four can take it down.' },
  ];

  const PET_NAMES = ['Mochi', 'Pudding', 'Biscuit', 'Noodle', 'Pebble', 'Clover', 'Waffle', 'Mango', 'Taco', 'Queso', 'Pecan', 'Bluebonnet'];

  // ------------------------------------------------------------------
  // State
  // ------------------------------------------------------------------
  function freshState() {
    return {
      user: { id: 'me', name: 'You' },
      pet: null,                      // active pet, set on hatch
      xp: 0, level: 1, streak: 4, coins: 1200,
      mood: 70, hunger: 55,
      typeCounts: { food: 0, social: 0, outdoor: 0, creative: 0 },
      completed: [],                  // [{questId, type, title, place, xp, at, proofType}]
      quests: [],                     // today's 3
      eggs: [],                       // [{id, rarity, progress, needed, shiny, source}]
      zoo: [],                        // other pets (not active)
      activeCurse: null,              // {id,name,icon,from,...}
      blessings: [],                  // active blessing ids waiting for next quest
      inventory: { curses: { pirate: 1, rhyme: 1, hop: 1 }, blessings: { double: 1 }, keys: 1 },
      inbox: [],                      // [{id, kind:'curse'|'bless'|'challenge', from, ...}]
      sentCurses: {},                 // friendId -> curseId
      duels: [],                      // challenges you sent [{id, friendId, petName, species, engine, difficulty, triesLeft, status, at}]
      raids: clone(RAIDS_SEED),
      friends: clone(FRIENDS_SEED),
      gacha: { pulls: 0, sinceMythic: 0, sinceLegendary: 0, freeDay: null },
      games: { day: null, rewarded: 0 },
      vacation: null,                 // {start, end, startMood}
      tutorialDone: false,
      settings: { sound: true, forceLegendary: false },
      day: new Date().toDateString(),
    };
  }

  let S = load() || freshState();

  function load() {
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode: fine */ } }

  // ------------------------------------------------------------------
  // Remote (real AI). Every call has a local fallback.
  // ------------------------------------------------------------------
  async function remoteJSON(path, body, timeout = 20000) {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), timeout);
    try {
      const r = await fetch(API_BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal });
      const ct = r.headers.get('content-type') || '';
      if (!ct.includes('json')) return null;            // static server answered with HTML / 404
      return await r.json();
    } catch (e) { return null; } finally { clearTimeout(tm); }
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  function fill(text, pet, place) {
    return text.replace(/{pet}/g, pet ? pet.name : 'Your Familiar').replace(/{place}/g, place.name);
  }
  const TRANSFORMS = {
    pirate: t => t.replace(/\byou\b/gi, 'ye').replace(/\byour\b/gi, 'yer').replace(/\bis\b/g, 'be')
      .replace(/\bHello\b/g, 'Ahoy').replace(/\bfriend\b/gi, 'matey').replace(/\.\s/g, ', arr. ') + ' Arr!',
    shout: t => t.toUpperCase().replace(/\./g, '!!'),
    shakespeare: t => 'Hark! ' + t.replace(/\byou are\b/gi, 'thou art').replace(/\byour\b/gi, 'thy').replace(/\byou\b/gi, 'thee')
      .replace(/\bis\b/g, 'doth be').replace(/\bthe\b/g, 'ye olde') + ' Forsooth.',
    backwards: t => t.split(' ').reverse().join(' '),
  };
  function cursedText(t) { const f = S.activeCurse && TRANSFORMS[S.activeCurse.id]; return f ? f(t) : t; }

  function rollRarity(boost = 0) {
    if (S.settings.forceLegendary) return 'legendary';
    const r = Math.random();
    let out = r < 0.03 ? 'legendary' : r < 0.12 ? 'mythic' : r < 0.32 ? 'rare' : r < 0.6 ? 'uncommon' : 'common';
    return RAR[Math.min(4, tierOf(out) + boost)];
  }

  // seed places get real coordinates so the minimap and "Open in Maps" work offline too (origin: GDC, UT Austin)
  const SEED_COORDS = { 'Kerbey Lane Cafe': [30.2985, -97.7414], 'GDC Atrium': [30.2862, -97.7365], 'UT Turtle Pond': [30.2873, -97.7398],
    'The Drag (Guadalupe St)': [30.2878, -97.7421], 'Tapioca House': [30.2946, -97.7418], 'WEL Grand Hallway': [30.2868, -97.7378],
    'UT Tower lawn': [30.2862, -97.7394], 'Blanton Museum of Art': [30.2810, -97.7376], 'Congress Ave Bridge': [30.2616, -97.7452], 'Veracruz All Natural': [30.2561, -97.7265] };
  const ORIGIN = { lat: 30.2862, lng: -97.7365 };
  function enrichPlace(place) {
    const c = SEED_COORDS[place.name]; if (!c || place.bearing != null) return place;
    const toRad = d => d * Math.PI / 180, [lat, lng] = c;
    const dLat = toRad(lat - ORIGIN.lat), dLng = toRad(lng - ORIGIN.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(ORIGIN.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
    const distMi = 2 * 3958.8 * Math.asin(Math.sqrt(h));
    const y = Math.sin(dLng) * Math.cos(toRad(lat)), x = Math.cos(toRad(ORIGIN.lat)) * Math.sin(toRad(lat)) - Math.sin(toRad(ORIGIN.lat)) * Math.cos(toRad(lat)) * Math.cos(dLng);
    return Object.assign({}, place, { lat, lng, distMi: +distMi.toFixed(2), bearing: Math.round((Math.atan2(y, x) * 180 / Math.PI + 360) % 360),
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' Austin TX')}` });
  }
  function questFrom(q, extra = {}) {
    const place = enrichPlace(q.place);
    return Object.assign({ id: uid(), type: q.type, title: q.title, place, xp: q.xp, eggChance: q.eggChance,
      text: fill(q.text, S.pet, place), status: 'open' }, extra);
  }
  function makeQuests() {
    const types = ['food', 'social', 'outdoor', 'creative'].sort(() => Math.random() - 0.5).slice(0, 3);
    S.quests = types.map(t => questFrom(rnd(QUEST_POOL.filter(p => p.type === t))));
    S.questSource = 'seed';
  }
  // Real quests: SerpApi places near the player, written by Gemini in the pet's voice (server/server.js).
  // Keeps the seed quests when the server/SerpApi is unavailable.
  async function fetchRealQuests(loc) {
    if (!S.pet || !loc) return false;
    const a = Animals.A[S.pet.species] || {};
    const qs = new URLSearchParams({ lat: loc.lat, lng: loc.lng, pet: S.pet.name, species: a.name || S.pet.species, flavor: a.flavor || '', curse: S.activeCurse ? S.activeCurse.name : '' });
    try {
      const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 25000);
      const r = await fetch(`${API_BASE}/api/quests?${qs}`, { signal: ctl.signal }); clearTimeout(tm);
      if (!(r.headers.get('content-type') || '').includes('json')) return false;
      const j = await r.json();
      if (!j.ok || !Array.isArray(j.quests) || !j.quests.length) return false;
      S.quests = j.quests.map(q => questFrom(q, { real: true }));
      S.questSource = 'serpapi'; S.questWriter = j.writer; S.questDay = new Date().toDateString();
      save(); return true;
    } catch (e) { return false; }
  }

  function publicQuest(q) {
    const out = Object.assign({}, q);
    const open = q.status === 'open';
    if (open) out.text = cursedText(q.text);
    out.cursed = !!S.activeCurse && open;
    out.blessed = S.blessings.length > 0 && open;
    out.blessings = open ? S.blessings.slice() : [];
    out.forcedProof = open && S.activeCurse ? S.activeCurse.proof : null;
    return out;
  }

  function dominantType() {
    return Object.entries(S.typeCounts).sort((a, b) => b[1] - a[1])[0][0];
  }

  // mood decays while on vacation; the stored mood is the value at vacation start
  function vacationInfo() {
    const v = S.vacation; if (!v) return null;
    const now = Date.now(), until = Math.min(now, v.end);
    const hours = Math.max(0, (until - v.start) / HOUR);
    return { start: v.start, end: v.end, active: now < v.end, hoursAway: hours,
      remainingMs: Math.max(0, v.end - now), mood: Math.max(5, Math.round(v.startMood - hours * VACATION_DECAY)) };
  }
  function currentMood() { const v = vacationInfo(); return v ? v.mood : S.mood; }
  function onVacation() { const v = vacationInfo(); return !!(v && v.active); }
  function settleVacation() {
    const v = vacationInfo();
    if (v && !v.active) { S.mood = v.mood; S.vacation = null; S.inbox.push({ id: uid(), kind: 'note', from: S.pet ? S.pet.name : 'Your pet', text: `You are back! ${S.pet ? S.pet.name : 'Your Familiar'} missed you. Mood dropped to ${v.mood}. A quest will cheer them up.` }); save(); }
  }

  function snapshot() {
    settleVacation();
    return {
      user: S.user, pet: S.pet, xp: S.xp, level: S.level, xpNeeded: LEVEL_XP(S.level),
      streak: S.streak, coins: S.coins, mood: currentMood(), hunger: S.hunger,
      typeCounts: S.typeCounts, completedToday: S.completed.length,
      activeCurse: S.activeCurse, blessings: S.blessings, blessing: S.blessings.length > 0, settings: S.settings,
      evolveAt: EVOLVE_AT, inboxCount: S.inbox.length, inventory: S.inventory,
      vacation: vacationInfo(), tutorialDone: S.tutorialDone, gacha: gachaInfo(),
    };
  }
  function gachaInfo() {
    const today = new Date().toDateString();
    return { freeAvailable: S.gacha.freeDay !== today, pulls: S.gacha.pulls, cost1: GACHA.cost1, cost10: GACHA.cost10,
      rates: GACHA.rates, pityMythicIn: GACHA.pityMythic - S.gacha.sinceMythic, pityLegendaryIn: GACHA.pityLegendary - S.gacha.sinceLegendary };
  }

  function newEgg(rarity, source, shiny = false) {
    const e = { id: uid(), rarity, progress: 0, needed: EGG_NEEDS + (rarity === 'legendary' ? 1 : 0), shiny, source };
    S.eggs.push(e); return e;
  }
  function allPets() { return (S.pet ? [S.pet] : []).concat(S.zoo); }

  // friends resolve duels after a few seconds (mock realtime)
  function tickDuels() {
    const now = Date.now();
    S.duels.forEach(d => {
      if (d.status !== 'pending' || now - d.at < 8000) return;
      const f = S.friends.find(x => x.id === d.friendId);
      const pTry = [0.8, 0.65, 0.5, 0.35, 0.18][d.difficulty - 1] || 0.5;
      let tries = 0, won = false;
      while (tries < 3 && !won) { tries++; won = Math.random() < pTry; }
      d.triesUsed = tries; d.status = won ? 'beaten' : 'failed';
      if (!won) { const prize = 30 + d.difficulty * 25; d.prize = prize; S.coins += prize;
        S.inbox.push({ id: uid(), kind: 'note', from: f.name, text: `${f.name} failed ${d.petName}'s ${d.engineName} 3 times. You win ${prize} coins.` }); }
      else S.inbox.push({ id: uid(), kind: 'note', from: f.name, text: `${f.name} beat ${d.petName}'s ${d.engineName} on try ${tries}. Rematch?` });
    });
  }

  // ------------------------------------------------------------------
  // Public API — each maps to an endpoint in SPECS.md
  // ------------------------------------------------------------------
  const API = {
    CURSES, BLESSINGS, EGG_PRICE, KEY_PRICE,

    /** GET /me */
    async getMe() { await delay(60); tickDuels(); return snapshot(); },

    /** POST /pet/hatch  { name } */
    async hatch({ name }) {
      await delay(200);
      S.pet = { id: uid(), name: name || rnd(PET_NAMES), species: 'axolotl', rarity: 'common', bornAt: Date.now() };
      makeQuests();
      // first-run social hooks: a friend has already cursed you and challenged you
      S.inbox.push({ id: uid(), kind: 'curse', from: 'Leo', curse: CURSES[0] });
      S.inbox.push({ id: uid(), kind: 'challenge', from: 'Leo', pet: clone(FRIENDS_SEED[0].pet), engine: 'timing', difficulty: 3, triesLeft: 3, wager: 40 });
      save();
      return S.pet;
    },

    async suggestName() { await delay(30); return rnd(PET_NAMES); },

    /** GET /quests?lat&lng — SerpApi places + Gemini text when the server runs; seed pool otherwise */
    async getQuests(loc) {
      await delay(60);
      if (!S.quests.length && S.pet) makeQuests();
      const fresh = S.questSource === 'serpapi' && S.questDay === new Date().toDateString();
      if (loc && !fresh && S.quests.every(q => q.status === 'open')) await fetchRealQuests(loc);
      return S.quests.map(publicQuest);
    },
    /** POST /quests/refresh — pull a new set of real places (only while nothing is done yet) */
    async refreshQuests(loc) {
      if (S.quests.some(q => q.status !== 'open')) return { ok: false, message: 'Finish today\'s quests first.' };
      S.questSource = 'seed';
      const ok = await fetchRealQuests(loc);
      if (!ok) { makeQuests(); save(); }
      return { ok: true, source: S.questSource, quests: S.quests.map(publicQuest) };
    },
    questInfo() { return { source: S.questSource || 'seed', writer: S.questWriter || null }; },

    /** POST /chat { message } — talk to your pet (Gemini in character, canned lines offline) */
    async chat(message, history) {
      const a = Animals.A[S.pet.species] || {};
      const r = await remoteJSON('/api/chat', { message, history,
        pet: { name: S.pet.name, species: a.name || S.pet.species, flavor: a.flavor || '', mood: currentMood(), hunger: S.hunger, level: S.level },
        quests: S.quests.map(q => ({ title: q.title, type: q.type, status: q.status, place: { name: q.place.name } })) }, 30000);
      if (r && r.ok) return r;
      const open = S.quests.find(q => q.status === 'open');
      const lines = [
        open ? `I cannot think straight without wifi, but I remember one thing: ${open.title.toLowerCase()} at ${open.place.name}. Go?` : 'All quests done? Then this is cuddle time.',
        `${S.pet.name} tilts head. Say that again, but outside?`,
        S.hunger < 40 ? 'Did you say snack? I definitely heard snack.' : 'I am listening. I am also thinking about the turtle pond.',
      ];
      return { ok: true, reply: rnd(lines), mood: 'neutral', engine: 'fallback' };
    },

    /** POST /quests/:id/reroll — one free reroll per quest */
    async rerollQuest(id) {
      await delay(300);
      const i = S.quests.findIndex(q => q.id === id);
      if (i < 0) return null;
      const used = S.quests.map(q => q.title);
      const q = rnd(QUEST_POOL.filter(p => !used.includes(p.title)));
      S.quests[i] = questFrom(q, { rerolled: true });
      save();
      return publicQuest(S.quests[i]);
    },

    /**
     * POST /quests/:id/complete  { proof: { type:'photo'|'voice', data } }
     * The proof is judged by /api/proof/verify (Gemini vision / transcript judge,
     * heuristic fallback). Rejected proofs return ok:false + rejected:true and no XP.
     */
    async completeQuest(id, proof) {
      const started = Date.now();
      const q = S.quests.find(x => x.id === id);
      if (!q || q.status !== 'open') return { ok: false, message: 'Quest not found.' };
      if (S.activeCurse && S.activeCurse.proof && proof.type !== S.activeCurse.proof)
        return { ok: false, rejected: true, message: `Cursed! ${S.activeCurse.name} only accepts a ${S.activeCurse.proof} proof.`, reasons: [] };

      const verdict = await remoteJSON('/api/proof/verify', {
        type: proof.type, quest: { title: q.title, text: q.text, type: q.type, place: q.place },
        curse: S.activeCurse ? { id: S.activeCurse.id, name: S.activeCurse.name, desc: S.activeCurse.desc } : null,
        petName: S.pet.name,
        image: proof.type === 'photo' ? proof.data : undefined,
        transcript: proof.type === 'voice' ? proof.data.transcript : undefined,
      });
      await delay(Math.max(0, 1100 - (Date.now() - started)));   // let the judging animation breathe
      if (verdict && verdict.ok === false)
        return { ok: false, rejected: true, message: verdict.message || 'The game master is not convinced.', reasons: verdict.reasons || [], engine: verdict.engine };

      // --- game master verdict (server or mock)
      const mock = {
        photo: ['That is definitely the place. {pet} approves.', 'Verified! {pet} zoomed in on the food and screamed.', 'Counts. Barely. {pet} says the lighting was dramatic.'],
        voice: ['Heard every word. {pet} laughed at the second half.', 'Transcribed and judged: legit. {pet} wants a sequel.'],
      };
      let message = verdict && verdict.message ? verdict.message : fill(rnd(mock[proof.type] || mock.photo), S.pet, q.place);
      if (!verdict && S.activeCurse && S.activeCurse.id === 'pirate' && proof.type === 'voice') message = 'Pirate accent detected. Curse lifted. Legendary performance.';

      // --- blessings
      const used = S.blessings.slice(); S.blessings = [];
      const has = b => used.includes(b);
      let xp = q.xp; if (has('double')) xp *= 2;
      let coins = Math.round(xp / 2); if (has('coinrain')) coins *= 3;
      const curse = S.activeCurse; if (curse && curse.id === 'tiny') coins = Math.round(coins / 2);
      const curseLifted = !!curse; S.activeCurse = null;

      // vacation ends when you quest again
      if (S.vacation) { S.mood = currentMood(); S.vacation = null; }
      S.xp += xp; S.coins += coins;
      S.mood = Math.min(100, S.mood + 15); S.hunger = q.type === 'food' ? 100 : Math.min(100, S.hunger + 5);
      S.typeCounts[q.type] = (S.typeCounts[q.type] || 0) + 1;
      q.status = 'done';
      S.completed.push({ questId: q.id, type: q.type, title: q.title, place: q.place.name, xp, at: Date.now(), proofType: proof.type });

      let levelUp = false;
      while (S.xp >= LEVEL_XP(S.level)) { S.xp -= LEVEL_XP(S.level); S.level++; levelUp = true; }

      // egg drop
      let egg = null;
      if (Math.random() < q.eggChance || has('lucky') || S.settings.forceLegendary || S.completed.length === 1) {
        egg = newEgg(rollRarity(has('rarityup') ? 1 : 0), 'quest', Math.random() < GACHA.shinyChance);
      }
      S.eggs.forEach(e => { if (e !== egg) e.progress = Math.min(e.needed, e.progress + 1); });
      const readyEggs = S.eggs.filter(e => e.progress >= e.needed).map(e => e.id);

      // evolution: the starter axolotl becomes an animal by your dominant quest type, one tier sharper
      let evolution = null;
      if (S.pet.species === 'axolotl' && S.completed.length >= EVOLVE_AT) {
        const to = Animals.EVOLVE_TO[dominantType()];
        evolution = { from: 'axolotl', to, toName: Animals.A[to].name, fromRarity: S.pet.rarity, toRarity: 'uncommon' };
        S.pet.species = to; S.pet.rarity = 'uncommon';
      }

      // raid damage for every raid you are in
      let raidDamage = 0; const raidWins = [];
      S.raids.forEach(r => {
        if (!r.members.includes('me') || r.hp <= 0) return;
        const dmg = Math.round(xp * 0.8); raidDamage += dmg; r.hp = Math.max(0, r.hp - dmg);
        if (r.hp === 0) { raidWins.push(r.name); newEgg(r.reward.egg, 'raid'); }
      });

      const reaction = rnd(['Leo: "no way you actually did that"', 'Ana sent you a heart', 'Mia is suddenly questing too', 'Sam\'s owl hooted from vacation']);
      save();
      return { ok: true, message, xpGained: xp, coinsGained: coins, blessed: used.length > 0, blessingsUsed: used, curseLifted, levelUp, level: S.level,
        egg, readyEggs, evolution, raidDamage, raidWins, reaction, engine: verdict ? verdict.engine : 'mock', state: snapshot() };
    },

    /** POST /speech/transcribe (ElevenLabs Scribe). Returns {ok, text} or null if unavailable. */
    async transcribe(blob) {
      try {
        // keyterms help Scribe spell the place and pet names right
        const open = S.quests.filter(q => q.status === 'open').map(q => q.place.name);
        const kt = encodeURIComponent([S.pet && S.pet.name, 'Familiars', 'HackTX'].concat(open).filter(Boolean).join(','));
        const r = await fetch(API_BASE + '/api/speech/transcribe?keyterms=' + kt, { method: 'POST', headers: { 'Content-Type': blob.type || 'audio/webm' }, body: blob });
        if (!(r.headers.get('content-type') || '').includes('json')) return null;
        const j = await r.json(); return j && j.ok ? j : null;
      } catch (e) { return null; }
    },

    /** POST /speech/say (ElevenLabs TTS). Returns an audio Blob or null. */
    async say(text, voice, mood = 'neutral') {
      try {
        const r = await fetch(API_BASE + '/api/speech/say', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice, mood }) });
        if (!r.ok || !(r.headers.get('content-type') || '').includes('audio')) return null;
        return await r.blob();
      } catch (e) { return null; }
    },

    /** GET /zoo */
    async getZoo() {
      await delay(60);
      return { pets: S.zoo, eggs: S.eggs, active: S.pet };
    },

    /** POST /eggs/:id/hatch — species only from that egg's tier (Longhorn only from legendary) */
    async hatchEgg(id) {
      await delay(200);
      const i = S.eggs.findIndex(e => e.id === id);
      if (i < 0) return null;
      const egg = S.eggs.splice(i, 1)[0];
      const owned = new Set(allPets().map(p => p.species));
      const pool = Animals.POOL[egg.rarity];
      const fresh = pool.filter(s => !owned.has(s));
      const species = rnd(fresh.length && Math.random() < 0.7 ? fresh : pool);
      const pet = { id: uid(), name: rnd(PET_NAMES), species, rarity: egg.rarity, shiny: !!egg.shiny, bornAt: Date.now(), isNew: !owned.has(species) };
      S.zoo.push(pet);
      save();
      return pet;
    },

    /** POST /pets/:id/activate — the active pet sets the whole app theme */
    async setActivePet(id) {
      await delay(80);
      const i = S.zoo.findIndex(p => p.id === id);
      if (i < 0) return S.pet;
      const next = S.zoo.splice(i, 1)[0];
      if (S.pet) S.zoo.unshift(S.pet);
      S.pet = next; save();
      return S.pet;
    },

    /** PATCH /pets/:id { name } */
    async renamePet(id, name) {
      const p = allPets().find(x => x.id === id); if (p && name) p.name = name.slice(0, 12); save(); return p;
    },

    // ---------------------------------------------------------------- shop
    /** GET /shop */
    async getShop() {
      await delay(60);
      return { coins: S.coins, inventory: S.inventory, curses: CURSES, blessings: BLESSINGS, eggPrice: EGG_PRICE, keyPrice: KEY_PRICE, gacha: gachaInfo() };
    },

    /** POST /shop/buy { kind:'egg'|'curse'|'blessing'|'key', id, qty } */
    async buy(kind, id, qty = 1) {
      await delay(150);
      let price = 0;
      if (kind === 'egg') price = EGG_PRICE[id];
      if (kind === 'curse') price = (CURSES.find(c => c.id === id) || {}).price;
      if (kind === 'blessing') price = (BLESSINGS.find(c => c.id === id) || {}).price;
      if (kind === 'key') price = qty >= 3 ? 250 : KEY_PRICE * qty;
      if (!price) return { ok: false, message: 'Unknown item.' };
      if (S.coins < price) return { ok: false, message: `Not enough coins. You need ${price - S.coins} more. Go do a quest!` };
      S.coins -= price;
      if (kind === 'egg') newEgg(id, 'shop', Math.random() < GACHA.shinyChance);
      if (kind === 'curse') S.inventory.curses[id] = (S.inventory.curses[id] || 0) + qty;
      if (kind === 'blessing') S.inventory.blessings[id] = (S.inventory.blessings[id] || 0) + qty;
      if (kind === 'key') S.inventory.keys += qty;
      save();
      return { ok: true, coins: S.coins, inventory: S.inventory };
    },

    /** POST /blessings/:id/use — spend a blessing on yourself */
    async useBlessing(id) {
      await delay(100);
      if (!S.inventory.blessings[id]) return { ok: false, message: 'You do not own that blessing.' };
      S.inventory.blessings[id]--;
      const b = BLESSINGS.find(x => x.id === id);
      let message = `${b.name} is active on your next quest.`;
      if (id === 'incubate') { S.eggs.forEach(e => { e.progress = Math.min(e.needed, e.progress + 1); }); message = 'Every egg in the nest got warmer (+1).'; }
      else if (id === 'reroll') { S.quests.forEach(q => { q.rerolled = false; }); message = 'Every quest has a fresh reroll.'; }
      else if (id === 'cheer') { if (S.vacation) S.vacation.startMood = 100; S.mood = 100; S.hunger = 100; message = `Picnic! ${S.pet.name} is full and happy.`; }
      else if (id === 'shield') { S.shield = true; message = 'Hex Shield up. The next curse bounces off.'; }
      else if (!S.blessings.includes(id)) S.blessings.push(id);
      save();
      return { ok: true, message };
    },

    /** POST /gacha/pull { count:1|10, free? } — Lucky Capsule machine */
    async pullGacha(count = 1, free = false) {
      await delay(200);
      const today = new Date().toDateString();
      if (free) { if (S.gacha.freeDay === today) return { ok: false, message: 'Free capsule already used today.' }; S.gacha.freeDay = today; count = 1; }
      else {
        const cost = count >= 10 ? GACHA.cost10 : GACHA.cost1 * count;
        if (S.coins < cost) return { ok: false, message: `Need ${cost - S.coins} more coins.` };
        S.coins -= cost;
      }
      const results = [];
      for (let i = 0; i < count; i++) {
        S.gacha.pulls++; S.gacha.sinceMythic++; S.gacha.sinceLegendary++;
        let rarity = 'common';
        if (S.settings.forceLegendary) rarity = 'legendary';
        else {
          const r = Math.random(); let acc = 0;
          for (const k of ['legendary', 'mythic', 'rare', 'uncommon', 'common']) { acc += GACHA.rates[k]; if (r < acc) { rarity = k; break; } }
        }
        let pity = null;
        if (S.gacha.sinceLegendary >= GACHA.pityLegendary) { rarity = 'legendary'; pity = 'legendary'; }
        else if (S.gacha.sinceMythic >= GACHA.pityMythic && tierOf(rarity) < 3) { rarity = 'mythic'; pity = 'mythic'; }
        if (count >= 10 && i === count - 1 && !results.some(x => tierOf(x.rarity) >= 2) && tierOf(rarity) < 2) { rarity = 'rare'; pity = 'rare'; }
        if (tierOf(rarity) >= 3) S.gacha.sinceMythic = 0;
        if (rarity === 'legendary') S.gacha.sinceLegendary = 0;
        // common capsules are sometimes items instead of eggs
        if (rarity === 'common' && Math.random() < 0.45) {
          const roll = Math.random();
          if (roll < 0.35) { const c = rnd(CURSES); S.inventory.curses[c.id] = (S.inventory.curses[c.id] || 0) + 1; results.push({ kind: 'curse', rarity, item: c }); }
          else if (roll < 0.7) { const b = rnd(BLESSINGS); S.inventory.blessings[b.id] = (S.inventory.blessings[b.id] || 0) + 1; results.push({ kind: 'blessing', rarity, item: b }); }
          else if (roll < 0.85) { S.inventory.keys++; results.push({ kind: 'key', rarity }); }
          else { S.coins += 60; results.push({ kind: 'coins', rarity, amount: 60 }); }
          continue;
        }
        const egg = newEgg(rarity, 'gacha', Math.random() < GACHA.shinyChance);
        results.push({ kind: 'egg', rarity, egg, pity, shiny: egg.shiny });
      }
      save();
      return { ok: true, results, coins: S.coins, gacha: gachaInfo() };
    },

    // ---------------------------------------------------------------- minigames
    /** POST /minigames/result { petId, win, practice } — wins warm eggs and pay coins (5 rewarded/day) */
    async reportMinigame(petId, win) {
      await delay(80);
      const today = new Date().toDateString();
      if (S.games.day !== today) S.games = { day: today, rewarded: 0 };
      const p = allPets().find(x => x.id === petId);
      if (!win) { save(); return { ok: true, reward: null }; }
      if (S.games.rewarded >= 5) return { ok: true, reward: null, message: 'Daily minigame rewards used up. Still bragging rights.' };
      S.games.rewarded++;
      const coins = 15 + tierOf(p ? p.rarity : 'common') * 15;
      S.coins += coins; S.mood = Math.min(100, S.mood + 8);
      S.eggs.forEach(e => { e.progress = Math.min(e.needed, e.progress + 1); });
      save();
      return { ok: true, reward: { coins, warmed: S.eggs.length }, left: 5 - S.games.rewarded };
    },

    /** POST /friends/:id/challenge { petId } — friend gets 3 tries at your pet's minigame */
    async sendChallenge(friendId, petId) {
      await delay(200);
      const f = S.friends.find(x => x.id === friendId);
      const p = allPets().find(x => x.id === petId);
      if (!f || !p) return { ok: false, message: 'Not found.' };
      if (f.vacation) return { ok: false, message: `${f.name} is on vacation. Duel requests are paused until they are back.` };
      if (S.duels.some(d => d.friendId === friendId && d.status === 'pending')) return { ok: false, message: `${f.name} is still working on your last challenge.` };
      const a = Animals.A[p.species];
      const d = { id: uid(), friendId, friendName: f.name, petName: p.name, species: p.species, rarity: p.rarity, engine: a.minigame,
        engineName: (global.Minigames && Minigames.gameFor ? Minigames.gameFor(p.species).name : a.minigame),
        difficulty: tierOf(p.rarity) + 1, triesLeft: 3, status: 'pending', at: Date.now() };
      S.duels.unshift(d); S.duels = S.duels.slice(0, 8); save();
      return { ok: true, duel: d, message: `Sent! ${f.name} has 3 tries to beat ${p.name}'s ${d.engineName}. If they fail all 3, you win coins.` };
    },

    /** POST /inbox/:id/attempt { win } — one try at a challenge a friend sent you */
    async attemptChallenge(id, win) {
      await delay(80);
      const m = S.inbox.find(x => x.id === id && x.kind === 'challenge');
      if (!m) return null;
      if (win) { S.inbox = S.inbox.filter(x => x !== m); S.coins += m.wager; save(); return { done: true, win: true, coins: m.wager, message: `You beat ${m.from}'s ${m.pet.name}! +${m.wager} coins.` }; }
      m.triesLeft--;
      if (m.triesLeft <= 0) { S.inbox = S.inbox.filter(x => x !== m); S.coins = Math.max(0, S.coins - Math.round(m.wager / 2)); S.mood = Math.max(0, S.mood - 10);
        save(); return { done: true, win: false, message: `Out of tries. ${m.from} wins and takes ${Math.round(m.wager / 2)} coins. ${S.pet.name} is a little sad.` }; }
      save(); return { done: false, triesLeft: m.triesLeft, message: `${m.triesLeft} tr${m.triesLeft === 1 ? 'y' : 'ies'} left.` };
    },

    /** DEV: a friend sends you a duel request (blocked while on vacation) */
    async simulateIncomingChallenge() {
      await delay(100);
      const f = rnd(S.friends.filter(x => !x.vacation));
      if (onVacation()) return { ok: false, blocked: true, message: `${f.name} tried to challenge you, but you are on vacation. Request bounced.` };
      const diff = tierOf(f.pet.rarity) + 1;
      S.inbox.push({ id: uid(), kind: 'challenge', from: f.name, pet: clone(f.pet), engine: Animals.A[f.pet.species].minigame, difficulty: diff, triesLeft: 3, wager: 20 + diff * 15 });
      save(); return { ok: true, message: `${f.name} challenged you to ${f.pet.name}'s minigame.` };
    },

    // ---------------------------------------------------------------- village
    /** GET /village */
    async getVillage() {
      await delay(80);
      tickDuels(); save();
      return { friends: S.friends.map(f => Object.assign({}, f, { cursedBy: S.sentCurses[f.id] || null })),
        raids: S.raids, inbox: S.inbox, curses: CURSES, blessings: BLESSINGS, inventory: S.inventory, duels: S.duels,
        onVacation: onVacation() };
    },

    /** POST /inbox/:id/accept  — apply an incoming curse / blessing, dismiss notes */
    async acceptInbox(id) {
      await delay(60);
      const i = S.inbox.findIndex(m => m.id === id);
      if (i < 0) return null;
      const m = S.inbox[i];
      if (m.kind === 'challenge') return m;          // challenges stay until played (attemptChallenge)
      S.inbox.splice(i, 1);
      if (m.kind === 'curse') {
        if (S.shield) { S.shield = false; save(); return Object.assign({ shielded: true }, m); }
        S.activeCurse = Object.assign({ from: m.from }, m.curse);
      }
      if (m.kind === 'bless' && !S.blessings.includes(m.blessing.id)) S.blessings.push(m.blessing.id);
      save();
      return m;
    },

    /** POST /friends/:id/curse { curseId } — uses a scroll from your inventory */
    async sendCurse(friendId, curseId) {
      await delay(200);
      if (!S.inventory.curses[curseId]) return { ok: false, message: 'No scroll left. Buy one in the shop.' };
      S.inventory.curses[curseId]--;
      S.sentCurses[friendId] = curseId;
      save();
      const f = S.friends.find(x => x.id === friendId), c = CURSES.find(x => x.id === curseId);
      return { ok: true, message: `${f.name}'s ${f.pet.name} got ${c.name}. They have 24h to break it.` };
    },

    /** POST /friends/:id/bless { blessingId } — uses one from your inventory, or the free daily Double XP */
    async sendBless(friendId, blessingId = 'double') {
      await delay(200);
      const f = S.friends.find(x => x.id === friendId);
      const today = new Date().toDateString();
      f.blessDay = f.blessDay || null;
      if (blessingId === 'double' && f.blessDay !== today) f.blessDay = today;
      else if (S.inventory.blessings[blessingId]) S.inventory.blessings[blessingId]--;
      else return { ok: false, message: 'You do not own that blessing. The free Double XP is once per friend per day.' };
      const b = BLESSINGS.find(x => x.id === blessingId);
      save();
      return { ok: true, message: `${f.pet.name} glows. ${f.name} got ${b.name}.` };
    },

    /** POST /raids/:id/join — costs raid keys */
    async joinRaid(id) {
      await delay(200);
      const r = S.raids.find(x => x.id === id) || S.raids[0];
      if (r.members.includes('me')) return { ok: true, raid: r };
      if (S.inventory.keys < r.keys) return { ok: false, message: `This raid needs ${r.keys} key${r.keys > 1 ? 's' : ''}. You have ${S.inventory.keys}. Get more in the shop.` };
      S.inventory.keys -= r.keys; r.members.push('me'); save();
      return { ok: true, raid: r };
    },

    // ---------------------------------------------------------------- vacation
    /** POST /vacation { hours } — pets slowly get sadder, duel requests are blocked */
    async startVacation(hours) {
      await delay(100);
      const now = Date.now();
      S.vacation = { start: now, end: now + hours * HOUR, startMood: S.mood };
      save(); return vacationInfo();
    },
    async endVacation() { await delay(80); if (S.vacation) { S.mood = currentMood(); S.vacation = null; save(); } return snapshot(); },
    /** DEV: pretend time passed */
    async skipVacationTime(hours) {
      if (!S.vacation) return null;
      S.vacation.start -= hours * HOUR; S.vacation.end -= hours * HOUR; save();
      return vacationInfo();
    },

    /** GET /storybook/today  (Muse Spark writes it, Muse Image illustrates) */
    async getStorybook() {
      await delay(120);
      const p = S.pet;
      if (!p) return null;
      const done = S.completed;
      const sp = Animals.A[p.species].name;
      const pages = [];
      pages.push({ scene: 'morning', text: `Once upon a hack, in a kingdom called Austin, a small ${sp} named ${p.name} woke up hungry for adventure. The sky was the colour of cold brew and the Tower was already awake.` });
      if (!done.length) pages.push({ scene: 'waiting', text: `${p.name} waited by the window. Three quests sat unopened on the table. "Tomorrow," ${p.name} whispered. (Complete a quest and this chapter rewrites itself.)` });
      done.forEach(d => {
        const lines = {
          food:     `At ${d.place}, ${p.name} dared you to order something with no recognizable name. You did. ${p.name} grew a little rounder and a lot happier.`,
          social:   `In ${d.place}, you talked to a stranger who turned out to be building a robot that folds laundry. ${p.name} sparkled the whole time.`,
          outdoor:  `You walked all the way to ${d.place}. ${p.name} counted turtles, clouds, and one very confused squirrel.`,
          creative: `Inside ${d.place} you explained a painting to ${p.name} for twenty seconds, which is nineteen more than most people do.`,
        };
        pages.push({ scene: d.type, text: lines[d.type], xp: d.xp });
      });
      if (p.species !== 'axolotl' && S.completed.length >= EVOLVE_AT) pages.push({ scene: 'evolve', text: `And that was the day ${p.name} stopped being a tiny axolotl and became a ${sp}. Nobody in the village could believe it. Leo cursed you out of jealousy.` });
      pages.push({ scene: 'night', text: `${p.name} fell asleep at level ${S.level} with a ${S.streak}-day streak, dreaming of ${S.eggs.length ? 'the eggs in the nest' : 'tomorrow\'s quests'}. The end. For now.` });
      return { title: `Chapter ${S.streak}: The ${sp} of ${done[0] ? done[0].place : 'Guadalupe Street'}`, date: S.day, pages, pet: p };
    },

    /** PATCH /settings */
    async setSettings(patch) { Object.assign(S.settings, patch); save(); return S.settings; },
    async setTutorialDone(v = true) { S.tutorialDone = v; save(); },

    /** DEV: tester account — every animal, a hatchable egg of each tier, coins, items and keys */
    async unlockAll() {
      await delay(100);
      const owned = new Set(allPets().map(p => p.species));
      Object.keys(Animals.A).forEach(id => {
        if (owned.has(id)) return;
        const a = Animals.A[id];
        S.zoo.push({ id: uid(), name: a.name.split(' ').pop().slice(0, 12), species: id, rarity: a.rarity, shiny: id === 'chameleon', bornAt: Date.now() });
      });
      S.coins += 50000; S.inventory.keys += 20;
      CURSES.forEach(c => { S.inventory.curses[c.id] = (S.inventory.curses[c.id] || 0) + 5; });
      BLESSINGS.forEach(b => { S.inventory.blessings[b.id] = (S.inventory.blessings[b.id] || 0) + 5; });
      RAR.forEach(r => newEgg(r, 'dev', r === 'legendary'));
      S.eggs.forEach(e => { e.progress = e.needed; });
      S.user = { id: 'me', name: 'Tester', role: 'admin' };
      S.tutorialDone = true;
      save();
      return snapshot();
    },

    /** DEV: wipe demo */
    async reset() { S = freshState(); save(); return true; },
  };

  global.API = API;
})(window);
