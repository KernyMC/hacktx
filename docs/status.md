# Project status

Living checklist. Update when something changes column — the "how" lives in `docs/log.md` or in the code.

## Done

- [x] Full mocked front-end (v1, Oct 24): hatch, home, quest sheet, judging, reward sequence,
  evolution, nest, village (raid + friends), story, settings.
- [x] **v2 (Oct 25)**: 30 animals in 5 rarities and 5 classes; rarity = resolution; the active pet
  themes the app; shop; "Lucky Capsule" gacha with pity and shiny; 10 curses + 8 blessings as
  inventory; 3 raids gated by keys; 7 minigames + duels; vacation mode; 10-step tutorial; tester
  account (`#dev`).
- [x] **Zero-dependency Node server** (`npm start`): static files + `/api/proof/verify` (Gemini, with
  heuristic fallback and duplicate-photo detection), `/api/quests` (SerpApi + Gemini), `/api/chat`,
  `/api/speech/transcribe`, `/api/speech/say`, `/api/health`.
- [x] Gemini tested live with the Vertex key (`AQ.`) and `gemini-3-flash-preview`: judges photos and
  voice notes, writes quests, chats in character.
- [x] Pixel minimap on every quest + "Open in Maps"; real location with fallback to GDC.
- [x] Chat with your pet ("Talk" on the stage), spoken reply via TTS.
- [x] ElevenLabs voices per the official skill: `eleven_v4`, one premade voice per personality, audio
  tags by mood, fallbacks; STT `scribe_v2` with keyterms.
- [x] HackTX "Once Upon a Hack" visual theme: starry night + UT burnt orange + parchment; HackTX
  ribbon; new tab bar with a gold "lantern" on the active tab.
- [x] Art pipeline with pxl: `tools/pxl`, `art/BRIEF.md` (contract + style guide + standard `face()`),
  `tools/pack_sprites.js`, loader in `js/sprites.js` via `manifest.json`.
- [x] Documentation system (`CLAUDE.md` router, `CONTEXT.md`, `docs/`, `.claude/agents/`) created
  Oct 25, mirroring the Galápagos & Beyond repo.
- [x] Playable artifact (offline mode): https://claude.ai/artifact/JejDGqb8Us9a398MaWbHTc

## In progress

- [ ] **pxl sprites for all 30 animals** (3 agents in parallel, by class). First round rejected by the
  user ("goofy, the mouth is not properly made") → new rule: solid ink outline + mandatory standard
  `face()`. Water/prairie batch (10) is done; farm and wild/legends batches still running. When done:
  `node tools/pack_sprites.js`, review the full contact sheet, publish.
- [ ] Verify on the user's machine (this sandbox blocks those hosts): ElevenLabs v4 voices (does the
  plan include v4? otherwise it falls back to flash), Scribe v2 transcription, real SerpApi quests.

## Pending

- [ ] Real backend: auth + real friends + realtime village (Supabase or Tiger Data). Today friends
  (Leo, Ana, Sam, Mia) and raids are mocked in `localStorage`.
- [ ] Storybook with Muse Spark / Muse Image (Meta track). Today it is a local template.
- [ ] Muse Voice Transcribe as an alternative to Scribe (Meta track).
- [ ] UI icons (`js/icons.js`, 8×8) and eggs redrawn with pxl to match the new animals.
- [ ] Deploy (Vultr) + `familiars.tech` domain.
- [ ] Devpost + demo video + rehearse `docs/demo.md` twice.
- [ ] Rotate the keys (ElevenLabs, Gemini, SerpApi) after the hackathon: they were pasted in chat.
