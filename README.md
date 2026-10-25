# Pixling

## Inspiration
Every app on your phone is built to keep you scrolling. Streaks, notifications, loot boxes, a little red dot that won't go away. We got petty about it and asked: what if we used those same tricks to get you out of the house instead?

## What it does
Pixling gives you a tiny 16-bit pet, inspired by the familiars that followed witches around in old fairytales. It can't grow on its own. The only way to feed it, evolve it, and hatch new friends is to go do real things.

- Daily quests come from real places near you, written in your pet's voice. Think "order the weirdest thing on the menu at the taco truck 200 meters away."
- A photo plus a short caption finishes the quest. Your pet reacts, and you earn coins, XP, and a shot at an egg.
- Eggs come in five rarities, from chunky little commons to detailed legendaries like the Texas Longhorn.
- Friends live in your village. Bless them with double coins, curse them to do their next quest like a pirate, or challenge them to a minigame.

## How we built it
SerpApi pulls nearby restaurants, parks, cafes, and events. Gemini turns those places into quests in your pet's voice, then checks your proof when you finish. Every pet is pixel art we drew ourselves, and each animal comes with its own icons, habitat, and sounds. The background shifts from dawn to night based on your actual clock.

## Challenges we ran into
- Making quests feel like a pet wrote them, not a to-do list.
- Verifying photos without making the app feel like a strict teacher.
- Making each rarity look clearly more detailed than the last while keeping every pet charming.

## Accomplishments that we're proud of
- The egg opening actually gives you the pack-pull rush.
- We used the attention economy's own tricks and pointed them in a completely different direction.
- We had a lot of fun making it!

## What we learned
The loop isn't the problem. Streaks, rewards, and surprise work on everyone. What matters is where they point. Aim them at a screen and you get doomscrolling. Aim them at a taco truck and you get a good Tuesday.

## What's next for Pixling
More pets, more habitats, and more minigames. We want group quests with friends, seasonal events, and quests that adapt to your neighborhood and your schedule. The goal stays the same: more new places, new food, and time with friends.

## How to run it

**You need:** Node.js 18 or newer. No `npm install` needed, the server has no dependencies.

1. Clone the repo and switch to the `systems` branch (the one that is deployed):
   ```bash
   git clone https://github.com/KernyMC/hacktx.git
   cd hacktx
   git switch systems
   ```
2. Add your API keys. Copy `.env.example` to `.env` in the project root (that is the file `server/server.js` reads) and fill in the keys you have:
   ```bash
   cp .env.example .env        # Windows: copy .env.example .env
   ```
   | Key | Turns on |
   |---|---|
   | `SERPAPI_API_KEY` | real nearby places for quests |
   | `GEMINI_API_KEY` | quest writing, photo checking, pet chat |
   | `MODEL_API_KEY` | Meta Muse: group plans and the village chronicle |
   | `ELEVENLABS_API_KEY` | pet voices |

   Every key is optional. Without them the app runs on built-in Austin places and offline fallbacks, so you can try it without signing up for anything.
3. Start the server:
   ```bash
   npm start
   ```
   (or `node server/server.js`)
4. Open http://localhost:8080 (the server prints this URL; change it with `PORT` in `.env`).
   http://localhost:8080/api/health shows which keys were picked up.
   For the phone layout on a laptop, open DevTools and switch to a phone view.
5. Optional: Settings > **Tester account** unlocks every pet (or open `/?dev=1`). Settings > **Time of day**
   sets dawn, day, sunset or night by hand, and Settings > **Demo events** triggers any moment of the game.

**On a phone:** location, installing the app and notifications only work over https, so use the deployed link (https://hacktx-eight.vercel.app) or a tunnel (for example `npx localtunnel --port 8080`) instead of your laptop's local IP. Over the local IP the app runs, but quests fall back to the default Austin location.

## Built with
JavaScript, Node.js, SerpApi (Google Maps), Gemini, Meta Muse, ElevenLabs, Web Audio API, and our own pixel art tool.