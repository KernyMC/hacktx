# Familiars — project context for Claude Code

Read this first. It is the full history of decisions from the design session, so you can continue without re-asking.

## What this is

**Familiars** is a HackTX 2026 (UT Austin, theme #OnceUponAHack, 24h, Oct 24–25 2026) hackathon project.
A cute 16-bit pet you can only raise by doing real-world quests. An AI game master turns real places near you into quests; proof is a photo or a voice note; rewards are XP, random-rarity eggs and evolutions. Friends' pets live in a shared village where you curse, bless and raid together.

Tracks we are targeting (max 3 sponsored + Best Overall):
- **Best Overall (Cinderella's Castle)** — MacBook Pro M5 Pro. Judged on design, complexity, impact, unique vision.
- **Jester's Court (Most Entertaining)** — PS5.
- **Meta** — "bring people closer together with AI"; uses Muse Spark (text), Muse Image, Muse Voice Transcribe. Top 3 go to Menlo Park.
- **SerpApi** — SerpApi must play a meaningful role (Maps/Places/Events feed every quest).
- Freebies: `.TECH` domain (`familiars.tech`), Gemini as vision fallback, Vultr hosting, Tiger Data (Postgres).

Deadlines: soft submission Sat 11:30 pm, final Sun 11:30 am, judging Sun 2–5 pm (Welch), Devpost `hacktx26.devpost.com`.

Full product/tech spec: **`SPECS.md`** (data model, API contract, AI prompts, design system, demo script). Keep it updated.

## State of the code (front-end is DONE, backend is NOT started)

No build step. Static files, open with any static server (`npx serve .` — the user is on Windows without Python).

```
index.html          markup + all CSS (single committed pixel theme, mobile-first 430px, phone frame on desktop)
js/icons.js         8x8 pixel icons rendered as inline SVG. NO EMOJI anywhere in the UI (user requirement).
js/sprites.js       pet rendering: 16-bit sprite sheets (preferred) with procedural 16x16 fallback; eggs; hats; palettes
js/audio.js         WebAudio chiptune SFX, no audio files
js/mockApi.js       THE ONLY FILE THE BACKEND REPLACES. Every function = one endpoint (see SPECS.md §8). localStorage key `familiars.v1`
js/app.js           UI controller: hatch → home/stage → quest sheet → proof → judging → reward sequence → evolution; Nest; Village; Story; Settings
assets/sprites/     16-bit sheets (320x320 PNG, 4x4 cells of 80px). Currently: axolotl.png, cat.png, dog.png
tools/slice_sheet.py  chroma-keys magenta + slices a ChatGPT-generated 4x4 sheet into assets/sprites
SPECS.md            product + technical spec
```

Screens built and working: Hatch, Home (animated stage + quests + inbox banner), Quest sheet (photo upload / hold-to-record voice with mock transcript, reroll), Judging, Reward sequence (verdict → XP count-up → level up → egg drop with rarity → evolution cutscene), Nest (eggs incubate, tap-to-hatch, collection), Village (lawn canvas, boss raid with HP, friends with Curse/Bless/Visit, curse picker), Story (illustrated chapter of your day), Settings (sound, **Demo: force legendary drop**, reset).

Demo tuning constants in `mockApi.js`: `EVOLVE_AT = 2` quests, `EGG_NEEDS = 2`, rarity roll 3% legendary / 12% epic / 30% rare / rest common, first quest always drops an egg.

## Sprite pipeline (important, the user generates art with ChatGPT)

Contract for every sheet: **4 columns × 4 rows, equal cells, solid magenta #FF00FF background**.
Pets: row 1 idle (4f), row 2 happy jump (4f), row 3 eating (4f), row 4 sleepy (4f).
Eggs: row 1 wobble (4f), row 2 crack stages (intact, small crack, big cracks, split with light), row 3 hatch burst (4f), row 4 glow pulse (4f).

Process a new sheet: `python tools/slice_sheet.py <generated.png> assets/sprites/<name>.png 80` → register in `Sprites.loadAll()` list in `js/sprites.js` (meta = `SHEET_META`, `baseHue` in `BASE_HUE`). Animations are selected with `drawPet(..., { anim: 'idle'|'happy'|'eat'|'sad', t })`.
Rarity variants are done by `ctx.filter = hue-rotate(pet.hue - baseHue)`: epic = +150 ("shiny"), legendary = +40 (golden). Hats are ignored for sheet-based species.
Note: the magenta key is strict (`r>200, b>200, g<80, |r-b|<45`) because the axolotl's pink gills were being erased with a looser threshold.

### Species today
- `axolotl` — every pet hatches as this (baby). Base hue 340.
- `cat` ("Snack Cat") — evolves from **food** quests. Base hue 30.
- `dog` ("Party Pup") — evolves from **social** quests. Base hue 30.
- `golem` ("Moss Golem", outdoor) and `owl` ("Night Owl", creative) — still procedural; waiting for sheets.
Mapping in `Sprites.QUEST_TYPE_TO_SPECIES`.

### Planned collection: 20 animals by rarity (user already has the prompts; files will arrive as PNGs)
Common (8): `common_cat` ✅, `common_dog` ✅, `common_bunny`, `common_duckling`, `common_hamster`, `common_hedgehog`, `common_frog`, `common_turtle`
Rare (7): `rare_redpanda`, `rare_penguin`, `rare_fennec`, `rare_otter`, `rare_raccoon`, `rare_capybara`, `rare_owl`
Epic (4): `epic_armadillo`, `epic_bat`, `epic_chameleon`, `epic_snowleopard`
Legendary (1): `legendary_longhorn` — **a Texas Longhorn bull (Austin, TX); must be the only legendary**
Eggs: `egg_common`, `egg_rare`, `egg_epic`, `egg_legendary`

When they arrive: slice each, add a `RARITY_POOL = { common:[...], rare:[...], epic:[...], legendary:['longhorn'] }` in `mockApi.js` and make `hatchEgg()` pick only from the egg's tier (longhorn only from a legendary egg). Replace procedural `drawEgg` with the egg sheets (idle wobble in Nest, crack stages on tap, burst on hatch, glow when ready). Hue-rotate is then no longer needed for rarity (art carries it) — keep it only as a fallback.

## Decisions the user made (do not undo)
1. 16-bit look, cute animals, ChatGPT-generated sheets (not AI-drawn at runtime, not procedural once sheets exist).
2. **No emojis anywhere.** Use `Icons.svg()` / `<i data-icon="...">`.
3. Legendary = Texas Longhorn bull, Austin-flavored collection (armadillo, Congress Bridge bat, UT turtle pond turtle).
4. Front-end first with mocked data; backend afterwards by replacing `js/mockApi.js` with `fetch` calls. Keep function names.
5. User will add **ElevenLabs**: (a) Speech-to-Text (Scribe) to transcribe the voice-note proof — replaces the mock transcript in `recEnd()` in `app.js`; (b) Text-to-Speech so the pet reads the quest aloud (one voice per species) — add a play button in the quest sheet. API key must live in the backend (`POST /speech/transcribe`, `POST /speech/say`); front-end switches the recorder to a real `MediaRecorder`.

## Backend plan (not started)
Suggested: Supabase (Postgres + Auth + Realtime for village/curses) or Tiger Data, thin Node/Express or Next.js API routes, SerpApi for places/events, Meta Muse Spark/Image/Voice Transcribe, Gemini Flash as vision fallback, ElevenLabs for speech, deploy on Vultr. Endpoint list and the exact LLM prompts are in `SPECS.md` §8–9.

## 3-minute demo script
1. Egg → judge taps it → names the axolotl.
2. Home: three quests from real places; accept Leo's pirate curse → quest text turns pirate.
3. Voice-note proof in pirate voice → judging → reward sequence (turn on *force legendary* in Settings first).
4. Second quest with a photo → evolution cutscene.
5. Village: curse Leo back, join the raid. Story: read the chapter aloud.
Everything is mocked locally so the demo never depends on wifi.

---

## UPDATE (Oct 25, v2) — read this, it supersedes parts of the above

**Run:** `npm start` (Node 18+, zero dependencies) → http://localhost:8080. Serves the front-end AND the AI routes. Keys live in `.env` (gitignored; template in `.env.example`). Opening with a plain static server still works: every AI call falls back to local mocks.

### New files
- `js/animals.js` — the collection (30 animals) as shape lists + a rasterizer. **Resolution scales with rarity:** common 20px · uncommon 24 · rare 32 · mythic 40 · legendary 48. Higher tiers also get more shading tones, dithering, sel-out outlines, gold rim light, sparkles. Each animal has `rarity, cls, minigame, voice, pal, shapes, face`.
- `js/minigames.js` — `Minigames.open({engine, pet, difficulty 1-5, title, subtitle, triesLeft, practice}) → {win, score}`. Engines: catch, hop, memory, timing, whack, dodge, rodeo (Longhorn's legendary trial, hard).
- `server/server.js` — static + `POST /api/proof/verify` (Gemini, heuristic fallback, duplicate-photo check), `POST /api/speech/transcribe` (ElevenLabs Scribe), `POST /api/speech/say` (ElevenLabs TTS, voice presets cute/chill/grumpy/wise/hyper/regal/spooky/cowboy/dreamy), `GET /api/health`.
  Gemini: the provided key is a **Vertex AI express key (`AQ.` prefix)** → server auto-uses `aiplatform.googleapis.com` with `gemini-3-flash-preview` (the only model that key can reach). `AIza` keys use AI Studio.

### Rarity / classes (replaces common/rare/epic/legendary)
5 tiers: common, uncommon, rare, mythic, legendary (legacy 'epic' maps to mythic). Longhorn is still the ONLY legendary.
Classes: Farm, Wild, Prairie, Water, + special **Austin Legends** (Congress Bat, Jackalope, Texas Longhorn). The **active pet themes the whole app**: class scenery on the stage (barn / forest / mesas+bluebonnets / pond / Austin dusk skyline with bats) + CSS vars from the animal palette + per-class panel styling (`body[data-cls]`).
Evolution: axolotl → cat/dog/turtle/owl by dominant quest type, and goes common → uncommon (visible resolution upgrade).

### Sprite sheets decision change
`Sprites.USE_SHEETS = false` by default: the 80px ChatGPT sheets downsampled to tier resolution looked muddy and clashed with the procedural set. Flip to `true` in `js/sprites.js` to use `assets/sprites/<species>.png` (downsampled to the tier res).

### New systems (all in mockApi.js, same function-per-endpoint style)
- Proof checking: `completeQuest` calls `/api/proof/verify`; rejected proofs → `{ok:false, rejected:true, message, reasons}`, no XP, quest stays open. Photos downscaled to 1024px JPEG client-side. Voice uses real `MediaRecorder` → Scribe (mock transcript built from the quest if offline/no mic).
- 10 curses (pirate, rhyme, hop, shout, shakespeare, backwards, opera, mime, whisper, tiny) — some force the proof type; 8 blessings (double, lucky, rarityup, coinrain, shield, incubate, reroll, cheer). Curses/blessings are inventory items.
- Shop: eggs per tier, blessings (buy / use on me), curse scrolls, raid keys (1/2/3 per raid; 3 raids).
- Gacha "Lucky Capsule": free daily pull, x1 100, x10 900; rates 52/27/14/6/1; pity mythic 20, legendary 60; x10 guarantees rare+; 1/16 shiny; common capsules can be items.
- Minigame duels: send your pet's minigame to a friend (3 tries; they fail all 3 → you win coins). Incoming duels in the inbox with 3 tries. Minigame wins also incubate eggs (+coins, 5 rewarded/day).
- Vacation: 12h–2 weeks or custom; mood decays 1.5/h; duel requests blocked; friends on vacation can't be dueled. Settings has "Skip 12 hours" + "Receive a duel" demo buttons.
- Tutorial: 10-step spotlight walkthrough after hatch, replayable from Settings.
- Starting coins 1200 (demo tuning). localStorage key is now `familiars.v2`.
