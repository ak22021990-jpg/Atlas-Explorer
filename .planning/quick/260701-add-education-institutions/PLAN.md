---
slug: add-education-institutions
created: 2026-07-01
status: in-progress
---

# Add Educational Institutions to Discover North America

## Goal

Enrich the "Discover North America" info panel so every state/province card highlights a famous educational institution.

## Scope

Data-only edit to `app/public/data/states.json` (64 regions: 51 US + 13 CA):

1. **"Known For" pills (`specialties`)** — replace one existing specialty per region with a nationally recognized educational institution.
   - Skip regions where an institution already appears in specialties: CT (Yale), IN (Notre Dame), MD (US Naval Academy), MA (Harvard), NJ (Princeton), NC (Research Triangle).
2. **"Did you know" trivia (`trivia`)** — replace one existing fact per region with a factually accurate education-focused fact tied to the institution.

## Institution selection rules

- Prefer Ivy League / R1 / iconic institutions where they exist.
- For regions without a nationally famous university (NT, NU, YT), use notable colleges or research institutes (Aurora Research Institute, Nunavut Arctic College, Yukon University).
- Every institution/fact must be factually accurate — no fabricated affiliations (e.g., "Harvard branch in NY" is wrong; Harvard is in MA).

## Out of scope

- No changes to `StateInfoPanel.tsx` — the existing UI reads `specialties` and `trivia` arrays as-is.
- No changes to game logic that consumes state data.
- No schema changes to `StateEntry` type.

## Verification

- Card renders without layout regressions (specialties still 3 pills, trivia still 2 items).
- Random spot-check of 5 states + 3 provinces confirms institution accuracy.
