# Scoring, Leaderboard, Badges & Engagement — Design Spec
**Date:** 2026-04-25
**Status:** Approved by user — rev 2 (post spec-review)
**Stack:** Vanilla JS / No-build — GitHub Pages (unchanged)
**Scope:** Retest scoring logic, Google Sheets leaderboard via Apps Script, permanent badge system, engagement additions

---

## Background

Atlas Explorer is a 4-game geography training platform for Amazon agents. The existing Scoring Engine (`calculateStars`, `isPassed`, `percentCorrect`, `requiredCorrect`) and Leaderboard Module (`fetchLeaderboard`, `renderLeaderboard`, `submitScore`) are partially wired. This spec adds:

1. **Retest flow** — unlimited retries (removes existing 2-attempt cap), fresh question shuffle on each fail
2. **Google Sheets leaderboard** via a single Apps Script endpoint
3. **8 permanent badges** stored in Google Sheets, fetched and cached in session
4. **6 engagement additions** — attempt dots, personal best, rank flash, badge chime, retry countdown, progress ring

### Existing function signatures (do not change)
- `isPassed(correctCount, totalCount)` — returns boolean; pass threshold is 70%
- `percentCorrect(correctCount, totalCount)` — returns 0–1 float
- `calculateStars(correctCount, totalCount)` — returns 0–3
- `handleGameComplete(gameIndex, result)` — existing orchestrator, gameIndex is numeric (0–3)
- `session.games` — **array** (not object); indexed by position; each entry is a `normalizeAttempt()` object

---

## Architecture & Data Flow

```
Game ends → onComplete({ correctCount, totalCount, streakPeak, timerRatio })
    │
    ▼
handleGameComplete(gameIndex, result)
    │  computes: ratio = percentCorrect(correctCount, totalCount)
    │            passed = isPassed(correctCount, totalCount)
    │            stars  = calculateStars(correctCount, totalCount)
    │
    ├── PASS ──► recordGameAttempt() ──► evaluateBadges()
    │                │                        │
    │                │                   awardBadge() POSTs per badge (queued)
    │                │                        │
    │                ▼                   fetchBadges() refresh cache
    │           submitScore() POST ──► Apps Script → Players tab
    │                │
    │           fetchLeaderboard() GET ──► Leaderboard tab JSON
    │                │
    │           renderResults() + badge shelf + rank flash
    │
    └── FAIL ──► recordGameAttempt() (unlimited — 2-attempt cap removed)
                      │
                 renderFailInterstitial()
                      ├── attempt dots
                      ├── personal best banner (if score improved)
                      ├── motivational message
                      └── Try Again button (3s countdown)
                               │
                          route() → remount game → pickQuestions() fresh shuffle
```

### Prerequisite: Remove 2-Attempt Cap

In `js/session.js`, `recordGameAttempt()` currently sets `session.blocked = true` after 2 failures and halts. **Remove this cap entirely.** Trainees may retry a game unlimited times. The `blocked` field and related logic in `main.js` that checks `session.blocked` are also removed.

---

## Google Sheets Setup

### Workbook name: `Atlas Explorer`

**Tab 1 — Players** (one row per game attempt)
| A: Timestamp | B: Agent | C: BatchID | D: Game | E: Attempt | F: ScorePct | G: Stars | H: Passed |

- `ScorePct` — float 0–1 (e.g. `0.8`)
- `Stars` — integer 0–3
- `Passed` — **Sheets boolean** (JS must send `true`/`false`, not the string `"true"`)
- `Game` — string key: `"crack-the-code"`, `"pin-it"`, `"city-sorter"`, `"region-ranger"`

**Tab 2 — Badges** (one row per badge per agent, no duplicates)
| A: Timestamp | B: Agent | C: BadgeID | D: BadgeName | E: EarnedOn |

**Tab 3 — Leaderboard** (formula-computed; script reads this tab, does not write it)

Paste these array formulas in row 2 of the Leaderboard tab (one agent per row):
```
A2: =UNIQUE(FILTER(Players!B2:B, Players!B2:B<>""))
B2: =ARRAYFORMULA(SUMIF(Players!B2:B, A2:A, Players!G2:G))   -- Stars (column G, not F)
C2: =ARRAYFORMULA(COUNTIFS(Players!B2:B, A2:A, Players!H2:H, TRUE))
D2: =ARRAYFORMULA(COUNTIF(Badges!B2:B, A2:A))
```
Row 1 headers: `Agent | TotalStars | GamesPassed | BadgeCount`

The Leaderboard tab is read-only by the script. Sorting happens in JS (App Script fetches all rows, sorts by TotalStars desc in memory).

### Apps Script (`Code.gs`) — complete, copy-paste ready

```javascript
const SHEET_ID = 'YOUR_SHEET_ID_HERE'; // paste your Google Sheet ID here

function doGet(e) {
  const action = e.parameter.action;
  const agent  = e.parameter.agent || '';
  if (action === 'fetchLeaderboard') return fetchLeaderboard(agent);
  if (action === 'fetchBadges')      return fetchBadges(agent);
  return jsonResponse({ error: 'unknown action' });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  if (data.action === 'submit')     return submitScore(data);
  if (data.action === 'awardBadge') return awardBadge(data);
  return jsonResponse({ error: 'unknown action' });
}

function submitScore(data) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Players');
  sheet.appendRow([
    new Date().toISOString(),
    data.agent,
    data.batchId,
    data.game,
    data.attempt,      // integer, 1-based
    data.scorePct,     // float 0-1
    data.stars,        // integer 0-3
    data.passed        // boolean true/false — must be JS boolean, not string
  ]);
  return jsonResponse({ ok: true });
}

function awardBadge(data) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Badges');
  const rows  = sheet.getDataRange().getValues();
  const alreadyEarned = rows.some(r => r[1] === data.agent && r[2] === data.badgeId);
  if (alreadyEarned) return jsonResponse({ ok: true, skipped: true });
  sheet.appendRow([
    new Date().toISOString(),
    data.agent,
    data.badgeId,
    data.badgeName,
    new Date().toLocaleDateString()
  ]);
  return jsonResponse({ ok: true, awarded: true });
}

function fetchLeaderboard(currentAgent) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Leaderboard');
  const rows  = sheet.getDataRange().getValues();
  const data  = rows.slice(1)
    .filter(r => r[0])
    .map(r => ({
      agent:       r[0],
      totalStars:  Number(r[1]) || 0,
      gamesPassed: Number(r[2]) || 0,
      badgeCount:  Number(r[3]) || 0
    }));
  data.sort((a, b) => b.totalStars - a.totalStars);
  const top10 = data.slice(0, 10);
  const idx   = data.findIndex(r => r.agent === currentAgent);
  const currentRow = idx >= 0 ? { ...data[idx], rank: idx + 1 } : null;
  return jsonResponse({ top10, currentRow });
}

function fetchBadges(agent) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Badges');
  const rows  = sheet.getDataRange().getValues();
  const badges = rows.slice(1)
    .filter(r => r[1] === agent)
    .map(r => ({ badgeId: r[2], badgeName: r[3], earnedOn: r[4] }));
  return jsonResponse({ badges });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### Deployment Steps (admin, one-time)

1. Create Google Sheet named `Atlas Explorer` — 3 tabs: Players, Badges, Leaderboard
2. Add headers and Leaderboard formulas as above
3. Extensions → Apps Script → paste `Code.gs` → set `SHEET_ID` to the Sheet's ID (from its URL)
4. Deploy → New deployment → Web App → Execute as: **Me** → Access: **Anyone**
5. Copy the `/exec` URL → paste as `APPS_SCRIPT_URL` constant in `js/leaderboard.js`

---

## JS-Side Leaderboard Module Changes (`js/leaderboard.js`)

Add `APPS_SCRIPT_URL` constant and these new exported functions alongside existing ones:

```js
const APPS_SCRIPT_URL = ''; // paste deployed /exec URL here

// Map from session.js GAME_DEFINITIONS short keys to Players tab slug strings
const GAME_SHEET_KEYS = {
  crack:  'crack-the-code',
  pin:    'pin-it',
  sorter: 'city-sorter',
  ranger: 'region-ranger'
};

// POST a per-game-per-attempt score row to Players tab
// Pass game.key (short key) — this function translates to the Sheets slug via GAME_SHEET_KEYS
function submitAttemptScore({ agent, batchId, game, attempt, scorePct, stars, passed }) {
  const gameSlug = GAME_SHEET_KEYS[game] || game;
  if (!isConfigured()) { saveLocalScore({ agent, batchId, game: gameSlug, attempt, scorePct, stars, passed }); return; }
  return fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'submit', agent, batchId, game: gameSlug, attempt, scorePct, stars, passed: Boolean(passed) })
  }).catch(() => saveLocalScore({ agent, batchId, game: gameSlug, attempt, scorePct, stars, passed }));
}

// POST a badge award (Apps Script deduplicates server-side)
function awardBadge(agent, badgeId, badgeName) {
  if (!isConfigured()) return Promise.resolve();
  return fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'awardBadge', agent, badgeId, badgeName })
  }).catch(() => {});
}

// GET badges for agent — seeds session.earnedBadges[] on load
function fetchBadges(agent) {
  if (!isConfigured()) return Promise.resolve([]);
  return fetch(`${APPS_SCRIPT_URL}?action=fetchBadges&agent=${encodeURIComponent(agent)}`)
    .then(r => r.json())
    .then(d => (d.badges || []).map(b => b.badgeId))
    .catch(() => []);
}

// Existing fetchLeaderboard() — change batchId param to agent
// Old: fetchLeaderboard(batchId) — New: fetchLeaderboard(agent)
function fetchLeaderboard(agent) {
  if (!isConfigured()) return Promise.resolve({ top10: getLocalScores(), currentRow: null });
  return fetch(`${APPS_SCRIPT_URL}?action=fetchLeaderboard&agent=${encodeURIComponent(agent)}`)
    .then(r => r.json())
    .catch(() => ({ top10: getLocalScores(), currentRow: null }));
}
```

**Note:** The existing `submitScore(getSubmissionPayload())` all-games-summary call in `results.js` is replaced by per-attempt `submitAttemptScore()` calls in `handleGameComplete()` (one call per attempt, triggered on each pass). The all-games summary path is removed.

---

## Game Module Changes — `onComplete` Payload

Each game's `onComplete` callback must emit:

```js
onComplete({
  correctCount: number,   // how many questions answered correctly
  totalCount:   number,   // total questions in this attempt
  streakPeak:   number,   // highest consecutive-correct run (0 if none)
  timerRatio:   number    // fraction of time remaining at completion (0–1); -1 if no timer
})
```

**Note on `normalizeAttempt()`:** `streakPeak` and `timerRatio` do **not** need to be stored in the attempt object by `normalizeAttempt()`. They are consumed directly from the raw `result` argument inside `handleGameComplete()` in the same call frame — `evaluateBadges(gameIndex, result, ...)` receives the raw `result` and reads `result.streakPeak` and `result.timerRatio` directly. `normalizeAttempt()` does not need to be modified.

**`streakPeak` tracking** — add to each game module:
```js
let streak = 0, streakPeak = 0;
// on each correct answer:
streak++;
if (streak > streakPeak) streakPeak = streak;
// on each wrong answer:
streak = 0;
```
City Sorter operates in drag-and-drop rounds; each correctly placed city counts as one correct answer in sequence for streak purposes.

**`timerRatio` tracking** — add to games that have a timer (Pin It!, City Sorter, Region Ranger):
```js
// when game completes:
timerRatio = timeRemaining / totalTime; // both in same unit (ms or s)
```
Crack the Code has no per-game timer → emit `timerRatio: -1`.

---

## Scoring & Retest Logic

### Session Schema Changes (`session.js`)

Add to each game entry in `session.games[]`:
```js
{
  // existing fields: score, correctCount, totalCount, passed, stars, recordedAt
  attemptNumber: number,      // 1-based count for this game (new field)
  streakPeak:    number,      // highest streak seen across all attempts for this game
  earnedBadges:  string[]     // badge IDs earned during this session (populated by evaluateBadges)
}
```

Add to session root:
```js
{
  // existing fields ...
  earnedBadges:    string[],  // all badge IDs earned this session (union of all games)
  lastKnownRank:   number|null  // persisted in localStorage for rank-up detection
}
```

`session.earnedBadges[]` is seeded from `fetchBadges()` at game shell load (before any game runs). This ensures returning users never see re-award toasts for already-earned badges.

**Initialization in `route()` (game shell load):**
```js
async function initSession(agent) {
  const session = createSession(agent);
  session.earnedBadges = await fetchBadges(agent); // seed from Sheets
  session.lastKnownRank = Number(localStorage.getItem('atlas_rank_' + agent)) || null;
  return session;
}
```

### Retest Flow in `handleGameComplete(gameIndex, result)`

```js
function handleGameComplete(gameIndex, result) {
  const game   = session.games[gameIndex];
  const ratio  = percentCorrect(result.correctCount, result.totalCount);
  const passed = isPassed(result.correctCount, result.totalCount);
  const stars  = calculateStars(result.correctCount, result.totalCount);
  const attemptNumber = game.attempts.length + 1; // computed BEFORE recordGameAttempt appends

  // Track peak streak across attempts (game-level, not per-attempt)
  game.streakPeak = Math.max(game.streakPeak || 0, result.streakPeak);

  // recordGameAttempt is called UNCONDITIONALLY here — before the pass/fail branch.
  // This means game.attempts.length inside evaluateBadges already includes the current attempt.
  // So: attempts.length === 1 means first-and-only attempt; attempts.length === 4 means 4th attempt (3 prior fails).
  recordGameAttempt(session, gameIndex, { ...result, ratio, passed, stars, attemptNumber });

  if (passed) {
    submitAttemptScore({
      agent: session.agent, batchId: session.batchId,
      game: game.key, attempt: attemptNumber,
      scorePct: ratio, stars, passed: true
    });
    const newBadges = evaluateBadges(gameIndex, result, session, ratio);
    // Award badges sequentially — show toasts with 500ms stagger
    awardBadgesSequentially(newBadges, session.agent);
    // Refresh leaderboard then mount results screen.
    // mountResults() renders the results panel into #game-container.
    // renderLeaderboard() fills the leaderboard section within that panel.
    fetchLeaderboard(session.agent).then(lb => {
      mountResults(document.getElementById('game-container'), session);
      renderLeaderboard(
        document.querySelector('.leaderboard-table'),
        lb.top10,
        session.agent
      );
      // Rank-up flash
      if (lb.currentRow && session.lastKnownRank && lb.currentRow.rank < session.lastKnownRank) {
        const flash = document.querySelector('.rank-up-flash');
        if (flash) flash.textContent = `▲ Rank up! You're now #${lb.currentRow.rank}`;
      }
      if (lb.currentRow) {
        localStorage.setItem('atlas_rank_' + session.agent, lb.currentRow.rank);
        session.lastKnownRank = lb.currentRow.rank;
      }
    });
  } else {
    submitAttemptScore({
      agent: session.agent, batchId: session.batchId,
      game: game.key, attempt: attemptNumber,
      scorePct: ratio, stars, passed: false
    });
    renderFailInterstitial(game, ratio, stars, attemptNumber);
  }
}
```

### Fail Interstitial (`renderFailInterstitial`)

**Extends (does not replace) `renderAttemptResult()`** — adds extra sections for the fail state:

- Score display with roll-up animation (Free Element #4 — must be implemented per retheme spec)
- `"ATTEMPT {n}"` counter in Press Start 2P
- **Attempt progress dots** — one dot per attempt in `game.attempts[]`, coloured red/green, current attempt pulsing orange
- **Personal best banner** — shown only when `attemptNumber > 1` and `ratio > Math.max(...game.attempts.slice(0, -1).map(a => a.ratio))` — the `.slice(0,-1)` excludes the current attempt (already appended) so the comparison is against all *prior* attempts — label: `"↑ NEW PERSONAL BEST"`
- Motivational message, cycled by `attemptNumber % 5`:
  1. *"Good effort — the map doesn't give up its secrets easily."*
  2. *"Every agent improves. Retry when ready."*
  3. *"Knowledge builds with each attempt."*
  4. *"Almost there — one more run."*
  5. *"Amazon explorers never stop learning."*
- "Try Again" button — disabled for 3 seconds, countdown shown (`"Try Again (3)… (2)… (1)… GO!"`)
- On click: calls `route(gameKey)` which remounts the game; `pickQuestions()` runs a fresh `shuffle()` producing a different question order

### Pass Interstitial

Uses existing `renderAttemptResult()` pass branch plus:
- Confetti burst (Free Element #9 — implement per retheme spec)
- Star pop sequence (Free Element #8 — implement per retheme spec)
- Score roll-up (Free Element #4)
- Badge unlock toasts for newly earned badges (staggered 500ms apart)

**Note:** Free Elements #4, #8, #9 are specified in `docs/superpowers/specs/2026-04-25-amazon-orange-arcade-retheme-design.md` and must be implemented before these interstitials are complete. They are a prerequisite.

---

## Badge System

### 8 Badges

| ID | Icon | Name | Trigger |
|----|------|------|---------|
| `first-blood` | 🚀 | First Blood | Pass any game on attempt 1 |
| `perfect-agent` | 💯 | Perfect Agent | `percentCorrect() === 1.0` on any game |
| `hot-streak` | 🔥 | Hot Streak | `streakPeak >= 3` in a single game session (all 4 games eligible; City Sorter counts each correctly placed city) |
| `globe-trotter` | 🌎 | Globe Trotter | All 4 games passed (any number of attempts) |
| `diamond-agent` | 💎 | Diamond Agent | All 4 games passed on attempt 1 each |
| `star-collector` | ⭐ | Star Collector | Earn all 12 possible stars in a single session (3 stars × 4 games = 12 max) |
| `never-quit` | 🏅 | Never Quit | Pass a game after 3+ prior failed attempts (i.e. `attemptNumber >= 4` at time of pass) |
| `speed-run` | ⚡ | Speed Run | Complete a game with 100% score and `timerRatio > 0.5` (eligible games: Pin It!, City Sorter, Region Ranger only — Crack the Code has no timer, emits `timerRatio: -1` and is excluded) |

### Badge Evaluation (`evaluateBadges`)

```js
function evaluateBadges(gameIndex, result, session, ratio) {
  const game       = session.games[gameIndex];
  const allGames   = session.games;
  const attempts   = game.attempts; // array of normalizeAttempt() objects
  const newBadges  = [];

  function maybeAdd(id, name) {
    if (!session.earnedBadges.includes(id)) {
      newBadges.push({ id, name });
      session.earnedBadges.push(id); // prevent re-award in same session
    }
  }

  if (attempts.length === 1)
    maybeAdd('first-blood', 'First Blood');

  if (ratio === 1.0)
    maybeAdd('perfect-agent', 'Perfect Agent');

  if (game.streakPeak >= 3)
    maybeAdd('hot-streak', 'Hot Streak');

  if (allGames.length === 4 && allGames.every(g => g.passed))
    maybeAdd('globe-trotter', 'Globe Trotter');

  if (allGames.length === 4 && allGames.every(g => g.passed && g.attempts.length === 1))
    maybeAdd('diamond-agent', 'Diamond Agent');

  const totalStars = allGames.reduce((sum, g) => sum + (g.stars || 0), 0);
  if (totalStars >= 12)
    maybeAdd('star-collector', 'Star Collector');

  if (attempts.length >= 4) // attempts.length is now after recording, so 4 = passed on 4th try = 3 prior fails
    maybeAdd('never-quit', 'Never Quit');

  if (ratio === 1.0 && result.timerRatio > 0.5)
    maybeAdd('speed-run', 'Speed Run');

  return newBadges;
}
```

**Note on `attempts.length`:** `recordGameAttempt()` appends the current attempt before `evaluateBadges()` is called, so `attempts.length === 1` means this was the first and only attempt.

### Badge Award Sequence

Multiple badges can fire simultaneously (e.g., `globe-trotter` + `diamond-agent` on the same game). Show toasts sequentially with 500ms stagger:

```js
function awardBadgesSequentially(badges, agent) {
  const configured = isConfigured();
  badges.forEach(({ id, name }, i) => {
    setTimeout(() => {
      if (configured) {
        awardBadge(agent, id, name); // POST to Apps Script only when configured
      }
      // Toast and chime are shown locally regardless — they reflect session state,
      // not Sheets state. Criterion 16 ("badges not awarded" when unconfigured)
      // means no Sheets row is written, but the local session toast still fires
      // so the trainee sees their achievement within the session.
      showBadgeToast(name);
      playBadgeChime();
    }, i * 500);
  });
}
```

### Badge UI

**`.badge-shelf`** appears in:
1. **Results screen** (`results-panel`) — after leaderboard; all 8 badges rendered, earned ones lit
2. **Landing page** (`index.html`) — below Readiness Row; shown only if `localStorage.getItem('atlas_agent')` exists (returning user). If no agent stored, shelf is hidden.

**`.badge-card` anatomy:**
```
┌──────────────────┐
│   🚀             │  2rem emoji
│  FIRST BLOOD     │  Press Start 2P, 0.5rem, #FF9900
│  Pass on 1st try │  Inter, 0.75rem, #8B95A1
│  [ EARNED ]      │  teal pill — or —
│  [ LOCKED ]      │  dimmed, grayscale
└──────────────────┘
```

**First-unlock animation (`.badge-card.just-earned`):**
- Scale `0.5 → 1.1 → 1.0`, orange glow, `0.5s`
- Class added in JS after toast is triggered; removed after animation ends

---

## CSS Additions (`css/retro.css`)

Append to end of file. All variables (`--surface2`, `--orange-glow`, `--shadow`) must be defined in the `:root` block:

```css
/* Ensure these are in :root if not already present from retheme spec: */
:root {
  /* ... existing vars ... */
  --orange-glow: 0 0 12px rgba(255,153,0,0.25);
}

/* fadeInUp — reused by rank flash and interstitial */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Badge shelf ── */
.badge-shelf { display: flex; gap: 12px; overflow-x: auto; padding: 8px 0; }

.badge-card {
  min-width: 120px; padding: 12px 8px;
  background: var(--surface2); border: 1px solid rgba(255,153,0,0.25);
  border-radius: 8px; text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.badge-card.earned { border-color: #FF9900; box-shadow: var(--orange-glow); }
.badge-card.locked { opacity: 0.35; filter: grayscale(1); }

.badge-card .badge-icon  { font-size: 2rem; display: block; margin-bottom: 6px; }
.badge-card .badge-name  {
  font-family: 'Press Start 2P', cursive; font-size: 0.5rem;
  color: #FF9900; display: block; margin-bottom: 4px;
}
.badge-card .badge-desc  { font-family: Inter, sans-serif; font-size: 0.7rem; color: #8B95A1; }
.badge-card .badge-status {
  display: inline-block; margin-top: 6px; padding: 2px 8px;
  border-radius: 4px; font-family: Inter, sans-serif; font-size: 0.65rem; font-weight: 600;
}
.badge-card.earned .badge-status { background: #007185; color: #fff; content: 'EARNED'; }
.badge-card.locked .badge-status { background: #4A5568; color: #8B95A1; content: 'LOCKED'; }

@keyframes badgeUnlock {
  0%   { transform: scale(0.5); box-shadow: 0 0 0 rgba(255,153,0,0); }
  60%  { transform: scale(1.1); box-shadow: 0 0 24px rgba(255,153,0,0.5); }
  100% { transform: scale(1.0); box-shadow: var(--orange-glow); }
}
.badge-card.just-earned { animation: badgeUnlock 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }

/* ── Badge unlock toast ── */
.badge-toast {
  position: fixed; top: 80px; right: 20px; z-index: 300;
  background: var(--surface2); border: 2px solid #FF9900; border-radius: 8px;
  padding: 10px 16px; font-family: Inter, sans-serif; font-size: 0.85rem; color: #FEBD69;
  box-shadow: var(--orange-glow), var(--shadow);
  animation: toastIn 0.3s ease forwards, toastOut 0.3s ease 2.7s forwards;
  pointer-events: none;
}
@keyframes toastIn  { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
@keyframes toastOut { from { opacity: 1; } to { opacity: 0; transform: translateX(40px); } }

/* ── Attempt progress dots ── */
.attempt-dots { display: flex; gap: 6px; justify-content: center; margin: 8px 0; }
.attempt-dot  { width: 10px; height: 10px; border-radius: 50%; border: 2px solid #4A5568; background: transparent; }
.attempt-dot.fail    { background: #E53E3E; border-color: #E53E3E; }
.attempt-dot.pass    { background: #1DB954; border-color: #1DB954; }
.attempt-dot.current { border-color: #FF9900; animation: dotPulse 1s ease infinite; }
@keyframes dotPulse  { 0%,100% { box-shadow: 0 0 0 0 rgba(255,153,0,0.4); } 50% { box-shadow: 0 0 0 4px rgba(255,153,0,0); } }

/* ── Personal best banner ── */
.personal-best {
  color: #FEBD69; font-family: 'Press Start 2P', cursive; font-size: 0.5rem;
  padding: 4px 10px; border: 1px solid rgba(254,189,105,0.4);
  border-radius: 4px; margin-bottom: 8px; display: inline-block;
}

/* ── Rank flash ── */
.rank-up-flash {
  color: #1DB954; font-family: Inter, sans-serif; font-size: 0.85rem;
  animation: fadeInUp 0.4s ease forwards;
}

/* ── Progress ring (landing page) ── */
.progress-ring-wrap { position: relative; width: 56px; height: 56px; }
.progress-ring-wrap svg { transform: rotate(-90deg); }
.progress-ring-track { fill: none; stroke: rgba(255,153,0,0.15); stroke-width: 4; }
.progress-ring-fill  {
  fill: none; stroke: #FF9900; stroke-width: 4; stroke-linecap: round;
  transition: stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1);
}
```

---

## Engagement Additions

### 1. Attempt Progress Dots
Rendered above score in fail interstitial. Each previous attempt = one dot (red = fail, green = pass). Current attempt = pulsing orange hollow dot. Generated from `game.attempts` array.

### 2. Personal Best Banner
Shown in fail interstitial only (not first attempt). Condition: `ratio > Math.max(...game.attempts.slice(0,-1).map(a => a.ratio))`. Text: `"↑ NEW PERSONAL BEST"`.

### 3. Leaderboard Rank Flash
After `fetchLeaderboard()` resolves: compare `currentRow.rank` to `session.lastKnownRank`. If rank improved (lower number), show `"▲ Rank up! You're now #N"` above leaderboard for 3s. Then persist new rank: `localStorage.setItem('atlas_rank_' + agent, currentRow.rank)`.

### 4. Badge Unlock Chime (optional)
```js
function playBadgeChime() {
  if (!window.AudioContext && !window.webkitAudioContext) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx  = new (window.AudioContext || window.webkitAudioContext)();
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.start(); osc.stop(ctx.currentTime + 0.4);
}
```

### 5. Retry Countdown
```js
function startRetryCountdown(btn, seconds = 3) {
  btn.disabled = true;
  let t = seconds;
  btn.textContent = `Try Again (${t})`;
  const id = setInterval(() => {
    t--;
    if (t > 0) { btn.textContent = `Try Again (${t})`; }
    else { clearInterval(id); btn.disabled = false; btn.textContent = 'Try Again'; }
  }, 1000);
}
```

### 6. Total Progress Ring (Landing Page)
SVG circle around brand mark. `r=24`, circumference `= 2π×24 ≈ 150.8`. On DOMContentLoaded:
```js
const gamesPassed = readSessionFromStorage().games.filter(g => g.passed).length; // 0–4
const pct = gamesPassed / 4;
const circ = 150.8;
document.querySelector('.progress-ring-fill')
  .style.strokeDashoffset = circ * (1 - pct);
```
Animates via CSS `transition: stroke-dashoffset 1s`. Hidden if no session in localStorage.

---

## Files Modified

| File | Change Summary |
|------|---------------|
| `js/session.js` | Remove 2-attempt cap + `blocked` logic; add `attemptNumber`, `streakPeak`, `earnedBadges[]`, `lastKnownRank` fields |
| `js/main.js` | Rewrite `handleGameComplete()` with pass/fail branches; add `evaluateBadges()`, `renderFailInterstitial()`, `awardBadgesSequentially()`, `showBadgeToast()`, `playBadgeChime()`, `startRetryCountdown()`, `initSession()` |
| `js/results.js` | Remove old `submitScore(getSubmissionPayload())` call; call `renderLeaderboard(lb)` with fetched data; add badge shelf render; add rank flash |
| `js/leaderboard.js` | Add `APPS_SCRIPT_URL`; add `submitAttemptScore()`, `awardBadge()`, `fetchBadges()`; update `fetchLeaderboard()` to accept `agent` param instead of `batchId` |
| `js/crack-the-code.js` | Add `streakPeak` tracking; emit `timerRatio: -1` in `onComplete` payload |
| `js/pin-it.js` | Add `streakPeak` tracking; emit `timerRatio` in `onComplete` payload |
| `js/city-sorter.js` | Add `streakPeak` tracking (per placed city); emit `timerRatio` in `onComplete` payload |
| `js/region-ranger.js` | Add `streakPeak` tracking; emit `timerRatio` in `onComplete` payload |
| `css/retro.css` | Append all new CSS classes from section above; ensure `--orange-glow` in `:root`; add `fadeInUp` keyframe |
| `index.html` | Add progress ring SVG around brand mark; add badge shelf below Readiness Row (hidden if no agent in localStorage) |
| `Code.gs` *(new file — docs only)* | Full Apps Script — saved to `docs/appscript/Code.gs` for reference |

---

## Success Criteria

1. Failing a game shows fail interstitial with attempt number, attempt dots, personal best banner (when applicable), motivational message, and Try Again button disabled for 3 seconds
2. Clicking Try Again remounts the game; question order on retry differs from the previous attempt (visual confirmation: first question changes at least half the time across 10 retries)
3. Unlimited retries — no blocked state, no cap; trainee can retry as many times as needed
4. Passing a game submits a row to the Players tab in Google Sheets (Timestamp, Agent, BatchID, Game, Attempt, ScorePct, Stars, Passed=true)
5. Failing a game also submits a row (Passed=false) — the full attempt history is in Sheets
6. Eligible badges are evaluated on pass; earned badges POST to Badges tab; Apps Script skips duplicates
7. Badge shelf on results screen shows all 8 badges — earned ones have orange border and EARNED pill, locked ones are greyscale and dimmed
8. Badge shelf on landing page shows same layout for returning users (agent in localStorage); hidden for new users
9. Newly earned badges show unlock animation on the badge card + toast notification sliding in from top-right + optional chime
10. Multiple simultaneous badge unlocks show toasts staggered 500ms apart (not stacked on top of each other)
11. Leaderboard on results screen shows top 10 from Sheets, sorted by total stars; current agent row highlighted in orange
12. If fetched rank is better than `lastKnownRank`, a `"▲ Rank up! You're now #N"` message appears for 3s
13. Progress ring on landing page reflects games passed / 4; hidden for new users
14. `hot-streak` badge fires correctly when 3+ consecutive correct answers occur in a single game (tested in each of the 4 games)
15. `speed-run` badge only evaluates for Pin It!, City Sorter, Region Ranger — Crack the Code is excluded
16. All features degrade gracefully when Apps Script URL is empty: scores saved to localStorage via `saveLocalScore()`; badge rows are **not written to Sheets** (no `awardBadge` POST is made), but badge toasts and chimes still fire locally so the trainee sees their achievement within the session; leaderboard falls back to `getLocalScores()`; badge shelf renders from `session.earnedBadges[]` (which will be empty for unconfigured deployments, so all badges show as locked)
