# 3-minute demo (judges)

Before: `npm start` with keys loaded, Settings → "force legendary drop" ON, sound ON, phone on
`http://localhost:8080` (or the deploy). Have a real photo of a nearby place in the gallery.

1. **(0:00)** Egg → the judge taps it 3 times → the axolotl hatches → they name it. 10-step tutorial
   (skip after 2–3 steps: the point is made).
2. **(0:30)** Home: "these three quests are real places within a mile, fetched by SerpApi and written
   by the pet with Gemini". Open one: pixel minimap + "Open in Maps". Accept Leo's pirate curse → the
   text turns pirate and the proof must be a voice note.
3. **(1:00)** Record a 3-second pirate voice note → ElevenLabs transcribes it → Gemini judges it →
   reward sequence: XP, coins, **legendary egg** (shake + confetti).
4. **(1:30)** Second quest with a gallery photo → Gemini accepts it (or rejects a screenshot: showing
   that is good too) → **evolution** with the resolution upgrade.
5. **(2:00)** Nest: hatch the legendary egg → **Texas Longhorn** → make it active: the whole app
   switches to Austin Legends (skyline, bats). Play 5 s of the rodeo.
6. **(2:30)** Shop: free Lucky Capsule pull. Village: curse Leo, join a raid with a key, send a duel.
   "Talk": ask the pet what to do; it answers in its own voice.
7. **(2:55)** Close: "every number you saw came from a real place and a real proof; the pet is just
   the excuse to go outside".

Backup: everything has a local fallback; if wifi dies the demo continues with fixed quests and the
heuristic judge. Never refresh quests in a loop in front of judges (it spends SerpApi credits).
