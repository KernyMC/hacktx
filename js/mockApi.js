/* =====================================================================
   Pixlings — mock API + local state
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
    { id: 'pirate',      name: 'Pirate Voice', icon: 'skull',   price: 30, proof: null,    desc: 'Their quest reads like a pirate and the proof caption must be written in pirate talk.', caption: 'write your caption like a pirate (arr, matey, ye)' },
    { id: 'rhyme',       name: 'Rhyme Time',   icon: 'note',    price: 30, proof: null,    desc: 'Their proof caption has to rhyme.', caption: 'make your caption rhyme' },
    { id: 'hop',         name: 'Hop Hex',      icon: 'frog',    price: 25, proof: null,    desc: 'They have to hop the last 10 steps to the quest location.' },
    { id: 'shout',       name: 'Megaphone',    icon: 'chat',    price: 30, proof: null,    desc: 'Quest text is ALL CAPS and the caption must be SHOUTED.', caption: 'WRITE YOUR CAPTION IN ALL CAPS' },
    { id: 'shakespeare', name: 'Ye Olde Bard', icon: 'quill',    price: 35, proof: null,    desc: 'Quest text turns Shakespearean. The caption must be written like a bard.', caption: 'write your caption like Shakespeare (thee, thou, forsooth)' },
    { id: 'backwards',   name: 'Backwords',    icon: 'reroll',  price: 35, proof: null,    desc: 'Quest text is scrambled backwards. Good luck reading it.' },
    { id: 'opera',       name: 'Opera Night',  icon: 'note',    price: 40, proof: null,    desc: 'The caption must read like an aria: dramatic, with at least one "ooo".', caption: 'write your caption as a dramatic aria' },
    { id: 'mime',        name: 'Mime Time',    icon: 'hand',    price: 35, proof: null,    desc: 'The photo must include a silly pose. Not a word in the caption.' },
    { id: 'whisper',     name: 'Library Hex',  icon: 'mic',     price: 25, proof: null,    desc: 'The caption must be whispered: all lowercase, no exclamation marks.', caption: 'whisper it: all lowercase, no exclamation marks' },
    { id: 'tiny',        name: 'Tiny Coins',   icon: 'pouch',    price: 45, proof: null,    desc: 'Their next quest pays half the coins. Petty, but effective.' },
  ];
  const BLESSINGS = [
    { id: 'double',   name: 'Double XP',     icon: 'star',    price: 40, badge: '2x XP', desc: 'Next quest gives 2x XP.' },
    { id: 'lucky',    name: 'Lucky Clover',  icon: 'egg',     price: 50, badge: 'egg guaranteed', desc: 'Next quest is guaranteed to drop an egg.' },
    { id: 'rarityup', name: 'Golden Touch',  icon: 'sparkle', price: 90, badge: 'rarity +1', desc: 'Next egg dropped is one rarity higher.' },
    { id: 'coinrain', name: 'Coin Rain',     icon: 'coins',    price: 35, badge: '2x coins', desc: 'Next quest pays 2x coins.' },
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
    { id: 'f1', name: 'Leo', pet: { name: 'Pip',     species: 'dog',     rarity: 'common' },     level: 5, streak: 9,  status: 'On a quest at Caffe Medici', vacation: false },
    { id: 'f2', name: 'Ana', pet: { name: 'Boulder', species: 'turtle',  rarity: 'uncommon' }, level: 4, streak: 3,  status: 'Just hatched a rare egg', vacation: false },
    { id: 'f3', name: 'Sam', pet: { name: 'Hoot',    species: 'owl',     rarity: 'rare' },   level: 3, streak: 12, status: 'On vacation in Marfa until Tuesday', vacation: true },
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
      xp: 0, level: 1, streak: 4, coins: 0,            // starter goods come in the Welcome Package (inbox gift)
      mood: 70, hunger: 55,
      typeCounts: { food: 0, social: 0, outdoor: 0, creative: 0 },
      completed: [],                  // [{questId, type, title, place, xp, at, proofType}]
      quests: [],                     // today's 3
      eggs: [],                       // [{id, rarity, progress, needed, shiny, source}]
      zoo: [],                        // other pets (not active)
      activeCurse: null,              // {id,name,icon,from,...}
      blessings: [],                  // active blessing ids waiting for next quest
      inventory: { curses: {}, blessings: {}, keys: 0 },
      inbox: [],                      // [{id, kind:'curse'|'bless'|'challenge', from, ...}]
      plans: [],                      // group outings proposed to the village (Muse planner) [{id, title, place, when, who, why, type, at}]
      chronicle: null,                // last village chronicle {title, paragraphs, engine, at}
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

  // Daily quests and the storybook's "today" entries must not survive midnight.
  // Keep collection, inventory and lastQuestDay so streaks can continue normally.
  function ensureDay() {
    const today = new Date().toDateString();
    if (S.day === today) return;
    S.day = today;
    S.quests = [];
    S.completed = [];
    S.questSource = 'seed';
    S.questDay = null;
    S.questWriter = null;
    save();
  }

  function load() {
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  // what the friends did this week (seed activity the planner and the chronicle read)
  const FRIEND_WEEK = [
    { who: 'Leo', petName: 'Pip', type: 'food', title: 'Breakfast taco crawl', place: 'Veracruz All Natural' },
    { who: 'Leo', petName: 'Pip', type: 'social', title: 'Board game night', place: 'Emerald Tavern Games' },
    { who: 'Ana', petName: 'Boulder', type: 'outdoor', title: 'Turtle pond walk', place: 'UT Turtle Pond' },
    { who: 'Ana', petName: 'Boulder', type: 'creative', title: 'Mural hunt', place: 'The Drag (Guadalupe St)' },
    { who: 'Mia', petName: 'Ziggy', type: 'outdoor', title: 'Sunrise on the trail', place: 'Lady Bird Lake Trail' },
    { who: 'Mia', petName: 'Ziggy', type: 'food', title: 'Boba roulette', place: 'Tapioca House' },
    { who: 'Mia', petName: 'Ziggy', type: 'social', title: 'Talk to a stranger', place: 'GDC Atrium' },
  ];
  const favoriteOf = (who) => { const c = {}; FRIEND_WEEK.filter(w => w.who === who).forEach(w => { c[w.type] = (c[w.type] || 0) + 1; }); return (Object.entries(c).sort((a, b) => b[1] - a[1])[0] || ['social'])[0]; };
  function villagePayload() {
    const me = { name: 'You', pet: { name: S.pet.name, species: S.pet.species }, favorite: dominantType() };
    const friends = S.friends.map(f => ({ name: f.name, pet: { name: f.pet.name, species: f.pet.species }, status: f.status, vacation: !!f.vacation, favorite: favoriteOf(f.name) }));
    const week = S.completed.slice(-8).map(d => ({ who: 'You', petName: S.pet.name, type: d.type, title: d.title, place: d.place })).concat(FRIEND_WEEK);
    const places = S.quests.map(q => ({ name: q.place.name, kind: q.place.kind, dist: q.place.dist, rating: q.place.rating, hint: q.place.hint, type: q.type }))
      .concat(QUEST_POOL.map(q => ({ name: q.place.name, kind: q.place.kind, dist: q.place.dist, rating: q.place.rating, hint: q.place.hint, type: q.type })))
      .filter((p, i, arr) => arr.findIndex(x => x.name === p.name) === i).slice(0, 12);
    return { me, friends, week, places };
  }
  function localPlans(payload) {
    const avail = payload.friends.filter(f => !f.vacation).map(f => f.name);
    const by = t => payload.places.find(p => p.type === t) || payload.places[0];
    const P = [
      { title: 'Taco run, then the bats', type: 'food', when: 'Today 6:30 pm', why: 'Everyone keeps picking food quests, and nobody has seen the bridge bats this week.' },
      { title: 'Sunset lap around the lake', type: 'outdoor', when: 'Saturday 5 pm', why: 'The squad keeps questing alone. One loop gets everyone in the same photo.' },
      { title: 'Museum speedrun and coffee', type: 'creative', when: 'Sunday 11 am', why: 'Creative quests are the rarest in this village. One trip fixes that.' },
    ];
    return P.map((p, i) => Object.assign({}, p, { place: by(p.type) || { name: 'Downtown' }, who: avail.slice(i % 2, i % 2 + 2).length ? avail.slice(i % 2, i % 2 + 2) : avail.slice(0, 2), pitch: `${S.pet.name} says: bring snacks.` }));
  }
  function localChronicle(payload) {
    const pet = S.pet.name, mine = payload.week.filter(w => w.who === 'You'), theirs = payload.week.filter(w => w.who !== 'You');
    const paragraphs = [`Once upon a hack, the village of Austin woke up to a quiet week. ${pet} stretched, sniffed the air, and decided something had to happen.`];
    paragraphs.push(mine.length ? `You went out ${mine.length} time${mine.length > 1 ? 's' : ''}: ${mine.slice(0, 3).map(w => `${w.title} at ${w.place}`).join(', ')}. ${pet} told everyone about it twice.` : `You stayed in. ${pet} sat by the door with a look that said "three quests are waiting on the table".`);
    paragraphs.push(`Meanwhile ${theirs.slice(0, 3).map(w => `${w.who} took ${w.petName} to ${w.place}`).join(', ')}. The village got louder, and nobody minded.`);
    paragraphs.push(`Moral of the chapter: a Pixling grows fastest when the whole village goes outside together. ${pet} is already planning next week.`);
    return { title: 'The Village Chronicle', paragraphs, engine: 'template' };
  }
  // Village activity: what friends' pets are doing, plus every new inbox item, delivered as notifications
  function inboxEvent(m) {
    const f = S.friends.find(x => x.name === m.from);
    const base = { id: 'ib-' + m.id, at: Date.now(), from: m.from, pet: f ? clone(f.pet) : null, tab: 'home' };
    if (m.kind === 'curse') return Object.assign(base, { icon: 'skull', title: `${m.from} cursed you`, text: `${m.curse.name}. Accept it on Home and break it with a quest.` });
    if (m.kind === 'bless') return Object.assign(base, { icon: 'sparkle', title: `${m.from} blessed you`, text: m.blessing.desc });
    if (m.kind === 'challenge') return Object.assign(base, { icon: 'star', title: `${m.from} challenged you`, text: `${m.pet.name}'s minigame, 3 tries, ${m.wager} coins on the line.`, pet: clone(m.pet) });
    if (m.kind === 'gift') return Object.assign(base, { icon: 'gift', title: m.title || 'A gift arrived', text: m.text || 'Open it on Home.' });
    return Object.assign(base, { icon: 'chat', title: m.from, text: m.text });
  }
  function friendEvent() {
    const f = rnd(S.friends), pet = f.pet.name, place = rnd(FRIEND_WEEK.map(w => w.place).concat(QUEST_POOL.map(q => q.place.name)));
    const T = f.vacation ? [
      { icon: 'pin', title: `Postcard from ${f.name}`, text: `${pet} found a very serious cactus in Marfa. Back Tuesday.` },
    ] : [
      { icon: 'check', title: `${pet} finished a quest`, text: `${f.name} and ${pet} just proved a quest at ${place}.` },
      { icon: 'egg', title: `${pet}'s nest is shaking`, text: `${f.name} hatched a ${rnd(['common', 'uncommon', 'rare', 'rare', 'mythic'])} egg. Go see who came out.` },
      { icon: 'food', title: `${pet} is hungry`, text: `${f.name} is heading to ${place}. Tag along?` },
      { icon: 'monster', title: `Raid update from ${f.name}`, text: `${pet} hit the Procrastination Hydra. The squad needs one more quest.` },
      { icon: 'flame', title: `${f.name} is on fire`, text: `${pet} kept a ${f.streak + 1}-day streak alive at ${place}.` },
      { icon: 'heart', title: `${pet} misses your pet`, text: `${f.name} says ${S.pet ? S.pet.name : 'your pet'} should come to ${place} next time.` },
    ];
    return Object.assign({ id: uid(), at: Date.now(), from: f.name, pet: clone(f.pet), tab: 'village' }, rnd(T));
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
    return text.replace(/{pet}/g, pet ? pet.name : 'Your Pixling').replace(/{place}/g, place.name);
  }
  const TRANSFORMS = {
    pirate: t => t.replace(/\byou\b/gi, 'ye').replace(/\byour\b/gi, 'yer').replace(/\bis\b/g, 'be')
      .replace(/\bHello\b/g, 'Ahoy').replace(/\bfriend\b/gi, 'matey').replace(/\.\s/g, ', arr. ') + ' Arr!',
    shout: t => t.toUpperCase().replace(/\./g, '!!'),
    shakespeare: t => 'Hark! ' + t.replace(/\byou are\b/gi, 'thou art').replace(/\byour\b/gi, 'thy').replace(/\byou\b/gi, 'thee')
      .replace(/\bis\b/g, 'doth be').replace(/\bthe\b/g, 'ye olde') + ' Forsooth.',
    backwards: t => t.split(' ').reverse().join(' '),
    rhyme: t => t + ' Tell it in rhyme, line after line, or the proof will not count this time.',
    whisper: t => t.toLowerCase().replace(/[!]+/g, '.') + ' (psst... whisper it, we are in a library.)',
    opera: t => t.replace(/\.\s/g, '... ') + ' Sing your proof like an aria. Vibrato mandatory.',
    mime: t => t + ' Photo only. Strike a silly pose. No words allowed.',
    hop: t => t + ' Hop the last ten steps. Yes, hop.',
    tiny: t => t + ' (Payout: half the coins. Someone is petty.)',
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
    if (v && !v.active) { S.mood = v.mood; S.vacation = null; S.inbox.push({ id: uid(), kind: 'note', from: S.pet ? S.pet.name : 'Your pet', text: `You are back! ${S.pet ? S.pet.name : 'Your Pixling'} missed you. Mood dropped to ${v.mood}. A quest will cheer them up.` }); save(); }
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

  // duel difficulty = the minigame's own rating + 1 (Minigames.difficultyFor); rarity tier + 3 when minigames.js is absent
  const duelDifficulty = (species, rarity) => global.Minigames ? Minigames.difficultyFor(species, { rarity, duel: true }) : Math.min(5, tierOf(rarity) + 3);
  function newEgg(rarity, source, shiny = false) {
    // the nest only has so much warmth: every two eggs already incubating slow a new one down by one step
    // 1 egg = 2 quests; every egg already in the nest adds one more quest to the new one
    const e = { id: uid(), rarity, progress: 0, needed: EGG_NEEDS + S.eggs.length, shiny, source };
    S.eggs.push(e); return e;
  }
  function allPets() { return (S.pet ? [S.pet] : []).concat(S.zoo); }

  // friends resolve duels after a few seconds (mock realtime)
  function tickDuels() {
    const now = Date.now();
    let changed = false;
    S.duels.forEach(d => {
      if (d.status !== 'pending' || now - d.at < 8000) return;
      const f = S.friends.find(x => x.id === d.friendId);
      const pTry = [0.8, 0.65, 0.5, 0.35, 0.18][d.difficulty - 1] || 0.5;
      let tries = 0, won = false;
      while (tries < 3 && !won) { tries++; won = Math.random() < pTry; }
      d.triesUsed = tries; d.status = won ? 'beaten' : 'failed'; changed = true;
      if (!won) { const prize = 30 + d.difficulty * 25; d.prize = prize; S.coins += prize;
        S.inbox.push({ id: uid(), kind: 'note', from: f.name, text: `${f.name} failed ${d.petName}'s ${d.engineName} 3 times. You win ${prize} coins.` }); }
      else S.inbox.push({ id: uid(), kind: 'note', from: f.name, text: `${f.name} beat ${d.petName}'s ${d.engineName} on try ${tries}. Rematch?` });
    });
    if (changed) save();
  }

  // ------------------------------------------------------------------
  // Public API — each maps to an endpoint in SPECS.md
  // ------------------------------------------------------------------
  // When run from a static host, the verifier is unavailable. Do not treat
  // an absent response as unconditional success. Keep the advertised offline
  // demo playable, but require an actual photo and honour caption curses.
  function offlineProof(proof, curse) {
    if (!proof || !['photo', 'voice'].includes(proof.type)) return false;
    const caption = String(proof.caption || '').trim();
    if (proof.type === 'photo' && (typeof proof.data !== 'string' ||
        !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(proof.data) ||
        proof.data.length < 11000)) return false;
    if (proof.type === 'voice' && String(proof.data?.transcript || '').trim().split(/\s+/).length < 4) return false;
    if (!curse) return true;
    const words = caption.toLowerCase();
    if (curse.id === 'pirate') return /\b(arr+|ahoy|matey|aye|ye|avast|scallywag|landlubber)\b/.test(words);
    if (curse.id === 'shout') return (caption.match(/!/g) || []).length >= 2 ||
      (caption.replace(/[^A-Z]/g, '').length / Math.max(1, caption.replace(/[^a-z]/gi, '').length)) >= 0.6;
    if (curse.id === 'rhyme') {
      const ends = words.split(/[\n.!?;,]+/).map(line => line.trim().split(/\s+/).pop()).filter(w => w && w.length >= 2);
      return ends.some((w, i) => ends.some((other, j) => j !== i && other.slice(-2) === w.slice(-2)));
    }
    return true;
  }

  const completingQuests = new Set();
  const API = {
    CURSES, BLESSINGS, EGG_PRICE, KEY_PRICE,

    /** GET /me */
    async getMe() { ensureDay(); await delay(60); tickDuels(); return snapshot(); },

    /** GET /activity: new notifications since the last poll (prime = mark what is already there as seen) */
    async pollActivity({ prime = false, force = false } = {}) {
      if (!S.pet) return [];
      S.feed = S.feed || []; S.seenInbox = S.seenInbox || [];
      if (!S.feedPrimed) { prime = true; S.feedPrimed = true; }   // the first poll after hatching only marks the welcome inbox as seen
      const out = [];
      S.inbox.forEach(m => { if (!S.seenInbox.includes(m.id)) { S.seenInbox.push(m.id); if (!prime) out.push(inboxEvent(m)); } });
      const now = Date.now();
      if (force || (!prime && S.nextActivity && now >= S.nextActivity)) out.push(friendEvent());
      if (prime || force || !S.nextActivity || now >= S.nextActivity) S.nextActivity = now + 40000 + Math.random() * 40000;
      out.forEach(e => S.feed.unshift(e)); S.feed = S.feed.slice(0, 40); S.seenInbox = S.seenInbox.slice(-80);
      save(); return out;
    },
    getFeed() { return (S.feed || []).slice(); },

    /** POST /pet/hatch  { name } */
    /** the first egg hatches a random common animal (rarity = resolution: every starter is 20 px) */
    rollStarter() { return rnd(Object.keys(Animals.A).filter(k => Animals.A[k].rarity === 'common')); },
    async hatch({ name, species }) {
      await delay(200);
      if (S.pet) return S.pet;
      if (!Animals.A[species] || Animals.A[species].rarity !== 'common') species = API.rollStarter();
      S.pet = { id: uid(), name: name || rnd(PET_NAMES), species, rarity: 'common', bornAt: Date.now() };
      makeQuests();
      // first-run social hooks: a friend has already cursed you and challenged you
      S.inbox.push({ id: uid(), kind: 'gift', from: 'HackTX', title: 'Welcome package', text: 'A care package for your first day. Open it!',
        items: [{ kind: 'coins', amount: 1200 }, { kind: 'curse', id: 'pirate', qty: 1 }, { kind: 'curse', id: 'rhyme', qty: 1 }, { kind: 'curse', id: 'hop', qty: 1 }, { kind: 'blessing', id: 'double', qty: 1 }, { kind: 'key', qty: 1 }] });
      S.inbox.push({ id: uid(), kind: 'curse', from: 'Leo', curse: CURSES[0] });
      S.inbox.push({ id: uid(), kind: 'challenge', from: 'Leo', pet: clone(FRIENDS_SEED[0].pet), engine: Animals.A[FRIENDS_SEED[0].pet.species].minigame, difficulty: duelDifficulty(FRIENDS_SEED[0].pet.species, FRIENDS_SEED[0].pet.rarity), triesLeft: 3, wager: 80 });
      save();
      return S.pet;
    },

    async suggestName() { await delay(30); return rnd(PET_NAMES); },

    /** GET /quests?lat&lng — SerpApi places + Gemini text when the server runs; seed pool otherwise */
    async getQuests(loc) {
      ensureDay();
      await delay(60);
      if (!S.quests.length && S.pet) makeQuests();
      const fresh = S.questSource === 'serpapi' && S.questDay === new Date().toDateString();
      if (loc && !fresh && S.quests.every(q => q.status === 'open')) await fetchRealQuests(loc);
      return S.quests.map(publicQuest);
    },
    /** POST /quests/refresh — pull a new set of real places (only while nothing is done yet) */
    async refreshQuests(loc) {
      ensureDay();
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
      ensureDay();
      await delay(300);
      const i = S.quests.findIndex(q => q.id === id);
      if (i < 0 || S.quests[i].status !== 'open' || S.quests[i].rerolled) return null;
      const used = S.quests.map(q => q.title);
      const choices = QUEST_POOL.filter(p => !used.includes(p.title));
      if (!choices.length) return null;
      const q = rnd(choices);
      S.quests[i] = questFrom(q, { rerolled: true });
      save();
      return publicQuest(S.quests[i]);
    },

    /**
     * POST /quests/:id/complete  { proof: { type:'photo'|'voice', data } }
     * The proof is judged by /api/proof/verify (Gemini vision / transcript judge,
     * heuristic fallback). Rejected proofs return ok:false + rejected:true and no XP.
     */
    async completeQuest(id, proof, demo = null) {
      ensureDay();
      // demo (settings > Demo events): skip the judge and force outcomes { egg, legendary, levelUp, evolve, raidWin }
      const started = Date.now();
      const q = S.quests.find(x => x.id === id);
      if (!q || q.status !== 'open') return { ok: false, message: 'Quest not found.' };
      if (!demo && (!proof || !['photo', 'voice'].includes(proof.type)))
        return { ok: false, rejected: true, message: 'Choose a photo to prove your quest.', reasons: [] };
      if (completingQuests.has(id)) return { ok: false, message: 'This quest is already being verified.' };
      completingQuests.add(id);
      try {
      if (!demo && S.activeCurse && S.activeCurse.caption && !(proof?.caption && proof.caption.trim().split(/\s+/).length >= 3))
        return { ok: false, rejected: true, message: `Cursed! ${S.activeCurse.name}: write a caption with your photo (${S.activeCurse.caption}).`, reasons: [] };

      const verdict = demo ? { ok: true, message: 'Demo run: the game master waves you through.', engine: 'mock' } : await remoteJSON('/api/proof/verify', {
        type: proof.type, quest: { title: q.title, text: q.text, type: q.type, place: q.place },
        curse: S.activeCurse ? { id: S.activeCurse.id, name: S.activeCurse.name, desc: S.activeCurse.desc } : null,
        petName: S.pet.name,
        image: proof.type === 'photo' ? proof.data : undefined,
        caption: proof.caption || undefined,
        transcript: proof.type === 'voice' ? proof.data.transcript : undefined,
      });
      if (!demo) await delay(Math.max(0, 1100 - (Date.now() - started)));   // let the judging animation breathe
      if (!demo && !verdict && !offlineProof(proof, S.activeCurse))
        return { ok: false, rejected: true, message: 'Could not verify that proof offline. Use a real photo and follow any active curse.', reasons: ['Unverifiable offline proof'], engine: 'fallback' };
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
      if (demo && demo.levelUp) xp = Math.max(xp, LEVEL_XP(S.level) - S.xp);
      let coins = Math.round(xp / 2); if (has('coinrain')) coins *= 2;
      const curse = S.activeCurse; if (curse && curse.id === 'tiny') coins = Math.round(coins / 2);
      const curseLifted = !!curse; S.activeCurse = null;

      // vacation ends when you quest again
      if (S.vacation) { S.mood = currentMood(); S.vacation = null; }
      S.xp += xp; S.coins += coins;
      S.mood = Math.min(100, S.mood + 15); S.hunger = q.type === 'food' ? 100 : Math.min(100, S.hunger + 5);
      S.typeCounts[q.type] = (S.typeCounts[q.type] || 0) + 1;
      q.status = 'done';
      { const today = new Date().toDateString(), y = new Date(Date.now() - 864e5).toDateString();
        if (S.lastQuestDay !== today) { S.streak = S.lastQuestDay === y ? (S.streak || 0) + 1 : (S.lastQuestDay ? 1 : (S.streak || 0) + 1); S.lastQuestDay = today; } }
      S.completed.push({ questId: q.id, type: q.type, title: q.title, place: q.place.name, xp, at: Date.now(), proofType: proof.type });

      let levelUp = false;
      while (S.xp >= LEVEL_XP(S.level)) { S.xp -= LEVEL_XP(S.level); S.level++; levelUp = true; }

      // egg drop
      let egg = null;
      if (demo && demo.legendary) egg = newEgg('legendary', 'quest', false);
      else if (demo && demo.egg) egg = newEgg(rollRarity(0), 'quest', false);
      else if (Math.random() < q.eggChance || has('lucky') || S.settings.forceLegendary || S.completed.length === 1) {
        egg = newEgg(rollRarity(has('rarityup') ? 1 : 0), 'quest', Math.random() < GACHA.shinyChance);
      }
      S.eggs.forEach(e => { if (e !== egg) e.progress = Math.min(e.needed, e.progress + 1); });
      const readyEggs = S.eggs.filter(e => e.progress >= e.needed).map(e => e.id);

      // evolution: the starter axolotl becomes an animal by your dominant quest type, one tier sharper
      let evolution = null;
      // evolution: the SAME pet grows into its stage-2 form (bigger, sharper, crowned), never another species
      if (demo && demo.evolve && (S.pet.stage || 1) >= 2) { S.pet.stage = 1; S.pet.rarity = RAR[Math.max(0, tierOf(Animals.normRarity(S.pet.rarity)) - 1)]; }   // replay the evolution for the demo
      if ((S.pet.stage || 1) < 2 && (S.completed.length >= EVOLVE_AT || (demo && demo.evolve))) {
        const fromRarity = Animals.normRarity(S.pet.rarity), toRarity = RAR[Math.min(4, tierOf(fromRarity) + 1)];
        evolution = { species: S.pet.species, from: S.pet.species, to: S.pet.species, toName: `${Animals.A[S.pet.species].name} · Stage 2`, fromRarity, toRarity, fromStage: 1, toStage: 2 };
        S.pet.stage = 2; S.pet.rarity = toRarity;
      }

      // raid damage for every raid you are in
      let raidDamage = 0; const raidWins = [];
      if (demo && demo.raidWin) { const r = S.raids.find(x => x.hp > 0); if (r) { if (!r.members.includes('me')) r.members.push('me'); r.hp = 1; } }
      S.raids.forEach(r => {
        if (!r.members.includes('me') || r.hp <= 0) return;
        const dmg = Math.round(xp * 0.8); raidDamage += dmg; r.hp = Math.max(0, r.hp - dmg);
        if (r.hp === 0) { raidWins.push(r.name); newEgg(r.reward.egg, 'raid'); }
      });

      const reaction = rnd(['Leo: "no way you actually did that"', 'Ana sent you a heart', 'Mia is suddenly questing too', 'Sam\'s owl hooted from vacation']);
      save();
      return { ok: true, message, xpGained: xp, coinsGained: coins, blessed: used.length > 0, blessingsUsed: used, curseLifted, levelUp, level: S.level,
        egg, readyEggs, evolution, raidDamage, raidWins, reaction, engine: verdict ? verdict.engine : 'offline', state: snapshot(), quest: publicQuest(q) };
      } finally {
        completingQuests.delete(id);
      }
    },

    /** DEV (settings > Demo events): complete the first open quest with forced outcomes, no proof needed */
    async demoQuest(opts = {}) {
      ensureDay();
      if (!S.quests.length) makeQuests();
      if (!S.quests.some(x => x.status === 'open')) S.quests.forEach(x => { x.status = 'open'; });
      const q = S.quests.find(x => x.status === 'open');
      return API.completeQuest(q.id, { type: 'photo', data: '', caption: 'demo run' }, opts);
    },
    /** DEV (settings > Demo events): drop one social event into the game. kind: gift | curse | bless | eggReady | raidReady | coins */
    async demoEvent(kind) {
      await delay(60);
      const f = rnd(S.friends.filter(x => !x.vacation));
      if (kind === 'gift') S.inbox.unshift({ id: uid(), kind: 'gift', from: 'HackTX', title: 'Care package', text: 'The judges sent snacks. Open it!',
        items: [{ kind: 'coins', amount: 500 }, { kind: 'curse', id: rnd(CURSES).id, qty: 1 }, { kind: 'blessing', id: rnd(BLESSINGS).id, qty: 1 }, { kind: 'key', qty: 1 }, { kind: 'egg', rarity: 'rare' }] });
      if (kind === 'curse') S.inbox.unshift({ id: uid(), kind: 'curse', from: f.name, curse: rnd(CURSES) });
      if (kind === 'bless') S.inbox.unshift({ id: uid(), kind: 'bless', from: f.name, blessing: rnd(BLESSINGS) });
      if (kind === 'eggReady') { let e = S.eggs.find(x => x.progress < x.needed); if (!e) e = newEgg('rare', 'gift'); e.progress = e.needed; }
      if (kind === 'raidReady') { const r = S.raids.find(x => x.hp > 0); if (r) { if (!r.members.includes('me')) r.members.push('me'); r.hp = 1; } }
      if (kind === 'coins') S.coins += 500;
      save();
      return { ok: true, from: f.name };
    },

    /** POST /speech/transcribe (ElevenLabs Scribe). Returns {ok, text} or null if unavailable. */
    async transcribe(blob) {
      try {
        // keyterms help Scribe spell the place and pet names right
        const open = S.quests.filter(q => q.status === 'open').map(q => q.place.name);
        const kt = encodeURIComponent([S.pet && S.pet.name, 'Pixlings', 'HackTX'].concat(open).filter(Boolean).join(','));
        const r = await fetch(API_BASE + '/api/speech/transcribe?keyterms=' + kt, { method: 'POST', headers: { 'Content-Type': blob.type || 'audio/webm' }, body: blob });
        if (!(r.headers.get('content-type') || '').includes('json')) return null;
        const j = await r.json(); return j && j.ok ? j : null;
      } catch (e) { return null; }
    },

    /** POST /speech/say (ElevenLabs TTS). Returns an audio Blob or null. */
    async say(text, voice, mood = 'neutral') {
      API.lastSayError = '';
      try {
        const r = await fetch(API_BASE + '/api/speech/say', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice, mood }) });
        if (!r.ok || !(r.headers.get('content-type') || '').includes('audio')) {
          let msg = ''; try { const j = await r.json(); msg = j.error || JSON.stringify(j); } catch { msg = r.statusText; }
          API.lastSayError = `HTTP ${r.status}: ${String(msg).slice(0, 140)}`; return null;
        }
        return await r.blob();
      } catch (e) { API.lastSayError = 'network: ' + e.message; return null; }
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
      if (i < 0 || S.eggs[i].progress < S.eggs[i].needed) return null;
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
      if (!Number.isSafeInteger(qty) || qty < 1 || qty > 99)
        return { ok: false, message: 'Quantity must be an integer from 1 to 99.' };
      let unit = 0;
      if (kind === 'egg') unit = EGG_PRICE[id];
      if (kind === 'curse') unit = CURSES.find(c => c.id === id)?.price;
      if (kind === 'blessing') unit = BLESSINGS.find(b => b.id === id)?.price;
      if (kind === 'key') unit = KEY_PRICE;
      if (!unit) return { ok: false, message: 'Unknown item.' };
      const price = kind === 'key' ? Math.floor(qty / 3) * 250 + (qty % 3) * KEY_PRICE : unit * qty;
      if (S.coins < price) return { ok: false, message: `Not enough coins. You need ${price - S.coins} more. Go do a quest!` };
      S.coins -= price;
      if (kind === 'egg') for (let i = 0; i < qty; i++) newEgg(id, 'shop', Math.random() < GACHA.shinyChance);
      if (kind === 'curse') S.inventory.curses[id] = (S.inventory.curses[id] || 0) + qty;
      if (kind === 'blessing') S.inventory.blessings[id] = (S.inventory.blessings[id] || 0) + qty;
      if (kind === 'key') S.inventory.keys += qty;
      save();
      return { ok: true, coins: S.coins, inventory: S.inventory };
    },

    /** POST /blessings/:id/use — spend a blessing on yourself */
    async useBlessing(id) {
      await delay(100);
      const b = BLESSINGS.find(x => x.id === id);
      if (!b || !S.inventory.blessings[id]) return { ok: false, message: 'You do not own that blessing.' };
      if (S.blessings.includes(id)) return { ok: false, message: 'That blessing is already active.' };
      S.inventory.blessings[id]--;
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
      if (!free && count !== 1 && count !== 10)
        return { ok: false, message: 'Choose a single capsule or a pack of ten.' };
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
      // minigames never incubate eggs (only real quests do); they lift mood and pay a few capped coins
      S.mood = Math.min(100, S.mood + 8);
      const readyEggs = 0;
      let coins = 0;
      if (S.games.rewarded < 5) { S.games.rewarded++; coins = 15 + tierOf(p ? p.rarity : 'common') * 15; S.coins += coins; }
      save();
      return { ok: true, reward: { coins, warmed: 0, readyEggs }, left: Math.max(0, 5 - S.games.rewarded) };
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
        difficulty: duelDifficulty(p.species, p.rarity), triesLeft: 3, status: 'pending', at: Date.now() };   // the game's own difficulty, +1 for the duel
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
      const diff = duelDifficulty(f.pet.species, f.pet.rarity);
      S.inbox.push({ id: uid(), kind: 'challenge', from: f.name, pet: clone(f.pet), engine: Animals.A[f.pet.species].minigame, difficulty: diff, triesLeft: 3, wager: 20 + diff * 15 });
      save(); return { ok: true, message: `${f.name} challenged you to ${f.pet.name}'s minigame.` };
    },

    // ---------------------------------------------------------------- village
    /** POST /village/plan: Muse reads the village's week and proposes 3 outings at real places (template offline) */
    async planTogether() {
      const payload = villagePayload();
      const j = await remoteJSON('/api/village/plan', payload, 30000);
      if (j && j.ok && Array.isArray(j.plans) && j.plans.length) return { plans: j.plans, engine: j.engine || 'muse', reason: j.reason || '' };
      return { plans: localPlans(payload), engine: 'template', reason: j ? 'server answered without plans' : 'server unreachable' };
    },
    /** POST /village/plans: propose a plan to the village (friends reply in the inbox) */
    async proposePlan(plan) {
      await delay(80);
      S.plans = S.plans || [];
      const who = (plan.who || []).filter(n => !/^(you|me)$/i.test(n));
      const p = Object.assign({ id: uid(), at: Date.now(), members: ['You'].concat(who) }, plan, { who });
      S.plans.unshift(p); S.plans = S.plans.slice(0, 6);
      const f = S.friends.find(x => (plan.who || []).includes(x.name)) || S.friends[0];
      S.inbox.unshift({ id: uid(), kind: 'note', from: f.name, text: `${f.name}: "${plan.title}"? I am in. ${f.pet.name} is already packing.` });
      save(); return { ok: true, plan: p, message: `Sent to the village. ${f.name} replied first.` };
    },
    /** POST /village/chronicle: this week's shared story (Muse, template offline) */
    async villageChronicle(force) {
      if (!force && S.chronicle && Date.now() - S.chronicle.at < 6 * 3600e3) return S.chronicle;
      const payload = villagePayload();
      const j = await remoteJSON('/api/village/chronicle', payload, 30000);
      const out = j && j.ok && Array.isArray(j.paragraphs) && j.paragraphs.length ? { title: j.title, paragraphs: j.paragraphs, engine: j.engine || 'muse' } : localChronicle(payload);
      S.chronicle = Object.assign({ at: Date.now() }, out); save(); return S.chronicle;
    },
    /** GET /village */
    async getVillage() {
      await delay(80);
      tickDuels(); save();
      return { friends: S.friends.map(f => Object.assign({}, f, { cursedBy: S.sentCurses[f.id] || null })),
        raids: S.raids, inbox: S.inbox, curses: CURSES, blessings: BLESSINGS, inventory: S.inventory, duels: S.duels, plans: S.plans || [],
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
      if (m.kind === 'gift') {
        (m.items || []).forEach(it => {
          if (it.kind === 'coins') S.coins += it.amount;
          if (it.kind === 'curse') S.inventory.curses[it.id] = (S.inventory.curses[it.id] || 0) + (it.qty || 1);
          if (it.kind === 'blessing') S.inventory.blessings[it.id] = (S.inventory.blessings[it.id] || 0) + (it.qty || 1);
          if (it.kind === 'key') S.inventory.keys += it.qty || 1;
          if (it.kind === 'egg') newEgg(it.rarity || 'common', 'gift');
        });
      }
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
      const f = S.friends.find(x => x.id === friendId), c = CURSES.find(x => x.id === curseId);
      if (!f || !c) return { ok: false, message: 'Friend or curse not found.' };
      if (!S.inventory.curses[curseId]) return { ok: false, message: 'No scroll left. Buy one in the shop.' };
      S.inventory.curses[curseId]--;
      S.sentCurses[friendId] = curseId;
      save();
      return { ok: true, message: `${f.name}'s ${f.pet.name} got ${c.name}. They have 24h to break it.` };
    },

    /** POST /friends/:id/bless { blessingId } — uses one from your inventory, or the free daily Double XP */
    async sendBless(friendId, blessingId = 'double') {
      await delay(200);
      const f = S.friends.find(x => x.id === friendId);
      const b = BLESSINGS.find(x => x.id === blessingId);
      if (!f || !b) return { ok: false, message: 'Friend or blessing not found.' };
      const today = new Date().toDateString();
      f.blessDay = f.blessDay || null;
      if (blessingId === 'double' && f.blessDay !== today) f.blessDay = today;
      else if (S.inventory.blessings[blessingId]) S.inventory.blessings[blessingId]--;
      else return { ok: false, message: 'You do not own that blessing. The free Double XP is once per friend per day.' };
      save();
      return { ok: true, message: `${f.pet.name} glows. ${f.name} got ${b.name}.` };
    },

    /** POST /raids/:id/join — costs raid keys */
    async joinRaid(id) {
      await delay(200);
      const r = S.raids.find(x => x.id === id);
      if (!r) return { ok: false, message: 'Raid not found.' };
      if (r.hp <= 0) return { ok: false, message: 'This raid has already been defeated.' };
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
      if ((p.stage || 1) >= 2) pages.push({ scene: 'evolve', text: `And that was the day ${p.name} grew up: a crown, brighter colours and a sharper sprite, still the same ${sp} at heart. Nobody in the village could believe it. Leo cursed you out of jealousy.` });
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
    async reset() { completingQuests.clear(); S = freshState(); save(); return true; },
  };

  global.API = API;
})(window);
