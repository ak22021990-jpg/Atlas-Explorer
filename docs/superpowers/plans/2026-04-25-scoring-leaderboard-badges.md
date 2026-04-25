# Scoring, Leaderboard, Badges & Engagement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add unlimited retries with fresh question pools, Google Sheets leaderboard via Apps Script, 8 permanent badges, and 6 engagement UI additions to the existing vanilla JS Atlas Explorer training game.

**Architecture:** Pure progressive enhancement — each task builds on the last without breaking existing behaviour. Badge logic is extracted to a pure `js/badges.js` module for testability. All other changes are surgical edits to existing files. The Apps Script endpoint is a reference file only; the admin deploys it manually.

**Tech Stack:** Vanilla JS ES modules, Node.js test runner (custom, `tests/test-runner.js`), Google Apps Script (server-side), no build step.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `js/session.js` | Modify | Remove 2-attempt cap; add `streakPeak`, `earnedBadges`, `lastKnownRank` to schema |
| `js/badges.js` | **Create** | Pure `evaluateBadges()` function — no DOM, fully testable |
| `js/leaderboard.js` | Modify | Add `GAME_SHEET_KEYS`, `submitAttemptScore()`, `awardBadge()`, `fetchBadges()`; update `fetchLeaderboard()` and `renderLeaderboard()` |
| `js/crack-the-code.js` | Modify | Add `streakPeak` tracking; emit `timerRatio: -1` in `onComplete` |
| `js/pin-it.js` | Modify | Add `streakPeak` tracking; emit `timerRatio` from game timer |
| `js/city-sorter.js` | Modify | Add `streakPeak` tracking; emit `timerRatio` |
| `js/region-ranger.js` | Modify | Add `streakPeak` tracking; emit `timerRatio` |
| `js/main.js` | Modify | Rewrite `handleGameComplete()`; add `renderFailInterstitial()`, `showBadgeToast()`, `playBadgeChime()`, `startRetryCountdown()`, `awardBadgesSequentially()`; import badges.js |
| `js/results.js` | Modify | Remove old `submitScore()` call; add `renderBadgeShelf()`; update leaderboard render; add rank-up flash |
| `css/retro.css` | Modify | Append badge, toast, dot, personal-best, rank-flash, progress-ring CSS |
| `index.html` | Modify | Add progress ring SVG; add badge shelf section |
| `tests/test-session.js` | Modify | Update blocked tests → unlimited retry tests; add new field tests |
| `tests/test-badges.js` | **Create** | Unit tests for all 8 badge conditions |
| `docs/appscript/Code.gs` | **Create** | Reference copy of Apps Script — admin pastes into Google Apps Script editor |
| `package.json` | Modify | Add `test-badges.js` to test script |

---

## Task 1: Remove 2-Attempt Cap from `session.js`

The existing `recordGameAttempt()` blocks the session after 2 failures (`status: 'blocked'`). Remove this entirely — on every failed attempt, always return `status: 'retry'`. Update the existing session tests.

**Files:**
- Modify: `js/session.js`
- Modify: `tests/test-session.js`

- [ ] **Step 1.1: Update test — replace 'blocked' tests with unlimited retry tests**

Open `tests/test-session.js`. Replace the `'second failure blocks and keeps best score'` test with:

```js
test('multiple failures always return retry', () => {
  const session = createSession('Priya', 'APR-2026-01');
  recordGameAttempt(session, 0, { score: 60, correctCount: 6, totalCount: 20 });
  const outcome = recordGameAttempt(session, 0, { score: 65, correctCount: 7, totalCount: 20 });
  assertEqual(outcome.status, 'retry');
  assert(!session.blocked);
  assert(!session.flagged);
});

test('third failure still retries', () => {
  const session = createSession('Priya', 'APR-2026-01');
  recordGameAttempt(session, 0, { score: 60, correctCount: 6, totalCount: 20 });
  recordGameAttempt(session, 0, { score: 60, correctCount: 6, totalCount: 20 });
  const outcome = recordGameAttempt(session, 0, { score: 60, correctCount: 6, totalCount: 20 });
  assertEqual(outcome.status, 'retry');
});

test('pass after multiple failures resolves correctly', () => {
  const session = createSession('Priya', 'APR-2026-01');
  recordGameAttempt(session, 0, { score: 60, correctCount: 6, totalCount: 20 });
  recordGameAttempt(session, 0, { score: 60, correctCount: 6, totalCount: 20 });
  const outcome = recordGameAttempt(session, 0, { score: 160, correctCount: 16, totalCount: 20 });
  assertEqual(outcome.status, 'passed');
  assertEqual(session.currentGameIndex, 1);
});
```

Also update the `'first failure unlocks a retry'` test — it calls `assert(!isFlagged(session))`. Since `isFlagged` checks `session.flagged || session.blocked`, and those fields will be removed, update the assertion:

```js
// Replace: assert(!isFlagged(session));
// With:
assert(!session.flagged, 'session should not be flagged after one fail');
```

Or simply remove the `isFlagged` call if `flagged` is removed from the schema. Check all remaining uses of `isFlagged` in the test file before removing it — if it still appears anywhere else, keep the import and make the function return `false` always, or remove those assertions too.

- [ ] **Step 1.2: Run test to confirm failure**

```bash
node tests/test-session.js
```

Expected: `fail multiple failures always return retry` (function still blocks)

- [ ] **Step 1.3: Remove 2-attempt cap from `recordGameAttempt` in `js/session.js`**

Replace the entire block starting at line 56 through line 79 (the `if (game.attempts.length < 2)` branch and the `blocked` branch) with:

```js
  // Failed — always allow retry (no attempt cap)
  game.score = attempt.score;
  game.correctCount = attempt.correctCount;
  game.totalCount = attempt.totalCount;
  game.stars = 0;
  game.passed = false;
  game.retryAvailable = true;
  return { status: 'retry', game, attempt, gameIndex: index };
```

Also remove the guard at the top of `recordGameAttempt`:
```js
  if (session.blocked) throw new Error('Session is already blocked');
```

And remove `blocked: false` and `flagged: false` from the `createSession` return object (they are no longer used). Remove `session.blocked = true`, `session.flagged = true`, `session.completed = true` from `recordGameAttempt`.

- [ ] **Step 1.4: Run tests**

```bash
node tests/test-session.js
```

Expected: all tests pass

- [ ] **Step 1.5: Commit**

```bash
git add js/session.js tests/test-session.js
git commit -m "feat: remove 2-attempt cap — unlimited retries per game

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Add New Session Schema Fields

Add `streakPeak` (per game), `earnedBadges` (session root), and `lastKnownRank` (session root). These fields support badge evaluation and rank tracking.

**Files:**
- Modify: `js/session.js`
- Modify: `tests/test-session.js`

- [ ] **Step 2.1: Write failing test for new fields**

Add to `tests/test-session.js` before `summary()`:

```js
test('createSession initialises earnedBadges and lastKnownRank', () => {
  const session = createSession('Priya', 'APR-2026-01');
  assertDeepEqual(session.earnedBadges, []);
  assertEqual(session.lastKnownRank, null);
});

test('each game slot initialises streakPeak to 0', () => {
  const session = createSession('Priya', 'APR-2026-01');
  assert(session.games.every(g => g.streakPeak === 0));
});
```

- [ ] **Step 2.2: Run test to confirm failure**

```bash
node tests/test-session.js
```

Expected: `fail createSession initialises earnedBadges and lastKnownRank`

- [ ] **Step 2.3: Add new fields to `createSession` in `js/session.js`**

In `createSession`, add to the returned object:
```js
earnedBadges: [],
lastKnownRank: null,
```

In the `games` array initialiser (inside `GAME_DEFINITIONS.map`), add:
```js
streakPeak: 0,
```

- [ ] **Step 2.4: Update `recordGameAttempt` to track streakPeak**

Place this block immediately **before** `const attempt = normalizeAttempt(rawAttempt);` (i.e. reading from `rawAttempt` while it still has all fields, before `normalizeAttempt` reconstructs a new object from only `{ score, correctCount, totalCount }`):

```js
  // Update per-game streakPeak from rawAttempt BEFORE normalizeAttempt strips it
  if (typeof rawAttempt.streakPeak === 'number') {
    game.streakPeak = Math.max(game.streakPeak, rawAttempt.streakPeak);
  }
```

This must run on every attempt regardless of pass/fail. `evaluateBadges()` later reads `game.streakPeak` (the game-level field), not from the stored attempt object — so `normalizeAttempt()` does NOT need to preserve `streakPeak`.

- [ ] **Step 2.5: Run tests**

```bash
node tests/test-session.js
```

Expected: all tests pass

- [ ] **Step 2.6: Commit**

```bash
git add js/session.js tests/test-session.js
git commit -m "feat: add earnedBadges, lastKnownRank, streakPeak to session schema

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Create `js/badges.js` — Pure Badge Evaluation

Extract badge logic into a standalone pure module with no DOM dependency. This makes it fully unit-testable.

**Files:**
- Create: `js/badges.js`
- Create: `tests/test-badges.js`
- Modify: `package.json`

- [ ] **Step 3.1: Write `tests/test-badges.js` with failing tests for all 8 badges**

Note: `assertDeepEqual` IS exported from `tests/test-runner.js` (confirmed in source). The import below is correct.

```js
import { suite, test, assert, assertEqual, assertDeepEqual, summary } from './test-runner.js';
import { evaluateBadges } from '../js/badges.js';

// Helper: build a minimal session with given game states
function makeSession(games, earnedBadges = []) {
  return {
    earnedBadges,
    games: games.map(g => ({
      key: g.key || 'crack',
      passed: g.passed || false,
      stars: g.stars || 0,
      streakPeak: g.streakPeak || 0,
      attempts: g.attempts || []
    }))
  };
}

suite('badges');

test('first-blood: awarded when first attempt passes', () => {
  const session = makeSession([{ passed: true, attempts: [{}] }]);
  const result = evaluateBadges(0, { correctCount: 16, totalCount: 20, timerRatio: -1 }, session);
  assert(result.some(b => b.id === 'first-blood'), 'first-blood not awarded');
});

test('first-blood: not awarded when second attempt passes', () => {
  const session = makeSession([{ passed: true, attempts: [{}, {}] }]);
  const result = evaluateBadges(0, { correctCount: 16, totalCount: 20, timerRatio: -1 }, session);
  assert(!result.some(b => b.id === 'first-blood'), 'first-blood should not fire on attempt 2');
});

test('perfect-agent: awarded on 100% score', () => {
  const session = makeSession([{ passed: true, attempts: [{}] }]);
  const result = evaluateBadges(0, { correctCount: 20, totalCount: 20, timerRatio: -1 }, session);
  assert(result.some(b => b.id === 'perfect-agent'));
});

test('perfect-agent: not awarded on < 100%', () => {
  const session = makeSession([{ passed: true, attempts: [{}] }]);
  const result = evaluateBadges(0, { correctCount: 19, totalCount: 20, timerRatio: -1 }, session);
  assert(!result.some(b => b.id === 'perfect-agent'));
});

test('hot-streak: awarded when streakPeak >= 3', () => {
  const session = makeSession([{ passed: true, streakPeak: 3, attempts: [{}] }]);
  const result = evaluateBadges(0, { correctCount: 14, totalCount: 20, timerRatio: -1 }, session);
  assert(result.some(b => b.id === 'hot-streak'));
});

test('hot-streak: not awarded when streakPeak < 3', () => {
  const session = makeSession([{ passed: true, streakPeak: 2, attempts: [{}] }]);
  const result = evaluateBadges(0, { correctCount: 14, totalCount: 20, timerRatio: -1 }, session);
  assert(!result.some(b => b.id === 'hot-streak'));
});

test('globe-trotter: awarded when all 4 games passed', () => {
  const session = makeSession([
    { passed: true, attempts: [{}] },
    { passed: true, attempts: [{}] },
    { passed: true, attempts: [{}] },
    { passed: true, attempts: [{}] }
  ]);
  const result = evaluateBadges(3, { correctCount: 14, totalCount: 20, timerRatio: -1 }, session);
  assert(result.some(b => b.id === 'globe-trotter'));
});

test('globe-trotter: not awarded when only 3 games passed', () => {
  const session = makeSession([
    { passed: true, attempts: [{}] },
    { passed: true, attempts: [{}] },
    { passed: true, attempts: [{}] },
    { passed: false, attempts: [{}] }
  ]);
  const result = evaluateBadges(3, { correctCount: 14, totalCount: 20, timerRatio: -1 }, session);
  assert(!result.some(b => b.id === 'globe-trotter'));
});

test('diamond-agent: awarded when all 4 games passed on first attempt each', () => {
  const session = makeSession([
    { passed: true, attempts: [{}] },
    { passed: true, attempts: [{}] },
    { passed: true, attempts: [{}] },
    { passed: true, attempts: [{}] }
  ]);
  const result = evaluateBadges(3, { correctCount: 14, totalCount: 20, timerRatio: -1 }, session);
  assert(result.some(b => b.id === 'diamond-agent'));
});

test('diamond-agent: not awarded when any game needed 2+ attempts', () => {
  const session = makeSession([
    { passed: true, attempts: [{}, {}] },
    { passed: true, attempts: [{}] },
    { passed: true, attempts: [{}] },
    { passed: true, attempts: [{}] }
  ]);
  const result = evaluateBadges(3, { correctCount: 14, totalCount: 20, timerRatio: -1 }, session);
  assert(!result.some(b => b.id === 'diamond-agent'));
});

test('star-collector: awarded when all 4 games have 3 stars (12 total)', () => {
  const session = makeSession([
    { passed: true, stars: 3, attempts: [{}] },
    { passed: true, stars: 3, attempts: [{}] },
    { passed: true, stars: 3, attempts: [{}] },
    { passed: true, stars: 3, attempts: [{}] }
  ]);
  const result = evaluateBadges(3, { correctCount: 20, totalCount: 20, timerRatio: -1 }, session);
  assert(result.some(b => b.id === 'star-collector'));
});

test('star-collector: not awarded when total stars < 12', () => {
  const session = makeSession([
    { passed: true, stars: 3, attempts: [{}] },
    { passed: true, stars: 3, attempts: [{}] },
    { passed: true, stars: 3, attempts: [{}] },
    { passed: true, stars: 2, attempts: [{}] }
  ]);
  const result = evaluateBadges(3, { correctCount: 14, totalCount: 20, timerRatio: -1 }, session);
  assert(!result.some(b => b.id === 'star-collector'));
});

test('never-quit: awarded when passing on 4th+ attempt', () => {
  const session = makeSession([{ passed: true, attempts: [{}, {}, {}, {}] }]);
  const result = evaluateBadges(0, { correctCount: 14, totalCount: 20, timerRatio: -1 }, session);
  assert(result.some(b => b.id === 'never-quit'));
});

test('never-quit: not awarded when passing on 3rd attempt', () => {
  const session = makeSession([{ passed: true, attempts: [{}, {}, {}] }]);
  const result = evaluateBadges(0, { correctCount: 14, totalCount: 20, timerRatio: -1 }, session);
  assert(!result.some(b => b.id === 'never-quit'));
});

test('speed-run: awarded on 100% score with timerRatio > 0.5', () => {
  const session = makeSession([{ passed: true, attempts: [{}] }]);
  const result = evaluateBadges(0, { correctCount: 20, totalCount: 20, timerRatio: 0.6 }, session);
  assert(result.some(b => b.id === 'speed-run'));
});

test('speed-run: not awarded when timerRatio is -1 (no timer game)', () => {
  const session = makeSession([{ passed: true, attempts: [{}] }]);
  const result = evaluateBadges(0, { correctCount: 20, totalCount: 20, timerRatio: -1 }, session);
  assert(!result.some(b => b.id === 'speed-run'));
});

test('already-earned badges are not returned again', () => {
  const session = makeSession([{ passed: true, attempts: [{}] }], ['first-blood']);
  const result = evaluateBadges(0, { correctCount: 16, totalCount: 20, timerRatio: -1 }, session);
  assert(!result.some(b => b.id === 'first-blood'), 'first-blood should not re-award');
});

summary();
```

- [ ] **Step 3.2: Add test-badges to `package.json` test script**

Edit `package.json` — append `&& node tests/test-badges.js` to the `"test"` script value:

```json
{
  "scripts": {
    "test": "node tests/test-scoring.js && node tests/test-session.js && node tests/test-crack-the-code.js && node tests/test-pin-it.js && node tests/test-city-sorter.js && node tests/test-region-ranger.js && node tests/test-badges.js"
  }
}
```

- [ ] **Step 3.3: Run to confirm failure**

```bash
node tests/test-badges.js
```

Expected: `Error: Cannot find module '../js/badges.js'`

- [ ] **Step 3.4: Create `js/badges.js`**

```js
// badges.js — pure badge evaluation, no DOM dependencies

const BADGE_DEFS = [
  { id: 'first-blood',   name: 'First Blood' },
  { id: 'perfect-agent', name: 'Perfect Agent' },
  { id: 'hot-streak',    name: 'Hot Streak' },
  { id: 'globe-trotter', name: 'Globe Trotter' },
  { id: 'diamond-agent', name: 'Diamond Agent' },
  { id: 'star-collector',name: 'Star Collector' },
  { id: 'never-quit',    name: 'Never Quit' },
  { id: 'speed-run',     name: 'Speed Run' }
];

/**
 * Evaluate which badges are newly earned after a passing attempt.
 * Called AFTER recordGameAttempt() has already appended the current attempt.
 *
 * @param {number} gameIndex - index of the completed game in session.games
 * @param {object} result    - raw onComplete payload: { correctCount, totalCount, timerRatio }
 * @param {object} session   - full session object (session.earnedBadges mutated on award)
 * @returns {{ id: string, name: string }[]} newly earned badges (not including already-earned ones)
 */
export function evaluateBadges(gameIndex, result, session) {
  const game     = session.games[gameIndex];
  const allGames = session.games;
  const newBadges = [];

  function maybeAdd(id) {
    if (session.earnedBadges.includes(id)) return;
    const def = BADGE_DEFS.find(b => b.id === id);
    if (!def) return;
    newBadges.push({ id: def.id, name: def.name });
    session.earnedBadges.push(id);
  }

  const ratio = result.correctCount / result.totalCount;

  // first-blood: current attempt is the only attempt (recordGameAttempt already appended it)
  if (game.attempts.length === 1) maybeAdd('first-blood');

  // perfect-agent: 100% correct
  if (ratio === 1) maybeAdd('perfect-agent');

  // hot-streak: peak consecutive-correct run >= 3 for this game
  if (game.streakPeak >= 3) maybeAdd('hot-streak');

  // globe-trotter: all games passed
  if (allGames.length === 4 && allGames.every(g => g.passed)) maybeAdd('globe-trotter');

  // diamond-agent: all games passed on first attempt each
  if (allGames.length === 4 && allGames.every(g => g.passed && g.attempts.length === 1))
    maybeAdd('diamond-agent');

  // star-collector: 12 total stars (max possible in a session)
  const totalStars = allGames.reduce((sum, g) => sum + (g.stars || 0), 0);
  if (totalStars >= 12) maybeAdd('star-collector');

  // never-quit: passed on 4th or later attempt (3+ prior fails)
  if (game.attempts.length >= 4) maybeAdd('never-quit');

  // speed-run: 100% score AND timerRatio > 0.5 AND game has a timer (timerRatio !== -1)
  if (ratio === 1 && result.timerRatio > 0.5) maybeAdd('speed-run');

  return newBadges;
}
```

- [ ] **Step 3.5: Run tests**

```bash
node tests/test-badges.js
```

Expected: all badge tests pass

- [ ] **Step 3.6: Run full suite**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 3.7: Commit**

```bash
git add js/badges.js tests/test-badges.js package.json
git commit -m "feat: add evaluateBadges pure module with full test coverage

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Update `js/leaderboard.js` — New Functions + Row Shape

Replace the old batch-filtered leaderboard with agent-based fetching. Add `submitAttemptScore`, `awardBadge`, `fetchBadges`. Update `renderLeaderboard` to handle the new Sheets row shape.

**Files:**
- Modify: `js/leaderboard.js`

- [ ] **Step 4.1: Replace `APPS_SCRIPT_URL` and add `GAME_SHEET_KEYS`**

At the top of `leaderboard.js`, replace:
```js
const APPS_SCRIPT_URL = 'REPLACE_WITH_YOUR_APPS_SCRIPT_URL';
```
With:
```js
const APPS_SCRIPT_URL = ''; // Paste your deployed Apps Script /exec URL here

// Maps session.js GAME_DEFINITIONS short keys to the strings written to the Players tab
const GAME_SHEET_KEYS = {
  crack:  'crack-the-code',
  pin:    'pin-it',
  sorter: 'city-sorter',
  ranger: 'region-ranger'
};
```

- [ ] **Step 4.2: Add `submitAttemptScore` function**

Add after the constant block:

```js
/**
 * POST one per-game-per-attempt row to the Players tab.
 * Falls back to localStorage if Apps Script URL not configured.
 * @param {{ agent, batchId, game, attempt, scorePct, stars, passed }} data
 */
export async function submitAttemptScore({ agent, batchId, game, attempt, scorePct, stars, passed }) {
  const gameSlug = GAME_SHEET_KEYS[game] || game;
  if (!isConfigured()) {
    saveLocalScore({ agent, batchId, game: gameSlug, attempt, scorePct, stars, passed });
    return;
  }
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'submit', agent, batchId, game: gameSlug, attempt, scorePct, stars, passed: Boolean(passed) })
    });
  } catch {
    saveLocalScore({ agent, batchId, game: gameSlug, attempt, scorePct, stars, passed });
  }
}
```

- [ ] **Step 4.3: Add `awardBadge` and `fetchBadges` functions**

```js
/**
 * POST a badge award. Apps Script deduplicates server-side.
 * Silently no-ops if not configured.
 * @param {string} agent
 * @param {string} badgeId
 * @param {string} badgeName
 */
export async function awardBadge(agent, badgeId, badgeName) {
  if (!isConfigured()) return;
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'awardBadge', agent, badgeId, badgeName })
    });
  } catch { /* silent */ }
}

/**
 * GET all badge IDs earned by this agent.
 * Returns [] if not configured or network fails.
 * @param {string} agent
 * @returns {Promise<string[]>} array of badge IDs
 */
export async function fetchBadges(agent) {
  if (!isConfigured()) return [];
  try {
    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.set('action', 'fetchBadges');
    url.searchParams.set('agent', agent);
    const res = await fetch(url);
    const data = await res.json();
    return (data.badges || []).map(b => b.badgeId);
  } catch {
    return [];
  }
}
```

- [ ] **Step 4.4: Update `fetchLeaderboard` to accept `agent` instead of `batchId`**

Replace the existing `fetchLeaderboard(batchId)` with:

```js
/**
 * GET top-10 leaderboard and current agent row.
 * Returns { top10: [], currentRow: null } on failure.
 * @param {string} agent — agent name (session.name)
 * @returns {Promise<{ top10: object[], currentRow: object|null }>}
 */
export async function fetchLeaderboard(agent) {
  if (!isConfigured()) {
    return { top10: [], currentRow: null };
  }
  try {
    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.set('action', 'fetchLeaderboard');
    url.searchParams.set('agent', agent);
    const res = await fetch(url);
    return await res.json();
  } catch {
    return { top10: [], currentRow: null };
  }
}
```

- [ ] **Step 4.5: Update `renderLeaderboard` to use new row shape and export `isConfigured`**

Replace the existing `renderLeaderboard` function:

```js
/**
 * Render leaderboard HTML into container.
 * Expects rows shaped as { agent, totalStars, gamesPassed, badgeCount }.
 * @param {Element} container
 * @param {object[]} rows  — top10 array from fetchLeaderboard()
 * @param {string} currentName — session.name, for highlighting current row
 */
export function renderLeaderboard(container, rows = [], currentName = '') {
  const shown = rows.slice(0, 10);
  container.innerHTML = `
    <section class="leaderboard" aria-labelledby="leaderboard-title">
      <div class="section-heading">
        <h2 id="leaderboard-title">Leaderboard</h2>
        <span>${shown.length} shown</span>
      </div>
      <div class="leaderboard-table" role="table">
        <div class="leaderboard-row header" role="row">
          <span>#</span>
          <span>Agent</span>
          <span>Stars</span>
          <span>Games</span>
          <span>Badges</span>
        </div>
        ${shown.map((row, i) => `
          <div class="leaderboard-row ${row.agent === currentName ? 'current' : ''}" role="row">
            <span>${i + 1}</span>
            <span>${escapeHtml(row.agent)}</span>
            <span>${row.totalStars}/12</span>
            <span>${row.gamesPassed}/4</span>
            <span>${row.badgeCount}</span>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}
```

Also export `isConfigured` (change `function isConfigured()` to `export function isConfigured()`).

- [ ] **Step 4.6: Run tests (no regressions)**

```bash
npm test
```

Expected: all tests pass (leaderboard has no unit tests — changes are integration-level)

- [ ] **Step 4.6b: Update `saveLocalScore` to accept new payload shape**

The existing `saveLocalScore(payload)` calls `getLocalScores(payload.batchId)` at the end — this still works because `submitAttemptScore` passes `batchId` in its payload. However, the old `saveLocalScore` return value (a filtered leaderboard array) is now ignored by `submitAttemptScore`, so this is safe. Verify `saveLocalScore` does not throw when called with `{ agent, batchId, game, attempt, scorePct, stars, passed }`. If it references `payload.name` or `payload.total` anywhere, update those references:

- `payload.name` → `payload.agent`
- Remove any reference to `payload.total`, `payload.passFail`, `payload.flagged` (those were the old all-games summary fields)

The local score entry is now a per-attempt row, not an all-games summary. The `getLocalScores(batchId)` filter still works on `batchId`. This is the correct and expected degraded-mode behaviour.

- [ ] **Step 4.7: Commit**

```bash
git add js/leaderboard.js
git commit -m "feat: add submitAttemptScore, awardBadge, fetchBadges; update leaderboard to agent-based

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Update Game Modules — `streakPeak` + `timerRatio`

Each game's `onComplete` call must include `streakPeak` (highest consecutive-correct run) and `timerRatio` (fraction of time remaining, or -1 for games with no timer).

**Files:**
- Modify: `js/crack-the-code.js`
- Modify: `js/pin-it.js`
- Modify: `js/city-sorter.js`
- Modify: `js/region-ranger.js`

### 5A: `crack-the-code.js`

Crack the Code has no per-game timer, so `timerRatio: -1`.

- [ ] **Step 5A.1: Add streak tracking variables**

After the `let correctCount = 0;` line, add:
```js
  let streak = 0;
  let streakPeak = 0;
```

- [ ] **Step 5A.2: Increment streak on correct, reset on miss**

In `handleType()`, inside the `if (checkAnswer(...))` branch, after `correctCount += 1;` add:
```js
      streak += 1;
      if (streak > streakPeak) streakPeak = streak;
```

In `handleMiss()`, add at the start of the function:
```js
    streak = 0;
```

- [ ] **Step 5A.3: Add fields to `onComplete` call**

Find `onComplete({ score, correctCount, totalCount: TOTAL_QUESTIONS });` and replace with:
```js
onComplete({ score, correctCount, totalCount: TOTAL_QUESTIONS, streakPeak, timerRatio: -1 });
```

- [ ] **Step 5A.4: Run game-module tests**

```bash
node tests/test-crack-the-code.js
```

Expected: all tests pass

### 5B: `pin-it.js`, `city-sorter.js`, `region-ranger.js`

These three games have a timer. Read each file to find where the timer starts and where `onComplete` is called. For each:

- [ ] **Step 5B.1: Add streak + timer variables**

After existing score/count variables, add:
```js
  let streak = 0;
  let streakPeak = 0;
  const gameStartTime = Date.now();
  let gameDuration = 0; // set when game timer starts (in ms)
```

- [ ] **Step 5B.2: Track streak on each correct/wrong answer**

On correct: `streak++; if (streak > streakPeak) streakPeak = streak;`
On wrong: `streak = 0;`

For City Sorter, a correctly placed city card counts as one correct. Apply streak increment in the city-placed-correctly handler.

- [ ] **Step 5B.3: Capture `gameDuration` when timer starts**

Find where each game sets up its countdown timer. Record `gameDuration = <totalTimerMs>` at that point.

- [ ] **Step 5B.4: Compute `timerRatio` at `onComplete`**

In each game's `onComplete` call, add:
```js
const timeElapsed = Date.now() - gameStartTime;
const timerRatio = gameDuration > 0 ? Math.max(0, 1 - timeElapsed / gameDuration) : -1;
```

Then include `streakPeak` and `timerRatio` in the `onComplete({...})` call.

- [ ] **Step 5B.5: Run game-module tests**

```bash
node tests/test-pin-it.js && node tests/test-city-sorter.js && node tests/test-region-ranger.js
```

Expected: all tests pass

- [ ] **Step 5B.6: Commit**

```bash
git add js/crack-the-code.js js/pin-it.js js/city-sorter.js js/region-ranger.js
git commit -m "feat: add streakPeak and timerRatio to all game onComplete payloads

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Rewrite `handleGameComplete` + Add Fail Interstitial in `main.js`

The current `handleGameComplete` blindly calls `renderAttemptResult`. Rewrite it to branch on pass/fail, call badge evaluation, submit scores, and on fail show the new fail interstitial with retry countdown.

**Files:**
- Modify: `js/main.js`

- [ ] **Step 6.1: Add import for new modules**

At the top of `main.js`, add:
```js
import { evaluateBadges } from './badges.js';
import { submitAttemptScore, awardBadge, fetchBadges, fetchLeaderboard, renderLeaderboard, isConfigured } from './leaderboard.js';
```

Remove the old `import { submitScore, renderLeaderboard } from './leaderboard.js';` if present.

- [ ] **Step 6.2: Initialise `earnedBadges` from Sheets on session load**

Replace the `let session = loadSession();` block at the top:

```js
let session = loadSession();

if (!session) {
  window.location.href = 'index.html';
} else {
  // Seed earnedBadges from Sheets so returning users don't see re-award toasts
  fetchBadges(session.name).then(ids => {
    session.earnedBadges = ids;
  });
  session.lastKnownRank = Number(localStorage.getItem('atlas_rank_' + session.name)) || null;
  renderShell();
  route();
}
```

- [ ] **Step 6.3: Update `route()` to remove blocked check**

Replace:
```js
  if (session.completed || session.blocked || session.currentGameIndex >= GAME_DEFINITIONS.length) {
```
With:
```js
  if (session.completed || session.currentGameIndex >= GAME_DEFINITIONS.length) {
```

- [ ] **Step 6.4: Update `attemptLabel` to remove the "of 2" cap**

Replace:
```js
function attemptLabel(game) {
  return game.attempts.length ? `Attempt ${game.attempts.length + 1} of 2` : 'Attempt 1 of 2';
}
```
With:
```js
function attemptLabel(game) {
  const n = game.attempts.length + 1;
  return `Attempt ${n}`;
}
```

- [ ] **Step 6.5: Rewrite `handleGameComplete`**

> ⚠️ **`session.name` not `session.agent`** — The design spec pseudocode uses `session.agent` throughout its code examples, but the real `createSession()` stores the agent's name as `session.name`. Use `session.name` everywhere in this file. Using `session.agent` will silently send `undefined` to every Sheets POST.

Replace the existing `handleGameComplete` function:

```js
function handleGameComplete(gameIndex, result) {
  const game = session.games[gameIndex];
  const definition = GAME_DEFINITIONS[gameIndex];
  const attemptNumber = game.attempts.length + 1; // before recordGameAttempt appends

  const outcome = recordGameAttempt(session, gameIndex, result);
  saveSession(session);
  renderShell();

  if (outcome.status === 'passed') {
    // Submit score row for this attempt
    submitAttemptScore({
      agent:    session.name,
      batchId:  session.batchId,
      game:     definition.key,
      attempt:  attemptNumber,
      scorePct: outcome.attempt.correctCount / outcome.attempt.totalCount,
      stars:    outcome.attempt.stars,
      passed:   true
    });

    // Evaluate and award badges
    const newBadges = evaluateBadges(gameIndex, result, session);
    saveSession(session); // persist earnedBadges update
    awardBadgesSequentially(newBadges, session.name);

    // Render pass interstitial then auto-advance
    renderAttemptResult(outcome, newBadges);

  } else {
    // Failed attempt — submit row (for admin visibility), show fail interstitial
    submitAttemptScore({
      agent:    session.name,
      batchId:  session.batchId,
      game:     definition.key,
      attempt:  attemptNumber,
      scorePct: outcome.attempt.correctCount / outcome.attempt.totalCount,
      stars:    0,
      passed:   false
    });
    renderFailInterstitial(outcome, gameIndex);
  }
}
```

- [ ] **Step 6.6: Update `renderAttemptResult` pass branch to accept `newBadges`**

Update the function signature to `function renderAttemptResult(outcome, newBadges = [])`.

Remove all references to `blocked` state and the `#view-results` button. The fail path is now in `renderFailInterstitial`. Keep only the pass branch:

```js
function renderAttemptResult(outcome, newBadges = []) {
  const definition = GAME_DEFINITIONS[outcome.gameIndex];
  const pct = Math.round((outcome.attempt.correctCount / outcome.attempt.totalCount) * 100);

  container.innerHTML = `
    <section class="interstitial-panel pass">
      <span class="eyebrow">// ${escapeHtml(definition.label)}</span>
      <h1>✔ MISSION CLEARED</h1>
      <div class="attempt-score">
        <strong>${outcome.attempt.score}</strong>
        <span>${outcome.attempt.correctCount}/${outcome.attempt.totalCount} CORRECT &nbsp;·&nbsp; ${pct}%</span>
      </div>
      ${definition.key === 'pin' ? '<button id="review-map" class="btn btn-secondary" type="button">⊙ Review Map</button>' : ''}
      <div class="action-row">
        <button id="continue-game" class="btn btn-primary" type="button">▶ Continue</button>
      </div>
    </section>
  `;

  const reviewButton = container.querySelector('#review-map');
  if (reviewButton) {
    reviewButton.addEventListener('click', () => {
      mountPinReview(container, () => renderAttemptResult(outcome, newBadges));
    });
  }
  container.querySelector('#continue-game').addEventListener('click', route);
}
```

- [ ] **Step 6.7: Add `renderFailInterstitial`**

Add this new function to `main.js`:

```js
const MOTIVATIONAL = [
  "Good effort — the map doesn't give up its secrets easily.",
  "Every agent improves. Retry when ready.",
  "Knowledge builds with each attempt.",
  "Almost there — one more run.",
  "Amazon explorers never stop learning."
];

function renderFailInterstitial(outcome, gameIndex) {
  const definition = GAME_DEFINITIONS[gameIndex];
  const game = session.games[gameIndex];
  const pct = Math.round((outcome.attempt.correctCount / outcome.attempt.totalCount) * 100);
  const attemptNumber = game.attempts.length; // already appended by recordGameAttempt
  const message = MOTIVATIONAL[(attemptNumber - 1) % MOTIVATIONAL.length];

  // Personal best — compare against all prior attempts (slice off current)
  const priorAttempts = game.attempts.slice(0, -1);
  const currentRatio = outcome.attempt.correctCount / outcome.attempt.totalCount;
  const priorBest = priorAttempts.length > 0
    ? Math.max(...priorAttempts.map(a => a.correctCount / a.totalCount))
    : -1;
  const isPersonalBest = attemptNumber > 1 && currentRatio > priorBest;

  // Attempt dots
  const dots = game.attempts.map((a, i) => {
    const isCurrent = i === game.attempts.length - 1;
    const cls = isCurrent ? 'current' : (a.passed ? 'pass' : 'fail');
    return `<div class="attempt-dot ${cls}"></div>`;
  }).join('');

  container.innerHTML = `
    <section class="interstitial-panel fail">
      <span class="eyebrow">// ${escapeHtml(definition.label)}</span>
      <h1>✖ RETRY REQUIRED</h1>
      <div class="attempt-dots">${dots}</div>
      ${isPersonalBest ? '<div class="personal-best">↑ NEW PERSONAL BEST</div>' : ''}
      <div class="attempt-score">
        <strong>${outcome.attempt.score}</strong>
        <span>${outcome.attempt.correctCount}/${outcome.attempt.totalCount} CORRECT &nbsp;·&nbsp; ${pct}%</span>
        <small style="display:block;margin-top:4px;color:var(--muted);font-family:Inter,sans-serif;">ATTEMPT ${attemptNumber}</small>
      </div>
      <p style="color:var(--muted);font-family:Inter,sans-serif;font-size:0.9rem;margin:12px 0 20px;">${message}</p>
      ${definition.key === 'pin' ? '<button id="review-map" class="btn btn-secondary" type="button">⊙ Review Map</button>' : ''}
      <div class="action-row">
        <button id="retry-game" class="btn btn-primary" type="button">↺ Try Again</button>
      </div>
    </section>
  `;

  const reviewButton = container.querySelector('#review-map');
  if (reviewButton) {
    reviewButton.addEventListener('click', () => {
      mountPinReview(container, () => renderFailInterstitial(outcome, gameIndex));
    });
  }

  const retryBtn = container.querySelector('#retry-game');
  startRetryCountdown(retryBtn);
  retryBtn.addEventListener('click', () => startGame(gameIndex, true));
}
```

- [ ] **Step 6.8: Add `startRetryCountdown` utility**

```js
function startRetryCountdown(btn, seconds = 3) {
  btn.disabled = true;
  let t = seconds;
  btn.textContent = `Try Again (${t})`;
  const id = setInterval(() => {
    t -= 1;
    if (t > 0) {
      btn.textContent = `Try Again (${t})`;
    } else {
      clearInterval(id);
      btn.disabled = false;
      btn.textContent = '↺ Try Again';
    }
  }, 1000);
}
```

- [ ] **Step 6.9: Add `awardBadgesSequentially` utility**

```js
function awardBadgesSequentially(badges, agent) {
  const configured = isConfigured();
  badges.forEach(({ id, name }, i) => {
    setTimeout(() => {
      if (configured) awardBadge(agent, id, name);
      showBadgeToast(name);
      playBadgeChime();
    }, i * 500);
  });
}
```

- [ ] **Step 6.10: Add `showBadgeToast` and `playBadgeChime`**

```js
function showBadgeToast(badgeName) {
  const toast = document.createElement('div');
  toast.className = 'badge-toast';
  toast.textContent = `🏅 Badge Unlocked: ${badgeName}!`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3100);
}

function playBadgeChime() {
  if (!window.AudioContext && !window.webkitAudioContext) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch { /* AudioContext blocked */ }
}
```

- [ ] **Step 6.11: Run full test suite**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 6.12: Manual smoke test**

Open `game.html` in a browser. Start Crack the Code, answer all questions incorrectly. Verify:
- Fail interstitial appears with attempt dot, motivational message
- "Try Again" button shows 3-second countdown
- Clicking Try Again starts a new game attempt
- After passing, pass interstitial appears with Continue button

- [ ] **Step 6.13: Commit**

```bash
git add js/main.js js/badges.js
git commit -m "feat: rewrite handleGameComplete with unlimited retries and fail interstitial

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Update `js/results.js` — Badge Shelf, Rank Flash, New Leaderboard Shape

Remove the old `submitScore(getSubmissionPayload())` call. Add badge shelf rendering and rank-up flash.

**Files:**
- Modify: `js/results.js`

- [ ] **Step 7.1: Update imports in `results.js`**

Replace:
```js
import { submitScore, renderLeaderboard } from './leaderboard.js';
```
With:
```js
import { fetchLeaderboard, renderLeaderboard } from './leaderboard.js';
```

Remove `getSubmissionPayload` from the session.js import since it's no longer called here.

- [ ] **Step 7.2: Replace the score submission block with leaderboard fetch**

Find the `try { const leaderboard = await submitScore(...) }` block (around line 95 of results.js). Replace entirely with:

```js
  const lbContainer = container.querySelector('#leaderboard-container');
  const submitStatus = container.querySelector('#submit-status');

  try {
    const lb = await fetchLeaderboard(session.name);
    submitStatus.textContent = '> SYNC COMPLETE.';
    submitStatus.style.color = 'var(--green)';

    renderLeaderboard(lbContainer, lb.top10, session.name);

    // Rank-up flash
    if (lb.currentRow) {
      const prevRank = session.lastKnownRank;
      const newRank  = lb.currentRow.rank;
      if (prevRank && newRank < prevRank) {
        const flash = document.createElement('div');
        flash.className = 'rank-up-flash';
        flash.textContent = `▲ Rank up! You're now #${newRank}`;
        lbContainer.insertAdjacentElement('beforebegin', flash);
        setTimeout(() => flash.remove(), 3000);
      }
      localStorage.setItem('atlas_rank_' + session.name, newRank);
      session.lastKnownRank = newRank;
    }
  } catch {
    submitStatus.textContent = '> SYNC FAILED. Check connection.';
    submitStatus.style.color = 'var(--red)';
  }

  // Badge shelf
  renderBadgeShelf(container.querySelector('#badge-shelf-container'), session.earnedBadges || []);
```

- [ ] **Step 7.3: Add `#badge-shelf-container` div to the `mountResults` HTML template**

Find the `#leaderboard-container` div in the HTML string inside `mountResults`. Add immediately after it:
```html
<div id="badge-shelf-container" style="margin-top:20px;"></div>
```

- [ ] **Step 7.4: Add `renderBadgeShelf` function to `results.js`**

```js
const ALL_BADGES = [
  { id: 'first-blood',    icon: '🚀', name: 'First Blood',    desc: 'Pass on first try' },
  { id: 'perfect-agent',  icon: '💯', name: 'Perfect Agent',  desc: '100% score' },
  { id: 'hot-streak',     icon: '🔥', name: 'Hot Streak',     desc: '3+ consecutive correct' },
  { id: 'globe-trotter',  icon: '🌎', name: 'Globe Trotter',  desc: 'Pass all 4 games' },
  { id: 'diamond-agent',  icon: '💎', name: 'Diamond Agent',  desc: 'All games on first try' },
  { id: 'star-collector', icon: '⭐', name: 'Star Collector', desc: 'Earn all 12 stars' },
  { id: 'never-quit',     icon: '🏅', name: 'Never Quit',     desc: 'Pass after 3+ fails' },
  { id: 'speed-run',      icon: '⚡', name: 'Speed Run',      desc: '100% before half time' }
];

function renderBadgeShelf(container, earnedIds = []) {
  if (!container) return;
  container.innerHTML = `
    <div class="section-heading" style="margin-bottom:12px;">
      <h2>Badges</h2>
      <span>${earnedIds.length}/${ALL_BADGES.length} earned</span>
    </div>
    <div class="badge-shelf">
      ${ALL_BADGES.map(b => {
        const earned = earnedIds.includes(b.id);
        return `
          <div class="badge-card ${earned ? 'earned' : 'locked'}">
            <span class="badge-icon">${b.icon}</span>
            <span class="badge-name">${b.name}</span>
            <span class="badge-desc">${b.desc}</span>
            <span class="badge-status">${earned ? 'EARNED' : 'LOCKED'}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
```

- [ ] **Step 7.5: Run tests**

```bash
npm test
```

Expected: all pass

- [ ] **Step 7.6: Manual smoke test**

Complete all 4 games, reach results screen. Verify leaderboard appears (even if empty when Apps Script not configured), badge shelf shows 8 badges with correct earned/locked states.

- [ ] **Step 7.7: Commit**

```bash
git add js/results.js
git commit -m "feat: update results screen with leaderboard fetch, badge shelf, rank flash

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Add CSS for All New Elements

Append all new CSS classes to `css/retro.css`. Ensure `--orange-glow` is in `:root` and `fadeInUp` keyframe is defined.

**Files:**
- Modify: `css/retro.css`

- [ ] **Step 8.1: Verify `--orange-glow` is in `:root` block**

Open `css/retro.css`, find the `:root {` block. If `--orange-glow` is not there, add:
```css
--orange-glow: 0 0 12px rgba(255,153,0,0.25);
```

- [ ] **Step 8.2: Append all new CSS at end of `retro.css`**

Add the following block at the very end of the file:

```css
/* ── Shared keyframe ── */
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
.badge-card.earned .badge-status { background: #007185; color: #fff; }
.badge-card.locked .badge-status { background: #4A5568; color: #8B95A1; }
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

/* ── Rank-up flash ── */
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
  stroke-dasharray: 150.8;
  stroke-dashoffset: 150.8;
  transition: stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1);
}
```

- [ ] **Step 8.3: Visual check**

Open `game.html`, fail a game, verify:
- Attempt dots render (red for fail, pulsing orange for current)
- Personal best banner appears when score improves
- Pass a game, verify toast notification slides in from top-right

- [ ] **Step 8.4: Commit**

```bash
git add css/retro.css
git commit -m "feat: add badge, toast, attempt-dots, personal-best, rank-flash CSS

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Update `index.html` — Progress Ring + Badge Shelf

Add the total-games-progress ring SVG around the brand mark and a badge shelf for returning users.

**Files:**
- Modify: `index.html`

- [ ] **Step 9.1: Add progress ring SVG inside the brand mark wrapper**

Find the `.brand-mark` element in `index.html`. Wrap it in a `.progress-ring-wrap` div and add the SVG:

```html
<div class="progress-ring-wrap" id="progress-ring-wrap" style="display:inline-flex;align-items:center;justify-content:center;">
  <svg width="56" height="56" viewBox="0 0 56 56" style="position:absolute;top:0;left:0;">
    <circle class="progress-ring-track" cx="28" cy="28" r="24"/>
    <circle class="progress-ring-fill"  cx="28" cy="28" r="24" id="progress-ring-fill"/>
  </svg>
  <!-- existing .brand-mark element stays here -->
  <div class="brand-mark">AE</div>
</div>
```

- [ ] **Step 9.2: Add badge shelf section below Readiness Row**

Find the Readiness Row section in `index.html`. After it, add:

```html
<div id="landing-badge-shelf" style="display:none; margin-top: 24px;">
  <div class="section-heading" style="margin-bottom:12px;">
    <h2 style="font-family:'Press Start 2P',cursive;font-size:0.7rem;color:#FF9900;">Your Badges</h2>
  </div>
  <div class="badge-shelf" id="landing-badge-shelf-inner"></div>
</div>
```

- [ ] **Step 9.3: Add inline script to populate ring and badge shelf from session storage**

At the bottom of `index.html` before `</body>`, add:

```html
<script type="module">
  import { loadSession } from './js/session.js';
  import { fetchBadges } from './js/leaderboard.js';

  const STORAGE_KEY = 'atlas-explorer-session';
  const ALL_BADGES = [
    { id: 'first-blood',    icon: '🚀', name: 'First Blood',    desc: 'Pass on first try' },
    { id: 'perfect-agent',  icon: '💯', name: 'Perfect Agent',  desc: '100% score' },
    { id: 'hot-streak',     icon: '🔥', name: 'Hot Streak',     desc: '3+ consecutive correct' },
    { id: 'globe-trotter',  icon: '🌎', name: 'Globe Trotter',  desc: 'Pass all 4 games' },
    { id: 'diamond-agent',  icon: '💎', name: 'Diamond Agent',  desc: 'All games on first try' },
    { id: 'star-collector', icon: '⭐', name: 'Star Collector', desc: 'Earn all 12 stars' },
    { id: 'never-quit',     icon: '🏅', name: 'Never Quit',     desc: 'Pass after 3+ fails' },
    { id: 'speed-run',      icon: '⚡', name: 'Speed Run',      desc: '100% before half time' }
  ];

  const session = loadSession();
  if (session) {
    // Progress ring
    const gamesPassed = session.games.filter(g => g.passed).length;
    const circ = 150.8;
    const fill = document.getElementById('progress-ring-fill');
    if (fill) {
      requestAnimationFrame(() => {
        fill.style.strokeDashoffset = circ * (1 - gamesPassed / 4);
      });
    }

    // Badge shelf
    const shelf = document.getElementById('landing-badge-shelf');
    const inner = document.getElementById('landing-badge-shelf-inner');
    if (shelf && inner) {
      fetchBadges(session.name).then(earnedIds => {
        inner.innerHTML = ALL_BADGES.map(b => {
          const earned = earnedIds.includes(b.id);
          return `
            <div class="badge-card ${earned ? 'earned' : 'locked'}">
              <span class="badge-icon">${b.icon}</span>
              <span class="badge-name">${b.name}</span>
              <span class="badge-desc">${b.desc}</span>
              <span class="badge-status">${earned ? 'EARNED' : 'LOCKED'}</span>
            </div>
          `;
        }).join('');
        shelf.style.display = 'block';
      });
    }
  }
</script>
```

- [ ] **Step 9.4: Visual check**

Open `index.html` in browser. If no session exists: ring and shelf are hidden. Complete a game and return: ring shows progress, badge shelf appears.

- [ ] **Step 9.5: Commit**

```bash
git add index.html
git commit -m "feat: add progress ring and badge shelf to landing page for returning users

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Create `docs/appscript/Code.gs` Reference File

This is the Apps Script the admin pastes into the Google Apps Script editor. Save it to the repo for reference.

**Files:**
- Create: `docs/appscript/Code.gs`

- [ ] **Step 10.1: Create the file**

```js
// Atlas Explorer — Google Apps Script
// Paste into: script.google.com → New project → Code.gs
// Then: Deploy → New deployment → Web App → Execute as: Me → Access: Anyone
// Copy the /exec URL → paste as APPS_SCRIPT_URL in js/leaderboard.js

const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
// Find Sheet ID in the Sheets URL: https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit

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
    data.attempt,
    data.scorePct,
    data.stars,
    Boolean(data.passed)
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

**Sheets setup (admin does once before deploying):**
1. Create Google Sheet named `Atlas Explorer`
2. Add 3 tabs: `Players`, `Badges`, `Leaderboard`
3. Add row 1 headers:
   - Players: `Timestamp | Agent | BatchID | Game | Attempt | ScorePct | Stars | Passed`
   - Badges: `Timestamp | Agent | BadgeID | BadgeName | EarnedOn`
   - Leaderboard row 1: `Agent | TotalStars | GamesPassed | BadgeCount`
4. In Leaderboard tab, paste these array formulas in row 2:
   ```
   A2: =UNIQUE(FILTER(Players!B2:B, Players!B2:B<>""))
   B2: =ARRAYFORMULA(SUMIF(Players!B2:B, A2:A, Players!G2:G))
   C2: =ARRAYFORMULA(COUNTIFS(Players!B2:B, A2:A, Players!H2:H, TRUE))
   D2: =ARRAYFORMULA(COUNTIF(Badges!B2:B, A2:A))
   ```

- [ ] **Step 10.2: Commit**

```bash
git add docs/appscript/Code.gs
git commit -m "docs: add Apps Script reference file with Sheets setup instructions

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 11: Final Integration Test

End-to-end verification that all pieces work together.

- [ ] **Step 11.1: Run full test suite**

```bash
npm test
```

Expected: all tests pass, output ends with `N/N tests passed`

- [ ] **Step 11.2: Manual end-to-end checklist**

Open `index.html` in a browser:
- [ ] Progress ring hidden (no session yet)
- [ ] Badge shelf hidden

Click Start, enter name + batch ID, begin Crack the Code:
- [ ] Answer all wrong → fail interstitial appears
- [ ] Attempt dot shows (red = failed, pulsing orange = current)
- [ ] Motivational message visible
- [ ] Try Again button counts down 3→2→1 then becomes active
- [ ] Clicking Try Again starts a fresh game (first question may differ)
- [ ] Second fail attempt → two dots visible (both red, new current pulsing)
- [ ] Pass on 3rd attempt → pass interstitial (green, Continue button)
- [ ] If score improved on fail: Personal Best banner visible
- [ ] Badge toast slides in for any earned badge (e.g. Hot Streak if achieved)
- [ ] Continue → next game

After all 4 games (or via completing the session):
- [ ] Results screen shows badge shelf with 8 badges (earned lit, locked dimmed)
- [ ] Leaderboard section present (may show empty if Apps Script not configured)
- [ ] No JS console errors

Return to `index.html`:
- [ ] Progress ring now shows games passed
- [ ] Badge shelf appears with current earned badges

- [ ] **Step 11.3: Final commit**

```bash
git add -A
git commit -m "chore: final integration — scoring, leaderboard, badges, engagement complete

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Notes on Preserved Code

**`getSubmissionPayload` in `session.js`:** This function and its test in `test-session.js` (`'submission payload totals scores and flags'`) are **kept as-is**. They do not conflict with the new per-attempt submission path. Do NOT remove them — they may be used by future admin reporting scripts. If a future maintainer removes `getSubmissionPayload`, they must also update `test-session.js`.

**`isFlagged` in `session.js`:** After removing `blocked` and `flagged` from the session schema in Task 1, `isFlagged` will always return `false`. Keep the function exported (returning `false`) so that `results.js` (which currently imports and calls it) does not break until that file is updated in Task 7.

---

## Apps Script Go-Live Checklist (admin action, after deployment)

Once the Apps Script is deployed and the URL is known:

1. Open `js/leaderboard.js`
2. Replace `const APPS_SCRIPT_URL = '';` with the deployed `/exec` URL
3. Commit and push
4. Verify: complete a game → check Players tab in Sheets for a new row
5. Verify: earn a badge → check Badges tab for the entry
6. Verify: open results screen → leaderboard loads from Sheets
