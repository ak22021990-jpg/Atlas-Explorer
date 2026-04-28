# Atlas Explorer

Atlas Explorer is a browser-based geography arcade game built around three mini-games that test location knowledge across the US and Canada. It is designed as a lightweight training and score-tracking experience with a fast, replayable flow instead of a heavy LMS-style interface.

Players start from a landing page, enter their name, wave code, and trainer name, then move through three levels in sequence. Each level has its own interaction style, scoring logic, and pass condition, while the app tracks stars, badges, streaks, retries, and leaderboard progress.

## What the Game Is About

The project turns geography knowledge into a short challenge run:

- Learn or test US states and Canadian provinces.
- Clear three game modes with at least 70% accuracy in each.
- Earn up to 3 stars per level.
- Unlock badges for performance milestones like perfect rounds, streaks, and full clears.
- Save progress locally, with optional leaderboard and badge sync through Google Apps Script.

This is currently a static front-end app, so it is easy to host on GitHub Pages or any simple web server.

## The Three Games

### 1. Code Drop

Implemented in `js/crack-the-code.js`.

The player sees a state or province name falling down the screen and must type its 2-letter code before it reaches the bottom.

- 20 total questions
- Focuses partly on commonly used locations first
- Rewards speed with bonus points
- Builds streaks for consecutive correct answers

This mode is about quick recall of location abbreviations like `TX`, `CA`, or `ON`.

### 2. Pin Rush

Implemented in `js/pin-it.js`.

The player is shown a live map of North America and must click the correct state or province for the target prompt.

- 15 total map questions
- Uses the SVG map in `maps/north-america.svg`
- Each round is timed
- Correct and incorrect regions are highlighted visually
- Includes a post-round map review mode

This mode is the direct map-recognition challenge.

### 3. City Stack

Implemented in `js/city-sorter.js`.

The player drags city cards into the correct state or province buckets.

- 4 rounds
- 3 buckets per round
- 2 cities per bucket
- Drag-and-drop interaction
- Speed bonus for fast clears

This mode tests whether players can connect major cities to their correct regions.

## Game Flow

Main flow is handled in `js/main.js`.

1. The player starts on `index.html`.
2. A session is created and stored in localStorage.
3. The player progresses through the three mini-games in `game.html`.
4. After each level, the app shows a pass or retry interstitial.
5. At the end, the app shows results, stars, badges, and leaderboard status.

Current behavior in the code:

- Passing threshold is `70%`
- Failed levels can be retried
- Demo mode starts a local manager walkthrough and lets viewers jump to any level without signing up or clearing previous levels
- Score, stars, streak peaks, and attempts are stored in session data
- Final results combine all three games into one run summary

## Scoring, Stars, and Badges

### Scoring

Implemented in `js/scoring.js`.

- Base points are awarded for correct answers
- Some games add speed bonus points
- Passing requires at least `70%` correct

### Stars

- 1 star for a passing round
- 2 stars for `80%+`
- 3 stars for `95%+`

Maximum possible total is `9` stars across all three games.

### Badges

Implemented in `js/badges.js`.

Current badge set includes:

- `First Blood`
- `Perfect Agent`
- `Hot Streak`
- `Globe Trotter`
- `Diamond Agent`
- `Star Collector`
- `Never Quit`
- `Speed Run`

## Tech Stack

Atlas Explorer is intentionally simple and mostly framework-free.

- `HTML5` for page structure
- `CSS3` for layout, theme, animations, and game visuals
- `Vanilla JavaScript (ES Modules)` for gameplay logic
- `JSON` files for state, city, and batch data
- `SVG` for the interactive North America map
- `localStorage` for local session persistence
- `Google Apps Script + Google Sheets` as the optional remote backend
- `Node.js` for running tests

## Project Structure

```text
AMZ/
|- index.html              # Landing page
|- game.html               # Main gameplay shell
|- css/
|  |- styles.css
|  |- geo.css
|  |- retro.css
|- js/
|  |- main.js
|  |- session.js
|  |- scoring.js
|  |- crack-the-code.js
|  |- pin-it.js
|  |- city-sorter.js
|  |- results.js
|  |- badges.js
|  |- leaderboard.js
|  |- flow-ui.js
|  |- ui-effects.js
|- data/
|  |- states.json
|  |- cities.json
|  |- batches.json
|- maps/
|  |- north-america.svg
|- apps-script/
|  |- Code.gs
|- tests/
|  |- test-*.js
```

## Data Files

- `data/states.json`: states and provinces, codes, and region groupings
- `data/cities.json`: city-to-state/province mapping for City Stack
- `data/batches.json`: available batch or wave options
- `maps/north-america.svg`: interactive map used by Pin Rush and map review

## Running Locally

Because the app uses ES modules and fetches local JSON/SVG assets, run it through a local server instead of opening the HTML files directly.

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Testing

Run the automated tests with:

```powershell
npm.cmd test
```

The test suite covers scoring, sessions, results, leaderboard behavior, badges, flow UI helpers, and the individual game modules.

## Optional Google Sheets Backend

The app works without a backend. If no Apps Script URL is configured, scores are stored locally in the browser.

To enable remote leaderboard and badge sync:

1. Create a Google Sheet for score storage.
2. Open Extensions > Apps Script.
3. Paste in `apps-script/Code.gs`.
4. Add your spreadsheet ID where required.
5. Deploy the script as a Web App.
6. Copy the deployed `/exec` URL.
7. Paste that URL into `js/leaderboard.js` as `APPS_SCRIPT_URL`.

## Deployment

Because this is a static app, it can be deployed easily to:

- GitHub Pages
- Netlify
- Vercel static hosting
- Any basic web server

For GitHub Pages, serve the repository root and keep the current folder structure intact.

## Summary

Atlas Explorer is a vanilla JavaScript geography arcade app with three distinct game modes:

- type the right location code
- click the correct place on the map
- sort cities into their home region

It combines simple static-site deployment with game-style progression, scoring, badges, and optional Google Sheets reporting.
