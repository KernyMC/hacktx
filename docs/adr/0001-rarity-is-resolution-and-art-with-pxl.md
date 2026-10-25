# 0001 — Rarity sets the sprite resolution; art is generated with pxl

**Date**: 2026-10-25
**Status**: Accepted

## Context

The user asked for "more animals" and that "as they go from common to legendary their resolution gets
better". There were 3 ChatGPT sheets at 80 px (axolotl, cat, dog) and a plan for 20 more PNGs.
Rescaling those sheets to 20–48 px made them blurry and outline-less, and 30 animals × 4 animations
drawn by hand do not fit in a hackathon.

## Decision

- 5 tiers with a fixed resolution: common 20 · uncommon 24 · rare 32 · mythic 40 · legendary 48 px.
  Each species has a fixed rarity (the Longhorn is the only legendary).
- Final art is written as code with **pxl** (`art/animals/<id>.px.js`), under one contract (4×4
  sheet, ink outline, standard `face()`), and packed into `assets/sprites/` + `manifest.json`.
- `js/animals.js` (shapes + rasterizer) stays as the **fallback** for any species without a sheet.

## Why

- For: a rule the player can see ("rarer = sharper"), consistent art across 30 animals, cheap
  iteration (one-line patch and rebuild), `lint` catches pillow shading and orphan pixels.
- Against: code-generated pixel art is less expressive than hand-drawn; mitigated with the standard
  `face()` and a visual review of the full contact sheet.
- Rejected: ChatGPT sheets (inconsistent with each other, single resolution, animations not aligned).

## Consequence

Adding an animal = one `.px.js` + one `def()` in `animals.js` + `pack_sprites`. Do not go back to
`USE_SHEETS` with external PNGs. If hand-drawn art is ever wanted it must follow the same sheet contract.
