// Dependency-free regression tests for game state and public API routes.
// Run: npm test   (Node 18+). External AI services are always disabled/mocked.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const source = file => fs.readFileSync(path.join(root, file), 'utf8');

async function stateTests() {
  let now = Date.now(), idCounter = 0, requests = [];
  const storage = new Map();
  const LocalDate = class extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  };
  // Distinct deterministic IDs with probability above every ordinary egg threshold.
  const math = Object.create(Math);
  math.random = () => 0.9 + (idCounter++ % 50000) / 1000000;
  const makePlace = name => ({ name, kind: 'Cafe', dist: '0.4 mi', bearing: 80,
    distMi: 0.4, lat: 30.27, lng: -97.74 });
  const makeQuest = name => ({ type: 'food', place: makePlace(name), title: 'Try ' + name,
    text: 'Visit ' + name, xp: 90, eggChance: 0.4 });
  const script = {
    window: {}, Math: math, Date: LocalDate, URLSearchParams, AbortController,
    localStorage: { getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)) },
    setTimeout: (fn, ms) => { if (ms < 1500) queueMicrotask(fn); return 1; },
    clearTimeout: () => {},
    fetch: async url => {
      requests.push(String(url));
      if (String(url).startsWith('/api/quests?')) {
        const refresh = String(url).includes('refresh=1');
        const names = refresh ? ['D', 'E', 'F'] : ['A', 'B', 'C'];
        return { headers: { get: () => 'application/json' },
          json: async () => ({ ok: true, writer: 'template', quests: names.map(makeQuest) }) };
      }
      throw Error('Intentional offline fallback');
    },
  };
  vm.runInNewContext(source('js/animals.js'), script, { filename: 'animals.js' });
  script.Animals = script.window.Animals;
  vm.runInNewContext(source('js/mockApi.js'), script, { filename: 'mockApi.js' });
  const api = script.window.API;

  const starter = await api.hatch({ name: 'QA' });
  assert.equal((await api.hatch({ name: 'Duplicate' })).id, starter.id, 'hatch once');
  assert.equal((await api.getVillage()).inbox.length, 3, 'welcome messages');

  const quests = await api.getQuests();
  const reroll = await api.rerollQuest(quests[0].id);
  assert.ok(reroll && reroll.rerolled);
  assert.equal(await api.rerollQuest(reroll.id), null, 'one free reroll only');

  await api.unlockAll();
  let coins = (await api.getMe()).coins;
  const three = await api.buy('curse', 'pirate', 3);
  assert.equal(coins - three.coins, 90, 'charge for every purchased curse');
  coins = three.coins;
  const fourKeys = await api.buy('key', 'key', 4);
  assert.equal(coins - fourKeys.coins, 350, 'bundle of three plus one key');
  assert.equal((await api.buy('key', 'key', -1)).ok, false);
  assert.equal((await api.pullGacha(0)).ok, false, 'reject free zero-count pulls');

  const eggBuy = await api.buy('egg', 'common', 2);
  assert.equal(eggBuy.ok, true);
  const shopEgg = (await api.getZoo()).eggs.find(e => e.source === 'shop');
  assert.equal(await api.hatchEgg(shopEgg.id), null, 'cannot hatch unready eggs');

  const beforeScrolls = (await api.getVillage()).inventory.curses.pirate;
  assert.equal((await api.sendCurse('missing', 'pirate')).ok, false);
  assert.equal((await api.getVillage()).inventory.curses.pirate, beforeScrolls);
  assert.equal((await api.joinRaid('missing')).ok, false);
  assert.equal((await api.reportMinigame('missing', true)).ok, false);

  // First completed quest drops an egg by design. Golden Touch should remain
  // active on the next quest if no egg drops.
  const q1 = (await api.getQuests()).find(q => q.status === 'open');
  assert.equal((await api.completeQuest(q1.id, { type: 'photo', data: '' }, { egg: true })).ok, true);
  assert.equal((await api.useBlessing('rarityup')).ok, true);
  const q2 = (await api.getQuests()).find(q => q.status === 'open');
  const result = await api.completeQuest(q2.id, { type: 'photo', data: '' }, {});
  assert.equal(result.ok, true);
  assert.equal(result.egg, null, 'no forced egg on second quest');
  assert.ok((await api.getMe()).blessings.includes('rarityup'), 'Golden Touch stays active');

  now += 864e5;
  assert.equal((await api.getMe()).completedToday, 0, 'new day resets daily progress');
  const chronicle = await api.villageChronicle(true);
  assert.match(chronicle.paragraphs.join(' '), /went out 2 times/, 'weekly history survives midnight');

  const live = await api.getQuests({ lat: 30.28, lng: -97.73 });
  assert.ok(live.every(q => q.real));
  const replacement = await api.rerollQuest(live[0].id, { lat: 30.28, lng: -97.73 });
  assert.ok(replacement && replacement.real);
  assert.ok(['D', 'E', 'F'].includes(replacement.place.name));
  assert.equal(await api.rerollQuest(replacement.id, { lat: 30.28, lng: -97.73 }), null);
  const lookups = requests.filter(u => u.includes('/api/quests?')).length;
  await api.getQuests({ lat: 30.28, lng: -97.73 });
  assert.equal(requests.filter(u => u.includes('/api/quests?')).length, lookups, 'no redundant lookup');

  // Test rejected offline proofs without relying on external providers.
  await api.reset();
  await api.hatch({ name: 'QA' });
  const proofQuest = (await api.getQuests())[0];
  assert.equal((await api.completeQuest(proofQuest.id, { type: 'photo', data: '' })).ok, false);
  assert.equal((await api.completeQuest(proofQuest.id, {
    type: 'photo', data: 'data:image/jpeg;base64,' + 'A'.repeat(12000) })).ok, true);
  assert.equal((await api.completeQuest(proofQuest.id, { type: 'photo', data: '' })).ok, false);
  console.log('PASS state: progression, day rollover, weekly history, economy, real rerolls, proof');
}

async function serverTests() {
  // Set whitespace to prevent a developer's local .env from activating paid APIs.
  for (const key of ['GEMINI_API_KEY', 'SERPAPI_API_KEY', 'ELEVENLABS_API_KEY', 'MODEL_API_KEY'])
    process.env[key] = ' ';
  const previousFetch = global.fetch;
  const { handle } = require('../../server/server.js');
  const send = async (method, url, body) => {
    const req = { method, url, headers: { 'content-type': 'application/json' },
      body: body === undefined ? '' : JSON.stringify(body), resume() {} };
    const res = { status: null, output: '', headers: null,
      writeHead(status, headers) { this.status = status; this.headers = headers; },
      end(value) { this.output = value || ''; } };
    await handle(req, res);
    return { status: res.status, ...(res.output ? JSON.parse(res.output) : {}) };
  };

  try {
    assert.equal((await send('GET', '/api/health')).status, 200);
    assert.equal((await send('POST', '/api/chat', null)).status, 400);
    assert.equal((await send('POST', '/api/village/plan', [])).status, 400);
    assert.equal((await send('GET', '/api/quests?lat=999&lng=10')).status, 400);
    const fallback = await send('POST', '/api/village/plan',
      { friends: { invalid: true }, places: [{ name: 'Real Park' }] });
    assert.equal(fallback.status, 200);
    assert.equal(fallback.plans.length, 3);
    assert.equal((await send('POST', '/api/proof/verify',
      { type: 'photo', image: 'data:image/heic;base64,AAAA' })).status, 400);

    const image = 'data:image/jpeg;base64,' + 'A'.repeat(12000);
    assert.equal((await send('POST', '/api/proof/verify', { type: 'photo', image })).ok, true);
    assert.equal((await send('POST', '/api/proof/verify', { type: 'photo', image })).ok, false);

    process.env.MODEL_API_KEY = 'qa-mock';
    const payload = { friends: [{ name: 'Leo', vacation: false }, { name: 'Sam', vacation: true }],
      places: [{ name: 'Real Park', type: 'outdoor' }] };
    const modelAnswer = plans => ({
      ok: true, status: 200, text: async () => JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ plans }) } }],
      }),
    });
    const plan = (name, who = ['Leo', 'Sam']) =>
      ({ title: 'Outdoor walk', place: { name }, who, type: 'outdoor' });
    global.fetch = async () => modelAnswer([plan('Invented Mall'), plan('Real Park'), plan('Real Park')]);
    assert.equal((await send('POST', '/api/village/plan', payload)).engine, 'template',
      'unverified venue must fall back');
    global.fetch = async () => modelAnswer([plan('Real Park'), plan('Real Park'), plan('Real Park')]);
    const valid = await send('POST', '/api/village/plan', payload);
    assert.equal(valid.engine, 'muse');
    assert.ok(valid.plans.every(p => p.who.join(',') === 'Leo'),
      'model cannot invite friends on vacation');
  } finally {
    global.fetch = previousFetch;
    process.env.MODEL_API_KEY = ' ';
  }
  console.log('PASS server: input validation, proof reuse and Muse plan grounding');
}

(async () => {
  await stateTests();
  await serverTests();
  console.log('All regression checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
