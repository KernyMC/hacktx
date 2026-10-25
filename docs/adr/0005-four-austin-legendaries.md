# 0005 — Four Austin legendaries (supersedes "Longhorn is the only legendary" in 0001)

**Date**: 2026-10-25
**Status**: Accepted

## Context

ADR 0001 fixed one legendary, the Texas Longhorn. The user asked for three more legendaries with full art,
an animation and an aura, to make the top tier worth chasing in the demo.

## Decision

- Legendary tier = Longhorn + **Grackle** (great-tailed, the HEB parking-lot bird), **Golden Salamander**
  (Barton Springs, found nowhere else) and **Horned Lizard** (the Texas horny toad). All 48 px pxl art.
- Each has a signature animation (tail flare, tail swish + gill ripple, puff-up with raised horns) and every
  legendary wears a pulsing gold aura (`Sprites.drawPet`, stage 0 of the evolution renderer).
- The rodeo minigame stays Longhorn-only; the new three use existing engines (fly, swim, dig).

## Why

- For: more legendaries make the 1% egg tier a real collection goal; all four stay Austin icons, so the
  "Austin-flavored collection" rule still holds.
- Against: the Longhorn is less unique. It keeps the only rodeo and the UT tie-in.

## Consequence

`Animals.POOL.legendary` has four entries; a legendary egg picks one of them at random.
