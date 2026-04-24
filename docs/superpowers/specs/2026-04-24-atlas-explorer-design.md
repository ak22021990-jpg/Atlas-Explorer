# Atlas Explorer — Design Spec
**Date:** 2026-04-24
**Module:** Atlas Explorer Practice
**Part of:** Geography Fundamentals Training Program
**Duration:** 60 minutes
**Audience:** Recruitment screening agents (India-based, Day 1 onboarding)

---

## 1. Background & Purpose

Recruitment screening agents are hired from India and have limited familiarity with US and Canadian geography. During production, agents screen candidates by matching their location against job posting locations and relocation willingness. Incorrect geography knowledge leads to mis-routing (e.g., rejecting a candidate who lives in the same state as the job, or passing one who clearly cannot commute and has refused to relocate).

Atlas Explorer is a web-based game played after completing the "US & Canada Geography Overview" training module (45 min). It reinforces geography fundamentals through four sequential mini-games, each targeting a distinct knowledge layer. Agents must pass all four to be marked complete for this training step.

---

## 2. Goals

- Agents can decode US state and Canadian province/territory abbreviation codes (TX = Texas, ON = Ontario)
- Agents can locate major US states and Canadian provinces on a map
- Agents can map major cities to their correct state or province
- Agents can classify states and provinces into broad geographic regions
- Agents complete with a score submitted to a shared leaderboard, filtered by batch

---

## 3. Non-Goals

- Metro area groupings (e.g., "Dallas metro includes Plano and Frisco")
- Time zone knowledge
- Interview scheduling or logistics
- Relocation screening decisions (Screen or Pass) — this is Day 1 fundamentals only
- State capitals (not required for screening role)

---

## 4. Architecture

### 4.1 Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| UI / Frontend | HTML + CSS + JavaScript | Google Stitch may be used to scaffold UI if helpful |
| Visual Assets | Canva | Logo, mini-game intro cards, region legend map, star badges, completion certificate |
| Interactive Map | Inline SVG (adapted from public domain Wikipedia SVGs) | Clickable US + Canada map for Pin It! |
| Backend / API | Google Apps Script (deployed as Web App) | Handles score writes and leaderboard reads |
| Database | Google Sheets | One row per agent session |
| Hosting | GitHub Pages | Free, zero-config, shareable URL |

**Framework decision:** Do not migrate this v1 to React/Vite. The experience should remain a bespoke static game built with plain HTML, CSS, and ES-module JavaScript so it is easier to theme, more playful, and simple to host on GitHub Pages without a build step.

### 4.2 Data Flow

```
Agent completes all 4 mini-games
        |
        v
JS collects: name, batch ID, game scores, total score, pass/fail
        |
        v
fetch() POST --> Google Apps Script Web App URL
        |
        v
Apps Script appends row to Google Sheet
        |
        v
Apps Script returns leaderboard JSON (filtered by batch ID)
        |
        v
JS renders leaderboard on results screen
```

### 4.3 Google Sheets Schema

| Column | Field | Example |
|---|---|---|
| A | Timestamp | 2026-04-24 10:32:00 |
| B | Agent Name | Priya Sharma |
| C | Batch ID | APR-2026-01 |
| D | Game 1 Score (Crack the Code) | 160 |
| E | Game 2 Score (Pin It!) | 110 |
| F | Game 3 Score (City Sorter) | 190 |
| G | Game 4 Score (Region Ranger) | 140 |
| H | Total Score | 600 |
| I | Stars Earned (sum of per-game stars, max 12) | 7 |
| J | Pass / Fail | Pass |
| K | Flagged for Trainer Review | No |

**Score on second failure:** If an agent fails a game twice, the higher of the two attempt scores is recorded for that game. The agent is blocked from proceeding; the overall result is recorded as Fail and Flagged = Yes. The trainer must manually unlock the agent for a third attempt outside the game.

---

## 5. User Flow

```
Landing Page (name + batch ID entry via validated dropdown)
        |
        v
Mini-Game 1: Crack the Code
        |
   Pass (>=70%)? --> Mini-Game 2: Pin It!
   Fail? --> One retry allowed
        |
   Pass retry? --> Mini-Game 2: Pin It!
   Fail retry? --> BLOCKED (higher score recorded, Flagged=Yes) --> Results Screen (Fail)
        |
        v
Mini-Game 2: Pin It!
        |
   Pass (>=70%)? --> Mini-Game 3: City Sorter
   Fail? --> One retry --> Fail retry? --> BLOCKED --> Results Screen (Fail)
        |
        v
Mini-Game 3: City Sorter
        |
   Pass (>=70%)? --> Mini-Game 4: Region Ranger
   Fail? --> One retry --> Fail retry? --> BLOCKED --> Results Screen (Fail)
        |
        v
Mini-Game 4: Region Ranger
        |
   Pass (>=70%)? --> Results Screen (Pass)
   Fail? --> One retry --> Fail retry? --> BLOCKED --> Results Screen (Fail)
        |
        v
Results Screen (per-game stars + total score + overall Pass/Fail)
        |
        v
Score submitted to Google Sheets via Apps Script
        |
        v
Leaderboard (filtered by batch ID, shows Flagged status)
        |
        v
Download completion certificate (only if all 4 games passed, no flags)
```

---

## 6. Mini-Game Designs

### 6.1 Mini-Game 1 — Crack the Code

**Knowledge tested:** US state and Canadian province/territory abbreviation codes

**Mechanics:**
- A state/province code is shown in large text (e.g., `BC`)
- Agent selects the correct full name from 4 multiple-choice options
- Wrong answers do not eliminate options — agent sees result and moves on
- Questions are randomized each session

**Configuration:**
- Questions: 20
- Time per question: 60 seconds (auto-advances on timeout, counts as wrong)
- Scope: All 50 US states + 13 Canadian provinces/territories
- Pass threshold: 70% (14/20 correct)

**Scoring:**
- Correct answer: +10 points
- Speed bonus (answered in first 20 seconds): +3 points
- Wrong or timeout: 0 points

**Difficulty progression:** First 10 questions draw from the 20 most common states/provinces in hiring (TX, CA, NY, FL, ON, BC, etc.). Last 10 draw from the full pool.

---

### 6.2 Mini-Game 2 — Pin It!

**Knowledge tested:** Spatial location of US states and Canadian provinces on a map

**Mechanics:**
- A state or province name is shown at the top (e.g., "Click on Alberta")
- Agent clicks the corresponding region on an interactive SVG map of North America
- Correct click: region highlights green briefly, score awarded, next question loads
- Wrong click: region highlights red briefly, correct region flashes green, next question loads
- No multiple choice — pure spatial recall

**Configuration:**
- Questions: 15
- Time per question: 45 seconds
- Pass threshold: 70% — calculated as ceiling(0.70 × question count). For 15 questions: ceiling(10.5) = 11 correct required (73.3% effective threshold)

**Scoring:**
- Correct answer: +10 points
- Speed bonus (answered in first 15 seconds): +3 points
- Wrong or timeout: 0 points

**Difficulty progression:** Starts with large, well-known states (Texas, California, Ontario). Progresses to smaller or less familiar regions (Rhode Island, Prince Edward Island, New Mexico).

**Map:** Inline SVG with each US state and Canadian province as a named clickable path. Source: start from the public domain Wikipedia SVG map of North America (File:Blank US Map.svg + File:Canada blank map.svg) and merge/adapt into a single combined SVG. This avoids hand-drawing all 63 regions from scratch.

**Tooltip rule:** Hover tooltips showing region names are disabled during active gameplay questions to prevent agents from hovering to find the answer.

**Post-game review mode (Pin It! only):** After the Pin It! game ends, a "Review Map" button appears on the Pin It! interstitial results screen in all cases — pass, fail first attempt, or blocked second failure. Clicking it loads the SVG map in a non-scoring explore mode — all regions are labeled on hover and the agent can click any region to see its name. This mode has no timer, no scoring, and is only available for Pin It!. It serves as a learning reinforcement tool. The agent exits review mode by clicking "Continue" to proceed to the next mini-game.

---

### 6.3 Mini-Game 3 — City Sorter

**Knowledge tested:** Mapping major cities to their correct US state or Canadian province

**Mechanics:**
- 3 state/province "bucket" labels are shown on screen
- 6 city cards must be dragged and dropped into the correct bucket
- Wrong drop: card bounces back (no penalty, costs time)
- 4 rounds total; buckets and cities change each round
- Example: Buckets = Texas / Illinois / Florida | Cities = Houston, Chicago, Miami, Dallas, Springfield, Tampa

**Configuration:**
- Rounds: 4 (6 cities per round = 24 total placements)
- Time per round: 90 seconds
- Pass threshold: 70% — calculated as ceiling(0.70 × 24) = ceiling(16.8) = 17 correct required

**Scoring:**
- Correct placement: +10 points
- Speed bonus: +3 points per correct placement, awarded only if the agent completes the round in under 45 seconds. "Completed" means all 6 city cards are resting in their correct buckets simultaneously before the 45-second mark — whether they were placed correctly on first drop or after a bounce-back re-drop does not matter. If any card is still on the table (not yet placed), sitting in a wrong bucket, or currently in-flight (being dragged) when the 45-second mark is reached, no speed bonus is awarded for that round. A card in mid-drag at timer expiry is treated as unplaced.
- Wrong placement: 0 points (card bounces back, agent tries again within time)

**City pool:** 60–80 major US cities and 20–30 major Canadian cities, covering all regions. Randomized across sessions.

---

### 6.4 Mini-Game 4 — Region Ranger

**Knowledge tested:** Classifying US states and Canadian provinces into broad geographic regions

**Regions:**
- US: Northeast, Southeast, Midwest, Southwest, West
- Canada: Eastern Canada, Western Canada

**Mechanics:**
- A state or province name is shown
- Agent selects the correct region from the 7 options
- A static color-coded reference legend map is shown on screen for questions 1–15 (learning aid)
- Legend is hidden for questions 16–20 to test true recall

**Configuration:**
- Questions: 20
- Time per question: 45 seconds
- Pass threshold: 70% (14/20 correct)

**Scoring:**
- Correct answer: +10 points
- Speed bonus (answered in first 15 seconds): +3 points
- Wrong or timeout: 0 points

---

## 7. Scoring & Pass Criteria

### Per-Game Star Rating

| Stars | Criteria |
|---|---|
| 0 stars | Below 70% (failed, including blocked second-failure games) |
| 1 star | 70–79% correct |
| 2 stars | 80–94% correct |
| 3 stars | 95–100% correct |

**Score used for star calculation:**
- If agent passes on first attempt: first attempt score is used
- If agent fails first attempt but passes on retry: retry (passing) score is used
- If agent fails both attempts and is blocked: higher of the two scores is used (results in 0 stars since both attempts are below 70%)

### Overall Pass Criteria

- Agent must score >= 70% on **all 4 mini-games**
- Total score is the sum of all 4 game scores (exact max: 1,027 points — Game 1: 260, Game 2: 195, Game 3: 312, Game 4: 260)
- Stars Earned = sum of per-game star ratings (0–3 stars per game, max 12 total). Per-game stars: 0 stars = below 70% or game not reached (blocked on earlier game), 1 star = 70–79%, 2 stars = 80–94%, 3 stars = 95–100%. Unplayed games (because agent was blocked earlier) contribute 0 — never null or undefined.
- Agents who fail any game get **one retry** of that specific game
- Second failure: agent is **blocked from proceeding**. Higher of the two attempt scores is recorded. Overall result = Fail, Flagged = Yes. Trainer must manually clear the flag for a third attempt.

### Leaderboard

- Filtered by Batch ID — agents only see their cohort's ranking
- Sorted by Total Score descending
- Shows: Rank, Agent Name, Total Score, Stars (out of 12), Pass/Fail, Flagged indicator
- Refreshes after each new submission

---

## 8. Canva Assets Required

| Asset | Description | Format |
|---|---|---|
| Game logo/banner | "Atlas Explorer" branding with map/globe theme | PNG |
| Mini-game intro cards | Splash card for each of the 4 games (title + icon) | PNG x4 |
| Region reference map | Color-coded static map: 5 US regions + 2 Canada regions | PNG |
| Star badge icons | 1-star, 2-star, 3-star achievement icons | PNG x3 |
| Results screen background | Celebratory background for final score screen | PNG |
| Completion certificate | Printable/saveable certificate for agents who pass | PDF + PNG |

---

## 9. Google Apps Script Web App

### Endpoints

**POST /scores**
- Accepts: `{ name, batchId, game1, game2, game3, game4, total, stars, passFail, flagged }`
- Action: Appends row to Google Sheet, returns leaderboard JSON for the batch

**GET /leaderboard?batchId=APR-2026-01**
- Returns: Sorted leaderboard array for the given batch

### Security
- Script deployed as: "Execute as Me, Access to Anyone"
- No sensitive data stored — only names, scores, batch IDs
- Rate limiting not required for batch of 20

### CORS & Cross-Origin Requirements
The game is hosted on GitHub Pages and calls the Apps Script URL cross-origin. Google Apps Script automatically adds `Access-Control-Allow-Origin: *` headers for publicly deployed Web Apps — the developer cannot set these headers manually via `ContentService`. Both `doPost()` and `doGet()` must return responses via `ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON)` for the response body to be readable cross-origin.

```javascript
// Both doPost and doGet must follow this pattern:
return ContentService.createTextOutput(JSON.stringify(result))
  .setMimeType(ContentService.MimeType.JSON);
```

The frontend `fetch()` should use the default `mode` (omit it, or use `'cors'`) — Apps Script's automatic CORS headers make the response body readable. **Test the deployed Apps Script URL directly in the browser and via a simple fetch() call before building the full frontend integration.** Do not assume CORS works without an end-to-end test.

---

## 10. GitHub Repository Structure

```
atlas-explorer/
├── index.html              # Landing page (name entry + batch ID dropdown)
├── game.html               # Main game shell
├── css/
│   └── styles.css
├── js/
│   ├── main.js             # Session init, routing between games
│   ├── crack-the-code.js   # Mini-game 1 logic
│   ├── pin-it.js           # Mini-game 2 logic
│   ├── city-sorter.js      # Mini-game 3 logic
│   ├── region-ranger.js    # Mini-game 4 logic
│   ├── scoring.js          # Shared scoring utilities
│   └── leaderboard.js      # Google Apps Script integration
├── data/
│   ├── states.json         # State/province codes, names, regions, cities
│   ├── cities.json         # City pool with state/province mapping
│   └── batches.json        # Predefined batch ID list for landing page dropdown
├── assets/
│   ├── logo.png            # Canva export
│   ├── intro-crack.png     # Canva export
│   ├── intro-pinit.png     # Canva export
│   ├── intro-sorter.png    # Canva export
│   ├── intro-ranger.png    # Canva export
│   ├── region-map.png      # Canva export
│   ├── star-1.png          # Canva export
│   ├── star-2.png          # Canva export
│   ├── star-3.png          # Canva export
│   └── results-bg.png      # Canva export
├── maps/
│   └── north-america.svg   # Interactive SVG map for Pin It!
├── apps-script/
│   └── Code.gs             # Google Apps Script source
└── README.md
```

---

## 11. Landing Page Input Rules

- **Agent Name:** Free-text field, required, minimum 2 characters
- **Batch ID:** Dropdown (not free text) populated from a predefined list in `data/batches.json`. This prevents typos from silently creating phantom batch entries on the leaderboard. New batches are added to `batches.json` by the trainer before each cohort starts.
- The Start button is disabled until both fields are filled
- No authentication — the game is trust-based; agents self-identify by name

---

## 12. Out of Scope for v1

- Mobile-optimized layout (desktop/laptop first, agents use work machines)
- Admin dashboard for trainers (Google Sheets serves this purpose)
- Multi-language support
- Offline mode
- Timed leaderboard resets per batch (manual sheet management for now)
