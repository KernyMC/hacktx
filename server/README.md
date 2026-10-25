# Pixlings backend

A tiny Node server with no dependencies. It needs Node 18 or newer and no `npm install`. It serves the static front-end and proxies Gemini (proofs, quests, chat), Muse / Meta Model API (village plans and chronicle), SerpApi (real places) and ElevenLabs (speech). `server.js` exports `handle()`, which Vercel runs from `api/index.js`.

## Run

```bash
# from the project root (the folder with index.html)
copy .env.example .env      # Windows   (macOS/Linux: cp .env.example .env)
# fill in GEMINI_API_KEY, SERPAPI_API_KEY, ELEVENLABS_API_KEY, MODEL_API_KEY in .env
npm start                   # or: node server/server.js
```

Then open http://localhost:8080/. To use a different port, set `PORT` in `.env` or in your shell.

Every key is optional:
- Without `GEMINI_API_KEY`, proofs are checked by offline heuristics. The response shows `engine: "heuristic"`.
- Without `ELEVENLABS_API_KEY`, the speech routes return `503 {ok:false,error}` (the client stays quiet).
- Without `SERPAPI_API_KEY`, `/api/quests` returns `{ ok:false, source:'seed' }` and the client uses the fixed Austin pool.
- Without `MODEL_API_KEY`, the village routes return template plans and chronicle (`engine: "template"`).

Variables already set in your shell take priority over `.env`.

## Routes

All JSON responses send `Access-Control-Allow-Origin: *`. Errors always come back as `{ ok:false, error }`.

| Route | Request | Response |
|---|---|---|
| `GET /api/health` | – | `{ ok:true, elevenlabs:bool, gemini:bool, serpapi:bool, muse:bool }` |
| `GET /api/quests?lat&lng&pet&species&flavor&curse` | – | `{ ok, quests:[...], source:'serpapi' }`. SerpApi `google_maps` × 3 categories → real places → Gemini writes them in the pet's voice (template text without Gemini). 10-min cache. `{ ok:false, source:'seed' }` without SerpApi. |
| `POST /api/chat` | `{ pet, quests, history, message }` | `{ reply, mood, engine }`. Gemini in character; canned lines offline. |
| `POST /api/village/plan` | `{ me, friends, week, places }` | `{ ok, plans:[{ title, place, when, who, why, type, pitch }], engine:'muse'\|'template' }`. Meta Model API (Muse Spark, Chat Completions in JSON mode) plans 3 group outings at real places for the friends who are available. Template plans without `MODEL_API_KEY`. |
| `POST /api/village/chronicle` | `{ me, friends, week }` | `{ ok, title, paragraphs, engine }`. Muse writes the village's shared weekly story in the pet's voice; template offline. |
| `POST /api/speech/transcribe[?lang=en]` | raw audio bytes as the body, `Content-Type: audio/webm` (or `audio/mp4`, `audio/ogg`, …), max 10 MB | `{ ok:true, text, language, words?:[{text,start,end}] }` |
| `POST /api/speech/say` | `{ text, voice }`. Text is trimmed to 400 chars. | `audio/mpeg` bytes. Cached in memory (the last 50). |
| `POST /api/proof/verify` | `{ type:'photo'\|'voice', quest:{title,text,type,place:{name,kind}}, curse:{id,name,desc}\|null, petName, image?:dataURL, transcript?:string }`, max 12 MB | `{ ok, message, confidence, reasons:[], engine:'gemini'\|'heuristic' }` |

Voice presets for `/api/speech/say`: `cute`, `chill`, `grumpy`, `wise`, `hyper`, `regal`, `spooky`, `cowboy` and `dreamy`. You can also pass a raw ElevenLabs voice id. To change the voice behind a preset, set `VOICE_<NAME>=<voice id>`, for example `VOICE_GRUMPY=...`.

Front-end example:

```js
// record with MediaRecorder -> blob
const t = await fetch('/api/speech/transcribe', { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob }).then(r => r.json());
const v = await fetch('/api/proof/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'voice', quest, curse, petName: pet.name, transcript: t.text }) }).then(r => r.json());
const audio = new Audio(URL.createObjectURL(await fetch('/api/speech/say', { method: 'POST',
  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: v.message, voice: 'cute' }) }).then(r => r.blob())));
audio.play();
```

## Heuristic fallback

This runs when Gemini is off or a Gemini call fails.

- **Photo:** an image under 8 KB is rejected as too small or blank. An exact copy of a photo that was already accepted is rejected (checked by SHA-256, kept in memory only). Anything else is accepted with confidence 0.6.
- **Voice:** a transcript under 4 words is rejected. Mentioning the place or quest keywords raises the confidence. Curse checks:
  - `pirate` needs a pirate word (arr, matey, ye, ahoy, …).
  - `rhyme` needs two line endings that share their last 2 letters.
  - `shout` needs mostly capital letters or `!`.
  - Any other curse passes with slightly lower confidence.

Static serving never exposes `server/`, dotfiles (`.env`, `.git`) or `package.json`.
