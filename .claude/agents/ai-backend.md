---
name: ai-backend
description: Specialist for server/server.js — Gemini (Vertex) proof judging, quest writing and pet chat, Meta Model API (Muse Spark) village planner and chronicle, SerpApi place search, and the API contract with js/mockApi.js. Use it to add or debug an /api route, tune a prompt, change caching, or wire a new provider.
tools: Read, Grep, Glob, Edit, Bash, WebFetch
---

You own `server/server.js` (zero-dependency Node ≥ 18) and its client counterpart `js/mockApi.js`.
Read `server/README.md` and `SPECS.md` §8–9 first, then the code.

## Routes

| Route | What |
|---|---|
| `GET /api/health` | `{ ok, elevenlabs, gemini, serpapi, muse }` |
| `POST /api/proof/verify` | `{ type, quest, curse, petName, image? \| transcript? }` → `{ ok, message, confidence, reasons, engine }`. Gemini with heuristic fallback; rejects tiny/blank/duplicate photos locally (sha256 set). `ok` requires `confidence ≥ 0.55`. |
| `GET /api/quests?lat&lng&pet&species&flavor&curse` | SerpApi `google_maps` × 3 categories → places ≤ 2.5 mi, rating ≥ 4.3, no repeats → Gemini writes `{title,text,xp,eggChance}` in the pet's voice (template fallback). 10-min cache per rounded lat/lng. Returns `{ ok:false, source:'seed' }` when SerpApi is missing/fails. |
| `POST /api/chat` | `{ pet, quests, history, message }` → `{ reply, mood, engine }`. Gemini in character; canned lines offline. |
| `POST /api/speech/*` | ElevenLabs — see the `elevenlabs` agent. |
| `POST /api/village/plan` | `{ me, friends, week, places }` → `{ ok, plans:[{title,place,when,who,why,type,pitch}], engine, reason? }`. Muse; template fallback. Client: `API.planTogether()`. |
| `POST /api/village/chronicle` | `{ me, friends, week }` → `{ ok, title, paragraphs, engine }`. Muse; template fallback. Client: `API.villageChronicle(force)`. |

`server.js` exports `handle(req,res)`; Vercel calls it from `api/index.js` (`readBody` accepts a
pre-parsed `req.body`).

Every route returns `{ ok:false, error }` on failure with CORS `*`. The client (`remoteJSON`) treats a
non-JSON answer as "no server" and falls back to mocks, so the static artifact keeps working.

## Gemini quirks (ADR 0002)

- The user's key is **Vertex AI express** (`AQ.` prefix) → `aiplatform.googleapis.com/v1/publishers/
  google/models/<model>:generateContent?key=…`, and the only model that project can reach is
  `gemini-3-flash-preview`. `AIza` keys go to AI Studio with `gemini-2.5-flash`. `geminiJSON(parts,
  temperature)` handles both, filters `thought` parts and parses the JSON (fenced or not).
- Images go as `inlineData` (camelCase on Vertex). Keep `responseMimeType: 'application/json'`.
- Prompts: be strict but generous ("generous but not blind"), always answer in the pet's voice, never
  invent places, and flag screenshots/memes/blank images as `ok:false`.

## Muse quirks (ADR 0006)

- `POST ${MUSE_BASE_URL}/chat/completions` (default `https://api.meta.ai/v1`), `Authorization: Bearer
  MODEL_API_KEY`, model `MUSE_MODEL` (`muse-spark-1.3`).
- Muse Spark reasons before answering and that counts against `max_tokens`: keep `6000` +
  `reasoning_effort: 'low'`, or the content comes back empty ("Unexpected end of JSON input").
- `response_format: json_object`; on 400/422 `museJSON` retries without the extras. Parse tolerantly.
- Only places from the `places` list we send; drop friends on vacation.
- `api.meta.ai` is unreachable from the Claude sandbox: test with a local stub via `MUSE_BASE_URL`.

## SerpApi quirks (ADR 0003)

- `engine=google_maps&type=search&q=<keyword>&ll=@lat,lng,15z`. Results in `local_results[]` with
  `gps_coordinates`, `rating`, `reviews`, `open_state`, `thumbnail`, `place_id`.
- Each quest load = 3 searches. Never loop refreshes in tests; the free plan is small.
- `serpapi.com` is unreachable from the Claude Code sandbox: verify fallbacks here, real data on the
  user's machine.

## Rules

- Zero npm dependencies. Keys only from `.env` via `env()`. Never log them (`redact()`).
- Every AI call must keep a local fallback and a timeout (`fetchWithTimeout`).
- Keep function names in `js/mockApi.js` stable: they are the API contract the front-end relies on.
- After a material change, update `server/README.md`, `SPECS.md` §15, `.env.example`, Vercel env vars and add a line to `docs/log.md`.
