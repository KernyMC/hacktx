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

## 2026-10-25 — Playtest feedback round 1 (11 items)

User notes after playing: narrator voice bad; tutorial lets you scroll; sprites need their own sounds;
curses have no visible effect; challenges too easy; chat good but voice terrible; starter items should be
a welcome package; page too long (bottom bar must stay fixed like an app); minigame wins not counting
for eggs; egg time should depend on how many eggs you hold; evolution must be a better version of the
same pet, not a random animal; drop the animal "types" (too Pokémon).

Done in this batch (files not touched by the running minigames agent):
- **App shell**: `.phone` is a fixed-height column, only `<main>` scrolls (the stage scrolls with it),
  tab bar is a flex child, no more page-long scroll. `body.tut-on main { overflow: hidden }` for the tutorial.
- **Species cries**: `Audio8.cry(species)` — a short procedural call per animal (meow, bark, peep, ribbit,
  quack, oink, baa, hoot, moo, screech…) in `js/audio.js`.
- **Evolution = same pet, better**: `pet.stage` (1→2). Stage 2 uses a `<species>_2` sheet when one exists
  (`art/animals/axolotl_2.px.js`, rare tier 32 px: bigger, four gill fronds, gold crown) or the same sheet
  with gold twinkles. `Animals.EVOLVE_TO` (axolotl → cat/dog/turtle/owl) is retired.
- **Curse visuals** (CSS `body[data-curse=…]`): sepia for pirate, caps + shake for shout, mirrored text for
  backwards, faded italics for whisper, shrunken pet for tiny, grayscale for mime, serif for shakespeare,
  spotlight for opera; plus a curse bar under the top bar (JS, next batch).
- **Narrator fallback**: ElevenLabs 402/403/422 on v4 → flash; 404/400 voice → narrator; failures logged.
Pending in `app.js`/`mockApi.js` (after the minigames agent): welcome package, egg time by egg count,
minigame wins always warm eggs, tutorial scroll lock, curse bar + hop/opera effects, remove class UI,
browser-voice fallback tuned, harder duels.
- **Minigames unique per species** (agent, tested in Chromium on 22 species): 5 new engines (dig, fly,
  swim, stack, sneak) + `Minigames.SKINS` and `Minigames.gameFor(species)`; every one of the 30 animals
  has its own named game (max 3 species per engine; rodeo stays Longhorn-only). Not tested: touch on a
  real device, difficulty-5 balance, the duel inbox path end to end.

## 2026-10-25 — Visuals pass: per-animal themes, voices, evolution, 3 legendaries (branch `visuals`)

- Classes are gone (user: "too Pokémon"). Each animal has its own 9x9 icon set (home, quests, shop, emblem on
  book/coin) and its own habitat scene (174x100, same aspect as the stage), ported from the TS prototype and
  re-tinted for dawn 5-8 / day 8-17 / sunset 17-20 / night 20-5 from the device clock. One entry point:
  `Sprites.applyAnimalTheme(id)` (icons, CSS vars, re-themes when the phase changes).
- Sounds: `Audio8.pet/happy/hatch(id)` are sung in the voice of each species' existing cry (wave + pitch), so
  no second table. The cry now plays on pet tap and after both hatch fanfares.
- Evolution: species without a redrawn `_2` sheet get a richer palette (per-pixel, works without ctx.filter),
  a crown placed on the topmost head pixel found by scanning the frame, and a silhouette aura. `drawPet`
  shrinks the body so the crown fits its box; `drawEvolved(id, stage)` returns a 1.5x canvas.
- Found: nothing sets `body.dataset.curse`, so all curse CSS is dormant until app.js does. Opera spotlight fixed.
- 3 new legendaries (ADR 0005). Every legendary wears a gold aura (stage 0 of the evolution renderer).
- QA: Playwright (playwright-core from a scratch dir, system Chrome) at 390x844 after every commit; contact
  sheets of all habitats x 4 phases, icons and evolutions were looked at, not just counted.

## 2026-10-25 — Merged PR #1 `visuals` (Richard) into `familiars-v2`

Both branches started from `b4b07bb`. Kept from Richard: per-animal habitats that follow the device
clock + per-animal icon sets (`Sprites.applyAnimalTheme`, `drawHabitat`; classes removed for good),
`Audio8.pet/happy/hatch` jingles in each species' cry voice, the evolution renderer for species without a
redrawn sheet (`drawUpgrade`: richer palette, crown found by scanning the head, aura; gold aura on every
legendary), the opera spotlight fix, the 100dvh shell, Nest filters by rarity, and the three new
legendaries (Grackle, Golden Salamander, Horned Lizard; ADR 0005 supersedes "Longhorn is the only
legendary"). Kept from the main session: welcome package, egg time by nest size, minigame wins always
warm eggs, same-pet evolution via `pet.stage` in `mockApi.js`, `axolotl_2` sheet, tutorial scroll lock,
curse bar + `body.dataset.curse`, browser-voice fallback, harder duels. The only conflicts were in
`js/app.js` (Nest filters, stage-2 badges, a duplicated hatch cry); resolved by hand and re-tested in
Chromium (`#dev` account: 33 pets, 4 legendaries, grackle habitat, evolved cat, no errors).

## 2026-10-25 — `systems` branch: curses/blessings wired, eggs by quests, Vercel config, quest sheet v2

- Steps 0-6 of the systems list (only `js/app.js`, `js/mockApi.js`, `server/`): `body.dataset.curse` set
  from `me.activeCurse`; species sounds on tap/reply/reward/hatch; evolution reveal via `drawEvolved`;
  voice proofs off (photo + typed caption, the judge reads both; cursed captions are judged on the caption);
  welcome package as a tappable gift box; curses show as "<name> mode" on the quest card, blessings show
  their badge; only real quests incubate eggs, needed = 2 + eggs in nest; practice = tier + 2, duels tier + 3.
- Step 7 (time-of-day override in the tester section) is blocked: `Sprites.setPhaseOverride` does not exist
  in `js/sprites.js` and that file is the teammate's. Per-engine minigame tuning (step 6) needs
  `js/minigames.js`, same rule.
- Vercel: `server/server.js` now exports `handle(req, res)` and only listens when run directly;
  `api/[...path].js` routes every `/api/*` to it; `vercel.json` gives the function 60 s. Static files are
  served by Vercel itself. Project creation through the Vercel MCP failed with 403 (hobby account token
  cannot create projects), so the project has to be imported from the dashboard (repo KernyMC/hacktx,
  production branch `systems`, the six `.env` keys as env vars).
- UI (user request, touches `index.html`): Village no longer shows the home stage on top (it has its own
  150 px scene with names on a label line); quest sheet got a pet speech bubble, a 3-step checklist
  (go / do / prove), and XP / coins / egg tiles that show the real payout with blessing (2x) and curse (1/2)
  badges. Display font is now Silkscreen with Press Start 2P as fallback: Press Start 2P's capital C has
  spurs that close it at 8-12 px, so "Common" read as "Oommon". One-line revert in `--display` if unwanted.
- Follow-up (same day): sprites looked blurry in the village because `drawSheetAtTier` resampled a sheet
  whenever a pet's rarity did not match its species' native resolution (friend "Pip" was a rare dog on a
  20 px sheet) and then blitted at a non-integer scale. Fix in `js/sprites.js`: pxl sheets are always drawn
  at native resolution and at an integer scale (centred, feet on the box floor); the evolution renderer
  also snaps to an integer scale. Friends' seed pets now carry their species' real rarity. Raid bosses
  have their own 24 px sprites (hydra, golem, kraken) drawn in `app.js`. ElevenLabs is back on the client
  side: the quest "Listen" button and chat replies call `/api/speech/say` in the pet's voice preset, no
  browser fallback (quiet when the key/server is missing). Voice-note proofs stay off.
- Demo events panel (settings): eleven buttons fire any showable moment on demand for judging: welcome
  package, friend curse, friend blessing, duel request, egg ready, quest complete + egg, level up, evolution,
  legendary egg, raid boss defeated, and a "full show" that chains level up + evolution + legendary + raid win
  in one reward sequence. `API.demoQuest(opts)` completes the first open quest with the judge skipped and
  forced outcomes; `API.demoEvent(kind)` drops inbox items / readies eggs and raids. Chat typing indicator
  animated. GitHub history: Claude co-author trailers removed from familiars-v2, systems and visuals
  (force-pushed, trees identical); the same rewrite of `richard` is on `richard-clean` because the sandbox
  refuses force-pushing the default branch.
