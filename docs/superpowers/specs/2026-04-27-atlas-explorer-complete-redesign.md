# Atlas Explorer — Complete Visual Redesign Spec
**Date:** 2026-04-27
**Status:** Approved for implementation

---

## Overview

Full redesign of all four game screens and the application shell. The arcade/retro theme is replaced with a **Modern Geographic** aesthetic — clean sans-serif typography, muted terrain colors, and a geographic explorer experience. The landing/signup page retains brand colors to establish brand identity before transitioning into the explorer world.

---

## Design Principles

1. **Brand at entry, geography in play** — Brand colors greet users on the landing page; terrain palette takes over once gameplay begins.
2. **Each game is a terrain** — Code Drop, Pin Rush, City Stack, and Zone Sprint each map to a distinct geographic terrain type with its own accent color and background motif.
3. **Calm and readable** — Off-white surfaces, dark high-contrast ink on primary text, muted secondary text. No glow effects, no neon.
4. **CSS-only motifs** — Background terrain patterns are pure CSS (repeating-linear-gradient / radial-gradient). No image assets added.

---

## Color System

### Brand Palette (Landing / Signup — `index.html`)
| Token | Value | Use |
|-------|-------|-----|
| `--amz-dark` | `#232F3E` | Page/card background |
| `--amz-orange` | `#FF9900` | Primary CTA, borders, highlights |
| `--amz-amber` | `#FEBD69` | Secondary accent, metric text |
| `--amz-ink` | `#FFFFFF` | Primary text on dark |
| `--amz-muted` | `#8D9196` | Secondary text |
| `--amz-surface` | `#37475A` | Card/panel surfaces |

### Explorer Palette (Game shell + all 4 games)
| Token | Value | Use |
|-------|-------|-----|
| `--geo-paper` | `#F5F0E8` | Card backgrounds |
| `--geo-ink` | `#2D3B2F` | Primary text (high contrast) |
| `--geo-muted` | `#5A6B5C` | Secondary text, labels |
| `--geo-line` | `#D6CDB8` | Borders, dividers |
| `--geo-surface` | `#FDFAF4` | Page background |

### Per-Game Terrain Accents
Each terrain defines a single `--terrain-accent` CSS custom property. CSS rules throughout the game shell use `var(--terrain-accent)` — no hard-coded terrain hex values in component rules.

| Game | Terrain | `--terrain-accent` value | Background motif |
|------|---------|--------------------------|-----------------|
| Code Drop | Coastal/Water | `#4A7C6F` | Horizontal ripple lines |
| Pin Rush | Desert/Arid | `#C4883A` | Sparse dot grid |
| City Stack | Forest/Valley | `#3D6B3A` | Soft diagonal hatch |
| Zone Sprint | Mountain/Elevation | `#5A6E8C` | Angular chevron ridge lines |

---

## Typography

All text uses **Inter**. The Google Fonts import must include weights 400, 500, 600, 700, and 800:

```
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
```

**Press Start 2P is dropped entirely.** All existing references to `'Press Start 2P'` are replaced with Inter at the appropriate weight.

| Role | Size | Weight | Color |
|------|------|--------|-------|
| Page heading | `clamp(2rem, 4vw, 3rem)` | 800 | `--geo-ink` |
| Game title (h1 in game card) | `clamp(1.4rem, 3vw, 2rem)` | 700 | `--geo-ink` |
| Section heading (h2) | `1.1rem` | 700 | `var(--terrain-accent)` |
| Body / instructions | `1rem` | 400 | `--geo-ink` |
| Label / eyebrow | `0.72rem` | 600 | `var(--terrain-accent)` |
| Button | `0.875rem` | 700 | varies |
| Progress / score | `0.75rem` | 700 | `--geo-ink` |
| Secondary / muted | any | 400 | `--geo-muted` (`#5A6B5C`) |

---

## Terrain Scoping — CSS Architecture

### How `--terrain-accent` is set

`main.js` sets a `data-terrain` attribute on `#game-container` before calling each game's mount function, and resets it when routing away.

```
// in main.js, before mount(container, ...)
const TERRAIN_MAP = { crack: 'water', pin: 'desert', sorter: 'forest', ranger: 'mountain' };
container.dataset.terrain = TERRAIN_MAP[definition.key] ?? '';
```

The CSS then defines `--terrain-accent` per terrain value:

```css
#game-container[data-terrain="water"]    { --terrain-accent: #4A7C6F; }
#game-container[data-terrain="desert"]   { --terrain-accent: #C4883A; }
#game-container[data-terrain="forest"]   { --terrain-accent: #3D6B3A; }
#game-container[data-terrain="mountain"] { --terrain-accent: #5A6E8C; }
```

The `data-terrain` attribute persists across the intro screen, active game, and pass/fail interstitial for that level. It is reset to empty on `route()` before re-rendering.

### Files to change
- **`css/retro.css`** — stripped entirely; replaced by `css/geo.css`
- **`css/styles.css`** — update `:root` CSS custom properties; keep layout grid structure
- **`css/geo.css`** — new file: full design system, terrain scoping, component rules
- **`index.html`** — replace `retro.css` link with `geo.css`; apply brand class to body
- **`game.html`** — replace `retro.css` link with `geo.css`
- **`js/main.js`** — add `data-terrain` attribute assignment before each game mount

### JS changes required
- `main.js`: set `container.dataset.terrain` before calling each mount function (one line addition)
- No changes to individual game files (`crack-the-code.js`, `pin-it.js`, `city-sorter.js`, `region-ranger.js`)

---

## Application Shell

### Game Topbar (`game.html`)
- Background: `--geo-ink` (`#2D3B2F`)
- Bottom border: `3px solid #FF9900` (brand anchor)
- Brand link: white Inter 700
- Player summary: `#FEBD69` amber, 0.75rem, Inter 600

### Hub / Intro Screen (`.hub-panel` in `main.js`)
- Panel: `--geo-paper` background, `--geo-line` border, `4px solid var(--terrain-accent)` border-top
- Map container: `--geo-ink` background, `2px solid var(--terrain-accent)` border
- Hub pins: completed = `var(--terrain-accent)` fill with white number, active = `#FF9900` with pulse, pending = `--geo-line` background
- Mission brief: Inter typography, no pixel font

### Pass Interstitial
- Card border-top: `4px solid var(--terrain-accent)` (inherits current game's terrain)
- "LEVEL CLEARED" heading: `--geo-ink`, Inter 800
- Score rollup number: `clamp(2.5rem, 5vw, 3.5rem)`, Inter 800, `--geo-ink`
- Stars earned: `var(--terrain-accent)` color; unearned: `--geo-line`

### Fail Interstitial
- Card border-top: `4px solid var(--terrain-accent)` (inherits current game's terrain)
- "RUN IT BACK" heading: `--geo-ink`, Inter 800
- Attempt dots: `var(--terrain-accent)` for current attempt, `--geo-line` for prior attempts

### Results Screen
- Panel background: `--geo-paper`, `--geo-line` border, no terrain accent (session is complete)
- Section headings: `--geo-ink`, Inter 700
- Result status rows (pass): `4px left border rgba(61,107,58,0.8)` forest green; (fail): `4px left border rgba(90,110,140,0.8)` slate
- Score values / metrics: Inter 800, `--geo-ink`
- Leaderboard table: `--geo-surface` background, `--geo-line` row borders; current row: `4px solid #FF9900` left border, `rgba(255,153,0,0.06)` background
- Badge shelf: `--geo-paper` card background, `var(--terrain-accent)` → use `#C4883A` (desert/ochre) as the default badge accent since it is session-level, not game-level
- CTA buttons (back / share): primary orange, secondary geo secondary style

---

## Landing / Signup Page (`index.html`)

The entire landing page uses the brand palette.

- **Body background**: `#232F3E`
- **Entry panel**: `#37475A` surface, `3px solid #FF9900` border-top, white text
- **Brand mark**: `#FF9900` background, `#232F3E` text, Inter 900
- **Atlas preview card**: `#1A2535` background, `2px solid #FF9900` border, SVG map with orange tint filter
- **Challenge track cards**: `#37475A` surface, `1px solid rgba(255,153,0,0.3)` border, `#FEBD69` strong text
- **Readiness row**: same surface, `#FEBD69` metric values, Inter 800
- **Primary CTA button**: `#FF9900` background, `#232F3E` text, Inter 700
- **Score preview tiles**: `#2D3D50` background, `#FEBD69` metric values
- **All body/label text**: Inter (no Press Start 2P on this page either)

---

## Game 1: Code Drop (`crack-the-code.js`)

**Terrain:** Coastal/Water — `--terrain-accent: #4A7C6F`

**Falling zone:**
- Background: `#EEF4F2` (pale teal tint)
- Background motif: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(74,124,111,0.09) 40px)`
- Border: `2px solid rgba(74,124,111,0.3)`
- Bottom danger line: `3px solid #C4883A` (ochre/desert contrast — visually signals "danger zone")

**Falling block** (`.falling-block` element):
- Font: Inter 700, `clamp(1.4rem, 2.5vw, 2rem)`, `--geo-ink` color while falling
- Text shadow: none (clean, readable)
- Correct state: color changes to `var(--terrain-accent)` with brief background flash
- Missed state: color changes to `#A64D42` (terracotta), text changes to "Missed — [code]"

**Input field (`#code-input`):**
- Background: white, `2px solid rgba(74,124,111,0.35)` border
- Focus: `2px solid var(--terrain-accent)`
- Text: Inter 700, 2rem, letter-spacing 0.2em, `--geo-ink`
- Correct flash: border-color `var(--terrain-accent)`, brief teal tint background
- Wrong flash: border-color `#A64D42`, shake animation

**Progress badge:** `var(--terrain-accent)` border and text, `--geo-paper` background

---

## Game 2: Pin Rush (`pin-it.js`)

**Terrain:** Desert/Arid — `--terrain-accent: #C4883A`

**Map container:**
- Background: `#FBF5E9` (warm sand)
- Background motif: `radial-gradient(circle, rgba(196,136,58,0.14) 1px, transparent 1px)` at `32px 32px`
- Border: `2px solid rgba(196,136,58,0.35)`

**SVG regions:**
- Default fill: `#E8DCC8` (pale sand), stroke `rgba(196,136,58,0.35)` at 1.5px
- Hover: `#D4B896` fill, stroke `var(--terrain-accent)` at 2px
- Target (pulsing): `rgba(196,136,58,0.35)` fill, `2px solid var(--terrain-accent)`, pulse animation
- Correct hit: `rgba(74,124,111,0.25)` teal fill, `#4A7C6F` stroke
- Wrong hit: `rgba(166,77,66,0.25)` terracotta fill, `#A64D42` stroke

**Question display:**
- Clean card below the map, `--geo-paper` background, Inter 700 ochre label, `--geo-ink` state name

**Timer:** `var(--terrain-accent)` bar fill

---

## Game 3: City Stack (`city-sorter.js`)

**Terrain:** Forest/Valley — `--terrain-accent: #3D6B3A`

**City tray:**
- Background: `#EEF3EC` (pale sage)
- Motif: `repeating-linear-gradient(135deg, rgba(61,107,58,0.06) 0 1px, transparent 1px 12px)`

**City cards:**
- `#FDFAF4` background, `1px solid rgba(61,107,58,0.25)` border, Inter 500
- Hover: `translateY(-2px)`, `border-color: var(--terrain-accent)`, `3px solid var(--terrain-accent)` left accent bar
- Placed correct: `rgba(61,107,58,0.1)` fill, `var(--terrain-accent)` border and text
- Wrong bounce: `rgba(166,77,66,0.1)` fill, `#A64D42` border, shake animation

**Drop buckets:**
- `#F5F3EE` background, `2px dashed rgba(61,107,58,0.3)` border
- Hover: `border-style: solid`, `border-color: var(--terrain-accent)`, `rgba(61,107,58,0.06)` fill
- Column header h2: `var(--terrain-accent)`, Inter 700

**Timer:** `var(--terrain-accent)` bar fill

---

## Game 4: Zone Sprint (`region-ranger.js`)

**Terrain:** Mountain/Elevation — `--terrain-accent: #5A6E8C`

**Question area:**
- Background: `#EEF0F4` (pale slate)
- Motif: `repeating-linear-gradient(60deg, rgba(90,110,140,0.08) 0 1px, transparent 1px 18px)`

**Place name display:**
- Inter 800, `clamp(1.8rem, 4vw, 2.8rem)`, `--geo-ink`, centered, generous vertical padding

**Region buttons:**
- `#FDFAF4` background, `1px solid rgba(90,110,140,0.25)` border, Inter 500
- Hover: `3px solid var(--terrain-accent)` left bar, `translateX(4px)`
- Correct: `rgba(61,107,58,0.12)` fill, `#3D6B3A` border/text
- Wrong: `rgba(166,77,66,0.12)` fill, `#A64D42` border/text

**Timer:** `var(--terrain-accent)` bar fill

---

## Shared Component Rules

### Timer Bar
- Track: `--geo-line` background, no text label inside
- Fill: `var(--terrain-accent)`, no shimmer animation
- Warning (<30%): `#A64D42` (terracotta) fill

### Buttons
- **Primary**: `#FF9900` background, `#232F3E` text, Inter 700, `6px` border-radius
- **Secondary**: `--geo-paper` background, `--geo-ink` text, `1.5px solid var(--geo-line)` border, Inter 600
- **Hover all**: `translateY(-2px)`, subtle shadow `0 4px 12px rgba(0,0,0,0.12)`
- No pixel font on any button

### Eyebrow / Labels
- `--geo-line` border, `var(--terrain-accent)` text, Inter 600, 0.72rem, uppercase, `999px` border-radius pill

### Game Progress Badge
- `--geo-paper` background, `2px solid var(--terrain-accent)` border, `var(--terrain-accent)` text, Inter 700, 0.75rem

### Streak Badge
- `var(--terrain-accent)` background, white text, Inter 700, 0.75rem
- Positioned top-right, slide-in/out animation retained

### Badge Toast
- `--geo-paper` background, `1px solid var(--terrain-accent)` border, `--geo-ink` text, Inter 500

### Star Strip
- Earned stars: `var(--terrain-accent)` color
- Unearned stars: `--geo-line` color

---

## What Does NOT Change

- Game mechanics and scoring logic
- Session / leaderboard / badge data systems
- SVG map structure
- All JS module interfaces (except the one-line `data-terrain` addition in `main.js`)
- Responsive breakpoints (kept at 860px and 1024px)
- `css/styles.css` layout structure (grid columns, spacing, shell widths)
