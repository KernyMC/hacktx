# Session log

Append-only. One entry per session with relevant work — date, what was decided/done, and the *why*
when it is not obvious. History is never deleted or rewritten, only appended.

---

## 2026-10-24 — Mocked front-end v1 (design session)

Initial decisions (see the earlier `CLAUDE.md` in git history): 16-bit look, no emoji, Longhorn as
the only legendary, Austin-flavored collection, front-end first with `js/mockApi.js` as the only file
the backend replaces. ChatGPT sheets (axolotl, cat, dog) at 80 px with magenta chroma key.

## 2026-10-25 — v2: rarity = resolution, shop, gacha, minigames, real AI

- **30 animals described as shapes** (`js/animals.js`) and rasterized at their rarity's resolution
  (20/24/32/40/48 px) with more tones, dithering and a gold rim on the top tiers. Reason: the user
  asked that "resolution gets better from common to legendary"; shapes generate 5 tiers without
  drawing 5 times. The rescaled ChatGPT sheets were dropped: blurry and outline-less
  (`Sprites.USE_SHEETS=false` at that point). See ADR 0001.
- Rarity went from 4 to 5 tiers (`uncommon` new, `epic` → `mythic`). Classes: farm, wild, prairie,
  water + **Austin Legends**. The active pet themes the whole app (`body[data-cls]` + CSS vars).
- **Zero-dependency Node server** (`server/server.js`) with `/api/proof/verify` (Gemini) and
  `/api/speech/*` (ElevenLabs). **Finding**: the user's Gemini key is a **Vertex AI express** key
  (`AQ.`), blocked on AI Studio; only `gemini-3-flash-preview` answers on
  `aiplatform.googleapis.com`. The server detects the prefix and picks endpoint/model. See ADR 0002.
- Tested live: Gemini approves a pirate voice note, rejects "I stayed home", and rejects a pixel
  sprite posing as a Turtle Pond photo. Rejected proofs give no XP and allow a retry.
- **Real bugs found**: the mock transcript (no mic) did not mention the place and Gemini rejected
  it; it is now built from the quest title and place. A toast covered the record button → toasts are
  `pointer-events: none`. A pending mic-permission prompt hung `recEnd` → 500 ms timeout.
- Shop, gacha (rates 52/27/14/6/1, pity 20/60, x10 guarantees rare+, 1/16 shiny), 10 curses,
  8 blessings, 3 raids with keys, 7 minigames (the legendary rodeo was tuned with a simulated player
  reacting 0.25 s late: ~15–20 % wins at difficulty 5), duels, vacation, tutorial, tester account
  `#dev`. Starting coins 1200 so the x10 pull can be demoed.
- Pushed to `KernyMC/hacktx` branch `familiars-v2` (push to `main` was blocked by session
  permissions; `richard` holds a teammate's Next.js project).

## 2026-10-25 — v2.1: SerpApi, minimap, chat with the pet

- `/api/quests`: SerpApi `google_maps` for 3 categories → filter ≤ 2.5 mi, rating ≥ 4.3, no repeats
  → Gemini writes title/text/xp in the pet's voice; 10-min cache per rounded lat/lng (each load spends
  3 searches). Fallback to the fixed pool with real coordinates (`SEED_COORDS`) so the minimap works
  offline.
- **Decision: no Google Maps Platform** (billing, breaks the pixel look, SerpApi already provides the
  data and it is the track). Pixel minimap with real bearing/distance + "Open in Maps". See ADR 0003.
- `/api/chat`: Gemini in character with mood/hunger/quests; tested live ("I'm hungry" → sends you to
  Veracruz All Natural). **Decision**: chat with the pet, not between friends (realtime does not fit
  in 24 h). See ADR 0004.
- **Not tested live** (the sandbox blocks `serpapi.com` and `api.elevenlabs.io`): only the clean
  fallback was verified. To be confirmed on the user's machine.

## 2026-10-25 — ElevenLabs voices per the official skill + HackTX theme

- Read `elevenlabs/skills` (text-to-speech, speech-to-text). Changes: `eleven_v4` by default (audio
  tags `[giggles]`, `[whispers]`, `[sighs]`…, only `stability`/`similarity_boost`), one premade voice
  per personality (Jessica, Laura, Sarah, Bill, George, Charlotte, Callum, Brian, Matilda), tags from
  the `mood` the chat returns, `apply_text_normalization: on`, fallback to George when a voice returns
  404/400 and to `eleven_flash_v2_5` when the model returns 422. STT `scribe_v2` with `keyterms`
  (pet name + open quest places). Raw `fetch` kept (zero deps) instead of `@elevenlabs/elevenlabs-js`.
- UI: HackTX "Once Upon a Hack" palette (midnight + burnt orange + parchment), top ribbon, midnight
  tab bar with the active tab lifted in gold. `hacktx.com` was unreachable from the sandbox; the
  palette was derived from the fairytale theme and UT colors.

## 2026-10-25 — pxl sprites (in progress) + documentation system

- Vendored `uilianks/pxl` into `tools/pxl` (pixel art as code, with `lint`). Contract in
  `art/BRIEF.md`: 4 anims × 4 frames, 4×4 sheet at native resolution, `tools/pack_sprites.js` →
  `assets/sprites/manifest.json`; `js/sprites.js` loads native sheets and falls back to procedural.
- First round (cat, axolotl, hedgehog) rejected by the user: "goofy, the mouth is not properly
  made". Response: a mandatory standard **`face()`** (eyes with glint, kawaii "w" mouth, `^ ^` happy,
  open mouth when eating, frown + tear when sad, blink) for all 30, and solid ink outline instead of
  `selout` (the colored outline vanished over the pastel sky).
- Water/prairie batch delivered (10 animals, all with `outline: "k"` + `face()`): axolotl, fennec,
  penguin, duckling, otter strong; turtle the weakest (blobby shell seams, small legs).
- This documentation system was created mirroring Galápagos & Beyond (`CLAUDE.md` router,
  `CONTEXT.md`, `docs/status.md`, `docs/log.md`, `docs/adr/`, `.claude/agents/`), in English.

## 2026-10-25 — Faces v2 per species; sprite-by-sprite review

- User feedback on the 30 sheets: "you gave them all the same face, some have the mouth on the nose".
  Root cause: the standard `face()` always placed nose/mouth at a fixed offset under the eyes, ignoring
  the muzzle each species drew, and had a single mouth type.
- Fix: **face v2** with kinds (`kitty`, `dog`, `bunny`, `snout`, `beak`, `wide`, `eyes`) and
  explicit `noseY`/`mouthY`. Applied by hand to all 30 files (species-drawn noses/beaks removed where
  the face now draws them: chick, duckling, penguin, owl, pig, capybara, armadillo, longhorn, snowleopard,
  jackalope) and reviewed in zoomed strips, 10 at a time, all four moods. Decision: the user asked that
  this review not be split across agents again; the main session owns face QA from now on.
- Minigame uniqueness delegated to one agent (new engines + per-species skins); pending at write time.
