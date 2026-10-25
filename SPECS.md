# Familiars — Product & Technical Spec

> HackTX 2026 · #OnceUponAHack
> Tracks: **Best Overall (Cinderella's Castle)** · **Most Entertaining (Jester's Court)** · **Meta** · **SerpApi** (+ .TECH domain, Gemini fallback)

**One-liner:** A cute 8-bit pet you can only raise by going outside. An AI game master turns real places near you into quests; proof is a photo or a voice note; rewards are XP, random-rarity eggs and evolutions. Your friends' pets live in a shared village where you curse, bless and raid together.

---

## 1. Why this wins

| Judging criterion | How Familiars hits it |
|---|---|
| **Unique vision** | Not a productivity app, not a chatbot. The pet is the *reason* to leave the building. Tamagotchi × Pokémon GO × an AI dungeon master. |
| **Technical complexity** | Real-time places (SerpApi) → LLM quest generation in a character voice (Muse Spark) → multimodal proof verification (Muse Voice Transcribe + vision) → procedural pixel sprites → realtime social layer → generated storybook (Muse Image). |
| **Design** | Consistent pixel-art system, chiptune audio, "juice" on every reward, zero generic UI. |
| **Impact** | Gets people to eat somewhere new, talk to a stranger, walk to a park. Social hooks keep friends accountable. |
| **Entertaining** | Curses between friends, pirate-voice proofs, boss raids, a bedtime story about your day. |
| **Meta: "bring people closer together with AI"** | The social loop *is* the product. Curses/blessings/raids force IRL co-presence. |
| **SerpApi: "meaningful role"** | No SerpApi → no quests. Places, Maps, Events and Reviews feed every quest. |

---

## 2. Core loop

```
Morning   → 3 quests generated from real places nearby (SerpApi + Muse Spark, in the pet's voice)
Do it     → prove with photo or voice note
Judge     → AI game master verifies (Muse Voice Transcribe / Muse Spark vision)
Reward    → XP count-up · coins · egg drop (rarity roll) · maybe evolution · raid damage
Social    → friends see it; curses, blessings, boss raids, village visits
Night     → Storybook chapter of your day (Muse Spark text + Muse Image illustration)
```

**Dopamine design (deliberate):**
- **Variable reward:** egg chance per quest (40–65%), rarity roll 60/30/12/3 → common/rare/epic/legendary.
- **Count-up + sound + confetti** on every XP gain; screen shake on epic/legendary.
- **Evolution cutscene** (flash → flicker → reveal) after the 2nd quest so a judge sees it within 3 minutes.
- **Streak** shown permanently in the top bar.
- **Social pressure:** incoming curse on first launch ("Leo cursed you") so the social layer is felt immediately.

---

## 3. Screens (all built in `index.html` + `js/app.js`)

| Screen | What's on it | State |
|---|---|---|
| **Hatch** (first run) | Egg, 3 taps to crack, name input, "Start the adventure" | ✅ built |
| **Home** | Top bar (name, species, Lv, streak, settings) · animated stage (pet idle/bounce/blink/happy, tap → hearts + squeak + speech bubble) · XP/mood/hunger/coins · inbox banner (curse/bless) · 3 quest cards with type colour, place, distance, XP | ✅ built |
| **Quest sheet** | Pet-voice text · place card (kind, distance, rating, hint) · XP + egg chance · reroll (1/day) · proof tabs: **Photo** (file input w/ camera capture) / **Voice** (hold-to-record, waveform, transcript) · curse badge changes required proof | ✅ built |
| **Judging** | Pet thinking animation, "Game master is judging…" | ✅ built |
| **Reward sequence** | Step 1 verdict + XP count-up · Step 2 level up · Step 3 egg drop with rarity reveal · Step 4 evolution cutscene. One "Next" per step so the presenter controls pacing. | ✅ built |
| **Nest** | Eggs with incubation progress (quests), tap-to-hatch (3 taps), collection grid of all Familiars with rarity | ✅ built |
| **Village** | Lawn canvas with everyone's pets · **Boss raid** card (HP bar, members, join) · friend cards with Curse / Bless / Visit · curse picker (Pirate Voice, Rhyme Time, Hop Hex) | ✅ built |
| **Story** | Tonight's chapter: title, dated, one illustrated page per completed quest + morning/evolution/night pages · Copy · Share | ✅ built |
| **Settings** | Sound toggle · **Demo: force legendary drop** (for judging) · Reset | ✅ built |

Open items for the backend day: real location, real SerpApi quests, real Muse calls, real friends via auth, push notifications for curses.

---

## 4. Sprite system (`js/sprites.js`)

The AI never draws pixels. Image models can't keep a sprite consistent, so every Familiar is **procedural**:

- 16×16 grid of role characters (`b` body, `d` shade, `l` highlight, `a` accent, `e` eye, `w` eye-white, `k` blush, `m` mouth, `o` outline).
- **Palette from one hue** (`makePalette(hue, rarity)`); legendary pets get a gold accent and a shimmering highlight.
- **Species:** `blob` (baby) → evolves to `dragon` (food), `fox` (social), `golem` (outdoor), `owl` (creative) based on the dominant quest type.
- **Hats** (overlay): `crown` (legendary), `wizard` (epic), `bow`/`sprout` (rare), none (common). Each species has a `HAT_ROW` so hats sit between ears/horns.
- **Animations** in the stage: idle bounce, blink every 1.8–4.3 s, `happy` (jump + squash), `eat`, `sad`. Legendary shimmer cycles hue.
- **Eggs:** rarity-coloured, speckled, 3 crack stages.
- API: `Sprites.drawPet(ctx, pet, x, y, px, {blink, t, flip})`, `Sprites.petCanvas(pet, px)`, `Sprites.drawEgg(ctx, rarity, x, y, px, cracks, t)`.

Pet object: `{ id, name, species, hue, rarity, hat, bornAt }` — that's all the backend stores for appearance.

---

## 5. Audio (`js/audio.js`)

All SFX synthesized with WebAudio (square/triangle + noise), no files: `tap, squeak, open, close, accept, xp, reward, legendary, crack, hatch, evolve, curse, bless, hit, error, tick`. `Audio8.play(name)`; auto-unlocks on first gesture. Toggle in settings.

---

## 6. Design system

| Token | Value | Use |
|---|---|---|
| `--sky` / `--sky-2` | `#bfe3ff` / `#eaf6ff` | header & stage |
| `--grass` / `--grass-2` | `#8fd48a` / `#5fb35e` | content ground |
| `--panel` / `--panel-2` | `#fff8ea` / `#ffefcf` | cards |
| `--ink` / `--ink-2` | `#2b2140` / `#6f6386` | outlines, text |
| `--pink` `--gold` `--mint` `--lilac` | `#ff6f9c` `#ffcf4d` `#6fe3b1` `#b79cff` | quest types: food / creative / outdoor / social |
| Rarity | common `#8fd48a` · rare `#5ab0ff` · epic `#b79cff` · legendary `#ffcf4d` | eggs, badges |
| Display font | **Press Start 2P** | headings, numbers |
| Body font | **Pixelify Sans** | everything else |
| Bevel | `3px solid --ink` + `4px 4px 0 --ink` hard shadow | every button/panel; press = translate(2px,2px) |

Rules: no gradients except the sky, no rounded corners, every interactive element has the hard shadow and the press-down, `image-rendering: pixelated` on all canvases, mobile-first at 430 px with a phone frame on desktop.

---

## 7. Data model

```ts
User     { id, name, friends: UserId[] }
Pet      { id, ownerId, name, species: 'blob'|'dragon'|'fox'|'golem'|'owl', hue: 0-360,
           rarity: 'common'|'rare'|'epic'|'legendary', hat: 'none'|'crown'|'bow'|'wizard'|'sprout', bornAt }
Progress { userId, xp, level, streak, coins, mood, hunger, typeCounts: {food,social,outdoor,creative} }
Quest    { id, userId, date, type, title, text, place: Place, xp, eggChance, status: 'open'|'done', rerolled }
Place    { name, kind, dist, rating, hint, lat, lng, serpapi_place_id }
Proof    { questId, type: 'photo'|'voice', url | transcript, verdict: { ok, message }, at }
Egg      { id, userId, rarity, progress, needed }
Curse    { id, from, to, curseId: 'pirate'|'rhyme'|'hop', active, createdAt }
Raid     { id, name, hp, maxHp, members: UserId[], needed, reward, expires }
Chapter  { userId, date, title, pages: [{ scene, text, imageUrl?, xp? }] }
```

---

## 8. API contract (what `js/mockApi.js` mocks)

Every function in `mockApi.js` maps to one endpoint. Keep the names; swap bodies for `fetch`.

| Function | Endpoint | Notes |
|---|---|---|
| `getMe()` | `GET /me` | returns pet + progress + settings + active curse |
| `hatch({name})` | `POST /pet/hatch` | creates blob, generates first quests |
| `getQuests()` | `GET /quests?lat&lng` | 3 quests for today, curse applied to text |
| `rerollQuest(id)` | `POST /quests/:id/reroll` | one per quest |
| `completeQuest(id, proof)` | `POST /quests/:id/complete` | **returns the whole reward bundle:** `{ ok, message, xpGained, blessed, curseLifted, levelUp, level, egg, readyEggs, evolution, raidDamage, reaction, state }` so the UI plays it as one sequence |
| `getZoo()` | `GET /zoo` | eggs + hatched pets |
| `hatchEgg(id)` | `POST /eggs/:id/hatch` | rolls species/hue/hat by rarity |
| `getVillage()` | `GET /village` | friends, raid, inbox, curse catalog |
| `acceptInbox(id)` | `POST /inbox/:id/accept` | applies curse/blessing |
| `sendCurse(friendId, curseId)` | `POST /friends/:id/curse` | costs 5 coins |
| `sendBless(friendId)` | `POST /friends/:id/bless` | |
| `joinRaid()` | `POST /raid/:id/join` | |
| `getStorybook()` | `GET /storybook/today` | |
| `setSettings(patch)` | `PATCH /settings` | |

Suggested stack for the backend day: **Supabase** (Postgres + Auth + Realtime for village/curses) or **Tiger Data** (MLH track) + a thin **Node/Express or Next.js API** route layer calling SerpApi and Meta Muse. Host on **Vultr** (MLH track).

---

## 9. AI integration

### 9.1 Quest generation (SerpApi → Muse Spark)
1. `GET https://serpapi.com/search?engine=google_maps&q=<category>&ll=@lat,lng,15z` for categories `restaurant | cafe | park | museum | event`. Also `engine=google_events` for tonight.
2. Pick 3 places (one per type, prefer rating ≥ 4.3, ≤ 0.8 mi, exclude places already used this week).
3. Prompt Muse Spark:

```
SYSTEM
You are {pet.name}, a {species} Familiar. Personality: {flavor}. You speak in 1–2 short, excited,
slightly chaotic sentences, never more than 40 words. You address the player as "you".
You never invent places; you only use the place given.

USER
Write a quest for the player at this real place:
Place: {place.name} ({place.kind}), {dist} away, rating {rating}, note: "{hint}".
Quest type: {type}  (food = eat/drink something new · social = talk to a stranger ·
outdoor = walk/see something · creative = draw/explain/make)
Give: title (≤6 words), text (your voice, ends with how to prove it: photo or voice note), xp (80–130),
eggChance (0.4–0.65). Return JSON {title, text, xp, eggChance}.
```
If a curse is active, append: `Rewrite the text in {curse.style} (e.g. pirate speak).`

### 9.2 Proof verification
- **Voice:** stream to **Muse Voice Transcribe** → transcript. Then Muse Spark: *"Quest: {text}. Transcript: {t}. Did the player plausibly do it? If a pirate curse is active, is the speech in pirate voice? Reply JSON {ok, message in {pet.name}'s voice, confidence}."*
- **Photo:** Muse Spark (vision) with the place name + kind: *"Does this photo plausibly show {place.kind} '{place.name}' or the activity '{title}'? Be generous but not blind."* Fallback: **Gemini 2.x Flash** vision (MLH Gemini track).
- Threshold: `confidence ≥ 0.55` → ok. Below → `ok:false` with a funny retry message, no XP.

### 9.3 Storybook
- Text: Muse Spark, *"Write tonight's chapter (≤180 words, fairytale tone, 1 paragraph per completed quest, name the real places) for {pet.name} the {species}."*
- Illustration: **Muse Image**, prompt `"pixel art, 16-bit, cute {species} {colour} with {hat} at {place.kind}, pastel, no text"` — one image per chapter (not per sprite; sprites stay procedural).

### 9.4 Muse connector (Meta track bonus)
Expose `getQuests` and `completeQuest` as tools Muse can call, so a user can say "Muse, what's my Familiar's quest?" from the Meta app.

---

## 10. Social mechanics

| Mechanic | Rule |
|---|---|
| **Curse** | Costs 5 coins. Target's next quest text is rewritten in the curse style and the proof must match (pirate voice / rhyme / hopping video). Completing any quest breaks it. 24 h expiry. |
| **Bless** | Free, 1/day per friend. Target's next quest = 2× XP. |
| **Boss raid** | 3 members needed. Every completed quest by a member deals `0.8 × xp` damage. Boss dead → epic egg for all. Expires nightly. |
| **Visit** | Sends a push notification + hearts on their stage. |
| **Village lawn** | All friends' pets rendered on one canvas, realtime updates on evolution/hatch. |

---

## 11. Demo script (3 min, for judges)

1. **(0:00)** Open app → egg. Hand the phone to a judge: *"Tap it."* Crack → blob → they name it.
2. **(0:30)** Home: *"These three quests are real places within half a mile, written by the pet."* Show the incoming curse from Leo. Accept it → quest text turns pirate.
3. **(1:00)** Open the turtle-pond quest. Record a 3-second pirate voice note. Submit → judging → **reward sequence**: verdict, XP count-up, egg drop (switch on *force legendary* in settings beforehand → legendary + shake + confetti).
4. **(1:45)** Second quest with a photo (gallery) → **evolution cutscene** into Dumpling Dragon.
5. **(2:15)** Village: curse Leo back (Hop Hex), join the raid. Story tab: read the chapter aloud, it names the judge's pet.
6. **(2:50)** Close: *"Every number you saw came from a real place and a real proof. The pet is just the excuse."*

Backup: all APIs mocked locally, so the demo never depends on wifi. `familiars.tech` on the screen.

---

## 12. Running the front-end

```
cd familiars
python3 -m http.server 8080     # or any static server
open http://localhost:8080
```
No build step. Files: `index.html` (markup + CSS), `js/sprites.js`, `js/audio.js`, `js/mockApi.js`, `js/app.js`. State persists in `localStorage` under `familiars.v1`; Settings → Reset clears it.

---

## 13. Timeline for what's left

| When | What |
|---|---|
| Now–11:30 pm | Backend skeleton (Supabase schema from §7, `/quests` with real SerpApi + Muse Spark). **Soft submit 11:30 pm.** |
| 12–3 am | `/quests/:id/complete` with Muse Voice Transcribe + vision verdict. Wire `mockApi.js` → `fetch`. |
| 3–6 am | Auth + friends + realtime village; curses via Supabase channel. |
| 6–8 am | Storybook with Muse Image; `familiars.tech`; deploy on Vultr. |
| 8–11:30 am | Demo video, Devpost (tracks: Best Overall, Jester's Court, Meta, SerpApi), rehearse the 3-minute script twice. |

---

## 14. v2 additions (Oct 25)

See `CLAUDE.md` → "UPDATE (Oct 25, v2)" for the full list. Summary of new API functions in `mockApi.js`:

| Function | Endpoint |
|---|---|
| `transcribe(blob)` | `POST /api/speech/transcribe` (ElevenLabs Scribe) — **live** |
| `say(text, voice)` | `POST /api/speech/say` (ElevenLabs TTS) — **live** |
| `completeQuest` → verify | `POST /api/proof/verify` (Gemini via Vertex) — **live** |
| `setActivePet(id)`, `renamePet` | `POST /pets/:id/activate`, `PATCH /pets/:id` |
| `getShop()`, `buy(kind,id,qty)`, `useBlessing(id)` | `GET /shop`, `POST /shop/buy`, `POST /blessings/:id/use` |
| `pullGacha(count, free)` | `POST /gacha/pull` |
| `reportMinigame(petId, win)` | `POST /minigames/result` |
| `sendChallenge(friendId, petId)`, `attemptChallenge(id, win)` | `POST /friends/:id/challenge`, `POST /inbox/:id/attempt` |
| `sendCurse(friendId, curseId)`, `sendBless(friendId, blessingId)` | now consume inventory |
| `joinRaid(id)` | costs raid keys |
| `startVacation(hours)`, `endVacation()` | `POST /vacation`, `DELETE /vacation` |
| `setTutorialDone()` | `PATCH /me` |
| `getQuests(loc)`, `refreshQuests(loc)` | `GET /api/quests?lat&lng` (SerpApi + Gemini) — **live** |
| `chat(message, history)` | `POST /api/chat` (Gemini, pet in character) — **live** |

Rarity is now 5 tiers (common/uncommon/rare/mythic/legendary) and sprite resolution = 20/24/32/40/48 px.
