---
slug: add-education-institutions
completed: 2026-07-01
status: complete
---

# Add Educational Institutions to Discover North America — Summary

## What changed

`app/public/data/states.json` — all 63 regions (50 US states + 13 Canadian provinces/territories) now surface a famous educational institution in the "Known For" pills and a matching education fact in the "Did you know?" trivia.

- **57 regions:** one specialty was replaced with an institution (e.g., FL: "Space Coast" → "University of Florida").
- **6 regions already had an institution** (CT/Yale, IN/Notre Dame, MD/US Naval Academy, MA/Harvard, NJ/Princeton, NC/Research Triangle) — specialties left untouched; only trivia updated.
- **All 63 regions** had one trivia fact replaced with an institution-focused education fact.

## Institution highlights

| Category | Examples |
|----------|----------|
| Ivy League | Harvard (MA), Yale (CT), Princeton (NJ), Columbia (NY), Penn (PA), Brown (RI), Dartmouth (NH), Cornell-adjacent |
| Elite research | Stanford (CA), MIT-adjacent (MA), UChicago (IL), Johns Hopkins-adjacent (MD), Los Alamos (NM), WashU (MO) |
| Big flagship publics | UCLA/Berkeley-adjacent (CA), UMich (MI), UT Austin (TX), UF (FL), OSU (OH), Wisconsin-Madison (WI) |
| Canadian top-tier | U of Toronto (ON), McGill (QC), UBC (BC), U of Alberta (AB), Dalhousie (NS), McGill area |
| Remote/territorial | Aurora Research Institute (NT), Nunavut Arctic College (NU), Yukon University (YT) |

## Verification

- `node -e "JSON.parse(...)"` — file parses; all 63 regions have `specialties.length===3` and `trivia.length===2`.
- `npm run build` — clean (486 kB main bundle, no TS errors).
- No consumer of `state.specialties` or `state.trivia` hard-codes string values (grepped `StateInfoPanel.tsx`, `InfoCard.tsx`, `region-of-day.ts`, `TrainingCompletePage.tsx`, `PassInterstitial.tsx`).

## Correction noted

User's Harvard/NY example was factually inaccurate (Harvard's main campus is in Cambridge, MA — there is no "major NY branch"). Confirmed with user before writing content. All institution facts in the file are factually accurate.

## Files touched

- `app/public/data/states.json` (rewritten)
- `.planning/quick/260701-add-education-institutions/PLAN.md` (new)
- `.planning/quick/260701-add-education-institutions/SUMMARY.md` (this file)
- `.planning/STATE.md` (Quick Tasks Completed table appended)
