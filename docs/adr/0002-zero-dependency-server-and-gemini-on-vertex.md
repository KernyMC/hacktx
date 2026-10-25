# 0002 — Zero-dependency Node server; Gemini through Vertex AI express

**Date**: 2026-10-25
**Status**: Accepted

## Context

The front-end was static and mocked. A backend was needed to hold the keys (ElevenLabs, Gemini,
SerpApi) and judge proofs, but the user works on Windows without Python, the team is small and the
deadline is hours away. The Gemini key the user provided is a **Vertex AI express** key (prefix `AQ.`):
`generativelanguage.googleapis.com` answers `API_KEY_SERVICE_BLOCKED`, and on
`aiplatform.googleapis.com` only `gemini-3-flash-preview` exists for that project.

## Decision

- A single `server/server.js` using native `http` + `fetch`, **zero npm dependencies**, serving the
  static files and exposing `/api/*`. `.env` is parsed by hand.
- The server detects the key type by prefix (`AQ.` → Vertex, `AIza` → AI Studio) and picks the
  endpoint and default model; `GEMINI_ENDPOINT`/`GEMINI_MODEL` override it.
- Every AI route has a local fallback (proof heuristics, fixed quests, canned chat lines), and the
  front-end falls back to mocks when the server is absent (e.g. in the artifact).

## Why

- `npm start` and nothing else: any teammate runs it without installing anything. Less surface for
  failure during the demo.
- Vertex was not the original intent (AI Studio was expected), but it is what the key allows;
  swapping keys mid-hackathon was riskier than supporting both.

## Consequence

Do not add packages to the server without discussing it. If the team gets an `AIza` key, changing
`.env` is enough (default model becomes `gemini-2.5-flash`). Vertex responses include `parts` with
`thought: true` that must be filtered (done in `geminiJSON`).
