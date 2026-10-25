# 0006 — Muse (Meta Model API) for the social features, through Chat Completions

**Status**: accepted (2026-10-25)

## Context

The Meta track rewards using Meta's models to bring people together. We already use Gemini for vision
(proof judging), quest writing and chat. The Meta Model API offers Muse Spark through an
OpenAI-compatible Chat Completions surface.

## Decision

- Muse owns the two **group** features: the village planner (`POST /api/village/plan`, 3 outings at real
  SerpApi places for the friends who are available) and the Village Chronicle (`POST /api/village/chronicle`).
  Gemini keeps the single-player features. One provider per job keeps prompts and fallbacks simple.
- Plain `fetch` to `${MUSE_BASE_URL}/chat/completions` (no SDK, zero-dependency rule), key `MODEL_API_KEY`.
- `max_tokens: 6000` and `reasoning_effort: 'low'`: Muse Spark reasons first and the reasoning counts
  against the budget (900 tokens produced empty answers). `response_format: json_object`, retried
  without the extras on a 400/422. Tolerant JSON parsing (fences, prose around the object).
- Template fallback on a missing key or any failure; the failure reason is returned so the card can show it.

## Consequences

Two AI providers to keep keys for. Places in plans must still come from the list we send (prompted and
validated), never invented. If the endpoint or model name changes, only `MUSE_BASE_URL` / `MUSE_MODEL` move.
