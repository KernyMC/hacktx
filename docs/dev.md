# Run, configure and test

## 1. Local setup (Windows / macOS / Linux, Node ≥ 18, no `npm install`)

```
git clone https://github.com/KernyMC/hacktx.git && cd hacktx
git checkout systems && git pull origin systems
copy .env.example .env        # Windows  (macOS/Linux: cp .env.example .env), then paste the keys
npm start                     # = node server/server.js  ->  http://localhost:8080
```

The server prints which services are `on` and `GET /api/health` returns
`{ ok, elevenlabs, gemini, serpapi, muse }`. Any key left empty just switches that feature to its local
fallback; the game always works. Variables already set in the shell win over `.env`.

| Variable | Needed for | Notes |
|---|---|---|
| `GEMINI_API_KEY` | proof judging, quest text, pet chat | `AQ.` key = Vertex express (auto), `AIza` = AI Studio. |
| `GEMINI_MODEL` | | `gemini-3-flash-preview` (the only model the Vertex project reaches). |
| `SERPAPI_API_KEY` | real places for quests and plans | 3 searches per quest load, 10-min cache. Free plan is small. |
| `ELEVENLABS_API_KEY` | pet voices, chronicle narration | `ELEVENLABS_TTS_MODEL`, `ELEVENLABS_STT_MODEL`, `VOICE_<PRESET>=<id>` optional. |
| `MODEL_API_KEY` | Muse: village planner + chronicle | Meta Model API key (`LLM_…`), from https://dev.meta.ai. |
| `MUSE_MODEL` | | `muse-spark-1.3`. |
| `MUSE_BASE_URL` | | Optional, default `https://api.meta.ai/v1` (Chat Completions). |
| `PORT` | | Default 8080. |

Without the server (any static host, the claude.ai artifact) the game still runs: fixed Austin quests,
heuristic judge, template plans, browser voice.

## 2. Vercel (production)

Project `hacktx` under kernymcs-projects, production branch **`systems`**: every push deploys to
https://hacktx-eight.vercel.app. `api/index.js` wraps `handle()` from `server/server.js`; `vercel.json`
rewrites `/api/*` to it (60 s, 1 GB). Env vars live in Project → Settings → Environment Variables (same
names as `.env`, all three environments). After changing a variable you must **redeploy** (Deployments →
… → Redeploy, or push any commit). Check `https://hacktx-eight.vercel.app/api/health`.

## 3. Phone / app mode

- Same wifi: start the server, find your LAN IP (`ipconfig` / `ifconfig`) and open `http://<ip>:8080`
  on the phone. Camera upload works; install and system notifications need HTTPS, so for those use the
  Vercel URL.
- Install: iPhone Safari → Share → Add to Home Screen; Android Chrome → Install app (or Settings > Install).
  It opens full screen with the Pixlings icon. After a deploy, close and reopen twice (service worker
  `sw.js`, cache `pixlings-v2`; bump the name when shell files change a lot).
- Desktop emulation: Chrome DevTools → device toolbar → iPhone. Under 560 px the app goes full screen.
- Notifications: Settings > Phone notifications (permission), then Settings > Demo events > Friend activity.

## 4. Demo shortcuts

- `#dev` or `?dev=1` → tester account (33 animals, 50k coins, items, one ready egg per tier).
- Settings > Demo events: gift, curse, duel, egg, level up, evolution, legendary, raid win, full show,
  friend notification. Settings > Time of day: dawn / day / sunset / night override.
- State lives in `localStorage` `familiars.v2`; Settings > Reset wipes it.

## 5. QA (Playwright + Chromium; preinstalled in the Claude sandbox, `npx playwright install chromium` locally)

```
GEMINI_API_KEY=invalid-for-test MODEL_API_KEY= PORT=8099 node server/server.js   # deterministic, no AI spend
node tools/qa/audit.js /tmp/qa      # 40-step e2e tour; must print 40/40 before pushing a flow change
node tools/qa/allgames.js           # every species' minigame at difficulty 5 with random input (33/33)
```

Windows PowerShell: `$env:GEMINI_API_KEY="invalid-for-test"; $env:MODEL_API_KEY=""; $env:PORT=8099; npm start`.
Both scripts print PASS/FAIL per step plus page/console errors, and save screenshots: **look** at them.
Expected offline noise: `/api/speech/say` 502 when ElevenLabs is unreachable (the client goes quiet 60 s).
In scripts, keep the server PID in a file and `kill` it; `pkill -f` can kill the calling shell.

Photo proof without a camera: `page.setInputFiles('#photoInput', <png>)`.

## 6. Adding a new integration (the pattern every provider follows)

1. `server/server.js`: `const hasX = () => !!env('X_API_KEY')`, a route in `handle()` that returns
   `{ ok:true, ..., engine:'x' }` and, without the key or on any error/timeout (`fetchWithTimeout`),
   the local fallback with `engine:'template'` (never a 5xx for game data).
2. Add `x` to `/api/health`.
3. `js/mockApi.js`: one `async` function that calls it through `remoteJSON` and has a mock branch.
4. `js/app.js`: UI. No emoji (`Icons.svg`), no invented places.
5. `.env.example` (empty value), Vercel env var, `server/README.md` route row, `docs/status.md`,
   `docs/log.md`, an ADR if the choice is hard to reverse. Run the audit.

## 7. Art (pxl)

```
node tools/pxl/bin/pxl.js build art/animals/<id>.px.js --out art/out/<id>
node tools/pxl/bin/pxl.js lint  art/animals/<id>.px.js <id>_idle
node tools/pack_sprites.js [id ...]     # → assets/sprites/<id>.png + manifest.json
```

Look at `art/out/<id>/_preview/<id>.png` before calling a sprite done. Contract: `art/BRIEF.md`.

## 8. Claude Code cloud sandbox limits

From the remote session `api.elevenlabs.io`, `serpapi.com`, `api.meta.ai` and `*.vercel.app` are not
reachable (proxy 403); `aiplatform.googleapis.com` is. Those providers are verified on Vercel or the
user's machine; in the sandbox verify the fallbacks (Muse was checked against a local stub endpoint).
