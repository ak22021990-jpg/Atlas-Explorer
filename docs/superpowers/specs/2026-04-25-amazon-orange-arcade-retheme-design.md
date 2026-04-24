# Amazon Orange Arcade — Retheme Design Spec
**Date:** 2026-04-25
**Status:** Approved by user
**Scope:** Full visual retheme of `css/retro.css` — color palette, typography, component styles, animation cleanup, and new free elements

---

## Background

The existing theme (`css/retro.css`) uses a CRT/phosphor arcade aesthetic: black backgrounds, phosphor green text (#33ff00), magenta pixel borders (#ff00ff), neon glows, scanline textures, screen flicker, and pixel fonts throughout. While visually striking, it feels too vibrant and is misaligned with a professional training curriculum context.

**Goal:** Replace with "Amazon Orange Arcade" — a dark navy base using Amazon's brand colors, retaining enough game personality (pixel headings, progress counters, pulse animations, celebratory effects) to feel like a game, while being professional enough for a corporate training platform.

---

## Color Palette

```css
--paper:       #0D1117   /* deepest background */
--surface:     #161D27   /* card background */
--surface2:    #1E2A38   /* elevated card / panel */
--surface3:    #243040   /* hover states */

--ink:         #FFFFFF   /* primary text */
--muted:       #8B95A1   /* secondary text, labels */
--subtle:      #4A5568   /* disabled, placeholder */

--orange:      #FF9900   /* Amazon primary — borders, CTAs, accents */
--orange-dim:  #CC7A00   /* pressed states, drop shadows */
--amber:       #FEBD69   /* scores, stars, metric highlights */
--teal:        #007185   /* Amazon teal — info badges, secondary accents */
--teal-light:  #00A8CC   /* teal hover */

--green:       #1DB954   /* correct answer feedback */
--red:         #E53E3E   /* wrong answer feedback */
--line:        rgba(255,153,0,0.25)   /* subtle panel borders */
--divider:     #FF9900   /* full-weight divider lines (topbar, mobile breakpoints) */

--shadow:      0 4px 20px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)
--orange-glow: 0 0 12px rgba(255,153,0,0.25)
```

**Note:** `--line` is intentionally low-opacity for card borders. Use `--divider` (`#FF9900`) anywhere a full-weight divider is needed (topbar border, mobile `.atlas-stage` bottom border).

### Key Replacements

| Old | New | Role |
|-----|-----|------|
| `#33ff00` phosphor green | `#FFFFFF` | Primary text |
| `#ff00ff` magenta | `#FF9900` Amazon orange | Panel borders, accents |
| `#00ffff` cyan | `#007185` Amazon teal | Info badges, secondary |
| `#ffe600` neon gold | `#FEBD69` Amazon amber | Scores, stars |
| `#03030e` near-black | `#0D1117` deep navy | Background |
| `#06071a` surface | `#161D27` dark navy | Card background |
| `#ff2244` coral | `#E53E3E` | Wrong/error/fail |

---

## Typography

### Fonts

Import line (replaces existing line 7):
```css
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;600&display=swap');
```
`VT323` and `Share Tech Mono` are removed entirely.

- **`Press Start 2P`** — retained for: `h1`, `h2`, `h3`, brand mark "AE", `.btn` labels, `.metric`, `.game-progress`, `.player-summary`, `.attempt-score strong`, `.result-status strong`
- **`Inter`** — body text, `p`, labels, form inputs, `.answer-option`, `.region-btn`, `.city-card`, `.leaderboard-row`, `.review-details`, `.submit-status`, `.form-message`, `.readiness-row span` (body text portions)

### Scale

| Element | Font | Size | Color |
|---------|------|------|-------|
| h1 | Press Start 2P | clamp(1.2rem, 3vw, 2rem) | `#FFFFFF` |
| h2 | Press Start 2P | clamp(0.8rem, 2vw, 1.1rem) | `#FF9900` |
| h3 | Press Start 2P | 0.75rem | `#FEBD69` |
| body / p | Inter 400 | 1rem / 1.125rem | `#8B95A1` |
| strong | Inter 600 | inherit | `#FFFFFF` |
| labels / eyebrow | Inter 500 | 0.75rem uppercase | `#8B95A1` |
| `.attempt-score strong` | Press Start 2P | clamp(2rem, 5vw, 3.5rem) | `#FEBD69` |
| `.result-status strong` | Press Start 2P | clamp(1.2rem, 3vw, 2rem) | `#FEBD69` |
| `.metric` | Press Start 2P | clamp(1.2rem, 3vw, 2rem) | `#FEBD69` |
| `.game-progress` | Press Start 2P | 0.65rem | `#FF9900` |
| `.player-summary` | Press Start 2P | 0.55rem | `#FEBD69` |

---

## Components

### Panels / Cards (`.entry-panel`, `.intro-panel`, `.interstitial-panel`, `.results-panel`, `.game-card`)

- Background: `var(--surface)` (`#161D27`)
- Border: `1px solid rgba(255,153,0,0.25)`
- Top accent: `3px solid #FF9900`
- Border radius: `8px`
- Shadow: `0 4px 20px rgba(0,0,0,0.4)`
- Removed: scanline texture (`background-image: var(--scanline)`), pixel corner decorations (`▮▮▮` `::before`), magenta pixel-offset shadow (`4px 4px 0 #ff00ff`)

### Arcade Card (`.arcade-card`)

Used by Crack-the-Code and dossier views.
- Background: `var(--surface2)` (`#1E2A38`)
- Border: `2px solid #FF9900`
- Box-shadow: `var(--orange-glow)`, `var(--shadow)`
- Border radius: `8px`

### Buttons

| Type | Background | Text | Border | Border-radius |
|------|-----------|------|--------|---------------|
| `.btn` (base) | transparent | `#FF9900` | `2px solid #FF9900` | `6px` |
| `.btn-primary` | `#FF9900` | `#0D1117` | none | `6px` |
| `.btn-secondary` | transparent | `#FF9900` | `2px solid #FF9900` | `6px` |
| `.btn-success` | `#1DB954` | `#FFFFFF` | none | `6px` |
| disabled | 35% opacity | — | — | — |

- Hover: `transform: translateY(-2px)`, `box-shadow: 0 4px 12px rgba(255,153,0,0.3)`
- Active: `transform: translateY(1px)`, shadow reduced
- **`btn-scan` animation is removed from `.btn-primary`** — replaced by the ripple (Free Element #5). `.btn-scan` may be removed entirely from the stylesheet.

### Form Inputs

- Background: `var(--surface2)`
- Border: `1px solid #4A5568`
- Focus: `border-color #FF9900`, `box-shadow: 0 0 0 3px rgba(255,153,0,0.15)`
- Font: Inter 400, `1rem`
- Color: `#FFFFFF`
- Placeholder: `#4A5568`
- Select options: background `var(--surface2)`, color `#FFFFFF`

### Answer Options / Region Buttons (`.answer-option`, `.region-btn`)

- Background: `var(--surface2)`
- Border: `1px solid rgba(255,153,0,0.3)` default
- Font: Inter 400, `1rem`
- Color: `#FFFFFF`
- Hover: `border-color #FF9900`, `border-width 2px`, `translateX(4px)`, `box-shadow: -4px 0 0 #FF9900`
- Correct: `border-left 4px solid #1DB954`, `background rgba(29,185,84,0.1)`, color `#1DB954` + green pulse flash (Free Element #6)
- Wrong: `border-left 4px solid #E53E3E`, `background rgba(229,62,62,0.1)`, color `#E53E3E` + horizontal shake (Free Element #6)

### City Sorter (`.city-card`, `.drop-bucket`)

**`.city-card`:**
- Background: `var(--surface2)`
- Border: `1px solid rgba(255,153,0,0.3)`
- Font: Inter 400, `1rem`
- Color: `#FFFFFF`
- Hover: `border-color #FF9900`, `translateX(3px)`, `box-shadow: -3px 0 0 #FF9900`
- `.city-card.selected`: `border-color #FF9900`, `background rgba(255,153,0,0.08)`, `box-shadow: -3px 0 0 #FF9900`
- `.city-card.placed-correct`: `background rgba(29,185,84,0.08)`, `border-color #1DB954`, color `#1DB954`

**`.drop-bucket`:**
- Border: `2px dashed rgba(255,153,0,0.25)`
- Background: `rgba(255,153,0,0.02)`
- `.drop-bucket.hover`: `border-color #FF9900`, `background rgba(255,153,0,0.06)`
- `.drop-bucket h2`: color `#FF9900`, `border-bottom: 2px solid rgba(255,153,0,0.2)`

### Readiness Row (`.readiness-row`)

- Each `span`: border `2px solid rgba(255,153,0,0.3)`, background transparent, color `#8B95A1`, font Inter
- `strong` metric inside: font Press Start 2P, `1.1rem`, color `#FEBD69`
- Box-shadow: `inset 0 0 16px rgba(255,153,0,0.04)`, `2px 2px 0 rgba(255,153,0,0.15)`

### Review Details (`.review-details`)

Used in Pin-It review layout.
- Background: `var(--surface2)`
- Border: `1px solid rgba(255,153,0,0.3)`
- Font: Inter 400, `1rem`
- Color: `#8B95A1`
- `strong` labels: font Press Start 2P, `0.6rem`, color `#FF9900`

### Notice (`.notice`)

Used for validation errors.
- Background: `rgba(229,62,62,0.08)`
- Border: `2px dashed #E53E3E`
- Color: `#E53E3E`
- Font: Inter 400

### Submit Status (`.submit-status`)

- Font: Inter 400, `1rem`
- Color: `#8B95A1`

### Results Panel Components (`.result-status`, `.result-card`, `.score-preview`)

**`.result-status`** (header bar inside `.results-panel`):
- Background: `var(--surface2)` (replaces hardcoded `#000`)
- Border-bottom: `1px solid rgba(255,153,0,0.2)`
- `.result-status.pass`: `border-left 6px solid #1DB954`, `box-shadow: inset 8px 0 20px rgba(29,185,84,0.06)`
- `.result-status.fail`: `border-left 6px solid #E53E3E`, `box-shadow: inset 8px 0 20px rgba(229,62,62,0.06)`
- `.result-status span`: Inter, `1rem`, color `#8B95A1`
- `.result-status strong`: Press Start 2P, `clamp(1.2rem, 3vw, 2rem)`, color `#FEBD69`

**`.result-card`:**
- Background: `var(--surface2)` (replaces `#000`)
- Border: `1px solid rgba(255,153,0,0.25)`
- Border-radius: `6px`
- `p` label: Press Start 2P, `0.7rem`, color `#FF9900`

**`.score-preview > div`:**
- Background: `var(--surface2)` (replaces `#000`)
- Border: `1px solid rgba(255,153,0,0.2)`
- Border-radius: `6px`

### Game Progress Widget (`.game-progress`)

- Background: `var(--surface2)` (replaces `#000`)
- Border: `2px solid #FF9900`
- Border-radius: `6px`
- Color: `#FF9900`
- Font: Press Start 2P, `0.65rem`

### Atlas Preview — Landing Page (`.atlas-preview`)

The landing page map preview (distinct from the interactive `.atlas-map` in games):
- Border: `3px solid #FF9900`
- Background: `#0D1117`
- Box-shadow: `0 0 0 1px rgba(255,153,0,0.15), 0 0 24px rgba(255,153,0,0.2), inset 0 0 20px rgba(255,153,0,0.04)`
- Radar sweep: `rgba(255,153,0,0.08)` (orange instead of cyan)
- Radar rings: `rgba(255,153,0,0.04)`
- `img` filter: `drop-shadow(0 0 6px rgba(255,153,0,0.4)) brightness(0.9) contrast(1.1)`

### Intro Panel Header Wash (`.intro-panel::before`, `.interstitial-panel::before`)

Update the gradient wash at the top of intro and interstitial panels:
```css
background: linear-gradient(90deg,
  rgba(255,153,0,0.07),
  rgba(254,189,105,0.05),
  rgba(0,113,133,0.04)
);
```
(Replaces old neon teal/gold/coral values.)

### Region Legend (`.legend-pill`, `.region-1` through `.region-7`)

These are game-content color indicators (not UI chrome). The existing dark region colors are intentionally retained as geographic zone identifiers. Only update the shared `.legend-pill` base:
- Border: `1px solid rgba(255,255,255,0.15)` (reduce from `0.2`, slight refinement)
- Font: Inter 500 (replaces Press Start 2P for legibility at small sizes)
- Text-shadow: `1px 1px 0 rgba(0,0,0,0.5)` (unchanged)
- The `.region-1` through `.region-7` background/border-color values are **unchanged** — they represent geographic data, not UI theme.

### Brand Elements (`.brand-mark`, `.brand-link`, `.brand-strip`, `.stage-copy h2`, `.mission-brief`)

**`.brand-mark`:**
- Background: `#FF9900`
- Color: `#0D1117`
- Border: `2px solid rgba(255,153,0,0.5)`
- Box-shadow: `2px 2px 0 rgba(255,153,0,0.4)`, `var(--orange-glow)`

**`.brand-link`:**
- Color: `#FFFFFF`
- Font: Press Start 2P, `0.65rem`

**`.stage-copy h2`:**
- Font: Press Start 2P
- Color: `#FEBD69`
- Text-shadow: `1px 1px 0 rgba(254,189,105,0.3)`

**`.mission-brief p`:**
- Font: Inter, `1.1rem`
- Color: `#8B95A1`

### Layout Containers (`.sorter-layout`, `.bucket-grid`, `.city-tray`, `.action-row`, `.result-actions`, `.section-heading`, `.game-header`)

These are layout-only rules (grid/flex structure, gaps, padding). No color changes needed — they inherit from the updated component styles above. No modifications required.

### Atlas Map (SVG — `.atlas-map`, `.atlas-region`)

- Container border: `2px solid #FF9900`
- Background: `#0D1117`
- `.atlas-region` fill: `#0D1F2D`, stroke: `rgba(255,153,0,0.3)`, stroke-width `1.5`
- Hover: fill `#162D3D`, stroke `#FF9900`, stroke-width `2.5`, `drop-shadow(0 0 4px rgba(255,153,0,0.4))`
- Correct: fill `rgba(29,185,84,0.2)`, stroke `#1DB954`, stroke-width `3`
- Wrong: fill `rgba(229,62,62,0.15)`, stroke `#E53E3E`, stroke-width `3`
- Regions staggered fade-in on mount (Free Element #3)
- Radar sweep color: `rgba(255,153,0,0.06)`

### Game Topbar (`.game-topbar`)

- Background: `#0D1117`
- Border-bottom: `2px solid #FF9900` (uses `--divider`, not `--line`)
- Box-shadow: `0 2px 8px rgba(0,0,0,0.4)`
- `.player-summary`: Press Start 2P, `0.55rem`, color `#FEBD69`
- Removed: HUD scanline `::after`

### Hub Panel (`.hub-panel`, `.hub-map-container`, `.hub-pin`)

- `.hub-panel`: background `var(--surface)`, border `1px solid rgba(255,153,0,0.25)`, border-radius `8px`
- `.hub-map-container`: border `2px solid #FF9900`, background `#0D1117`
- `.hub-pin` (default): background `var(--surface)`, border `2px solid #4A5568`, color `#4A5568`
- `.hub-pin.completed`: background `#1DB954`, border-color `#1DB954`, color `#FFFFFF`
- `.hub-pin.active`: background `#FF9900`, border-color `#FFFFFF`, color `#0D1117`, orange pulse

### Challenge Track (`.challenge-track li`)

- Border: `2px solid rgba(255,153,0,0.25)`, border-top `4px solid` per-card accent (see below)
- Box-shadow: `2px 2px 0 rgba(255,153,0,0.2)`
- Hover: `translateY(-4px)`, `box-shadow: 0 8px 24px rgba(255,153,0,0.15)` (Free Element #11)
- Per-card top border colors:
  - Card 1: `#FF9900` (orange)
  - Card 2: `#FEBD69` (amber)
  - Card 3: `#007185` (teal)
  - Card 4: `#1DB954` (green)
- `.challenge-track strong`: Press Start 2P, color `#FEBD69`
- `.challenge-track small`: Inter, color `#8B95A1`

### Leaderboard

- `.leaderboard-table`: border `1px solid rgba(255,153,0,0.2)`, background `var(--surface)`
- `.leaderboard-row`: font Inter, color `#8B95A1`, border-bottom `1px solid rgba(255,153,0,0.1)`
- Row hover: `background rgba(255,153,0,0.04)`
- `.leaderboard-row.header`: background `rgba(255,153,0,0.08)`, font Press Start 2P `0.45rem`, color `#FEBD69`
- `.leaderboard-row.current`: `border-left 4px solid #FF9900`, color `#FEBD69`, background `rgba(255,153,0,0.06)`

### Interstitial Panel (`.interstitial-panel`)

- `.interstitial-panel.pass`: `border-color #1DB954`, h1 color `#1DB954`
- `.interstitial-panel.fail`: `border-color #E53E3E`, h1 color `#E53E3E`
- Removed: `glitch-text` animation — h1 uses clean `fadeInUp` instead (`translateY(10px) opacity:0` → normal, `0.4s`)
- Pass: confetti burst (Free Element #9), star pop (Free Element #8)

### Eyebrow / Badges (`.eyebrow`, `.intro-meta span`)

- Border: `1px solid #007185`
- Color: `#007185`
- Font: Inter 500, uppercase
- Box-shadow: none (no glow)

### Timer Bar

- Container: background `var(--surface2)`, border `1px solid #4A5568`
- Fill gradient: `linear-gradient(90deg, #007185, #FF9900, #FEBD69)`
- Warning state: background `#E53E3E`
- `::before` TIME label: color `#4A5568`

### Responsive (Mobile `max-width: 860px`)

- `.atlas-stage` bottom border: `4px solid #FF9900` (use `--divider`, not `--line`)
- All other responsive layout rules unchanged (column collapses, padding reductions)

---

## Map Route Dots

Three dots on the atlas preview use `dot-ping`:
- `.dot-west`: background `#FF9900` (orange), box-shadow `var(--orange-glow)`
- `.dot-north`: background `#FEBD69` (amber), box-shadow `0 0 8px rgba(254,189,105,0.5)`
- `.dot-east`: background `#007185` (teal), box-shadow `0 0 8px rgba(0,113,133,0.5)`

---

## Animations: Kept (Toned Down)

| Animation | Change |
|-----------|--------|
| `dot-ping` map waypoints | Orange/amber/teal per dot (see above) |
| `radar-sweep` atlas/hub map | Color: `rgba(255,153,0,0.06)` |
| `pulse-pin` active hub pin | Orange pulse: `rgba(255,153,0,0.3)` ring |
| `brand-pulse` brand mark | `box-shadow: 4px 4px 0 #FF9900, 0 0 8px rgba(255,153,0,0.4)` |
| `screen-on` page entrance | Unchanged |
| `bounce` city card | Unchanged |
| `timer-shimmer` | Unchanged |
| `timer-warning` | Uses `--red` (`#E53E3E`) |

## Animations: Removed

| Animation | Notes |
|-----------|-------|
| `crt-flicker` body | Gone |
| `scan-line-move` body::after | Gone |
| `body::before` CRT vignette | Gone |
| Scanline textures all panels | Gone |
| `glitch-text` interstitial h1 | Replaced by `fadeInUp` |
| `neon-flicker` | Gone |
| `cursor-blink` | Gone |
| `btn-scan` | Gone — replaced by ripple on primary buttons |

---

## Free Elements (New)

### 1. Floating Particles Background
- Location: `body` on `index.html` landing page only (scoped via `.landing-shell` parent)
- 12 `<span class="particle">` elements injected by a small JS snippet in `index.html` on DOMContentLoaded (or equivalent)
- Each: `4–6px` square, `border-radius 50%`, colors cycling through `#FF9900`, `#FEBD69`, `rgba(255,153,0,0.6)`
- Animation: `floatUp` keyframe — `translateY(0)` to `translateY(-100vh)`, each particle has randomised `animation-delay` (0–8s) and `animation-duration` (8–14s)
- Opacity: `0.12–0.18`
- Positioned absolutely, `pointer-events: none`, `z-index: 0`
- CSS class `.particle` in `retro.css`; JS injection in landing page init

### 2. Animated Perspective Grid Underlay
- Location: `.atlas-stage::before`
- Faint orange perpective grid: `repeating-linear-gradient(90deg, rgba(255,153,0,0.05) ...)` + `repeating-linear-gradient(0deg, ...)` with `transform: perspective(400px) rotateX(60deg)`
- Static — no animation
- Replaces current magenta grid

### 3. Map Region Staggered Fade-In
- Location: `.atlas-region` paths in atlas preview and hub map
- CSS: `.atlas-region { opacity: 0; animation: regionFadeIn 0.4s ease-out forwards; }`
- Stagger via `nth-child`: `retro.css` defines delays for indices 1–20 at `0.03s` increments; JS adds `animation-delay` inline for any beyond that
- `@keyframes regionFadeIn`: `opacity: 0` → `opacity: 1`

### 4. Score Counter Roll-Up
- Location: `.attempt-score strong`, `.metric` elements in results and interstitial
- JS utility added to `js/results.js` (and called from game interstitials):
  ```js
  function animateCount(el, target, duration = 600) {
    const start = performance.now();
    const step = ts => {
      const p = Math.min((ts - start) / duration, 1);
      el.textContent = Math.floor(p * target);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  }
  ```
- Called when the interstitial or results panel mounts, passing the numeric score value
- No CSS needed beyond existing element styles

### 5. Button Press Ripple
- Location: `.btn-primary` only
- CSS-only using `::after`:
  ```css
  .btn-primary::after {
    content: "";
    position: absolute;
    inset: 50%;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    transform: scale(0);
    opacity: 1;
  }
  .btn-primary:active::after {
    animation: ripple 0.4s ease-out forwards;
  }
  @keyframes ripple {
    to { inset: -50%; transform: scale(1); opacity: 0; }
  }
  ```
- `btn-scan` is removed entirely; this replaces it on primary buttons

### 6. Correct Answer Flash / Wrong Answer Shake
- CSS classes `.flash-correct` and `.flash-wrong` added to `retro.css`
- `.flash-correct`: `@keyframes correctFlash` — `box-shadow` expands from `0` to `0 0 0 8px rgba(29,185,84,0.4)` then fades, `0.4s`
- `.flash-wrong`: `@keyframes wrongShake` — `translateX(-6px → 6px → -4px → 4px → 0)`, `0.3s`
- Existing JS already handles correct/wrong class toggling on answer options; add `.flash-correct`/`.flash-wrong` alongside existing `.correct`/`.wrong` assignments

### 7. Progress Bar Fill Animation
- Location: `.timer-bar-fill`, and any `[style*="width"]` progress bars
- CSS: `transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1)` on `.timer-bar-fill`
- No JS changes — existing JS already sets `width` inline; the transition takes effect automatically

### 8. Star Pop Sequence
- Location: star rating display in interstitial and results
- The existing stars are rendered as text/emoji characters. A small wrapper is needed: wrap each star character in `<span class="star-pop">` when rendering the star rating in JS (results.js or the interstitial render function)
- CSS:
  ```css
  .star-pop {
    display: inline-block;
    opacity: 0;
    transform: scale(0);
    animation: starPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
  }
  @keyframes starPop {
    to { opacity: 1; transform: scale(1); }
  }
  ```
- Stagger: `animation-delay` set inline per star index (`0s`, `0.15s`, `0.30s`)
- **Note:** This requires wrapping star characters in `<span class="star-pop">` in the JS render — a minimal, targeted markup addition in the render function only, not a structural HTML change

### 9. Confetti Burst on Pass
- Location: `.interstitial-panel.pass`
- JS function `launchConfetti()` called when pass interstitial mounts (in `main.js` `renderAttemptResult` or equivalent)
- Injects ~30 `<span class="confetti-piece">` into the interstitial panel
- Colors: `#FF9900`, `#FEBD69`, `#FFFFFF`, `#007185` — distributed evenly
- Each piece: `4px × 8px`, `position: absolute`, `top: 50%`, `left: 50%`
- CSS `@keyframes confettiBurst`: `translateX(random offset) translateY(-200px) rotate(random deg)`, opacity `1 → 0`, `1.8s forwards`
- Random offsets set inline via JS (`style.setProperty('--dx', ...)`)
- JS removes all pieces after `2s` via `setTimeout`

### 10. Streak Badge
- Location: game card area (inside `.game-card` or `.game-container`)
- JS function `showStreak(n)` — called when `n >= 3` consecutive correct answers within a game
- Injects `<div class="streak-badge">STREAK x{n}</div>` into `.game-container`
- CSS:
  ```css
  .streak-badge {
    position: fixed;
    top: 72px; right: 20px;
    background: #FF9900;
    color: #0D1117;
    font-family: 'Press Start 2P', cursive;
    font-size: 0.6rem;
    padding: 8px 14px;
    border-radius: 6px;
    z-index: 200;
    animation: streakIn 0.3s ease forwards, streakOut 0.3s ease 2s forwards;
  }
  @keyframes streakIn  { from { transform: translateY(-40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes streakOut { from { opacity: 1; } to { opacity: 0; transform: translateY(-40px); } }
  ```
- JS removes the element after `2.4s`
- Streak counter tracked per game session in each game's JS module

### 11. Game Card Hover Lift
- Location: `.challenge-track li`
- CSS: `transition: transform 0.2s ease, box-shadow 0.2s ease`
- Hover: `transform: translateY(-4px)`, `box-shadow: 0 8px 24px rgba(255,153,0,0.15)`

### 12. Page Transition Wipe
- Location: global — fires on every `route()` call in `main.js`
- JS utility `pageWipe()`:
  ```js
  function pageWipe() {
    const bar = document.createElement('div');
    bar.className = 'page-wipe-bar';
    document.body.appendChild(bar);
    setTimeout(() => bar.remove(), 350);
  }
  ```
- Called at the top of `route()` in `main.js`
- CSS:
  ```css
  .page-wipe-bar {
    position: fixed;
    top: 0; left: 0;
    height: 3px;
    width: 0;
    background: #FF9900;
    z-index: 9999;
    animation: wipe 0.3s ease forwards;
  }
  @keyframes wipe {
    from { width: 0; opacity: 1; }
    80%  { width: 100%; opacity: 1; }
    to   { width: 100%; opacity: 0; }
  }
  ```

---

## Implementation Scope

**Primary file:** `css/retro.css` — full rewrite of CSS custom properties, all color/style rules, typography, component styles, animation definitions, and new CSS-only free element styles.

**JS touches (minimal and scoped):**
- `js/main.js` — add `pageWipe()` utility; call it at the start of `route()`; add `showStreak(n)` utility; call from each game's correct-answer handler
- `js/results.js` — add `animateCount()` utility; call on `.metric` and `.attempt-score strong` at mount; call `launchConfetti()` on pass state
- Each game JS (crack-the-code, pin-it, city-sorter, region-ranger) — add `.flash-correct`/`.flash-wrong` class toggles alongside existing `.correct`/`.wrong`; wrap star characters in `<span class="star-pop">` in star render functions; track streak counter and call `showStreak(n)`
- `index.html` — inject 12 `.particle` spans on DOMContentLoaded

**Font import:** Replace line 7 of `retro.css` with the new `Inter` + `Press Start 2P` import (remove `VT323`, `Share Tech Mono`).

---

## Success Criteria

1. No phosphor green, magenta, or neon cyan anywhere in the UI
2. Amazon orange `#FF9900` is the dominant accent color
3. Backgrounds are dark navy (not pure black)
4. Body text uses Inter; headings/scores use Press Start 2P; VT323 is gone
5. No CRT scanlines, flicker, or vignette effects
6. All 12 free elements are present and functional
7. Correct/wrong feedback: green flash + red shake on answer options
8. Score counters roll up on display
9. Stars pop in sequence on results
10. Page transitions use orange wipe
11. `.arcade-card`, `.readiness-row`, `.city-card`, `.drop-bucket`, `.notice`, `.submit-status`, `.review-details` all styled under new theme
12. Mobile breakpoints use `#FF9900` for full-weight divider borders
13. Page loads without visual jarring — smooth professional entry
