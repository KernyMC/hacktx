# Domain glossary — Familiars

Terms as the code and the UI use them. If you rename something, rename it here too.

| Term | What it is |
|---|---|
| **Familiar / pet** | The pet. Object `{ id, name, species, rarity, shiny, bornAt }`. Everyone hatches as `axolotl`. |
| **Active pet** | The Familiar shown on the stage; it **themes the whole app** (sky, grass, colors). Changed from the Nest. |
| **Species** | One of the 30 animals in `js/animals.js` (`cat`, `longhorn`…). Each species has a fixed rarity, class, minigame and voice. |
| **Rarity / tier** | `common` · `uncommon` · `rare` · `mythic` · `legendary`. Sets the sprite resolution (20/24/32/40/48 px) and minigame difficulty (1–5). `epic` is legacy = `mythic`. |
| **Class** | Habitat: `farm`, `wild`, `prairie`, `water` and the special `legends` (Austin Legends: bat, jackalope, longhorn). Sets scenery and palette. |
| **Quest** | Daily quest (3 per day). Types: `food`, `social`, `outdoor`, `creative`. Comes from SerpApi + Gemini or the fixed pool (`QUEST_POOL`). |
| **Proof** | Evidence for a quest: `photo` (dataURL, downscaled to 1024 px) or `voice` (transcript). Judged by `/api/proof/verify`. |
| **Verdict** | Judge result: `{ ok, message, confidence, reasons, engine }`. `ok` requires `confidence ≥ 0.55`. Rejected = no XP, quest stays open. |
| **Evolution** | The axolotl evolves after `EVOLVE_AT` quests into the animal of the dominant quest type (`Animals.EVOLVE_TO`) and becomes `uncommon`. |
| **Egg** | `{ rarity, progress, needed, shiny, source }`. Incubates with quests or minigame wins. Hatches a species **from its own tier only**. |
| **Shiny** | 1/16 variant with a hue shift (hue-rotate 160°). |
| **Nest** | Screen with eggs + collection + Dex (silhouettes of what is missing). |
| **Curse** | Sent to a friend (10 kinds). Rewrites the quest text and may force the proof type (`proof`). Broken by completing a quest. An inventory item (scroll). |
| **Blessing** | 8 kinds: used on yourself or sent. E.g. `double` (2× XP), `lucky` (guaranteed egg), `rarityup`, `shield` (blocks the next curse). |
| **Inbox** | Incoming messages: `curse`, `bless`, `challenge` (duel) and `note`. |
| **Shop** | Eggs per tier, blessings, curse scrolls and **raid keys**. Currency: coins. |
| **Lucky Capsule / gacha** | Capsule machine: 1 free per day, x1 = 100, x10 = 900. Rates 52/27/14/6/1. Pity: mythic at 20, legendary at 60; x10 guarantees rare+. |
| **Raid** | Boss shared with friends. Joining costs 1–3 keys. Each completed quest deals `0.8 × xp`. Boss down = egg for everyone. |
| **Duel / challenge** | You send your pet's minigame to a friend: they get 3 tries; if they fail all 3 you win coins. Incoming ones arrive in the inbox with 3 tries. |
| **Minigame engine** | `catch`, `hop`, `memory`, `timing`, `whack`, `dodge`, `rodeo` (Longhorn only, hard). `Minigames.open()` returns `{ win, score }`. |
| **Vacation** | Away mode: mood drops 1.5/h, no duel requests arrive, friends on vacation cannot be dueled. Doing a quest ends it. |
| **Mood / hunger** | Bars 0–100. Mood < 35 makes the pet sad (anim `sad`). |
| **Tester account (`#dev`)** | Unlocks all 30 animals, 50k coins, items and one ready egg per tier. Button in Settings or `#dev` in the URL. |
| **Storybook** | Chapter of the day generated from the completed quests (Story screen). |
| **Voice preset** | ElevenLabs voice personality per species: `cute`, `hyper`, `chill`, `grumpy`, `wise`, `regal`, `spooky`, `cowboy`, `dreamy`. |
| **Sheet / manifest** | 4×4 sprite sheet (rows idle/happy/eat/sad, 4 frames) at native resolution; `assets/sprites/manifest.json` gives the cell size. |
