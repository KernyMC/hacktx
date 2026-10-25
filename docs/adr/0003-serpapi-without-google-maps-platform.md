# 0003 — Places from SerpApi; no Google Maps Platform; the map is a pixel minimap

**Date**: 2026-10-25
**Status**: Accepted

## Context

Quests must come from real nearby places. The user asked whether to also use the Google Maps API
for the data/map. SerpApi is a hackathon track and "must play a meaningful role".

## Decision

- **SerpApi `google_maps`** is the only source of places (name, type, rating, reviews, coordinates,
  hours, photo, `place_id`). Gemini only writes the text; it never invents places.
- Google Maps Platform is **not** integrated (neither Places nor tiles).
- The quest "map" is a **pixel minimap** on canvas: the player in the centre, the pin at the real
  bearing and distance, a compass, and an "Open in Maps" link built from the `place_id`.

## Why

- Google Maps Platform requires billing, duplicates what SerpApi already returns, and a real map
  breaks the pixel look. It would also dilute SerpApi's role in its track.
- Alternative considered: Leaflet + OpenStreetMap (free, no key). Rejected on aesthetics; it remains
  an option if a navigable map is ever needed.

## Consequence

Each quest load = 3 SerpApi searches (10-min cache per rounded lat/lng). Mind the free plan: do not
refresh quests in test loops; use the fixed pool (`QUEST_POOL`) for QA.
