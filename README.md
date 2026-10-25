# Familiars

Cute 16-bit pet you raise by doing real-world quests. HackTX 2026.

```
copy .env.example .env      # (Windows)  or: cp .env.example .env
# fill ELEVENLABS_API_KEY and GEMINI_API_KEY
npm start                   # http://localhost:8080
```

No dependencies, Node 18+. Without the server (any static host) the game still runs fully mocked.

- `index.html` — markup + styles
- `js/animals.js` — 30 animals, rasterized at a resolution that grows with rarity
- `js/sprites.js` — rendering entry point (eggs, legacy procedural, optional sheets)
- `js/minigames.js` — 7 minigame engines (rodeo = legendary)
- `js/audio.js` — WebAudio chiptune SFX
- `js/mockApi.js` — game state + API contract (calls the server's AI routes, falls back to mocks)
- `js/app.js` — screens and flows
- `server/server.js` — static server + Gemini proof judge + ElevenLabs speech
- `CLAUDE.md` / `SPECS.md` — context and spec
