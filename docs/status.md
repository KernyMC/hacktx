# Project status

Living checklist. Update when something changes column — the "how" lives in `docs/log.md` or in the code.
Last full update: 2026-10-25 (night), branch `systems`, live at https://hacktx-eight.vercel.app.

## Done

**Core loop**
- [x] Real-world quests: 3 a day from SerpApi (`google_maps`) written in the pet's voice by Gemini; fixed
  Austin pool offline. Quest sheet = pet speech bubble, go/do/prove checklist, real place + Maps link,
  pixel minimap, XP/coins/egg tiles with blessing and curse multipliers.
- [x] Proof = photo + typed caption, judged by Gemini (Vertex, `gemini-3-flash-preview`); rejects
  screenshots, photos of screens, blurry/blank/reused shots (sha256); curses are judged on the caption.
  Voice-note proofs are switched off in the UI (server route kept).
- [x] Rewards: XP/levels, coins, random-rarity eggs, raid damage; animated reward sequence.
- [x] Eggs incubate only with real quests (needed = 2 + eggs already in the nest); evolution = same pet,
  stage 2 (crown, palette, +1 resolution tier).
- [x] Real day streak (`S.lastQuestDay`); level and streak chips explain themselves on tap.

**Collection and art**
- [x] 33 animals, 5 rarities, rarity = resolution; 4 Austin legendaries; all sprites drawn with pxl and
  rendered at integer scales (crisp everywhere). Unique boss sprites (hydra, golem, kraken).
- [x] Per-animal habitats with dawn/day/sunset/night from the clock; Settings > Time of day override.
- [x] 31 full-colour 12x12 icons; tab bar keeps each animal's own glyphs (readable accent for dark animals).
- [x] Nest + dex + rarity filters; shop (compact wallet strip); Lucky Capsule gacha with pity and shiny.

**Social (Meta track)**
- [x] Village > "Plan something together": Muse Spark (Meta Model API) reads the village's week and plans
  3 outings at real places, shown as invitation cards (crew as pet sprites); sending one notifies a friend.
- [x] Story > "The Village Chronicle": Muse writes the shared weekly story; ElevenLabs reads it.
- [x] Curses (judged on the caption), blessings, raid bosses with keys, minigame duels (3 tries).
- [x] Phone-style notifications: friends' pet activity + inbox items as banners, bell history, real system
  notifications via the service worker (Settings > Phone notifications).

**Play**
- [x] Chat with the pet (Gemini) with an animated typing indicator; ElevenLabs voice per species + mood.
- [x] 17 minigame engines (incl. Club Penguin / Neopets style: ice fishing, round-up, sinking pads, hill
  roll, snack trail; Longhorn rodeo); per-game difficulty 1–5 stars; lost hearts dim.
- [x] Storybook + "Share as image" (1080x1350 card, Web Share API on phones, PNG download elsewhere).
- [x] Vacation mode, welcome package, 5-step tutorial, tester account (`#dev` / `?dev=1`).
- [x] Settings > Demo events: fire any moment (gift, curse, duel, egg, level up, evolution, legendary,
  raid win, full show, friend notification) for judges.

**Platform**
- [x] Zero-dependency Node server; Vercel deploy (single function `api/index.js`, all env vars set).
- [x] PWA: manifest, Pixlings icon, service worker (offline shell), full-screen layout on phones.
- [x] Renamed to Pixlings in UI, manifest and AI prompts (storage keys unchanged on purpose).
- [x] QA: `tools/qa/audit.js` 40/40, `tools/qa/allgames.js` 33/33 clean.
- [x] Pitch deck (11 slides, artifact) + 44 s motion-graphics explainer (`pitch/pixling-explainer.mp4`).

## In progress

- [ ] Whatever integration the user is adding next (see `docs/log.md` for the latest entry).

## Pending

- [ ] Real multiplayer backend: friends, raids and activity are simulated in `localStorage` today.
- [ ] Naming consistency: the deck and video say "Pixling", the app says "Pixlings" (user to decide).
- [ ] Minigame difficulty is by judgment, not measured win rates.
- [ ] Devpost submission + rehearse `docs/demo.md` twice.
- [ ] Rotate every key after judging (ElevenLabs, Gemini, SerpApi, Muse): all were pasted in chat.
