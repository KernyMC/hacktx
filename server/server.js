#!/usr/bin/env node
// Familiars — tiny zero-dependency backend (Node >= 18).
// Serves the static front-end and proxies ElevenLabs (STT/TTS) + Gemini (proof verification).
// Run: `npm start` or `node server/server.js` from the project root.
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SERVER_DIR = path.resolve(__dirname);

// ---------------------------------------------------------------------------
// .env loader (KEY=VALUE, # comments, optional quotes, `export ` prefix ok).
// Never overwrites variables already present in process.env.
// ---------------------------------------------------------------------------
function loadEnv(file) {
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch { return false; }
  for (let line of raw.split(/\r?\n/)) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('export ')) line = line.slice(7).trim();
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
        (val.startsWith("'") && val.endsWith("'") && val.length >= 2)) {
      val = val.slice(1, -1);
    } else {
      const hash = val.search(/\s#/); // inline comment on unquoted values
      if (hash !== -1) val = val.slice(0, hash).trim();
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (process.env[key] === undefined || process.env[key] === '') process.env[key] = val;
  }
  return true;
}
const envLoaded = loadEnv(path.join(ROOT, '.env'));

const env = (k, d = '') => (process.env[k] || '').trim() || d;
const PORT = parseInt(env('PORT', '8080'), 10) || 8080;
const hasEleven = () => !!env('ELEVENLABS_API_KEY');
const hasGemini = () => !!env('GEMINI_API_KEY');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function sendJson(res, status, obj) {
  if (res.headersSent) { try { res.end(); } catch {} return; }
  const body = JSON.stringify(obj);
  res.writeHead(status, { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const declared = parseInt(req.headers['content-length'] || '0', 10);
    if (declared > limit) { req.resume(); return reject(new HttpError(413, `Body too large (max ${Math.round(limit / 1048576)} MB)`)); }
    const chunks = []; let size = 0; let done = false;
    req.on('data', (c) => {
      if (done) return;
      size += c.length;
      if (size > limit) { done = true; req.resume(); return reject(new HttpError(413, `Body too large (max ${Math.round(limit / 1048576)} MB)`)); }
      chunks.push(c);
    });
    req.on('end', () => { if (!done) { done = true; resolve(Buffer.concat(chunks)); } });
    req.on('error', (e) => { if (!done) { done = true; reject(e); } });
  });
}

async function readJson(req, limit) {
  const buf = await readBody(req, limit);
  if (!buf.length) return {};
  try { return JSON.parse(buf.toString('utf8')); }
  catch { throw new HttpError(400, 'Invalid JSON body'); }
}

// Strip anything key-like from strings before logging.
function redact(s) {
  let out = String(s);
  for (const k of ['ELEVENLABS_API_KEY', 'GEMINI_API_KEY']) {
    const v = env(k);
    if (v) out = out.split(v).join('***');
  }
  return out.replace(/([?&]key=)[^&\s"]+/g, '$1***');
}
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a.map(redact));
const logErr = (...a) => console.error(new Date().toISOString().slice(11, 19), 'ERROR', ...a.map((x) => redact(x && x.stack ? x.stack : x)));

async function fetchWithTimeout(url, opts = {}, ms = 30000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ac.signal }); }
  finally { clearTimeout(t); }
}

async function upstreamError(r, name) {
  let detail = '';
  try { detail = (await r.text()).slice(0, 300); } catch {}
  logErr(`${name} upstream ${r.status}: ${detail}`);
  let msg = `${name} error ${r.status}`;
  try { const j = JSON.parse(detail); const m = j.detail?.message || j.detail || j.error?.message || j.message; if (m) msg += `: ${typeof m === 'string' ? m : JSON.stringify(m)}`; } catch {}
  return new HttpError(r.status === 401 || r.status === 403 ? 502 : (r.status === 429 ? 429 : 502), msg.slice(0, 300));
}

// ---------------------------------------------------------------------------
// Static files
// ---------------------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4',
  '.webm': 'video/webm', '.mp4': 'video/mp4',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function serveStatic(req, res, pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { return sendJson(res, 400, { ok: false, error: 'Bad path' }); }
  if (rel.includes('\0')) return sendJson(res, 400, { ok: false, error: 'Bad path' });
  if (rel === '/' || rel === '') rel = '/index.html';
  const file = path.resolve(ROOT, '.' + path.posix.normalize('/' + rel.replace(/\\/g, '/')));
  const relToRoot = path.relative(ROOT, file);
  const parts = relToRoot.split(path.sep);
  const forbidden =
    relToRoot.startsWith('..') || path.isAbsolute(relToRoot) ||
    file === SERVER_DIR || file.startsWith(SERVER_DIR + path.sep) ||
    parts.some((p) => p.startsWith('.')) || // .env, .git, .gitignore, ...
    parts[0] === 'node_modules' || parts[0] === 'package.json' || parts[0] === 'package-lock.json';
  if (forbidden) return sendJson(res, 404, { ok: false, error: 'Not found' });

  fs.stat(file, (err, st) => {
    let target = file;
    if (!err && st.isDirectory()) target = path.join(file, 'index.html');
    fs.stat(target, (err2, st2) => {
      if (err2 || !st2.isFile()) return sendJson(res, 404, { ok: false, error: 'Not found' });
      const type = MIME[path.extname(target).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { ...CORS, 'Content-Type': type, 'Content-Length': st2.size, 'Cache-Control': 'no-cache' });
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(target).on('error', () => res.destroy()).pipe(res);
    });
  });
}

// ---------------------------------------------------------------------------
// ElevenLabs: speech-to-text
// ---------------------------------------------------------------------------
const EXT_FOR = { 'audio/webm': 'webm', 'video/webm': 'webm', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/m4a': 'm4a', 'video/mp4': 'mp4', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/wave': 'wav' };

async function handleTranscribe(req, res, url) {
  if (!hasEleven()) { req.resume(); throw new HttpError(503, 'ELEVENLABS_API_KEY is not configured on the server'); }
  const audio = await readBody(req, 10 * 1024 * 1024);
  if (!audio.length) throw new HttpError(400, 'Empty audio body');
  const ctype = (req.headers['content-type'] || 'audio/webm').split(';')[0].trim().toLowerCase();
  const ext = EXT_FOR[ctype] || 'webm';

  const form = new FormData();
  form.append('model_id', env('ELEVENLABS_STT_MODEL', 'scribe_v1'));
  const lang = (url.searchParams.get('lang') || '').trim();
  if (lang) form.append('language_code', lang);
  form.append('file', new Blob([audio], { type: ctype }), `proof.${ext}`);

  let r;
  try {
    r = await fetchWithTimeout('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': env('ELEVENLABS_API_KEY') }, body: form }, 45000);
  } catch (e) { logErr('ElevenLabs STT fetch failed:', e.message); throw new HttpError(502, 'Could not reach ElevenLabs'); }
  if (!r.ok) throw await upstreamError(r, 'ElevenLabs STT');
  const j = await r.json().catch(() => ({}));
  const out = { ok: true, text: (j.text || '').trim(), language: j.language_code || null };
  if (Array.isArray(j.words)) out.words = j.words.filter((w) => w.type !== 'spacing').map((w) => ({ text: w.text, start: w.start, end: w.end }));
  log(`STT ok (${audio.length} B, ${ctype}) -> ${out.text.length} chars`);
  sendJson(res, 200, out);
}

// ---------------------------------------------------------------------------
// ElevenLabs: text-to-speech
// ---------------------------------------------------------------------------
const VOICE_PRESETS = {
  cute:   'MF3mGyEYCl7XYWbV9V6O', // Elli
  chill:  'EXAVITQu4vr4xnSDxMaL', // Bella / Sarah
  grumpy: 'VR6AewLTigWG4xSOukaG', // Arnold
  wise:   'pNInz6obpgDQGcFmaJgB', // Adam
  hyper:  'AZnzlk1XvdvUeBnXmlld', // Domi
  regal:  '21m00Tcm4TlvDq8ikWAM', // Rachel
  spooky: 'yoZ06aMxZJJ28mfd3POQ', // Sam
  cowboy: 'TxGEqnHWrfWFTfGW9XjX', // Josh
  dreamy: 'ErXwobaYiN019PkySvjV', // Antoni
};
function resolveVoice(voice) {
  const v = String(voice || 'cute').trim();
  const key = v.toLowerCase();
  if (VOICE_PRESETS[key]) return env('VOICE_' + key.toUpperCase(), VOICE_PRESETS[key]);
  if (/^[A-Za-z0-9]{10,40}$/.test(v)) return v; // raw ElevenLabs voice id
  return env('VOICE_CUTE', VOICE_PRESETS.cute);
}

const ttsCache = new Map(); // key -> Buffer (insertion order = LRU-ish)
const TTS_CACHE_MAX = 50;

async function handleSay(req, res) {
  const body = await readJson(req, 64 * 1024);
  if (!hasEleven()) throw new HttpError(503, 'ELEVENLABS_API_KEY is not configured on the server');
  const text = String(body.text || '').replace(/\s+/g, ' ').trim().slice(0, 400);
  if (!text) throw new HttpError(400, 'Missing "text"');
  const voiceId = resolveVoice(body.voice);
  const key = voiceId + '|' + text;

  let audio = ttsCache.get(key);
  if (audio) {
    ttsCache.delete(key); ttsCache.set(key, audio);
  } else {
    let r;
    try {
      r = await fetchWithTimeout(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: { 'xi-api-key': env('ELEVENLABS_API_KEY'), 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify({ text, model_id: env('ELEVENLABS_TTS_MODEL', 'eleven_flash_v2_5'), voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.3 } }),
      }, 30000);
    } catch (e) { logErr('ElevenLabs TTS fetch failed:', e.message); throw new HttpError(502, 'Could not reach ElevenLabs'); }
    if (!r.ok) throw await upstreamError(r, 'ElevenLabs TTS');
    audio = Buffer.from(await r.arrayBuffer());
    ttsCache.set(key, audio);
    while (ttsCache.size > TTS_CACHE_MAX) ttsCache.delete(ttsCache.keys().next().value);
    log(`TTS ok voice=${body.voice || 'cute'} ${text.length} chars -> ${audio.length} B`);
  }
  res.writeHead(200, { ...CORS, 'Content-Type': 'audio/mpeg', 'Content-Length': audio.length, 'Cache-Control': 'no-store' });
  res.end(audio);
}

// ---------------------------------------------------------------------------
// Proof verification (Gemini, with heuristic fallback)
// ---------------------------------------------------------------------------
const acceptedHashes = new Set();
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0));

function parseDataUrl(s) {
  if (typeof s !== 'string') return null;
  const m = /^data:([^;,]+)?(?:;[^,]*)?;base64,(.*)$/s.exec(s.trim());
  if (m) return { mime: (m[1] || 'image/jpeg').toLowerCase(), b64: m[2].replace(/\s/g, '') };
  if (/^[A-Za-z0-9+/=\s]+$/.test(s) && s.length > 100) return { mime: 'image/jpeg', b64: s.replace(/\s/g, '') };
  return null;
}

function buildPrompt(p) {
  const q = p.quest || {}; const place = q.place || {}; const c = p.curse;
  const lines = [
    `You are the strict-but-fun game master of "Familiars", a real-world quest game. The player's pet familiar is named "${p.petName}".`,
    `Judge whether the submitted ${p.type === 'photo' ? 'PHOTO' : 'VOICE NOTE TRANSCRIPT'} is plausible proof that the player actually did this quest. Be generous but not blind.`,
    '',
    `QUEST: "${q.title || ''}" — ${q.text || ''}`,
    `Quest type: ${q.type || 'unknown'}. Place: ${place.name || 'unknown'} (${place.kind || 'unknown'}).`,
  ];
  if (c) lines.push(`ACTIVE CURSE: ${c.name || c.id} (${c.id}) — ${c.desc || ''}`);
  lines.push('', 'Rules:');
  if (p.type === 'photo') {
    lines.push(
      '- ok=true if the photo plausibly shows the place/kind of place, the activity, or something clearly connected to doing the quest there. Indoor/outdoor details, food, signage, people (from the back), art, etc. all count.',
      '- ok=false if it is a screenshot of the app/quest text itself, a screenshot of a phone/computer screen, a blank/black/extremely blurry image, a meme, a stock-looking image, or obviously unrelated to the quest.',
    );
  } else {
    lines.push(
      '- ok=true if the transcript plausibly describes doing the quest (what they saw/ate/did, who they talked to, the place). Short but specific is fine.',
      '- ok=false if it is empty, gibberish, generic ("I did it"), or unrelated to the quest.',
    );
    if (c) lines.push(
      `- The curse "${c.id}" applies to this voice note. Check it from the transcript as best you can: pirate = uses pirate words/speech (arr, matey, ye, ahoy...); rhyme = the lines/sentences rhyme; shout = all-caps/exclamatory; whisper/opera/backwards/etc. = judge any textual hints and be lenient since tone is not visible in text. If the curse requirement is clearly not met, ok=false and say so.`,
    );
  }
  lines.push(
    '- Any offensive, hateful, sexual/NSFW or violent content => ok=false.',
    '',
    'Respond ONLY with JSON: {"ok": boolean, "confidence": number 0..1, "message": string, "reasons": string[]}',
    `"message" is 1–2 short sentences (max 35 words) spoken BY ${p.petName} the pet in a cheeky, playful voice, mentioning "${p.petName}" by name (e.g. "${p.petName} approves!"). If rejected, make it a funny nudge to retry.`,
    '"reasons" is 1–3 short factual phrases explaining the verdict.',
  );
  if (p.type === 'voice') lines.push('', `TRANSCRIPT:\n"""${String(p.transcript || '').slice(0, 4000)}"""`);
  return lines.join('\n');
}

async function verifyWithGemini(p, img) {
  const key = env('GEMINI_API_KEY');
  // "AQ." keys are Vertex AI express-mode keys; "AIza" keys are Google AI Studio keys
  const vertex = (env('GEMINI_ENDPOINT') || (key.startsWith('AQ.') ? 'vertex' : 'studio')) === 'vertex';
  const model = env('GEMINI_MODEL', vertex ? 'gemini-3-flash-preview' : 'gemini-2.5-flash');
  const url = vertex
    ? `https://aiplatform.googleapis.com/v1/publishers/google/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`
    : `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const parts = [{ text: buildPrompt(p) }];
  if (p.type === 'photo' && img) parts.push({ inlineData: { mimeType: img.mime, data: img.b64 } });
  const r = await fetchWithTimeout(
    url,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: { responseMimeType: 'application/json', temperature: 0.4 } }) },
    30000,
  );
  if (!r.ok) throw await upstreamError(r, 'Gemini');
  const j = await r.json();
  const txt = (j.candidates?.[0]?.content?.parts || []).filter((x) => !x.thought).map((x) => x.text || '').join('').trim();
  if (!txt) throw new Error('Gemini returned no text' + (j.promptFeedback?.blockReason ? ` (blocked: ${j.promptFeedback.blockReason})` : ''));
  let v;
  try { v = JSON.parse(txt.replace(/^```(?:json)?\s*|\s*```$/g, '')); } catch { throw new Error('Gemini returned non-JSON: ' + txt.slice(0, 120)); }
  const confidence = clamp01(v.confidence);
  const ok = v.ok === true && confidence >= 0.55;
  let message = String(v.message || '').trim().slice(0, 300);
  if (!message) message = ok ? `${p.petName} approves! Proof accepted.` : `${p.petName} squints suspiciously. Try that proof again!`;
  const reasons = (Array.isArray(v.reasons) ? v.reasons : []).map(String).slice(0, 5);
  if (v.ok === true && !ok) reasons.push(`confidence ${confidence.toFixed(2)} below 0.55 threshold`);
  return { ok, message, confidence, reasons, engine: 'gemini' };
}

const WORDS = (s) => (String(s).toLowerCase().match(/[a-z0-9']+/g) || []);
const STOP = new Set('the a an and or of to in at on for with your you my me is it this that be go get do some something new one from by as are was were will can just like up out into about'.split(' '));

function heuristicPhoto(p, img) {
  const name = p.petName;
  if (!img) return { ok: false, message: `${name} sees... nothing. Snap an actual photo and try again!`, confidence: 0.95, reasons: ['no image provided'], engine: 'heuristic' };
  const bytes = Buffer.from(img.b64, 'base64');
  if (bytes.length < 8 * 1024) {
    return { ok: false, message: pick([`${name} squints at this tiny blank-ish pixel soup. Try a real photo!`, `Hmm, ${name} thinks that photo is way too tiny to be proof. Again!`]), confidence: 0.85, reasons: [`image too small/blank (${bytes.length} bytes)`], engine: 'heuristic' };
  }
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  if (acceptedHashes.has(hash)) {
    return { ok: false, message: pick([`Nice try! ${name} has seen this exact photo before. Fresh proof only!`, `${name} smells a recycled photo. Go make a new memory!`]), confidence: 0.95, reasons: ['duplicate of a previously accepted proof'], engine: 'heuristic' };
  }
  acceptedHashes.add(hash);
  const place = p.quest?.place?.name;
  return { ok: true, message: pick([`${name} approves! ${place ? place + ' looks' : 'That looks'} quest-worthy to me.`, `Ooh! ${name} is doing a happy wiggle. Proof accepted!`]), confidence: 0.6, reasons: ['photo looks like a real, new image (offline check)'], engine: 'heuristic' };
}

function heuristicVoice(p) {
  const name = p.petName;
  const t = String(p.transcript || '').trim();
  const words = WORDS(t);
  const reasons = [];
  if (words.length < 4) {
    return { ok: false, message: pick([`${name} heard like... three words. Tell me more about your quest!`, `That's it?! ${name} demands a juicier story. Try again!`]), confidence: 0.85, reasons: [`transcript too short (${words.length} words)`], engine: 'heuristic' };
  }
  let confidence = 0.6;
  const q = p.quest || {}; const place = q.place || {};
  const wset = new Set(words);
  const placeWords = WORDS(`${place.name || ''} ${place.kind || ''}`).filter((w) => w.length > 2 && !STOP.has(w));
  const questWords = WORDS(`${q.title || ''} ${q.text || ''}`).filter((w) => w.length > 3 && !STOP.has(w));
  if (placeWords.some((w) => wset.has(w))) { confidence += 0.15; reasons.push('mentions the place'); }
  const qHits = [...new Set(questWords)].filter((w) => wset.has(w)).length;
  if (qHits) { confidence += Math.min(0.15, qHits * 0.05); reasons.push(`mentions ${qHits} quest keyword${qHits > 1 ? 's' : ''}`); }

  const c = p.curse; const cid = c && String(c.id || '').toLowerCase();
  if (cid === 'pirate') {
    const pirate = ['arr', 'arrr', 'arrrr', 'matey', 'mateys', 'ye', 'ahoy', 'aye', 'booty', 'sea', 'seas', 'yarr', 'yo', 'ho', 'avast', 'landlubber', 'treasure', 'captain', 'plank', 'scallywag', 'shiver', 'timbers'];
    const pirateSet = new Set(pirate);
    if (!words.some((w) => pirateSet.has(w) || /^ar{2,}g?h?$/.test(w) || /^yar+$/.test(w))) {
      return { ok: false, message: pick([`Arr, where be the pirate talk? ${name} demands more "matey" in that proof!`, `${name} is cursed to only accept pirate speak, landlubber. Say it again with an "arr"!`]), confidence: 0.8, reasons: [...reasons, 'pirate curse: no pirate words found'], engine: 'heuristic' };
    }
    confidence += 0.05; reasons.push('pirate curse satisfied');
  } else if (cid === 'rhyme') {
    const ends = t.split(/[\n.!?;,]+/).map((s) => WORDS(s).pop()).filter((w) => w && w.length >= 2);
    const tails = ends.map((w) => w.slice(-2));
    const rhymes = tails.some((x, i) => tails.indexOf(x) !== i);
    if (!rhymes) {
      return { ok: false, message: pick([`${name} needs a rhyme, that's the crime — try again, it's rhyming time!`, `No rhyme detected! ${name} is cursed and very picky about poetry.`]), confidence: 0.75, reasons: [...reasons, 'rhyme curse: no rhyming line endings found'], engine: 'heuristic' };
    }
    reasons.push('rhyme curse satisfied');
  } else if (cid === 'shout') {
    const letters = t.replace(/[^A-Za-z]/g, '');
    const caps = letters.replace(/[^A-Z]/g, '').length / Math.max(1, letters.length);
    const bangs = (t.match(/!/g) || []).length;
    if (caps < 0.6 && bangs < 2) {
      return { ok: false, message: `${name} CAN'T HEAR YOU! The curse says SHOUT. Try again, louder!`, confidence: 0.7, reasons: [...reasons, 'shout curse: not shouty enough'], engine: 'heuristic' };
    }
    reasons.push('shout curse satisfied');
  } else if (cid) {
    confidence -= 0.05; reasons.push(`curse "${cid}" can't be fully checked offline; trusting you`);
  }
  confidence = clamp01(Math.min(0.9, confidence));
  if (!reasons.length) reasons.push('transcript long enough (offline check)');
  const msg = cid === 'pirate'
    ? pick([`Arr! ${name} accepts yer proof, matey. Treasure incoming!`, `Yo ho ho! ${name} be mighty proud of ye.`])
    : pick([`${name} believes you! What a story, proof accepted.`, `${name} did a little spin. Great proof, quest complete!`, `Wow, ${name} wishes it had been there. Accepted!`]);
  return { ok: confidence >= 0.55, message: msg, confidence, reasons, engine: 'heuristic' };
}

async function handleVerify(req, res) {
  const p = await readJson(req, 12 * 1024 * 1024);
  const type = p.type === 'photo' ? 'photo' : p.type === 'voice' ? 'voice' : null;
  if (!type) throw new HttpError(400, 'type must be "photo" or "voice"');
  const petName = String(p.petName || 'Your familiar').slice(0, 40);
  const input = { type, quest: p.quest || {}, curse: p.curse || null, petName, transcript: p.transcript || '' };
  const img = type === 'photo' ? parseDataUrl(p.image) : null;
  if (type === 'photo' && img && !/^image\//.test(img.mime)) img.mime = 'image/jpeg';

  let result = null;
  // Cheap local rejects first (no point paying for an LLM call on a blank/duplicate image).
  if (type === 'photo') {
    const bytes = img ? Buffer.from(img.b64, 'base64') : null;
    const hash = bytes ? crypto.createHash('sha256').update(bytes).digest('hex') : null;
    if (!img || bytes.length < 8 * 1024 || acceptedHashes.has(hash)) result = heuristicPhoto(input, img);
    else if (hasGemini()) {
      try { result = await verifyWithGemini(input, img); if (result.ok) acceptedHashes.add(hash); }
      catch (e) { logErr('Gemini verify failed, falling back to heuristics:', e.message); }
    }
    if (!result) result = heuristicPhoto(input, img);
  } else {
    if (hasGemini() && WORDS(input.transcript).length >= 2) {
      try { result = await verifyWithGemini(input, null); }
      catch (e) { logErr('Gemini verify failed, falling back to heuristics:', e.message); }
    }
    if (!result) result = heuristicVoice(input);
  }
  log(`verify ${type} curse=${input.curse?.id || '-'} -> ok=${result.ok} conf=${result.confidence.toFixed(2)} (${result.engine})`);
  sendJson(res, 200, result);
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch { return sendJson(res, 400, { ok: false, error: 'Bad URL' }); }
  const { pathname } = url;

  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }

  try {
    if (pathname.startsWith('/api/')) {
      if (pathname === '/api/health' && req.method === 'GET') return sendJson(res, 200, { ok: true, elevenlabs: hasEleven(), gemini: hasGemini() });
      if (pathname === '/api/speech/transcribe' && req.method === 'POST') return await handleTranscribe(req, res, url);
      if (pathname === '/api/speech/say' && req.method === 'POST') return await handleSay(req, res);
      if (pathname === '/api/proof/verify' && req.method === 'POST') return await handleVerify(req, res);
      req.resume();
      return sendJson(res, 404, { ok: false, error: `No route ${req.method} ${pathname}` });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return serveStatic(req, res, pathname);
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    if (status >= 500) logErr(`${req.method} ${pathname}:`, e); else log(`${req.method} ${pathname} -> ${status} ${e.message}`);
    sendJson(res, status, { ok: false, error: e instanceof HttpError ? e.message : 'Internal server error' });
  }
});

server.on('clientError', (err, socket) => { try { socket.end('HTTP/1.1 400 Bad Request\r\n\r\n'); } catch {} });
process.on('unhandledRejection', (e) => logErr('unhandledRejection:', e));

server.listen(PORT, () => {
  console.log(`\n  Familiars running at  http://localhost:${PORT}/`);
  console.log(`  .env: ${envLoaded ? 'loaded' : 'not found (using process env only)'} | ElevenLabs: ${hasEleven() ? 'on' : 'off'} | Gemini: ${hasGemini() ? 'on' : 'off (heuristic proofs)'}\n`);
});
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error(`Port ${PORT} is already in use. Set PORT=xxxx in .env or your shell and try again.`);
  else console.error(e);
  process.exit(1);
});
