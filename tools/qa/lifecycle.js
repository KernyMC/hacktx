// Race-condition and offline-verification regression tests.
// Run with node tools/qa/lifecycle.js; no external services or browser required.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const animalsSource = read('js/animals.js');
const apiSource = read('js/mockApi.js');
const storage = new Map();
let currentTime = Date.now();
const LocalDate = class extends Date {
  constructor(...args) { super(...(args.length ? args : [currentTime])); }
  static now() { return currentTime; }
};
let requests = [];
const makeGame = () => {
  const win = {};
  const env = {
    window: win, Date: LocalDate, URLSearchParams, AbortController,
    localStorage: { getItem: k => storage.get(k) ?? null,
      setItem: (k, v) => storage.set(k, String(v)) },
    setTimeout: (fn, ms) => { if (ms <= 1500) fn(); return 1; },
    clearTimeout: () => {},
    fetch: async url => new Promise(resolve => requests.push({ url: String(url), resolve })),
  };
  vm.runInNewContext(animalsSource, env, { filename: 'animals.js' });
  env.Animals = win.Animals;
  vm.runInNewContext(apiSource, env, { filename: 'mockApi.js' });
  return win.API;
};
const reply = (body) => {
  assert.ok(requests.length, 'expected an outstanding request');
  requests.shift().resolve({ headers: { get: () => 'application/json' },
    json: async () => body });
};
const offline = () => {
  assert.ok(requests.length, 'expected an offline request');
  requests.shift().resolve({ headers: { get: () => 'text/html' } });
};
const place = name => ({ type: 'food', title: 'Visit ' + name,
  place: { name, kind: 'Cafe', dist: '0.4 mi' }, text: 'Go to ' + name,
  xp: 90, eggChance: 0.5 });
const location = { lat: 30.28, lng: -97.73 };
const proof = 'data:image/jpeg;base64,' + 'A'.repeat(12000);

async function checkRaces() {
  let api = makeGame();
  await api.hatch({ name: 'QA' });
  let quest = (await api.getQuests())[0];

  // Complete a quest while manually refreshing nearby places.
  const refresh = api.refreshQuests(location);
  assert.equal(requests.length, 1);
  const result = await api.completeQuest(quest.id, { type: 'photo', data: '' }, { egg: true });
  assert.equal(result.ok, true);
  reply({ ok: true, quests: ['A', 'B', 'C'].map(place) });
  assert.equal((await refresh).ok, false, 'stale refresh must report a conflict');
  assert.equal((await api.getMe()).completedToday, 1, 'refresh cannot erase quest rewards');
  assert.equal((await api.getQuests()).find(q => q.id === quest.id).status, 'done');

  // Reroll a quest while the same request is pending.
  await api.reset(); await api.hatch({ name: 'QA' });
  quest = (await api.getQuests())[0];
  const rerollRefresh = api.refreshQuests(location);
  assert.equal(requests.length, 1);
  const reroll = await api.rerollQuest(quest.id);
  assert.ok(reroll && reroll.id !== quest.id);
  reply({ ok: true, quests: ['A', 'B', 'C'].map(place) });
  assert.equal((await rerollRefresh).ok, false);
  assert.ok((await api.getQuests()).some(q => q.id === reroll.id));

  // An old Gemini verdict must not credit an entirely new save.
  quest = (await api.getQuests())[0];
  const judging = api.completeQuest(quest.id, { type: 'photo', data: proof });
  assert.equal(requests.length, 1);
  await api.reset();
  reply({ ok: true, engine: 'gemini', message: 'verified' });
  assert.equal((await judging).ok, false);
  assert.equal((await api.getMe()).pet, null);
  assert.equal((await api.getMe()).coins, 0);

  // Midnight during verification must not award a new day's progress.
  await api.hatch({ name: 'QA' });
  quest = (await api.getQuests())[0];
  const midnight = api.completeQuest(quest.id, { type: 'photo', data: proof });
  assert.equal(requests.length, 1);
  currentTime += 864e5;
  reply({ ok: true, engine: 'gemini', message: 'verified' });
  assert.equal((await midnight).ok, false);
  assert.equal((await api.getMe()).completedToday, 0);
  assert.equal((await api.getMe()).coins, 0);
}

async function checkOfflineCurseRules() {
  const invalid = { pirate: 'ordinary words only', rhyme: 'these sentences do not match',
    shout: 'quiet normal text', shakespeare: 'this is normal text',
    opera: 'a nice normal caption', whisper: 'SHOUTING! Here NOW', mime: 'not silent' };
  const valid = { pirate: 'Arr matey sailed today', rhyme: 'I drew a cat. Then wore a hat.',
    shout: 'I FOUND IT!!', shakespeare: 'Hark I found the place',
    opera: 'Ooo I sing an aria', whisper: 'i whisper very softly', mime: '' };

  for (const id of Object.keys(invalid)) {
    storage.clear();
    currentTime += 864e5;
    let api = makeGame();
    await api.hatch({ name: 'QA' });
    const saved = JSON.parse(storage.get('familiars.v2'));
    saved.activeCurse = { id, name: id,
      caption: id === 'mime' ? undefined : 'Follow the caption rule' };
    storage.set('familiars.v2', JSON.stringify(saved));
    api = makeGame();
    const quest = (await api.getQuests())[0];

    const failed = api.completeQuest(quest.id, {
      type: 'photo', data: proof, caption: invalid[id] });
    offline();
    assert.equal((await failed).ok, false, id + ' rejects invalid caption offline');

    const passed = api.completeQuest(quest.id, {
      type: 'photo', data: proof, caption: valid[id] });
    offline();
    assert.equal((await passed).ok, true, id + ' accepts valid caption offline');
  }
}

async function checkBlessingInventory() {
  storage.clear();
  const api = makeGame();
  await api.hatch({ name: 'QA' });
  await api.unlockAll();
  const before = { ...(await api.getMe()).inventory.blessings };
  assert.equal((await api.useBlessing('incubate')).ok, false, 'ready eggs need no warmth');
  assert.equal((await api.useBlessing('reroll')).ok, false, 'unused rerolls need no reset');
  assert.equal((await api.useBlessing('shield')).ok, true);
  assert.equal((await api.useBlessing('shield')).ok, false, 'shield cannot stack');
  const after = (await api.getMe()).inventory.blessings;
  assert.equal(after.incubate, before.incubate);
  assert.equal(after.reroll, before.reroll);
  assert.equal(after.shield, before.shield - 1);
}

(async () => {
  await checkRaces();
  await checkOfflineCurseRules();
  await checkBlessingInventory();
  console.log('PASS lifecycle: refresh, verification, midnight, offline curses and blessing inventory');
})().catch(err => { console.error(err); process.exitCode = 1; });
