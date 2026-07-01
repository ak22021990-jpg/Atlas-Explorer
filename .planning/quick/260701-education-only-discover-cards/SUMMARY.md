---
slug: education-only-discover-cards
completed: 2026-07-01
status: complete
---

# Discover Cards: 100% Education Content — Summary

## Result

`app/public/data/states.json` — every region now surfaces only educational content:

- **48 regions:** 3 institution pills each (e.g., MA: Harvard / MIT / Boston University, CA: Stanford / UC Berkeley / Caltech, ON: U of Toronto / McMaster / Queen's).
- **10 regions:** 2 pills (DE, HI, NV, ND, SD, WV, MB, NB, SK, NT).
- **5 sparse regions:** 1 pill (WY, NL, NU, PE, YT).
- **All 63 regions:** 2 trivia facts, both education-focused.

## Highlight matrix

| Region | Pills |
|--------|-------|
| MA | Harvard, MIT, Boston University |
| CA | Stanford, UC Berkeley, Caltech |
| NY | Columbia, Cornell, NYU |
| PA | Penn, Carnegie Mellon, Penn State |
| NC | Duke, UNC-Chapel Hill, NC State |
| TX | UT Austin, Rice, Texas A&M |
| ON | U of Toronto, McMaster, Queen's |
| QC | McGill, UdeM, Laval |
| BC | UBC, SFU, U of Victoria |

## Verification

- `node -e "JSON.parse(...)"` — file parses; 63 regions; pill distribution {3:48, 2:10, 1:5}; trivia always 2 items.
- `npm run build` — clean.
- No consumer of `state.specialties` / `state.trivia` hard-codes removed strings.

## Files touched

- `app/public/data/states.json` (rewritten)
- `.planning/quick/260701-education-only-discover-cards/PLAN.md` (new)
- `.planning/quick/260701-education-only-discover-cards/SUMMARY.md` (this file)
- `.planning/STATE.md` (Quick Tasks Completed table appended)
