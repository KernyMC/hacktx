# Run and test

## Local (Windows / any OS, Node ≥ 18)

```
copy .env.example .env      # or cp — then paste the keys
npm start                   # http://localhost:8080  (PORT in .env)
```

On start it prints which services are `on`: ElevenLabs, Gemini, SerpApi. Without keys everything
falls back to mocks. `GET /api/health` returns the same.

Without the server (any static host) the game works the same, but with fixed quests, the heuristic
judge and the browser's voice.

## Demo shortcuts

- `#dev` in the URL → tester account (everything unlocked). Also in Settings.
- Settings → "Demo: force legendary drop", "Receive a duel request", "Skip 12 hours" (vacation).
- State lives in `localStorage` key `familiars.v2`; "Reset" wipes it.

## End-to-end checks (Playwright + Chromium, preinstalled in the sandbox)

There is no formal suite; the pattern used in every session is a Playwright script that opens
`http://localhost:<port>/`, hatches the pet (3 clicks on `#hatchCanvas`, then `#hatchGo`), skips the
tutorial (`.tut [data-a=skip]`), walks the tabs and takes screenshots at 430 px wide while collecting
`pageerror`. Any QA agent should repeat that pattern and **look at** the PNGs, not just count errors.

Photo proof without a camera: `page.setInputFiles('#photoInput', <png>)`.
Voice without a microphone: hold `#recBtn` ≥ 600 ms; the mock transcript is built from the quest.

## Art (pxl)

```
node tools/pxl/bin/pxl.js build art/animals/<id>.px.js --out art/out/<id>
node tools/pxl/bin/pxl.js lint  art/animals/<id>.px.js <id>_idle
node tools/pack_sprites.js [id ...]     # → assets/sprites/<id>.png + manifest.json
```

Look at `art/out/<id>/_preview/<id>.png` (the upscaled 4×4 sheet) before calling a sprite done.
Contract and style guide: `art/BRIEF.md`.

## Artifact (claude.ai view, no server)

A single HTML is generated with the `<script src>` tags inlined and published with the Artifact tool to
the same URL: https://claude.ai/artifact/JejDGqb8Us9a398MaWbHTc. The inlining is trivial: strip
doctype/head/body and replace each `<script src="js/x.js">` with its content.

## Claude Code sandbox limits (so nobody loses time)

From the remote session `api.elevenlabs.io`, `serpapi.com` and `hacktx.com` are **not** reachable
(proxy 403). `aiplatform.googleapis.com` is. That is why ElevenLabs and SerpApi are only validated on
the user's machine.

## QA scripts (Playwright + Chromium)

```
GEMINI_API_KEY=invalid-for-test PORT=8099 npm start      # deterministic heuristics, no AI calls
node tools/qa/audit.js /tmp/qa                           # 40-step end-to-end tour: hatch, tutorial, gift, curse, quest + proof,
                                                         # chat, nest, shop, gacha, village, story, settings, demo events, reset, #dev
node tools/qa/allgames.js                                # every species' minigame at difficulty 5 with random input
```
Both print PASS/FAIL per step plus any page or console errors. Expected offline noise: `/api/speech/say` answers 502
when ElevenLabs is unreachable (the client then stays quiet for a minute).
