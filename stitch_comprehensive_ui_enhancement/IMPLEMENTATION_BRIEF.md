# Atlas Explorer — UI Enhancement & Stitching Implementation Brief

## Project Overview

Atlas Explorer is a geography-themed gaming web app with 10 screens covering the full user flow. The screens were built as separate standalone HTML files using Tailwind CSS + Inter font + Material Symbols. They need to be unified into a single cohesive, highly interactive desktop application.

**Target:** Desktop only (no mobile required).  
**Stack:** Single HTML file, Tailwind CDN, vanilla JS, CSS animations, Inter font, Material Symbols.  
**Design System:** See `modern_geographic/DESIGN.md` for full color tokens, typography, spacing, and component specs.

---

## Current Screen Inventory

Each screen lives in its own folder under `stitch_comprehensive_ui_enhancement/` with a `code.html` (source) and `screen.png` (reference screenshot).

| # | Folder | Screen | Purpose |
|---|--------|--------|---------|
| 1 | `landing_sign_up` | Landing / Sign Up | Player tag form, game mode preview (bento grid), orange CTA |
| 2 | `game_intro_level_brief` | Level Brief | Mission brief card, attempt counter, "Begin Descent" button |
| 3 | `code_drop_gameplay` | Code Drop | Type 2-letter state codes as they fall, streak + score HUD |
| 4 | `pin_rush_gameplay` | Pin Rush | Locate states on a map with clues and countdown timer |
| 5 | `city_stack_gameplay` | City Stack | Drag-sort city cards into correct region buckets |
| 6 | `zone_sprint_gameplay` | Zone Sprint | Classify locations by terrain type (compass ring layout) |
| 7 | `pass_interstitial` | Level Cleared | Star rating, score, badge unlock, next/return actions |
| 8 | `retry_fail_interstitial` | Run It Back | Failure screen, attempt dots, retry CTA |
| 9 | `results_summary` | Mission Report | Full score, stars, terrain breakdown, badges, rank |
| 10 | `badge_shelf_leaderboard` | Rankings | Achievement badges + global leaderboard table |

---

## Diagnosed Problems (Why It Feels Disoriented)

### 1. Theme Schizophrenia
- The game intro/level brief uses a light paper background (`#F5F0E8`) while every other screen uses dark navy (`#0e1a28` / `#232f3e`).
- City Stack also has a light `sage-bg` variant.
- This creates jarring visual whiplash between screens.

### 2. Header Inconsistency
- The navbar is implemented differently on nearly every page — sticky vs fixed vs hidden, different class combos, different stat placements.
- Some show full nav links (Map, Archive, Rankings, Profile), others just logo + stats.
- During gameplay it's unclear if the user is "inside" the game or on a menu.

### 3. No Spatial Anchoring
- Each screen is a standalone HTML with its own body styles, backgrounds, and layout logic.
- Moving through them feels like teleporting between 10 different websites.

### 4. Background Chaos
- Topographic textures are all different: SVG data URIs, CSS dot gradients, checkerboard patterns (broken topo on level brief), external Google image URLs.
- No consistent atmospheric layer.

### 5. Zero Interactivity
- Everything is a static mockup.
- No typing, no drag-and-drop, no timers ticking, no score changing, no transitions.

---

## Enhancement Plan

### Architecture: Single-Page App
Stitch all 10 screens into **one HTML file** with JavaScript driving screen transitions via a state machine. Each screen becomes a `<section>` that gets shown/hidden with CSS transitions.

### Visual Unification

**Dark theme throughout.** Unify to the dark navy background (`#0e1a28`) for all screens. The "paper" texture from DESIGN.md should be used *within cards and panels* on the dark background, not as full-page swaps. This keeps the premium map-on-dark-surface feel while retaining the "stacked paper" aesthetic in briefing cards and leaderboard tables.

**One consistent header** that adapts by context:
- **Menu mode** (landing, results, leaderboard): Full nav links — Map, Archive, Rankings, Profile — with Stats display and account/badge icons.
- **Gameplay mode** (brief, all 4 games): Compact HUD — game title, score counter, streak indicator, pause button. No nav links.
- Smooth CSS transition between the two header modes.

**One topographic background pattern** used site-wide as a CSS-generated subtle contour overlay. Per-screen variation via opacity/color tint shifts only — not entirely different patterns.

**Consistent component library:**
- Buttons: Always `rounded-lg` (not mixed), orange CTA `#FF9900`, 2px vertical hover offset per DESIGN.md.
- Stars: Same size and rendering everywhere.
- Score/stats display: Same format and location on every screen.
- Cards/panels: Paper-toned `#F5F0E8` with 1px border at 15% opacity, on the dark background.

### Screen Transitions
- **Landing → Brief:** Slide-up with fade.
- **Brief → Gameplay:** Quick zoom-in effect (entering the mission).
- **Gameplay → Pass/Fail:** Overlay modal with backdrop blur.
- **Pass → Next Brief / Results:** Slide transition.
- **Results → Leaderboard:** Horizontal slide.
- All transitions ~300-400ms, CSS-driven.

### Game Mechanics (High Interactivity)

#### Code Drop
- State/province names fall from top of screen using CSS animation.
- Player types the 2-letter code in the input field.
- Correct → green flash, score increment, streak +1, next word drops.
- Wrong → red shake, streak resets.
- Progress bar fills as words are completed.
- Timer counts down from 60s.
- Data: Array of ~30 state/province objects `{name: "California", code: "CA"}`.

#### Pin Rush
- SVG map of North America with clickable state/province regions.
- Target state name displayed prominently.
- Player clicks the correct region on the map.
- Clue cards reveal progressively (3 clues per target).
- Timer counts down per question.
- Correct click → region highlights orange, score awarded based on time remaining and clues used.
- Wrong click → region flashes red, hint penalty.

#### City Stack
- City cards in a horizontal tray at the bottom.
- Region buckets (3 columns) at the top as drop targets.
- Drag a city card and drop it into the correct region.
- Correct → card slots into the bucket with a check animation, counter updates.
- Wrong → card bounces back to tray, brief red flash.
- Timer bar at top depletes.

#### Zone Sprint
- Location name displayed in the center compass circle (e.g., "Denver, CO").
- Four terrain options (Mountain, Plateau, Plain, Coast) at compass points.
- Player clicks the correct terrain type.
- Correct → option lights up orange with checkmark, auto-advances after 1s.
- Wrong → option flashes red, brief shake.
- Streak counter at bottom-left, auto-advance toggle at bottom-right.
- Timer bar at top.

### Score System
- Running score across all 4 games.
- Star calculation: 3 stars per game (12 total), based on accuracy and time thresholds.
- Badge unlocks triggered by specific achievements (e.g., "Cartographer" for completing all Pin Rush without hints).
- Final score, stars, and badges carry through to Results and Leaderboard screens.

### Pass/Fail Logic
- Each game has a pass threshold (70% accuracy, per the landing screen).
- Pass → "Level Cleared" interstitial with stars and score.
- Fail → "Run It Back" interstitial with attempt counter and retry option.
- After all 4 games pass → Mission Report (results summary).

---

## Required Assets

Before implementation, download and place these in the project folder:

### 1. North America SVG Map (CRITICAL for Pin Rush)
- A clean, flat vector map of North America with US states and Canadian provinces as **separate clickable SVG paths**.
- Sources: MapSVG, amCharts, SimpleMaps (all offer free SVGs).
- Search: "North America SVG map with states provinces clickable"
- Save as: `assets/north-america-map.svg`
- Dark/neutral colors preferred (can be re-colored in code).

### 2. City Photos — 6 images (for City Stack)
- Square-ish photos, ~400x300px, recognizable city shots.
- Download from Canva, Unsplash, or Pexels.
- Cities needed: Miami, Toronto, San Francisco, Los Angeles, Orlando, Vancouver.
- Save as: `assets/city-miami.jpg`, `assets/city-toronto.jpg`, etc.

### 3. Topographic Contour Pattern (OPTIONAL — enhances atmosphere)
- Seamless tileable topographic/contour line SVG or PNG.
- Subtle elevation contour lines like a hiking map.
- Sources: Freepik, SVGBackgrounds.com, Hero Patterns.
- Search: "topographic contour lines seamless pattern SVG"
- Save as: `assets/topo-pattern.svg`
- If not provided, CSS-generated fallback will be used.

### 4. Paper/Parchment Texture (OPTIONAL — enhances cards)
- Light, tileable texture for briefing cards and leaderboard panels.
- Old map paper / parchment feel.
- Sources: Subtle Patterns, Transparent Textures.
- Search: "subtle paper texture seamless tileable"
- Save as: `assets/paper-texture.png`
- If not provided, CSS-generated fallback will be used.

---

## Game Flow Diagram

```
[Landing / Sign Up]
       │
       ▼
[Level Brief: Code Drop]  ──→  [Code Drop Gameplay]  ──→  [Pass] or [Fail → Retry]
       │
       ▼
[Level Brief: Pin Rush]   ──→  [Pin Rush Gameplay]   ──→  [Pass] or [Fail → Retry]
       │
       ▼
[Level Brief: City Stack]  ──→  [City Stack Gameplay]  ──→  [Pass] or [Fail → Retry]
       │
       ▼
[Level Brief: Zone Sprint] ──→  [Zone Sprint Gameplay] ──→  [Pass] or [Fail → Retry]
       │
       ▼
[Mission Report / Results Summary]
       │
       ▼
[Rankings & Achievements / Leaderboard]
```

---

## Implementation Order

1. **Scaffold:** Single HTML file with Tailwind config, shared CSS, screen sections, state machine JS.
2. **Header:** Unified adaptive header (menu mode vs gameplay HUD mode).
3. **Landing screen:** Form + bento grid preview with hover effects.
4. **Level Brief screen:** Templated for all 4 games, dark theme, paper-toned brief card.
5. **Code Drop gameplay:** Falling words, keyboard input, scoring, timer.
6. **Pin Rush gameplay:** SVG map interaction, clue system, timer.
7. **City Stack gameplay:** Drag-and-drop cards to buckets, timer.
8. **Zone Sprint gameplay:** Compass ring click interface, streak, auto-advance.
9. **Pass/Fail interstitials:** Modal overlays with star/score display.
10. **Results summary:** Score aggregation, star count, terrain breakdown, badge shelf, rank.
11. **Leaderboard:** Badge grid + global table with user highlight.
12. **Polish:** Screen transitions, animations, sound effects (optional), final QA.

---

## Key Tailwind Config (shared across all screens)

```javascript
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#0e1a28",
                "primary-container": "#232f3e",
                "on-primary": "#ffffff",
                "on-primary-container": "#8a97a9",
                "secondary": "#8a5100",
                "secondary-container": "#fe9800",
                "on-secondary-container": "#643900",
                "tertiary-container": "#432800",
                "on-tertiary-container": "#c48a3b",
                "surface": "#fbf9fa",
                "surface-tint": "#535f70",
                "surface-container": "#f0edee",
                "surface-container-high": "#eae7e9",
                "on-surface": "#1b1b1d",
                "on-surface-variant": "#44474c",
                "outline": "#75777c",
                "outline-variant": "#c5c6cc",
                "inverse-surface": "#303031",
                "inverse-on-surface": "#f3f0f1",
                "error": "#ba1a1a",
                "on-error": "#ffffff",
                // ... (full token set from DESIGN.md)
            },
            fontFamily: { /* Inter for all */ },
            fontSize: { /* h1-display through label-numeric */ },
            borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
            spacing: { unit: "4px", gutter: "24px", margin: "48px", "container-max": "1440px" }
        }
    }
}
```

---

## Notes for Implementer

- Reference the `screen.png` in each folder for visual targets — the enhanced version should look *better* than these but recognizably the same screens.
- The `code.html` files contain the raw Tailwind markup to reuse — extract the structural HTML, discard the inconsistent styling.
- All external Google-hosted image URLs (`lh3.googleusercontent.com`) should be replaced with local assets or CSS-generated alternatives.
- Desktop only — strip all mobile bottom nav bars and responsive breakpoints below `md`.
- The `DESIGN.md` is the source of truth for tokens and visual language. When in doubt, follow it.
