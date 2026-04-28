# Atlas Explorer UI Brief for Google Stitch

Use this brief to generate a polished UI redesign for **Atlas Explorer**, a browser-based geography game with three mini-games. The output should feel production-ready, visually distinctive, and easy to turn into static HTML/CSS/JS screens.

## Product Summary

Atlas Explorer is a geography arcade experience for US states and Canadian provinces. Players enter their name, wave code, and trainer name, then complete three mini-games in sequence:

1. `Code Drop` — type the 2-letter code for a falling state or province name
2. `Pin Rush` — click the correct state or province on a North America map
3. `City Stack` — drag city cards into the correct state or province bucket

The game tracks:

- score
- progress across 3 levels
- stars per level
- badges
- retries
- leaderboard status

## Design Goal

Create a **high-end, modern geographic game UI** that feels energetic and premium, but not childish and not overly corporate. It should feel like a smart blend of:

- map explorer
- game dashboard
- challenge run

The UI should be much stronger than a plain quiz app. It needs personality, visual hierarchy, and a cohesive system across all screens.

## Visual Direction

Use a **Modern Geographic** aesthetic:

- clean sans-serif typography
- muted terrain-inspired color palette
- off-white paper surfaces
- dark readable text
- subtle cartographic patterns and topographic motifs
- crisp panels and structured layouts

Avoid:

- retro arcade styling
- neon glows
- pixel fonts
- generic startup dashboard look
- flat white app screens with weak contrast

## Core Theme Split

Use two visual modes:

### 1. Landing Page

The landing page should use **brand energy**:

- dark navy / charcoal base
- strong amber or orange call-to-action
- confident, inviting hero presentation
- game-preview framing that makes the app feel exciting immediately

### 2. Gameplay Screens

Once the player starts, switch to a **terrain explorer** look:

- paper-like light surfaces
- olive/slate/ochre accents
- subtle geographic texture
- more focused and readable than the landing page

## Screen List to Design

Design these screens:

1. `Landing / Sign-up`
2. `Game Intro / Level Brief`
3. `Code Drop`
4. `Pin Rush`
5. `City Stack`
6. `Pass Interstitial`
7. `Retry / Fail Interstitial`
8. `Results Summary`
9. `Badge Shelf / Leaderboard section`

## Screen Requirements

### Landing / Sign-up

Build a split or asymmetrical layout with strong visual energy.

Must include:

- title: `Atlas Explorer`
- short subheading that makes it feel like a fast challenge run
- form fields:
  - `Player Tag`
  - `iCube Wave Code`
  - `Name of the Trainer`
- primary CTA: `Start the run`
- readiness row showing:
  - `3 levels`
  - `70% to clear`
  - `9 stars max`
- preview of the three game types
- optional badge shelf preview for returning players

### Game Intro / Level Brief

This is the screen between levels and active gameplay.

Must include:

- current level number out of 3
- game title
- 1 short instruction paragraph
- attempt label
- clear start button
- visual connection to a map or route journey

### Code Drop

This game is about quick typing and reaction speed.

Must include:

- strong gameplay card
- a falling prompt area
- clear input field for the 2-letter code
- progress indicator
- score / streak support area

The feel should be fast, clean, and readable.

### Pin Rush

This game is the map-clicking challenge.

Must include:

- large map-focused layout
- target prompt shown clearly above or over the map
- timer bar
- hover and selection states for regions
- a review-mode variant where the map can be explored after the round

This should be the most map-centric screen in the product.

### City Stack

This is the drag-and-drop sorting challenge.

Must include:

- tray of draggable city cards
- 3 destination buckets visible at once
- clear drop affordances
- timer bar
- satisfying “correct placement” feedback state

This screen should feel organized, tactile, and game-like.

### Pass Interstitial

After a successful round, show:

- strong success headline
- score roll-up
- stars earned
- badges unlocked if any
- CTA for next level or results

It should feel rewarding without becoming flashy or noisy.

### Retry / Fail Interstitial

After an unsuccessful attempt, show:

- clear retry messaging
- attempt history or attempt dots
- supportive, motivating copy
- CTA to retry

This should encourage another run instead of feeling punishing.

### Results Summary

Show the end-of-run overview.

Must include:

- total score
- total stars
- game-by-game breakdown
- pass/fail clarity
- leaderboard preview
- badge shelf

This should feel like a polished mission report.

## Gameplay System Notes

The UI should reflect these mechanics:

- 3 levels total
- each level is scored independently
- passing threshold is `70%`
- up to `3 stars` per level
- total possible stars = `9`
- badges can unlock across the run
- retries exist and attempt history matters

## Per-Game Visual Accents

Give each game its own terrain-inspired accent while keeping the same overall design system:

- `Code Drop` = coastal / water accent
- `Pin Rush` = desert / sand accent
- `City Stack` = forest / valley accent

Use those accents in:

- border highlights
- progress indicators
- section labels
- interstitial states

## Typography

Use **Inter** or a very similar modern sans-serif.

Typography should feel:

- strong
- clean
- legible
- structured

Avoid playful or novelty fonts.

## UI Style Rules

- Prioritize clarity and visual hierarchy
- Use meaningful spacing and panel structure
- Keep interactions obvious
- Make the map screens feel premium and intentional
- Add subtle motion cues and hover states
- Preserve strong desktop layouts while remaining responsive on mobile

## Output Preference

Generate the UI as if it will be implemented in:

- static HTML
- modular CSS
- vanilla JavaScript

Avoid requiring a complex component framework in the design assumptions.

## Important Constraints

- Do not redesign the game mechanics
- Do not remove the 3-game structure
- Do not turn it into a generic admin dashboard
- Do not use retro neon or pixel aesthetics
- Do not make it look like a children’s classroom app

## Best Result

The best outcome is a UI system that makes Atlas Explorer feel like a polished, replayable geography challenge with:

- strong first impression
- distinct game identities
- premium map-driven visual language
- clear progression
- satisfying results and reward states

## Reference Files In This Repo

If additional context is needed, use these source files:

- `README.md`
- `index.html`
- `game.html`
- `js/main.js`
- `js/crack-the-code.js`
- `js/pin-it.js`
- `js/city-sorter.js`
- `docs/superpowers/specs/2026-04-27-atlas-explorer-complete-redesign.md`
