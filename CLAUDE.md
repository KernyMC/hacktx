# Familiars — HackTX 2026 (#OnceUponAHack)

Context router. This file is loaded whole every session — keep it short.
Detail lives in `docs/`, `SPECS.md` and the agents in `.claude/agents/`.

**What it is**: a cute 16-bit pet you can only raise by doing real-world quests. An AI game master
turns real places nearby (SerpApi) into quests; proof is a photo or a voice note judged by Gemini;
rewards are XP, random-rarity eggs and evolutions. Friends' pets live in a shared village
(curses, blessings, boss raids, minigame duels).

Tracks: **Best Overall**, **Jester's Court (Most Entertaining)**, **Meta**, **SerpApi**.
Deadlines: soft submit Sat 11:30 pm · final Sun 11:30 am · judging Sun 2–5 pm (Welch) · `hacktx26.devpost.com`.

## Commits on GitHub

Commits are authored as the user (KernyMC), never with Claude as co-author. Working branch:
`familiars-v2` (the `richard` branch holds a teammate's other project — do not touch it).
Ask before committing unless the user already said "push everything".

## Where to look

| You need | Go to |
|---|---|
| What is done / in progress / pending | `docs/status.md` |
| Decision history and findings per session | `docs/log.md` |
| Why something was decided (irreversible + non-obvious) | `docs/adr/` |
| Domain glossary (Familiar, rarity, class, curse, raid key, gacha…) | `CONTEXT.md` |
| Product spec, data model, API contract, prompts | `SPECS.md` |
| How to run and test (npm start, Playwright, #dev) | `docs/dev.md` |
| 3-minute demo script for judges | `docs/demo.md` |
| Drawing or fixing sprites (pxl) | `.claude/agents/pixel-artist.md` + `art/BRIEF.md` |
| ElevenLabs voices / transcription | `.claude/agents/elevenlabs.md` |
| Gemini (Vertex), SerpApi, server routes | `.claude/agents/ai-backend.md` + `server/README.md` |

## Code map (no build step, Node ≥ 18, zero dependencies)

```
index.html        markup + all CSS (HackTX theme: starry night, burnt orange, parchment)
js/animals.js     the 30 animals (shapes + procedural rasterizer; fallback when a sheet is missing)
js/sprites.js     drawing entry point: loads assets/sprites/manifest.json (4x4 pxl sheets), eggs
js/minigames.js   7 minigame engines (rodeo = legendary)
js/mockApi.js     game state + API contract; calls the server, falls back to mocks without it
js/app.js         UI controller (every screen and flow)
server/server.js  static files + Gemini (proofs, quests, chat) + ElevenLabs + SerpApi
art/              pxl sources for sprites (art/animals/*.px.js) · art/out is gitignored
tools/pxl         vendored pxl tool · tools/pack_sprites.js packs sheets into assets/
```

## Hard rules (non-negotiable)

- **No emoji anywhere in the UI.** Icons via `Icons.svg()` / `<i data-icon="...">`.
- **Legendaries are Austin icons only**: Longhorn, Grackle, Golden Salamander, Horned Lizard (ADR 0005). The rodeo stays Longhorn-only.
- **Rarity = resolution**: common 20 px · uncommon 24 · rare 32 · mythic 40 · legendary 48. See ADR 0001.
- **Zero npm dependencies.** The server is plain Node with `fetch`. Do not add packages without asking.
- **Keys live only in `.env`** (gitignored). Never in the front-end, never in commits. `.env.example` is versioned.
- **Every AI call has a local fallback**: the demo must never depend on wifi.
- **Never invent places**: quests only use places returned by SerpApi (or the fixed demo pool).
- **Art is made with pxl, not ChatGPT sheets**: see ADR 0001. Faces use the standard `face()` from `art/BRIEF.md`.
- **No Google Maps Platform**: SerpApi already provides the data; the map is a pixel minimap. See ADR 0003.

## At the end of a session with relevant work

Update `docs/status.md` (if something changed state) and append a short entry to `docs/log.md`
(date + what was done/decided + why, if not obvious). If you made a hard-to-reverse decision, write an
ADR in `docs/adr/`. Not needed for trivial changes.
