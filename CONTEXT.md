# Domain glossary — Pixlings

Terms as the code and the UI use them. If you rename something, rename it here too.
The game was called "Familiars" until Oct 25; code identifiers and storage keys still use that word.

| Term | What it is |
|---|---|
| **Pixling / pet** | The pet. Object `{ id, name, species, rarity, stage, shiny, bornAt }`. The first egg hatches a random common animal (`API.rollStarter()`). |
| **Active pet** | The Pixling on the stage. It themes the app (habitat, colours, tab-bar glyphs). Changed from the Nest. |
| **Species** | One of the 33 animals in `js/animals.js`. Fixed rarity, minigame engine and voice preset. |
| **Rarity / tier** | `common` · `uncommon` · `rare` · `mythic` · `legendary`. Sets the sprite resolution (20/24/32/40/48 px). `epic` is legacy = `mythic`. |
| **Stage** | `1` or `2`. Evolution moves the same species to stage 2: crown, richer palette, one rarity tier up. |
| **Habitat / phase** | Per-animal background scene; phase `dawn`/`day`/`sunset`/`night` from the clock or `Sprites.setPhaseOverride()`. |
| **Quest** | Daily quest (3 per day). Types: `food`, `social`, `outdoor`, `creative`. From SerpApi + Gemini, or `QUEST_POOL` offline. |
| **Proof** | Photo (dataURL) plus a caption. Judged by `/api/proof/verify`. Voice proofs exist server-side but are off in the UI. |
| **Verdict** | `{ ok, message, confidence, reasons, engine }`. `ok` requires `confidence ≥ 0.55`. Rejected = no XP. |
| **Egg** | `{ rarity, progress, needed, shiny, source }`. Only real quests incubate it; `needed = 2 + eggs already in the nest`. |
| **Streak** | Consecutive days with at least one completed quest (`S.streak`, `S.lastQuestDay`). |
| **Curse** | Sent to a friend. Rewrites their quest text and sets a caption rule (pirate, rhyme, whisper…) Gemini checks. Broken by a quest. |
| **Blessing** | Used on yourself or sent: `double` (2x XP), `coinrain` (2x coins), `lucky` (sure egg), `rarityup`, `shield`, `incubate`. |
| **Inbox** | Incoming `gift`, `curse`, `bless`, `challenge` (duel) and `note`. Every new item also becomes a notification. |
| **Notification / feed** | Phone-style banner from `API.pollActivity()`: inbox items + simulated friend activity. History under the bell (`S.feed`). |
| **Plan** | A group outing proposed by Muse: `{ title, place, when, who, why, type, pitch }`. "Send to the village" stores it in `S.plans`. |
| **Village Chronicle** | Muse's shared weekly story of the whole village (`S.chronicle`, refreshed every 6 h or on demand). |
| **Raid** | Boss shared with friends (hydra, golem, kraken). Joining costs keys. Each quest deals `0.8 × xp`. Boss down = egg for everyone. |
| **Duel / challenge** | Your pet's minigame sent to a friend: 3 tries; fail all 3 and you win coins. Incoming ones arrive in the inbox. |
| **Minigame engine** | 17 engines (`catch`, `hop`, `memory`, `timing`, `whack`, `dodge`, `rodeo`, `dig`, `fly`, `swim`, `stack`, `sneak`, `roll`, `herd`, `pads`, `fishing`, `trail`). Skins per species in `SKINS`. |
| **Difficulty** | `Minigames.difficultyFor(species, { rarity, duel })`: the engine's base (1–5) +1 for rare+ pets, +1 in duels. Shown as stars. |
| **Lucky Capsule / gacha** | 1 free pull a day, x1 = 100, x10 = 900. Pity: mythic at 20, legendary at 60; x10 guarantees rare+. |
| **Story card** | The storybook or chronicle rendered as a 1080x1350 PNG for social media ("Share as image"). |
| **Demo events** | Settings panel that fires any moment of the game for judges (`API.demoQuest`, `API.demoEvent`). |
| **Tester account** | `#dev` or `?dev=1`: all 33 animals, 50k coins, items, one ready egg per tier. |
| **Voice preset** | ElevenLabs personality per species: `cute`, `hyper`, `chill`, `grumpy`, `wise`, `regal`, `spooky`, `cowboy`, `dreamy`. |
| **Sheet / manifest** | 4x4 sprite sheet (rows idle/happy/eat/sad) at native resolution; `assets/sprites/manifest.json`. |
| **Engine (in responses)** | Who produced a result: `gemini`, `muse`, `serpapi`, `heuristic`, `template`, `seed`, `mock`. |
