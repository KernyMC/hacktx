# 0007 — PWA phone mode, Vercel single function, simulated village activity

**Status**: accepted (2026-10-25)

## Context

Judges will try it on their phones; there is no time for native apps or app-store review. There is also
no multiplayer backend: friends, raids and their activity are simulated in `localStorage`.

## Decision

- Ship as an installable **PWA**: `manifest.webmanifest`, `sw.js` (network first, cache fallback, never
  caches `/api`), full-screen layout under 560 px and in `display-mode: standalone`.
- Deploy on **Vercel** as static files plus **one** function, `api/index.js`, that reuses `handle()` from
  `server/server.js`; `vercel.json` rewrites `/api/*` to it (a catch-all `[...path]` file 404'd on nested
  paths). The same code runs locally with `npm start`.
- Notifications are **simulated** client-side (`API.pollActivity()` every 6 s: inbox items + generated
  friend activity) and shown as in-app banners, or as system notifications through the service worker
  when the app is in the background. No push server.
- Storage keys keep the old name (`familiars.*`) after the rename to Pixlings.

## Consequences

Real multi-device play needs a backend later (pending in `docs/status.md`); the client API in
`js/mockApi.js` is already shaped like the future REST contract. iOS only shows system notifications for
installed PWAs, and install needs HTTPS (Vercel, not the LAN IP).
