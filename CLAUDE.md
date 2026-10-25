# Project: Familiars (HackTX)

A cute 16-bit pixel pet (SNES/GBA era: Stardew Valley, EarthBound, Tamagotchi) that grows when you do real-life quests. Mobile-first web app; graphics are the priority, so keep everything cute, polished and cohesive.

Next.js App Router + React 19 + TypeScript + Tailwind 4 (`cacheComponents` is on). This Next version differs from older docs: read `AGENTS.md` and `node_modules/next/dist/docs/` before using Next APIs.

## Commands
- `npm run dev` starts the dev server at http://localhost:3000
- `npm run build` runs the type check and production build. Must pass before you say you're done.
- `npm run lint` must pass before you say you're done.

## Layout
- `src/app/` holds routes. Pages stay thin and compose components. Dev-only pages live under `src/app/dev/`.
- `src/components/` holds one component per file; shared pixel UI pieces go in `src/components/ui/`.
- `src/game/` holds game logic and art: sprite data and renderer, pets, particles, `sound.ts` (Web Audio).
- `src/styles/` holds the theme (palette, fonts, pixel borders). Changing it affects everyone, so say so in your summary.
- `src/lib/` holds shared helpers. `src/lib/ai.ts` and `src/app/api/` are owned by another teammate: don't touch them.

## How to work
1. Think before coding. State your assumptions. If the request is ambiguous, ask instead of guessing. If there's a simpler way, say so.
2. Simplicity first. Write the minimum code that does the job. No extra features, no abstractions for one-time use, no config options nobody asked for.
3. Surgical changes. Only touch what the task needs. Don't reformat, rename or "clean up" code you weren't asked to touch. If you notice something unrelated that's broken, mention it and leave it alone.
4. Goal-driven. Before you start, write a short plan with a check for each step. You aren't done until build and lint pass.

## Parallel work rules (other agents may be working in this repo at the same time)
- Stay inside the files your task needs. If you have to edit a shared file (`App.tsx`, `types.ts`, `package.json`, `index.css`), keep the edit small and call it out in your summary.
- Don't install new dependencies without asking first.
- Don't commit unless I ask. When I ask, use clear messages (`feat: ...`, `fix: ...`).
- Never push. Never switch branches or touch `main`. The human merges.
- End every task with: files changed, what you didn't do or check, and any risk.
