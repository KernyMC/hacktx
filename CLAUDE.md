# Pixlings — HackTX 2026 (#OnceUponAHack)

Context router. This file is loaded whole every session — keep it short.
Detail lives in `docs/`, `SPECS.md` and the agents in `.claude/agents/`.

**What it is**: Pixlings (repo and storage keys still say "Familiars"), a cute 16-bit pet you can only
raise by doing real-world quests. An AI game master turns real places nearby (SerpApi) into quests; the
proof is a photo plus a caption judged by Gemini; rewards are XP, random-rarity eggs and evolutions.
Friends' pets share a village: Muse (Meta) plans group outings and writes the village chronicle, plus
curses, blessings, raid bosses, minigame duels and phone-style notifications. Installable PWA.

Tracks: **Best Overall**, **Jester's Court (Most Entertaining)**, **Meta**, **SerpApi**.
Deadlines: soft submit Sat 11:30 pm · final Sun 11:30 am · judging Sun 2–5 pm (Welch) · `hacktx26.devpost.com`.
Live: https://hacktx-eight.vercel.app (Vercel, production branch `systems`).

## Commits on GitHub

Commits are authored as the user (`git -c user.name="KernyMC" -c user.email="ccelivetech@gmail.com"`),
**never** with Claude as co-author or a Claude-Session trailer. Working branch: **`systems`** (Vercel
deploys it on every push). `familiars-v2` and `visuals` are older; `richard` is a teammate's other
project — do not touch it. Ask before committing unless the user already said "push everything".

## Where to look

| You need | Go to |
|---|---|
| What is done / in progress / pending | `docs/status.md` |
| Decision history and findings per session | `docs/log.md` |
| Why something was decided (irreversible + non-obvious) | `docs/adr/` |
| Domain glossary (Pixling, rarity, curse, raid key, plan, chronicle…) | `CONTEXT.md` |
| Product spec, data model, API contract (§15 = what is actually built) | `SPECS.md` |
| Run locally, env vars, Vercel, QA scripts | `docs/dev.md` |
| 3-minute demo script for judges | `docs/demo.md` |
| Drawing or fixing sprites (pxl) | `.claude/agents/pixel-artist.md` + `art/BRIEF.md` |
| ElevenLabs voices / transcription | `.claude/agents/elevenlabs.md` |
| Gemini, Muse, SerpApi, server routes | `.claude/agents/ai-backend.md` + `server/README.md` |

## Code map (no build step, Node ≥ 18, zero dependencies)

```
index.html          markup + all CSS (HackTX theme; full-screen app under 560 px and when installed)
js/icons.js         31 full-colour 12x12 icons (COLOR) + per-animal 9x9 tab-bar glyphs (THEMES)
js/animals.js       the 33 animals (palette, rarity, minigame, voice) + procedural fallback rasterizer
js/sprites.js       pxl sheets (assets/sprites), habitats per animal + time of day (setPhaseOverride), eggs
js/audio.js         chiptune SFX + one cry per species
js/minigames.js     17 engines + per-species skins (SKINS), difficultyFor(species)
js/mockApi.js       game state (localStorage familiars.v2) + API contract; calls the server, mocks without it
js/app.js           UI controller: every screen, notifications, share card, demo panel, PWA wiring
server/server.js    static files + Gemini + Muse + ElevenLabs + SerpApi (+ fallbacks); exports handle()
api/index.js        Vercel entry: vercel.json rewrites /api/* here
sw.js, manifest.webmanifest, assets/icon-*.png   PWA (installable, offline shell)
tools/qa/           audit.js (40-step e2e) + allgames.js (33 minigames)  · tools/pxl, art/ = sprite pipeline
```

## Hard rules (non-negotiable)

- **No emoji anywhere in the UI.** Icons via `Icons.svg()` / `<i data-icon="...">`.
- **Legendaries are Austin icons only**: Longhorn, Grackle, Golden Salamander, Horned Lizard (ADR 0005). The rodeo stays Longhorn-only.
- **Rarity = resolution**: common 20 px · uncommon 24 · rare 32 · mythic 40 · legendary 48. See ADR 0001.
- **Zero npm dependencies.** The server is plain Node with `fetch`. Do not add packages without asking.
- **Keys live only in `.env`** (gitignored) and in Vercel env vars. Never in the front-end, never in commits.
- **Every AI call has a local fallback**: the demo must never depend on wifi.
- **Never invent places**: quests and Muse plans only use places returned by SerpApi (or the fixed demo pool).
- **Art is made with pxl, not ChatGPT sheets**: see ADR 0001. Faces use the standard `face()` from `art/BRIEF.md`.
- **No Google Maps Platform**: SerpApi already provides the data; the map is a pixel minimap. See ADR 0003.
- **Do not rename storage keys** (`familiars.*`, `FAMILIARS_API`): players would lose their pets.
- **Run `node tools/qa/audit.js` before pushing** a change that touches flows; it must stay 40/40.

## At the end of a session with relevant work

Update `docs/status.md` (if something changed state) and append a short entry to `docs/log.md`
(date + what was done/decided + why, if not obvious). If you made a hard-to-reverse decision, write an
ADR in `docs/adr/`. Not needed for trivial changes.
