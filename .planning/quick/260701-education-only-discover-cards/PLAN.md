---
slug: education-only-discover-cards
created: 2026-07-01
status: complete
---

# Discover Cards: Convert to 100% Education Content

## Goal

Per manager direction, the "Discover North America" info panel must be **entirely education-focused** — no general tourism / geography / culture content in either "Known For" pills or "Did you know?" trivia.

## Scope

Rewrite `app/public/data/states.json` for all 63 regions:

1. **"Known For" pills (`specialties`)** — every entry is a distinct educational institution (university, college, boarding school, national lab, or research institute).
2. **"Did you know?" trivia (`trivia`)** — both facts are about educational institutions or the region's education landscape.

## Sparsity rule

Rather than pad regions with weak institutions, break the "always 3 pills" pattern where genuinely necessary:

- **1 pill:** WY, NL, NU, PE, YT (only one truly notable institution)
- **2 pills:** DE, HI, NV, ND, SD, WV, MB, NB, SK, NT
- **3 pills:** everything else (48 regions)

Trivia stays at 2 items per region (the UI's `useMemo` handles arrays of 2 fine).

## UI compatibility

Verified `StateInfoPanel.tsx` and `InfoCard.tsx` both guard on `specialties.length > 0` and map over the array generically. Variable-length arrays render correctly.

## Out of scope

- No UI changes.
- No schema changes to `StateEntry` type (specialties/trivia are already `string[]`).
- No changes to game logic that samples trivia (e.g., `PassInterstitial`, `TrainingCompletePage`, `region-of-day`).
- Follows on top of prior commit `26f160f` — this fully replaces that pass.

## Verification

- JSON parses, all 63 regions, `trivia.length===2` everywhere, `specialties.length` in [1,3].
- `npm run build` clean.
- No grep hits on removed non-education strings.
