# 3-minute demo (judges)

**Before**: phone with Pixlings installed from https://hacktx-eight.vercel.app (Add to Home Screen),
`/api/health` all `true`, sound on, Settings > Phone notifications on. A real photo of a nearby place in
the gallery. Fresh state (Settings > Reset) so the judge hatches the egg. Laptop with the deck as backup.

1. **(0:00) Hatch.** The judge taps the egg 3 times, names the axolotl. Skip the tutorial after 2 steps.
2. **(0:25) Real quests (SerpApi + Gemini).** "These three quests are real places near Welch, found by
   SerpApi and written by the pet with Gemini." Open one: speech bubble, real place, minimap, Maps link.
3. **(0:50) Proof.** Upload the gallery photo + a caption → Gemini judges it → reward sequence (XP, coins,
   egg progress). Optional: show a screenshot being rejected.
4. **(1:20) Talk.** Ask the pet "what should I do today?" → typing dots → it answers in its own
   ElevenLabs voice.
5. **(1:40) Village (Meta track).** "Plan something together": Muse reads the whole village's week and
   proposes 3 outings at real places as invitation cards. Send one → a friend notification drops in.
   Story > Village Chronicle: Muse writes the shared chapter, ElevenLabs reads it. "Share as image".
6. **(2:20) The show.** Settings > Demo events > Full show (or one by one: curse, duel, legendary egg,
   evolution). Settings > Time of day > Night to show the habitat change. Play 5 s of a minigame.
7. **(2:50) Close.** "Every quest came from a real place and every reward from a real photo. The pet is
   just the excuse to go outside, together."

**Backup**: every AI call has a fallback (fixed quests, heuristic judge, template plans and chronicle);
if wifi dies the demo continues. Tester account: `?dev=1`. Never refresh quests in a loop in front of
judges (SerpApi credits).
