# Atlas Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 4-mini-game web app for training recruitment screening agents on US & Canada geography, with Google Sheets leaderboard and GitHub Pages hosting.

**Architecture:** Vanilla ES-module JavaScript, no build step. Each mini-game is a module with a `mount(container, onComplete, options)` interface. A session manager tracks scores and retry state. Google Apps Script handles leaderboard reads/writes via a publicly deployed Web App.

**Tech Stack:** HTML5, CSS3, Vanilla JS (ES modules), HTML5 Drag & Drop API, inline SVG, Google Apps Script, Google Sheets, GitHub Pages, Node.js (test runner only — no app dependencies).

---

## File Map

| File | Responsibility |
|---|---|
| `package.json` | `"type": "module"` for Node test runner; no dependencies |
| `index.html` | Landing page — name input + batch ID dropdown + Start button |
| `game.html` | Game shell — renders active mini-game into `#game-container` |
| `css/styles.css` | All styles — layout, game components, leaderboard |
| `js/scoring.js` | Pure scoring functions — points, stars, pass/fail (no DOM) |
| `js/session.js` | Session state machine — attempt tracking, blocked/flagged state |
| `js/main.js` | Game orchestrator — sequences mini-games, handles retries |
| `js/leaderboard.js` | Apps Script integration — submit, fetch, render leaderboard |
| `js/crack-the-code.js` | Mini-game 1 — abbreviation quiz, timer, difficulty progression |
| `js/pin-it.js` | Mini-game 2 — SVG map clicking, review mode |
| `js/city-sorter.js` | Mini-game 3 — drag-and-drop city placement |
| `js/region-ranger.js` | Mini-game 4 — region classification, legend toggle |
| `js/results.js` | Results screen — stars, total, submit, leaderboard, certificate |
| `data/states.json` | 63 entries: code, name, country, region, common flag |
| `data/cities.json` | 100+ cities: name, stateCode, stateName, country |
| `data/batches.json` | Predefined batch ID strings for landing page dropdown |
| `maps/north-america.svg` | Adapted Wikipedia SVG — 63 paths with `id="{CODE}"` |
| `apps-script/Code.gs` | Google Apps Script — doPost (write), doGet (leaderboard) |
| `tests/test-runner.js` | Minimal Node.js test runner |
| `tests/test-scoring.js` | Unit tests for scoring.js |
| `tests/test-session.js` | Unit tests for session.js |
| `tests/test-crack-the-code.js` | Unit tests for Crack the Code logic |
| `tests/test-city-sorter.js` | Unit tests for City Sorter logic |
| `tests/test-region-ranger.js` | Unit tests for Region Ranger logic |
| `README.md` | Setup and deployment guide |

---

## Task 1: Project Scaffold

**Files:** Create all directories and placeholder files.

- [ ] **Step 1: Initialize git repo**
```bash
cd "C:/Users/anoop/OneDrive/Desktop/AMZ"
git init
```

- [ ] **Step 2: Create package.json**
```json
{
  "name": "atlas-explorer",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "node tests/test-scoring.js && node tests/test-session.js && node tests/test-crack-the-code.js && node tests/test-pin-it.js && node tests/test-city-sorter.js && node tests/test-region-ranger.js"
  }
}
```

- [ ] **Step 3: Create directory structure**
```bash
mkdir -p css js data maps apps-script tests assets
touch assets/.gitkeep
```

- [ ] **Step 4: Create .gitignore**
```
.DS_Store
Thumbs.db
*.log
node_modules/
```

- [ ] **Step 5: Create placeholder JS files** — each with one comment line so they're valid ES modules
```bash
for f in scoring session main leaderboard crack-the-code pin-it city-sorter region-ranger results; do
  echo "// $f.js" > js/$f.js
done
```

- [ ] **Step 6: Create placeholder HTML, CSS, SVG**
```bash
echo "<!DOCTYPE html><html><body>Coming soon</body></html>" > index.html
echo "<!DOCTYPE html><html><body><div id='game-container'></div></body></html>" > game.html
touch css/styles.css maps/north-america.svg apps-script/Code.gs README.md
```

- [ ] **Step 7: Create placeholder data files**
```bash
echo "[]" > data/states.json
echo "[]" > data/cities.json
echo "[]" > data/batches.json
```

- [ ] **Step 8: Create placeholder test files**
```bash
for f in test-runner test-scoring test-session test-crack-the-code test-city-sorter test-region-ranger; do
  echo "// $f.js" > tests/$f.js
done
```

- [ ] **Step 9: Commit**
```bash
git add -A
git commit -m "chore: project scaffold"
```

---

## Task 2: Data Files

**Files:** Write `data/states.json`, `data/cities.json`, `data/batches.json`

- [ ] **Step 1: Write data/batches.json**
```json
[
  "APR-2026-01",
  "APR-2026-02",
  "MAY-2026-01",
  "MAY-2026-02",
  "JUN-2026-01",
  "JUN-2026-02"
]
```
Add more batches here before each new cohort starts.

- [ ] **Step 2: Write data/states.json** (63 entries — all 50 US states + 13 Canadian provinces/territories)

Fields: `code` (abbreviation), `name` (full name), `country` ("US" or "CA"), `region` (one of: Northeast, Southeast, Midwest, Southwest, West, Eastern Canada, Western Canada), `common` (true = in the 20-item priority pool for Crack the Code first 10 questions).

Common pool (20 items, `common: true`): TX, CA, NY, FL, IL, WA, GA, PA, OH, NC, AZ, MI, VA, CO, MA, TN, NJ, WI (18 US) + ON, BC (2 CA).

```json
[
  {"code":"AL","name":"Alabama","country":"US","region":"Southeast","common":false},
  {"code":"AK","name":"Alaska","country":"US","region":"West","common":false},
  {"code":"AZ","name":"Arizona","country":"US","region":"Southwest","common":true},
  {"code":"AR","name":"Arkansas","country":"US","region":"Southeast","common":false},
  {"code":"CA","name":"California","country":"US","region":"West","common":true},
  {"code":"CO","name":"Colorado","country":"US","region":"West","common":true},
  {"code":"CT","name":"Connecticut","country":"US","region":"Northeast","common":false},
  {"code":"DE","name":"Delaware","country":"US","region":"Northeast","common":false},
  {"code":"FL","name":"Florida","country":"US","region":"Southeast","common":true},
  {"code":"GA","name":"Georgia","country":"US","region":"Southeast","common":true},
  {"code":"HI","name":"Hawaii","country":"US","region":"West","common":false},
  {"code":"ID","name":"Idaho","country":"US","region":"West","common":false},
  {"code":"IL","name":"Illinois","country":"US","region":"Midwest","common":true},
  {"code":"IN","name":"Indiana","country":"US","region":"Midwest","common":false},
  {"code":"IA","name":"Iowa","country":"US","region":"Midwest","common":false},
  {"code":"KS","name":"Kansas","country":"US","region":"Midwest","common":false},
  {"code":"KY","name":"Kentucky","country":"US","region":"Southeast","common":false},
  {"code":"LA","name":"Louisiana","country":"US","region":"Southeast","common":false},
  {"code":"ME","name":"Maine","country":"US","region":"Northeast","common":false},
  {"code":"MD","name":"Maryland","country":"US","region":"Northeast","common":false},
  {"code":"MA","name":"Massachusetts","country":"US","region":"Northeast","common":true},
  {"code":"MI","name":"Michigan","country":"US","region":"Midwest","common":true},
  {"code":"MN","name":"Minnesota","country":"US","region":"Midwest","common":false},
  {"code":"MS","name":"Mississippi","country":"US","region":"Southeast","common":false},
  {"code":"MO","name":"Missouri","country":"US","region":"Midwest","common":false},
  {"code":"MT","name":"Montana","country":"US","region":"West","common":false},
  {"code":"NE","name":"Nebraska","country":"US","region":"Midwest","common":false},
  {"code":"NV","name":"Nevada","country":"US","region":"West","common":false},
  {"code":"NH","name":"New Hampshire","country":"US","region":"Northeast","common":false},
  {"code":"NJ","name":"New Jersey","country":"US","region":"Northeast","common":true},
  {"code":"NM","name":"New Mexico","country":"US","region":"Southwest","common":false},
  {"code":"NY","name":"New York","country":"US","region":"Northeast","common":true},
  {"code":"NC","name":"North Carolina","country":"US","region":"Southeast","common":true},
  {"code":"ND","name":"North Dakota","country":"US","region":"Midwest","common":false},
  {"code":"OH","name":"Ohio","country":"US","region":"Midwest","common":true},
  {"code":"OK","name":"Oklahoma","country":"US","region":"Southwest","common":false},
  {"code":"OR","name":"Oregon","country":"US","region":"West","common":false},
  {"code":"PA","name":"Pennsylvania","country":"US","region":"Northeast","common":true},
  {"code":"RI","name":"Rhode Island","country":"US","region":"Northeast","common":false},
  {"code":"SC","name":"South Carolina","country":"US","region":"Southeast","common":false},
  {"code":"SD","name":"South Dakota","country":"US","region":"Midwest","common":false},
  {"code":"TN","name":"Tennessee","country":"US","region":"Southeast","common":true},
  {"code":"TX","name":"Texas","country":"US","region":"Southwest","common":true},
  {"code":"UT","name":"Utah","country":"US","region":"West","common":false},
  {"code":"VT","name":"Vermont","country":"US","region":"Northeast","common":false},
  {"code":"VA","name":"Virginia","country":"US","region":"Southeast","common":true},
  {"code":"WA","name":"Washington","country":"US","region":"West","common":true},
  {"code":"WV","name":"West Virginia","country":"US","region":"Southeast","common":false},
  {"code":"WI","name":"Wisconsin","country":"US","region":"Midwest","common":true},
  {"code":"WY","name":"Wyoming","country":"US","region":"West","common":false},
  {"code":"AB","name":"Alberta","country":"CA","region":"Western Canada","common":false},
  {"code":"BC","name":"British Columbia","country":"CA","region":"Western Canada","common":true},
  {"code":"MB","name":"Manitoba","country":"CA","region":"Western Canada","common":false},
  {"code":"NB","name":"New Brunswick","country":"CA","region":"Eastern Canada","common":false},
  {"code":"NL","name":"Newfoundland and Labrador","country":"CA","region":"Eastern Canada","common":false},
  {"code":"NS","name":"Nova Scotia","country":"CA","region":"Eastern Canada","common":false},
  {"code":"NT","name":"Northwest Territories","country":"CA","region":"Western Canada","common":false},
  {"code":"NU","name":"Nunavut","country":"CA","region":"Eastern Canada","common":false},
  {"code":"ON","name":"Ontario","country":"CA","region":"Eastern Canada","common":true},
  {"code":"PE","name":"Prince Edward Island","country":"CA","region":"Eastern Canada","common":false},
  {"code":"QC","name":"Quebec","country":"CA","region":"Eastern Canada","common":false},
  {"code":"SK","name":"Saskatchewan","country":"CA","region":"Western Canada","common":false},
  {"code":"YT","name":"Yukon","country":"CA","region":"Western Canada","common":false}
]
```

- [ ] **Step 3: Write data/cities.json** — used by City Sorter. Each state used in City Sorter must have at least 2 cities. Fields: `name`, `stateCode`, `stateName`, `country`.

```json
[
  {"name":"Houston","stateCode":"TX","stateName":"Texas","country":"US"},
  {"name":"Dallas","stateCode":"TX","stateName":"Texas","country":"US"},
  {"name":"San Antonio","stateCode":"TX","stateName":"Texas","country":"US"},
  {"name":"Austin","stateCode":"TX","stateName":"Texas","country":"US"},
  {"name":"Fort Worth","stateCode":"TX","stateName":"Texas","country":"US"},
  {"name":"El Paso","stateCode":"TX","stateName":"Texas","country":"US"},
  {"name":"Los Angeles","stateCode":"CA","stateName":"California","country":"US"},
  {"name":"San Francisco","stateCode":"CA","stateName":"California","country":"US"},
  {"name":"San Diego","stateCode":"CA","stateName":"California","country":"US"},
  {"name":"San Jose","stateCode":"CA","stateName":"California","country":"US"},
  {"name":"Sacramento","stateCode":"CA","stateName":"California","country":"US"},
  {"name":"Fresno","stateCode":"CA","stateName":"California","country":"US"},
  {"name":"Oakland","stateCode":"CA","stateName":"California","country":"US"},
  {"name":"New York City","stateCode":"NY","stateName":"New York","country":"US"},
  {"name":"Buffalo","stateCode":"NY","stateName":"New York","country":"US"},
  {"name":"Rochester","stateCode":"NY","stateName":"New York","country":"US"},
  {"name":"Yonkers","stateCode":"NY","stateName":"New York","country":"US"},
  {"name":"Syracuse","stateCode":"NY","stateName":"New York","country":"US"},
  {"name":"Miami","stateCode":"FL","stateName":"Florida","country":"US"},
  {"name":"Tampa","stateCode":"FL","stateName":"Florida","country":"US"},
  {"name":"Orlando","stateCode":"FL","stateName":"Florida","country":"US"},
  {"name":"Jacksonville","stateCode":"FL","stateName":"Florida","country":"US"},
  {"name":"Fort Lauderdale","stateCode":"FL","stateName":"Florida","country":"US"},
  {"name":"St. Petersburg","stateCode":"FL","stateName":"Florida","country":"US"},
  {"name":"Chicago","stateCode":"IL","stateName":"Illinois","country":"US"},
  {"name":"Aurora","stateCode":"IL","stateName":"Illinois","country":"US"},
  {"name":"Naperville","stateCode":"IL","stateName":"Illinois","country":"US"},
  {"name":"Rockford","stateCode":"IL","stateName":"Illinois","country":"US"},
  {"name":"Seattle","stateCode":"WA","stateName":"Washington","country":"US"},
  {"name":"Spokane","stateCode":"WA","stateName":"Washington","country":"US"},
  {"name":"Tacoma","stateCode":"WA","stateName":"Washington","country":"US"},
  {"name":"Bellevue","stateCode":"WA","stateName":"Washington","country":"US"},
  {"name":"Atlanta","stateCode":"GA","stateName":"Georgia","country":"US"},
  {"name":"Savannah","stateCode":"GA","stateName":"Georgia","country":"US"},
  {"name":"Augusta","stateCode":"GA","stateName":"Georgia","country":"US"},
  {"name":"Columbus","stateCode":"GA","stateName":"Georgia","country":"US"},
  {"name":"Philadelphia","stateCode":"PA","stateName":"Pennsylvania","country":"US"},
  {"name":"Pittsburgh","stateCode":"PA","stateName":"Pennsylvania","country":"US"},
  {"name":"Allentown","stateCode":"PA","stateName":"Pennsylvania","country":"US"},
  {"name":"Erie","stateCode":"PA","stateName":"Pennsylvania","country":"US"},
  {"name":"Columbus","stateCode":"OH","stateName":"Ohio","country":"US"},
  {"name":"Cleveland","stateCode":"OH","stateName":"Ohio","country":"US"},
  {"name":"Cincinnati","stateCode":"OH","stateName":"Ohio","country":"US"},
  {"name":"Toledo","stateCode":"OH","stateName":"Ohio","country":"US"},
  {"name":"Akron","stateCode":"OH","stateName":"Ohio","country":"US"},
  {"name":"Charlotte","stateCode":"NC","stateName":"North Carolina","country":"US"},
  {"name":"Raleigh","stateCode":"NC","stateName":"North Carolina","country":"US"},
  {"name":"Greensboro","stateCode":"NC","stateName":"North Carolina","country":"US"},
  {"name":"Durham","stateCode":"NC","stateName":"North Carolina","country":"US"},
  {"name":"Winston-Salem","stateCode":"NC","stateName":"North Carolina","country":"US"},
  {"name":"Phoenix","stateCode":"AZ","stateName":"Arizona","country":"US"},
  {"name":"Tucson","stateCode":"AZ","stateName":"Arizona","country":"US"},
  {"name":"Mesa","stateCode":"AZ","stateName":"Arizona","country":"US"},
  {"name":"Scottsdale","stateCode":"AZ","stateName":"Arizona","country":"US"},
  {"name":"Chandler","stateCode":"AZ","stateName":"Arizona","country":"US"},
  {"name":"Detroit","stateCode":"MI","stateName":"Michigan","country":"US"},
  {"name":"Grand Rapids","stateCode":"MI","stateName":"Michigan","country":"US"},
  {"name":"Warren","stateCode":"MI","stateName":"Michigan","country":"US"},
  {"name":"Ann Arbor","stateCode":"MI","stateName":"Michigan","country":"US"},
  {"name":"Virginia Beach","stateCode":"VA","stateName":"Virginia","country":"US"},
  {"name":"Norfolk","stateCode":"VA","stateName":"Virginia","country":"US"},
  {"name":"Richmond","stateCode":"VA","stateName":"Virginia","country":"US"},
  {"name":"Arlington","stateCode":"VA","stateName":"Virginia","country":"US"},
  {"name":"Denver","stateCode":"CO","stateName":"Colorado","country":"US"},
  {"name":"Colorado Springs","stateCode":"CO","stateName":"Colorado","country":"US"},
  {"name":"Aurora","stateCode":"CO","stateName":"Colorado","country":"US"},
  {"name":"Fort Collins","stateCode":"CO","stateName":"Colorado","country":"US"},
  {"name":"Boston","stateCode":"MA","stateName":"Massachusetts","country":"US"},
  {"name":"Worcester","stateCode":"MA","stateName":"Massachusetts","country":"US"},
  {"name":"Springfield","stateCode":"MA","stateName":"Massachusetts","country":"US"},
  {"name":"Lowell","stateCode":"MA","stateName":"Massachusetts","country":"US"},
  {"name":"Nashville","stateCode":"TN","stateName":"Tennessee","country":"US"},
  {"name":"Memphis","stateCode":"TN","stateName":"Tennessee","country":"US"},
  {"name":"Knoxville","stateCode":"TN","stateName":"Tennessee","country":"US"},
  {"name":"Chattanooga","stateCode":"TN","stateName":"Tennessee","country":"US"},
  {"name":"Newark","stateCode":"NJ","stateName":"New Jersey","country":"US"},
  {"name":"Jersey City","stateCode":"NJ","stateName":"New Jersey","country":"US"},
  {"name":"Paterson","stateCode":"NJ","stateName":"New Jersey","country":"US"},
  {"name":"Elizabeth","stateCode":"NJ","stateName":"New Jersey","country":"US"},
  {"name":"Milwaukee","stateCode":"WI","stateName":"Wisconsin","country":"US"},
  {"name":"Madison","stateCode":"WI","stateName":"Wisconsin","country":"US"},
  {"name":"Green Bay","stateCode":"WI","stateName":"Wisconsin","country":"US"},
  {"name":"Las Vegas","stateCode":"NV","stateName":"Nevada","country":"US"},
  {"name":"Henderson","stateCode":"NV","stateName":"Nevada","country":"US"},
  {"name":"Reno","stateCode":"NV","stateName":"Nevada","country":"US"},
  {"name":"Minneapolis","stateCode":"MN","stateName":"Minnesota","country":"US"},
  {"name":"Saint Paul","stateCode":"MN","stateName":"Minnesota","country":"US"},
  {"name":"Rochester","stateCode":"MN","stateName":"Minnesota","country":"US"},
  {"name":"Kansas City","stateCode":"MO","stateName":"Missouri","country":"US"},
  {"name":"St. Louis","stateCode":"MO","stateName":"Missouri","country":"US"},
  {"name":"Indianapolis","stateCode":"IN","stateName":"Indiana","country":"US"},
  {"name":"Fort Wayne","stateCode":"IN","stateName":"Indiana","country":"US"},
  {"name":"Louisville","stateCode":"KY","stateName":"Kentucky","country":"US"},
  {"name":"Lexington","stateCode":"KY","stateName":"Kentucky","country":"US"},
  {"name":"Portland","stateCode":"OR","stateName":"Oregon","country":"US"},
  {"name":"Eugene","stateCode":"OR","stateName":"Oregon","country":"US"},
  {"name":"Salt Lake City","stateCode":"UT","stateName":"Utah","country":"US"},
  {"name":"Provo","stateCode":"UT","stateName":"Utah","country":"US"},
  {"name":"Albuquerque","stateCode":"NM","stateName":"New Mexico","country":"US"},
  {"name":"Santa Fe","stateCode":"NM","stateName":"New Mexico","country":"US"},
  {"name":"New Orleans","stateCode":"LA","stateName":"Louisiana","country":"US"},
  {"name":"Baton Rouge","stateCode":"LA","stateName":"Louisiana","country":"US"},
  {"name":"Oklahoma City","stateCode":"OK","stateName":"Oklahoma","country":"US"},
  {"name":"Tulsa","stateCode":"OK","stateName":"Oklahoma","country":"US"},
  {"name":"Toronto","stateCode":"ON","stateName":"Ontario","country":"CA"},
  {"name":"Ottawa","stateCode":"ON","stateName":"Ontario","country":"CA"},
  {"name":"Mississauga","stateCode":"ON","stateName":"Ontario","country":"CA"},
  {"name":"Hamilton","stateCode":"ON","stateName":"Ontario","country":"CA"},
  {"name":"Brampton","stateCode":"ON","stateName":"Ontario","country":"CA"},
  {"name":"Vancouver","stateCode":"BC","stateName":"British Columbia","country":"CA"},
  {"name":"Surrey","stateCode":"BC","stateName":"British Columbia","country":"CA"},
  {"name":"Burnaby","stateCode":"BC","stateName":"British Columbia","country":"CA"},
  {"name":"Victoria","stateCode":"BC","stateName":"British Columbia","country":"CA"},
  {"name":"Calgary","stateCode":"AB","stateName":"Alberta","country":"CA"},
  {"name":"Edmonton","stateCode":"AB","stateName":"Alberta","country":"CA"},
  {"name":"Red Deer","stateCode":"AB","stateName":"Alberta","country":"CA"},
  {"name":"Montreal","stateCode":"QC","stateName":"Quebec","country":"CA"},
  {"name":"Quebec City","stateCode":"QC","stateName":"Quebec","country":"CA"},
  {"name":"Laval","stateCode":"QC","stateName":"Quebec","country":"CA"},
  {"name":"Winnipeg","stateCode":"MB","stateName":"Manitoba","country":"CA"},
  {"name":"Brandon","stateCode":"MB","stateName":"Manitoba","country":"CA"},
  {"name":"Saskatoon","stateCode":"SK","stateName":"Saskatchewan","country":"CA"},
  {"name":"Regina","stateCode":"SK","stateName":"Saskatchewan","country":"CA"},
  {"name":"Halifax","stateCode":"NS","stateName":"Nova Scotia","country":"CA"},
  {"name":"Dartmouth","stateCode":"NS","stateName":"Nova Scotia","country":"CA"},
  {"name":"Moncton","stateCode":"NB","stateName":"New Brunswick","country":"CA"},
  {"name":"Fredericton","stateCode":"NB","stateName":"New Brunswick","country":"CA"},
  {"name":"St. John's","stateCode":"NL","stateName":"Newfoundland and Labrador","country":"CA"},
  {"name":"Charlottetown","stateCode":"PE","stateName":"Prince Edward Island","country":"CA"},
  {"name":"Whitehorse","stateCode":"YT","stateName":"Yukon","country":"CA"},
  {"name":"Yellowknife","stateCode":"NT","stateName":"Northwest Territories","country":"CA"},
  {"name":"Iqaluit","stateCode":"NU","stateName":"Nunavut","country":"CA"}
]
```

**Note:** Columbus appears twice (GA and OH). This is intentional and tests agent awareness — city names are not unique. City Sorter will display state buckets to disambiguate.

- [ ] **Step 4: Commit**
```bash
git add data/
git commit -m "feat: add states, cities, and batches data files"
```

---

## Task 3: Test Runner + Scoring Engine

**Files:**
- Create: `tests/test-runner.js`
- Create: `tests/test-scoring.js`
- Write: `js/scoring.js`

- [ ] **Step 1: Write tests/test-runner.js**
```javascript
// tests/test-runner.js
let passed = 0;
let failed = 0;
let suiteName = '';

export function suite(name) {
  suiteName = name;
  console.log(`\n${name}`);
}

export function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
}

export function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

export function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function summary() {
  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}
```

- [ ] **Step 2: Write tests/test-scoring.js**
```javascript
// tests/test-scoring.js
import { suite, test, assertEqual, assert, summary } from './test-runner.js';
import { calculatePoints, calculateStars, isPassed } from '../js/scoring.js';

suite('calculatePoints');

test('correct answer with no speed bonus returns 10', () => {
  assertEqual(calculatePoints(true, 25, 20), 10);
});

test('correct answer within speed window returns 13', () => {
  assertEqual(calculatePoints(true, 15, 20), 13);
});

test('correct answer exactly at speed window boundary returns 13', () => {
  assertEqual(calculatePoints(true, 20, 20), 13);
});

test('wrong answer returns 0 regardless of time', () => {
  assertEqual(calculatePoints(false, 5, 20), 0);
});

suite('calculateStars');

test('95% or above returns 3 stars', () => {
  assertEqual(calculateStars(19, 20), 3);
  assertEqual(calculateStars(20, 20), 3);
});

test('80-94% returns 2 stars', () => {
  assertEqual(calculateStars(16, 20), 2);
  assertEqual(calculateStars(18, 20), 2);
});

test('70-79% returns 1 star', () => {
  assertEqual(calculateStars(14, 20), 1);
  assertEqual(calculateStars(15, 20), 1);
});

test('below 70% returns 0 stars', () => {
  assertEqual(calculateStars(13, 20), 0);
  assertEqual(calculateStars(0, 20), 0);
});

suite('isPassed');

test('Game 1 (20 questions): 14 correct passes (70% exactly)', () => {
  assert(isPassed(14, 20));
});

test('Game 1: 13 correct fails', () => {
  assert(!isPassed(13, 20));
});

test('Game 2 (15 questions): 11 correct passes (ceiling of 10.5)', () => {
  assert(isPassed(11, 15));
});

test('Game 2: 10 correct fails', () => {
  assert(!isPassed(10, 15));
});

test('Game 3 (24 placements): 17 correct passes (ceiling of 16.8)', () => {
  assert(isPassed(17, 24));
});

test('Game 3: 16 correct fails', () => {
  assert(!isPassed(16, 24));
});

summary();
```

- [ ] **Step 3: Run test to verify it fails**
```bash
node tests/test-scoring.js
```
Expected: errors about `scoring.js` exports not found.

- [ ] **Step 4: Write js/scoring.js**
```javascript
// js/scoring.js
export const CORRECT_POINTS = 10;
export const SPEED_BONUS_POINTS = 3;

/**
 * Points for a single timed answer.
 * @param {boolean} isCorrect
 * @param {number} timeElapsed - seconds since question appeared
 * @param {number} speedWindow - seconds within which speed bonus applies
 * @returns {number} 0, 10, or 13
 */
export function calculatePoints(isCorrect, timeElapsed, speedWindow) {
  if (!isCorrect) return 0;
  return CORRECT_POINTS + (timeElapsed <= speedWindow ? SPEED_BONUS_POINTS : 0);
}

/**
 * Star rating based on percentage correct.
 * @param {number} correctCount
 * @param {number} totalCount
 * @returns {number} 0–3
 */
export function calculateStars(correctCount, totalCount) {
  if (totalCount === 0) return 0;
  const pct = correctCount / totalCount;
  if (pct >= 0.95) return 3;
  if (pct >= 0.80) return 2;
  if (pct >= 0.70) return 1;
  return 0;
}

/**
 * Pass/fail check using ceiling(70%) threshold.
 * @param {number} correctCount
 * @param {number} totalCount
 * @returns {boolean}
 */
export function isPassed(correctCount, totalCount) {
  return correctCount >= Math.ceil(totalCount * 0.70);
}
```

- [ ] **Step 5: Run test to verify it passes**
```bash
node tests/test-scoring.js
```
Expected: all tests pass, 0 failed.

- [ ] **Step 6: Commit**
```bash
git add js/scoring.js tests/test-runner.js tests/test-scoring.js
git commit -m "feat: scoring engine with tests"
```

---

## Task 4: Session Manager

**Files:**
- Create: `tests/test-session.js`
- Write: `js/session.js`

- [ ] **Step 1: Write tests/test-session.js**
```javascript
// tests/test-session.js
import { suite, test, assertEqual, assert, summary } from './test-runner.js';
import {
  createSession, recordAttempt, isFlagged, isAllPassed,
  getTotalScore, getTotalStars, getSubmissionPayload
} from '../js/session.js';

suite('createSession');

test('creates session with 4 games all zeroed', () => {
  const s = createSession('Priya', 'APR-2026-01');
  assertEqual(s.name, 'Priya');
  assertEqual(s.batchId, 'APR-2026-01');
  assertEqual(s.games.length, 4);
  assertEqual(s.games[0].score, 0);
  assertEqual(s.games[0].attempts, 0);
  assertEqual(s.games[0].passed, false);
  assertEqual(s.games[0].blocked, false);
});

suite('recordAttempt — pass on first try');

test('passed=true, attempts=1, not blocked', () => {
  const s = createSession('A', 'B1');
  const result = recordAttempt(s, 0, { score: 130, correctCount: 14, totalCount: 20 });
  assertEqual(result.passed, true);
  assertEqual(result.blocked, false);
  assertEqual(s.games[0].passed, true);
  assertEqual(s.games[0].attempts, 1);
  assertEqual(s.games[0].score, 130);
  assertEqual(s.games[0].stars, 1); // 14/20 = 70% = 1 star
});

suite('recordAttempt — fail then pass (retry)');

test('first attempt fails, second passes', () => {
  const s = createSession('A', 'B1');
  recordAttempt(s, 0, { score: 80, correctCount: 10, totalCount: 20 });
  const result = recordAttempt(s, 0, { score: 150, correctCount: 16, totalCount: 20 });
  assertEqual(result.passed, true);
  assertEqual(result.blocked, false);
  assertEqual(s.games[0].passed, true);
  assertEqual(s.games[0].attempts, 2);
  assertEqual(s.games[0].score, 150); // keeps higher score
});

suite('recordAttempt — fail twice (blocked)');

test('two failures block agent, keeps higher score', () => {
  const s = createSession('A', 'B1');
  recordAttempt(s, 0, { score: 100, correctCount: 12, totalCount: 20 });
  const result = recordAttempt(s, 0, { score: 90, correctCount: 11, totalCount: 20 });
  assertEqual(result.blocked, true);
  assertEqual(s.games[0].blocked, true);
  assertEqual(s.games[0].passed, false);
  assertEqual(s.games[0].score, 100); // keeps first (higher)
  assertEqual(s.games[0].stars, 0);   // both below 70%
});

suite('isFlagged, isAllPassed');

test('flagged when any game blocked', () => {
  const s = createSession('A', 'B1');
  recordAttempt(s, 0, { score: 80, correctCount: 10, totalCount: 20 });
  recordAttempt(s, 0, { score: 80, correctCount: 10, totalCount: 20 });
  assert(isFlagged(s));
});

test('not flagged when all passed', () => {
  const s = createSession('A', 'B1');
  [0,1,2,3].forEach(i => recordAttempt(s, i, { score: 140, correctCount: 14, totalCount: 20 }));
  assert(!isFlagged(s));
  assert(isAllPassed(s));
});

suite('getSubmissionPayload');

test('payload has all required fields', () => {
  const s = createSession('Priya Sharma', 'APR-2026-01');
  [0,1,2,3].forEach(i => recordAttempt(s, i, { score: 140, correctCount: 14, totalCount: 20 }));
  const p = getSubmissionPayload(s);
  assertEqual(p.name, 'Priya Sharma');
  assertEqual(p.batchId, 'APR-2026-01');
  assertEqual(p.passFail, 'Pass');
  assertEqual(p.flagged, 'No');
  assertEqual(p.total, 560);
});

summary();
```

- [ ] **Step 2: Run test to verify it fails**
```bash
node tests/test-session.js
```
Expected: import errors.

- [ ] **Step 3: Write js/session.js**
```javascript
// js/session.js
import { calculateStars, isPassed } from './scoring.js';

export function createSession(name, batchId) {
  return {
    name,
    batchId,
    games: Array.from({ length: 4 }, () => ({
      score: 0,
      correctCount: 0,
      totalCount: 0,
      attempts: 0,
      passed: false,
      blocked: false,
      stars: 0,
    })),
  };
}

/**
 * Record one attempt for a game.
 * @param {object} session
 * @param {number} gameIndex 0–3
 * @param {{score: number, correctCount: number, totalCount: number}} result
 * @returns {{passed: boolean, blocked: boolean}}
 */
export function recordAttempt(session, gameIndex, { score, correctCount, totalCount }) {
  const game = session.games[gameIndex];
  game.attempts++;
  const passed = isPassed(correctCount, totalCount);
  const stars = calculateStars(correctCount, totalCount);

  // Always keep the higher score
  if (score > game.score) {
    game.score = score;
    game.correctCount = correctCount;
    game.totalCount = totalCount;
    game.stars = stars;
  }

  if (passed) {
    game.passed = true;
  } else if (game.attempts >= 2) {
    game.blocked = true;
    game.stars = 0; // both attempts below 70%
  }

  return { passed: game.passed, blocked: game.blocked };
}

export function isFlagged(session) {
  return session.games.some(g => g.blocked);
}

export function isAllPassed(session) {
  return session.games.every(g => g.passed);
}

export function getTotalScore(session) {
  return session.games.reduce((sum, g) => sum + g.score, 0);
}

export function getTotalStars(session) {
  return session.games.reduce((sum, g) => sum + g.stars, 0);
}

export function getSubmissionPayload(session) {
  return {
    name: session.name,
    batchId: session.batchId,
    game1: session.games[0].score,
    game2: session.games[1].score,
    game3: session.games[2].score,
    game4: session.games[3].score,
    total: getTotalScore(session),
    stars: getTotalStars(session),
    passFail: isAllPassed(session) ? 'Pass' : 'Fail',
    flagged: isFlagged(session) ? 'Yes' : 'No',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**
```bash
node tests/test-session.js
```
Expected: all tests pass.

- [ ] **Step 5: Commit**
```bash
git add js/session.js tests/test-session.js
git commit -m "feat: session manager with tests"
```

---

## Task 5: CSS & Landing Page

**Files:**
- Write: `css/styles.css`
- Write: `index.html`

- [ ] **Step 1: Write css/styles.css**
```css
/* css/styles.css */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --primary: #1a3c5e;
  --accent: #f5a623;
  --success: #27ae60;
  --danger: #e74c3c;
  --bg: #f0f4f8;
  --card: #ffffff;
  --text: #2c3e50;
  --muted: #7f8c8d;
  --radius: 8px;
  --shadow: 0 2px 12px rgba(0,0,0,0.1);
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ─── Landing Page ─────────────────────────────────── */
.landing-card {
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 48px 40px;
  width: 100%;
  max-width: 480px;
  text-align: center;
}

.landing-card .logo {
  width: 180px;
  margin-bottom: 24px;
}

.landing-card h1 {
  font-size: 1.8rem;
  color: var(--primary);
  margin-bottom: 8px;
}

.landing-card p {
  color: var(--muted);
  margin-bottom: 32px;
  font-size: 0.95rem;
}

.form-group {
  text-align: left;
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 0.9rem;
  color: var(--primary);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px 14px;
  border: 2px solid #dce3ea;
  border-radius: var(--radius);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  border-color: var(--primary);
}

/* ─── Buttons ───────────────────────────────────────── */
.btn {
  display: inline-block;
  padding: 14px 28px;
  border: none;
  border-radius: var(--radius);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}

.btn:active { transform: scale(0.98); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-primary { background: var(--primary); color: #fff; width: 100%; }
.btn-accent  { background: var(--accent); color: #fff; }
.btn-success { background: var(--success); color: #fff; }

/* ─── Game Shell ────────────────────────────────────── */
#game-container {
  width: 100%;
  max-width: 860px;
  padding: 24px;
}

/* ─── Game Card (shared by all mini-games) ──────────── */
.game-card {
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 32px;
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.game-title { font-size: 1.3rem; color: var(--primary); font-weight: 700; }
.game-progress { color: var(--muted); font-size: 0.9rem; }

.timer-bar {
  height: 6px;
  background: #dce3ea;
  border-radius: 3px;
  margin-bottom: 24px;
  overflow: hidden;
}

.timer-bar-fill {
  height: 100%;
  background: var(--accent);
  transition: width 1s linear;
}

.timer-bar-fill.warning { background: var(--danger); }

/* ─── Crack the Code ────────────────────────────────── */
.code-display {
  font-size: 4rem;
  font-weight: 800;
  color: var(--primary);
  text-align: center;
  letter-spacing: 0.1em;
  margin: 24px 0;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
}

.option-btn {
  padding: 16px;
  border: 2px solid #dce3ea;
  border-radius: var(--radius);
  background: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  text-align: center;
}

.option-btn:hover { border-color: var(--primary); }
.option-btn.correct { border-color: var(--success); background: #eafaf1; }
.option-btn.wrong   { border-color: var(--danger);  background: #fdedec; }
.option-btn:disabled { cursor: default; }

/* ─── Pin It! ───────────────────────────────────────── */
.pin-it-prompt {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  color: var(--primary);
  margin-bottom: 16px;
}

#map-container svg {
  width: 100%;
  height: auto;
  display: block;
}

#map-container path {
  fill: #cdd9e5;
  stroke: #fff;
  stroke-width: 1;
  cursor: pointer;
  transition: fill 0.15s;
}

#map-container path:hover { fill: #a8c4d8; }
#map-container path.correct { fill: var(--success) !important; }
#map-container path.wrong   { fill: var(--danger) !important; }
#map-container path.review-mode { cursor: pointer; }
#map-container path.review-mode:hover { fill: var(--accent); }

.map-tooltip {
  position: fixed;
  background: var(--primary);
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
  pointer-events: none;
  display: none;
  z-index: 100;
}

/* ─── City Sorter ───────────────────────────────────── */
.sorter-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.city-cards-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 60px;
  padding: 12px;
  border: 2px dashed #dce3ea;
  border-radius: var(--radius);
}

.city-card {
  padding: 10px 18px;
  background: var(--primary);
  color: #fff;
  border-radius: var(--radius);
  cursor: grab;
  font-weight: 600;
  user-select: none;
}

.city-card.dragging { opacity: 0.5; }

.buckets-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.bucket {
  min-height: 120px;
  border: 2px dashed #dce3ea;
  border-radius: var(--radius);
  padding: 12px;
  transition: border-color 0.15s, background 0.15s;
}

.bucket.drag-over {
  border-color: var(--accent);
  background: #fff8ec;
}

.bucket-label {
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 8px;
  font-size: 0.9rem;
  text-align: center;
}

.bucket .city-card {
  margin-bottom: 6px;
  cursor: default;
  font-size: 0.85rem;
}

.bucket .city-card.placed-correct { background: var(--success); }
.bucket .city-card.placed-wrong   { background: var(--danger); }

/* ─── Region Ranger ─────────────────────────────────── */
.region-prompt {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--primary);
  text-align: center;
  margin: 16px 0 24px;
}

.region-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.region-btn {
  padding: 14px;
  border: 2px solid #dce3ea;
  border-radius: var(--radius);
  background: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.region-btn:hover   { border-color: var(--primary); }
.region-btn.correct { border-color: var(--success); background: #eafaf1; }
.region-btn.wrong   { border-color: var(--danger);  background: #fdedec; }

.region-legend {
  margin-top: 20px;
  text-align: center;
}

.region-legend img { max-width: 100%; border-radius: var(--radius); }

.legend-hidden { display: none; }

/* ─── Results Screen ────────────────────────────────── */
.results-card { text-align: center; }

.results-card h2 {
  font-size: 2rem;
  margin-bottom: 8px;
}

.results-card h2.pass { color: var(--success); }
.results-card h2.fail { color: var(--danger); }

.stars-row {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin: 24px 0;
}

.game-star-block { text-align: center; }
.game-star-block .label { font-size: 0.75rem; color: var(--muted); }
.game-star-block .stars { font-size: 1.4rem; color: var(--accent); }

.total-score {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--primary);
  margin: 16px 0;
}

.flagged-notice {
  background: #fef9e7;
  border: 2px solid var(--accent);
  border-radius: var(--radius);
  padding: 12px 16px;
  margin: 16px 0;
  font-size: 0.9rem;
  color: var(--text);
}

/* ─── Leaderboard ───────────────────────────────────── */
.leaderboard {
  width: 100%;
  border-collapse: collapse;
  margin-top: 24px;
  font-size: 0.9rem;
}

.leaderboard th {
  background: var(--primary);
  color: #fff;
  padding: 10px 12px;
  text-align: left;
}

.leaderboard td {
  padding: 10px 12px;
  border-bottom: 1px solid #dce3ea;
}

.leaderboard tr.current-agent { background: #fff8ec; font-weight: 700; }
.leaderboard .pass { color: var(--success); font-weight: 600; }
.leaderboard .fail { color: var(--danger); font-weight: 600; }

/* ─── Intro Splash ──────────────────────────────────── */
.intro-splash {
  text-align: center;
  padding: 40px;
}

.intro-splash img.intro-card { width: 200px; margin-bottom: 24px; }
.intro-splash h2 { font-size: 1.6rem; color: var(--primary); margin-bottom: 12px; }
.intro-splash p  { color: var(--muted); margin-bottom: 32px; }
```

- [ ] **Step 2: Write index.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atlas Explorer</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <div class="landing-card">
    <img src="assets/logo.png" alt="Atlas Explorer" class="logo"
         onerror="this.style.display='none'">
    <h1>Atlas Explorer</h1>
    <p>US & Canada Geography Training — test your knowledge across 4 challenges.</p>

    <div class="form-group">
      <label for="agent-name">Your Full Name</label>
      <input type="text" id="agent-name" placeholder="e.g. Priya Sharma" autocomplete="name">
    </div>

    <div class="form-group">
      <label for="batch-id">Batch ID</label>
      <select id="batch-id">
        <option value="">— Select your batch —</option>
      </select>
    </div>

    <button class="btn btn-primary" id="start-btn" disabled>Start Game</button>
  </div>

  <script type="module">
    // Load batch IDs from data/batches.json
    const batchSelect = document.getElementById('batch-id');
    const nameInput   = document.getElementById('agent-name');
    const startBtn    = document.getElementById('start-btn');

    fetch('data/batches.json')
      .then(r => r.json())
      .then(batches => {
        batches.forEach(b => {
          const opt = document.createElement('option');
          opt.value = b;
          opt.textContent = b;
          batchSelect.appendChild(opt);
        });
      });

    function checkReady() {
      startBtn.disabled = !(nameInput.value.trim().length >= 2 && batchSelect.value);
    }

    nameInput.addEventListener('input', checkReady);
    batchSelect.addEventListener('change', checkReady);

    startBtn.addEventListener('click', () => {
      const name    = nameInput.value.trim();
      const batchId = batchSelect.value;
      // Store in sessionStorage and redirect to game
      sessionStorage.setItem('atlas-name', name);
      sessionStorage.setItem('atlas-batch', batchId);
      window.location.href = 'game.html';
    });
  </script>
</body>
</html>
```

- [ ] **Step 3: Manual test** — Open index.html in a browser via a local server (e.g. `npx serve .` or VS Code Live Server). Verify: batch dropdown populates, Start is disabled until both fields filled, clicking Start redirects to game.html.

- [ ] **Step 4: Commit**
```bash
git add index.html css/styles.css
git commit -m "feat: landing page and global styles"
```

---

## Task 6: Google Apps Script Backend

**Files:**
- Write: `apps-script/Code.gs`

- [ ] **Step 1: Create Google Sheet**

  1. Go to sheets.google.com → create a new spreadsheet named "Atlas Explorer Scores"
  2. Rename the default tab to `Scores`
  3. Add this header row in row 1:
     `Timestamp | Agent Name | Batch ID | Game1 | Game2 | Game3 | Game4 | Total | Stars | Pass/Fail | Flagged`
  4. Note the spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

- [ ] **Step 2: Write apps-script/Code.gs**
```javascript
// apps-script/Code.gs
// Deploy as: Web App → Execute as Me → Access: Anyone

const SPREADSHEET_ID = 'REPLACE_WITH_YOUR_SPREADSHEET_ID';
const SHEET_NAME = 'Scores';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);

    sheet.appendRow([
      new Date().toISOString(),
      data.name,
      data.batchId,
      data.game1,
      data.game2,
      data.game3,
      data.game4,
      data.total,
      data.stars,
      data.passFail,
      data.flagged,
    ]);

    const leaderboard = getLeaderboardForBatch(sheet, data.batchId);
    return jsonResponse({ success: true, leaderboard });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function doGet(e) {
  try {
    const batchId = e.parameter.batchId || '';
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const leaderboard = getLeaderboardForBatch(sheet, batchId);
    return jsonResponse(leaderboard);
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function getLeaderboardForBatch(sheet, batchId) {
  const rows = sheet.getDataRange().getValues();
  return rows
    .slice(1) // skip header row
    .filter(row => row[2] === batchId)
    .map(row => ({
      name:     row[1],
      batchId:  row[2],
      game1:    row[3],
      game2:    row[4],
      game3:    row[5],
      game4:    row[6],
      total:    row[7],
      stars:    row[8],
      passFail: row[9],
      flagged:  row[10],
    }))
    .sort((a, b) => b.total - a.total);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

- [ ] **Step 3: Deploy the Apps Script**

  1. In Google Sheets → Extensions → Apps Script → paste Code.gs content
  2. Replace `REPLACE_WITH_YOUR_SPREADSHEET_ID` with your actual ID
  3. Click Deploy → New Deployment → Type: Web App
  4. Execute as: Me | Who has access: Anyone
  5. Copy the Web App URL — it looks like: `https://script.google.com/macros/s/{ID}/exec`
  6. Save this URL — it goes into `js/leaderboard.js` in the next task

- [ ] **Step 4: Test CORS manually**
```bash
# Replace URL with your deployed Apps Script URL
curl -X GET "https://script.google.com/macros/s/YOUR_ID/exec?batchId=APR-2026-01"
```
Expected: `[]` (empty array, no scores yet). If you get a JSON response, CORS is working.

Also test in browser devtools console:
```javascript
fetch('https://script.google.com/macros/s/YOUR_ID/exec?batchId=APR-2026-01')
  .then(r => r.json())
  .then(console.log)
```
Expected: `[]`

- [ ] **Step 5: Commit**
```bash
git add apps-script/Code.gs
git commit -m "feat: Google Apps Script backend (doPost + doGet)"
```

---

## Task 7: Leaderboard Module

**Files:**
- Write: `js/leaderboard.js`

No unit tests for this module — it wraps `fetch()` which requires a live URL. Test manually after integration.

- [ ] **Step 1: Write js/leaderboard.js**
```javascript
// js/leaderboard.js
// Replace this URL after deploying your Apps Script
export const APPS_SCRIPT_URL = 'REPLACE_WITH_YOUR_APPS_SCRIPT_URL';

/**
 * Submit session scores to Google Sheets and return leaderboard.
 * @param {object} payload - from getSubmissionPayload(session)
 * @returns {Promise<Array>} leaderboard for the batch
 */
export async function submitScore(payload) {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // Apps Script requires text/plain for doPost
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return data.leaderboard || [];
}

/**
 * Fetch leaderboard for a batch without submitting a score.
 * @param {string} batchId
 * @returns {Promise<Array>}
 */
export async function fetchLeaderboard(batchId) {
  const url = `${APPS_SCRIPT_URL}?batchId=${encodeURIComponent(batchId)}`;
  const response = await fetch(url);
  return response.json();
}

/**
 * Render leaderboard into a container element.
 * @param {HTMLElement} container
 * @param {Array} data
 * @param {string} currentAgentName - highlights current agent's row
 */
export function renderLeaderboard(container, data, currentAgentName) {
  if (!data || data.length === 0) {
    container.innerHTML = '<p style="color:var(--muted);text-align:center">No scores yet for this batch.</p>';
    return;
  }

  const rows = data.map((entry, i) => `
    <tr class="${entry.name === currentAgentName ? 'current-agent' : ''}">
      <td>${i + 1}</td>
      <td>${escHtml(entry.name)}</td>
      <td>${entry.total}</td>
      <td>${entry.stars}/12</td>
      <td class="${entry.passFail === 'Pass' ? 'pass' : 'fail'}">${entry.passFail}</td>
      <td>${entry.flagged === 'Yes' ? '&#9873;' : ''}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <table class="leaderboard">
      <thead>
        <tr>
          <th>Rank</th><th>Agent</th><th>Score</th>
          <th>Stars</th><th>Result</th><th>Flag</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

**Note:** Apps Script's `doPost` requires `Content-Type: text/plain` (not `application/json`) to avoid a CORS preflight. The body is still JSON-encoded text.

- [ ] **Step 2: Commit**
```bash
git add js/leaderboard.js
git commit -m "feat: leaderboard module (submit + render)"
```

---

## Task 8: Game Shell & Orchestrator

**Files:**
- Write: `game.html`
- Write: `js/main.js`

- [ ] **Step 1: Write game.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atlas Explorer</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <div id="game-container" style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px">
    <p style="color:var(--muted)">Loading...</p>
  </div>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write js/main.js**
```javascript
// js/main.js
import { createSession, recordAttempt, isAllPassed } from './session.js';
import { mountCrackTheCode } from './crack-the-code.js';
import { mountPinIt }        from './pin-it.js';
import { mountCitySorter }   from './city-sorter.js';
import { mountRegionRanger } from './region-ranger.js';
import { mountResults }      from './results.js';

const GAME_MOUNTS = [
  mountCrackTheCode,
  mountPinIt,
  mountCitySorter,
  mountRegionRanger,
];

const container = document.getElementById('game-container');
let session = null;

// Read name and batch from sessionStorage (set by index.html)
const name    = sessionStorage.getItem('atlas-name');
const batchId = sessionStorage.getItem('atlas-batch');

if (!name || !batchId) {
  window.location.href = 'index.html';
} else {
  session = createSession(name, batchId);
  runGame(0);
}

/**
 * Run a mini-game by index, handling retries automatically.
 * @param {number} gameIndex 0–3
 * @param {boolean} isRetry true on second attempt
 */
function runGame(gameIndex, isRetry = false) {
  if (gameIndex >= GAME_MOUNTS.length) {
    mountResults(container, session);
    return;
  }

  GAME_MOUNTS[gameIndex](container, (result) => {
    const { passed, blocked } = recordAttempt(session, gameIndex, result);

    if (passed) {
      runGame(gameIndex + 1);
    } else if (blocked) {
      // Second failure — blocked, go to results
      mountResults(container, session);
    } else {
      // First failure — retry same game
      runGame(gameIndex, true);
    }
  }, { isRetry });
}
```

- [ ] **Step 3: Commit**
```bash
git add game.html js/main.js
git commit -m "feat: game shell and orchestrator"
```

---

## Task 9: Crack the Code (Mini-Game 1)

**Files:**
- Create: `tests/test-crack-the-code.js`
- Write: `js/crack-the-code.js`

- [ ] **Step 1: Write tests/test-crack-the-code.js**
```javascript
// tests/test-crack-the-code.js
import { suite, test, assertEqual, assert, summary } from './test-runner.js';
import { buildOptions, pickQuestions } from '../js/crack-the-code.js';

// Minimal states fixture
const states = [
  {code:'TX',name:'Texas',common:true},
  {code:'CA',name:'California',common:true},
  {code:'NY',name:'New York',common:true},
  {code:'FL',name:'Florida',common:true},
  {code:'AL',name:'Alabama',common:false},
  {code:'AK',name:'Alaska',common:false},
  {code:'AZ',name:'Arizona',common:true},
  {code:'AR',name:'Arkansas',common:false},
  {code:'CO',name:'Colorado',common:true},
  {code:'CT',name:'Connecticut',common:false},
  {code:'DE',name:'Delaware',common:false},
  {code:'GA',name:'Georgia',common:true},
  {code:'HI',name:'Hawaii',common:false},
  {code:'ID',name:'Idaho',common:false},
  {code:'IL',name:'Illinois',common:true},
  {code:'IN',name:'Indiana',common:false},
  {code:'IA',name:'Iowa',common:false},
  {code:'KS',name:'Kansas',common:false},
  {code:'KY',name:'Kentucky',common:false},
  {code:'LA',name:'Louisiana',common:false},
  {code:'ME',name:'Maine',common:false},
];

suite('buildOptions');

test('returns 4 options including the correct state', () => {
  const target = states[0]; // TX
  const options = buildOptions(target, states);
  assertEqual(options.length, 4);
  assert(options.some(o => o.code === target.code), 'correct state not in options');
});

test('all 4 options are distinct', () => {
  const target = states[0];
  const options = buildOptions(target, states);
  const codes = options.map(o => o.code);
  assertEqual(new Set(codes).size, 4);
});

suite('pickQuestions');

test('returns exactly 20 questions', () => {
  const qs = pickQuestions(states, 20, 10);
  assertEqual(qs.length, 20);
});

test('first 10 questions all come from common pool', () => {
  const qs = pickQuestions(states, 20, 10);
  const first10 = qs.slice(0, 10);
  assert(first10.every(q => q.common === true), 'non-common state in first 10');
});

test('no duplicate questions', () => {
  const qs = pickQuestions(states, 20, 10);
  const codes = qs.map(q => q.code);
  assertEqual(new Set(codes).size, 20);
});

summary();
```

- [ ] **Step 2: Run test to verify it fails**
```bash
node tests/test-crack-the-code.js
```

- [ ] **Step 3: Write js/crack-the-code.js**
```javascript
// js/crack-the-code.js
import { calculatePoints, calculateStars, isPassed } from './scoring.js';

// ── Pure logic (exported for tests) ────────────────────────────────────────

/**
 * Build 4 multiple-choice options including the correct state.
 */
export function buildOptions(targetState, allStates) {
  const others = allStates.filter(s => s.code !== targetState.code);
  const shuffled = shuffle(others).slice(0, 3);
  return shuffle([targetState, ...shuffled]);
}

/**
 * Pick questions for the game.
 * First commonFirst questions from common pool, rest from full pool (no duplicates).
 */
export function pickQuestions(allStates, total, commonFirst) {
  const common    = shuffle(allStates.filter(s => s.common));
  const nonCommon = shuffle(allStates.filter(s => !s.common));
  const firstPart  = common.slice(0, commonFirst);
  const usedCodes  = new Set(firstPart.map(s => s.code));
  const remaining  = shuffle([...common.slice(commonFirst), ...nonCommon]
    .filter(s => !usedCodes.has(s.code)));
  return [...firstPart, ...remaining.slice(0, total - commonFirst)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Game mount ──────────────────────────────────────────────────────────────

const TOTAL_QUESTIONS  = 20;
const COMMON_FIRST     = 10;
const TIME_PER_Q       = 60; // seconds
const SPEED_WINDOW     = 20; // seconds for speed bonus

export async function mountCrackTheCode(container, onComplete, options = {}) {
  const { isRetry = false } = options;
  const statesData = await fetch('data/states.json').then(r => r.json());
  const questions  = pickQuestions(statesData, TOTAL_QUESTIONS, COMMON_FIRST);

  let currentIndex = 0;
  let totalScore   = 0;
  let correctCount = 0;
  let questionStart = 0;
  let timerInterval = null;

  function render() {
    const q = questions[currentIndex];
    const opts = buildOptions(q, statesData);

    container.innerHTML = `
      <div class="game-card">
        <div class="game-header">
          <span class="game-title">${isRetry ? 'Crack the Code (Retry)' : 'Crack the Code'}</span>
          <span class="game-progress">${currentIndex + 1} / ${TOTAL_QUESTIONS}</span>
        </div>
        <div class="timer-bar"><div class="timer-bar-fill" id="timer-fill" style="width:100%"></div></div>
        <div class="code-display">${q.code}</div>
        <p style="text-align:center;color:var(--muted);margin-bottom:16px">
          Which state or province does this code represent?
        </p>
        <div class="options-grid" id="options-grid">
          ${opts.map(o => `
            <button class="option-btn" data-code="${o.code}">${o.name}</button>
          `).join('')}
        </div>
      </div>
    `;

    questionStart = Date.now();
    startTimer();

    document.getElementById('options-grid').addEventListener('click', (e) => {
      const btn = e.target.closest('.option-btn');
      if (!btn) return;
      const elapsed = (Date.now() - questionStart) / 1000;
      handleAnswer(btn.dataset.code, q.code, elapsed);
    });
  }

  function startTimer() {
    clearInterval(timerInterval);
    let remaining = TIME_PER_Q;
    const fill = document.getElementById('timer-fill');

    timerInterval = setInterval(() => {
      remaining--;
      if (fill) {
        const pct = (remaining / TIME_PER_Q) * 100;
        fill.style.width = pct + '%';
        if (pct < 30) fill.classList.add('warning');
      }
      if (remaining <= 0) {
        clearInterval(timerInterval);
        handleAnswer(null, questions[currentIndex].code, TIME_PER_Q);
      }
    }, 1000);
  }

  function handleAnswer(selectedCode, correctCode, elapsed) {
    clearInterval(timerInterval);
    const isCorrect = selectedCode === correctCode;
    if (isCorrect) correctCount++;
    const pts = calculatePoints(isCorrect, elapsed, SPEED_WINDOW);
    totalScore += pts;

    // Show feedback briefly then advance
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.code === correctCode)  btn.classList.add('correct');
      if (btn.dataset.code === selectedCode && !isCorrect) btn.classList.add('wrong');
    });

    setTimeout(() => {
      currentIndex++;
      if (currentIndex < TOTAL_QUESTIONS) {
        render();
      } else {
        finish();
      }
    }, 800);
  }

  function finish() {
    onComplete({ score: totalScore, correctCount, totalCount: TOTAL_QUESTIONS });
  }

  render();
}
```

- [ ] **Step 4: Run tests**
```bash
node tests/test-crack-the-code.js
```
Expected: all pass.

- [ ] **Step 5: Manual browser test** — Start game, play through Crack the Code. Verify: timer counts down, correct answer highlighted green, wrong highlighted red, auto-advances on timeout, ends and calls onComplete.

- [ ] **Step 6: Commit**
```bash
git add js/crack-the-code.js tests/test-crack-the-code.js
git commit -m "feat: mini-game 1 — Crack the Code"
```

---

## Task 10: Pin It! SVG Map Preparation

**Files:**
- Write: `maps/north-america.svg`

This task is manual SVG preparation — no code tests. The SVG must have each US state and Canadian province as a `<path>` with `id="{STATE_CODE}"` (e.g., `id="TX"`, `id="ON"`).

- [ ] **Step 1: Download source SVGs**

  1. Go to Wikimedia Commons and download:
     - `Blank_US_Map_(states_only).svg` — search "Blank US Map states only site:commons.wikimedia.org"
     - `Canada_provinces_blank_map.svg` — search "Canada provinces blank map site:commons.wikimedia.org"
  2. Open both files in a text editor (they are XML)

- [ ] **Step 2: Normalize IDs**

  For the US map: each `<path>` must have `id="XX"` where XX is the 2-letter state code. Wikipedia SVGs often use full state names or FIPS codes — do a find/replace to set correct IDs. Example:
  ```xml
  <!-- Before -->
  <path id="US-TX" .../>
  <!-- After -->
  <path id="TX" .../>
  ```

  For the Canada map: same — each province path gets `id="ON"`, `id="BC"`, etc.

- [ ] **Step 3: Combine into maps/north-america.svg**

  Create a single SVG file with a `viewBox` that encompasses both maps. Place the US SVG paths in a `<g id="us-states">` group and Canada paths in `<g id="ca-provinces">`. Adjust `transform` attributes to position Canada above/beside the US as appropriate. Save as `maps/north-america.svg`.

  Minimum required structure:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800" id="north-america-map">
    <g id="ca-provinces">
      <path id="BC" d="..." />
      <path id="AB" d="..." />
      <!-- ... all 13 provinces/territories ... -->
    </g>
    <g id="us-states">
      <path id="TX" d="..." />
      <path id="CA" d="..." />
      <!-- ... all 50 states ... -->
    </g>
  </svg>
  ```

- [ ] **Step 4: Verify all 63 IDs exist**
```bash
grep -o 'id="[A-Z][A-Z]"' maps/north-america.svg | sort | uniq | wc -l
```
Expected: 63

- [ ] **Step 5: Commit**
```bash
git add maps/north-america.svg
git commit -m "feat: combined North America SVG map (63 regions)"
```

---

## Task 11: Pin It! Game Logic

**Files:**
- Create: `tests/test-pin-it.js`  (logic-only tests — no DOM)
- Write: `js/pin-it.js`

- [ ] **Step 1: Write tests/test-pin-it.js**
```javascript
// tests/test-pin-it.js
import { suite, test, assertEqual, assert, summary } from './test-runner.js';
import { pickQuestions, evaluateClick } from '../js/pin-it.js';

const states = [
  {code:'TX',name:'Texas',common:true},
  {code:'CA',name:'California',common:true},
  {code:'NY',name:'New York',common:true},
  {code:'FL',name:'Florida',common:true},
  {code:'IL',name:'Illinois',common:true},
  {code:'WA',name:'Washington',common:true},
  {code:'GA',name:'Georgia',common:true},
  {code:'PA',name:'Pennsylvania',common:true},
  {code:'OH',name:'Ohio',common:true},
  {code:'NC',name:'North Carolina',common:true},
  {code:'AZ',name:'Arizona',common:true},
  {code:'MI',name:'Michigan',common:true},
  {code:'VA',name:'Virginia',common:true},
  {code:'CO',name:'Colorado',common:true},
  {code:'MA',name:'Massachusetts',common:true},
  {code:'AL',name:'Alabama',common:false},
  {code:'AK',name:'Alaska',common:false},
  {code:'AR',name:'Arkansas',common:false},
  {code:'CT',name:'Connecticut',common:false},
  {code:'DE',name:'Delaware',common:false},
];

suite('pickQuestions');

test('returns exactly 15 questions', () => {
  const qs = pickQuestions(states, 15);
  assertEqual(qs.length, 15);
});

test('no duplicate states', () => {
  const qs = pickQuestions(states, 15);
  const codes = qs.map(q => q.code);
  assertEqual(new Set(codes).size, 15);
});

test('starts with large/common states first', () => {
  const qs = pickQuestions(states, 15);
  // First 5 should be from common pool
  assert(qs.slice(0, 5).every(q => q.common === true));
});

suite('evaluateClick');

test('correct click returns true', () => {
  assert(evaluateClick('TX', 'TX'));
});

test('wrong click returns false', () => {
  assert(!evaluateClick('CA', 'TX'));
});

summary();
```

- [ ] **Step 2: Run test to verify it fails**
```bash
node tests/test-pin-it.js
```

- [ ] **Step 3: Write js/pin-it.js**
```javascript
// js/pin-it.js
import { calculatePoints, isPassed } from './scoring.js';

const TOTAL_QUESTIONS = 15;
const TIME_PER_Q      = 45;
const SPEED_WINDOW    = 15;

// ── Pure logic ──────────────────────────────────────────────────────────────

export function pickQuestions(allStates, total) {
  const common    = shuffle(allStates.filter(s => s.common));
  const nonCommon = shuffle(allStates.filter(s => !s.common));
  const ordered   = [...common, ...nonCommon]; // common first = easier first
  return ordered.slice(0, total);
}

export function evaluateClick(clickedCode, targetCode) {
  return clickedCode === targetCode;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Game mount ──────────────────────────────────────────────────────────────

export async function mountPinIt(container, onComplete, options = {}) {
  const { isRetry = false } = options;
  const statesData = await fetch('data/states.json').then(r => r.json());
  const svgText    = await fetch('maps/north-america.svg').then(r => r.text());
  const questions  = pickQuestions(statesData, TOTAL_QUESTIONS);

  let currentIndex = 0;
  let totalScore   = 0;
  let correctCount = 0;
  let questionStart = 0;
  let timerInterval = null;
  let gameActive    = true;

  function render() {
    const q = questions[currentIndex];
    container.innerHTML = `
      <div class="game-card">
        <div class="game-header">
          <span class="game-title">${isRetry ? 'Pin It! (Retry)' : 'Pin It!'}</span>
          <span class="game-progress">${currentIndex + 1} / ${TOTAL_QUESTIONS}</span>
        </div>
        <div class="timer-bar"><div class="timer-bar-fill" id="timer-fill" style="width:100%"></div></div>
        <div class="pin-it-prompt">Click on <strong>${q.name}</strong></div>
        <div id="map-container">${svgText}</div>
        <div class="map-tooltip" id="map-tooltip"></div>
      </div>
    `;

    // Tooltips disabled during active play
    setupMapHandlers(q.code, false);
    questionStart = Date.now();
    startTimer();
  }

  function setupMapHandlers(targetCode, tooltipsEnabled) {
    const mapContainer = document.getElementById('map-container');
    const tooltip      = document.getElementById('map-tooltip');
    const paths        = mapContainer.querySelectorAll('path');

    paths.forEach(path => {
      const stateCode = path.id;

      if (tooltipsEnabled) {
        const stateObj = statesData.find(s => s.code === stateCode);
        path.addEventListener('mousemove', e => {
          if (stateObj) {
            tooltip.textContent = stateObj.name;
            tooltip.style.display = 'block';
            tooltip.style.left = (e.clientX + 12) + 'px';
            tooltip.style.top  = (e.clientY - 28) + 'px';
          }
        });
        path.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
      }

      path.addEventListener('click', () => {
        if (!gameActive) return;
        const elapsed  = (Date.now() - questionStart) / 1000;
        const isCorrect = evaluateClick(stateCode, targetCode);
        handleAnswer(stateCode, targetCode, isCorrect, elapsed);
      });
    });
  }

  function startTimer() {
    clearInterval(timerInterval);
    let remaining = TIME_PER_Q;
    timerInterval = setInterval(() => {
      remaining--;
      const fill = document.getElementById('timer-fill');
      if (fill) {
        const pct = (remaining / TIME_PER_Q) * 100;
        fill.style.width = pct + '%';
        if (pct < 30) fill.classList.add('warning');
      }
      if (remaining <= 0) {
        clearInterval(timerInterval);
        handleAnswer(null, questions[currentIndex].code, false, TIME_PER_Q);
      }
    }, 1000);
  }

  function handleAnswer(clickedCode, correctCode, isCorrect, elapsed) {
    gameActive = false;
    clearInterval(timerInterval);
    if (isCorrect) correctCount++;
    totalScore += calculatePoints(isCorrect, elapsed, SPEED_WINDOW);

    // Visual feedback on map
    const mapContainer = document.getElementById('map-container');
    if (clickedCode && clickedCode !== correctCode) {
      const wrongPath = mapContainer.querySelector(`#${clickedCode}`);
      if (wrongPath) wrongPath.classList.add('wrong');
    }
    const correctPath = mapContainer.querySelector(`#${correctCode}`);
    if (correctPath) correctPath.classList.add('correct');

    setTimeout(() => {
      gameActive = true;
      currentIndex++;
      if (currentIndex < TOTAL_QUESTIONS) {
        render();
      } else {
        showInterstitial();
      }
    }, 900);
  }

  function showInterstitial() {
    const passed = isPassed(correctCount, TOTAL_QUESTIONS);
    container.innerHTML = `
      <div class="game-card" style="text-align:center">
        <h2 style="color:${passed ? 'var(--success)' : 'var(--danger)'}">
          ${passed ? 'Pin It! Complete!' : 'Pin It! — Not quite'}
        </h2>
        <p style="margin:16px 0;color:var(--muted)">${correctCount}/${TOTAL_QUESTIONS} correct</p>
        <button class="btn btn-accent" id="review-map-btn" style="margin-right:12px">
          Review Map
        </button>
        <button class="btn btn-primary" id="continue-btn">Continue</button>
      </div>
    `;

    document.getElementById('review-map-btn').addEventListener('click', showReviewMode);
    document.getElementById('continue-btn').addEventListener('click', () => {
      onComplete({ score: totalScore, correctCount, totalCount: TOTAL_QUESTIONS });
    });
  }

  function showReviewMode() {
    container.innerHTML = `
      <div class="game-card">
        <div class="game-header">
          <span class="game-title">Review Map</span>
          <span style="color:var(--muted);font-size:0.85rem">Hover over regions to see names</span>
        </div>
        <div id="map-container" class="review-mode">${svgText}</div>
        <div class="map-tooltip" id="map-tooltip"></div>
        <div style="text-align:center;margin-top:20px">
          <button class="btn btn-primary" id="exit-review-btn">Continue to Next Game</button>
        </div>
      </div>
    `;

    // Enable tooltips in review mode
    setupMapHandlers(null, true);

    document.getElementById('exit-review-btn').addEventListener('click', () => {
      onComplete({ score: totalScore, correctCount, totalCount: TOTAL_QUESTIONS });
    });
  }

  render();
}
```

- [ ] **Step 4: Run tests**
```bash
node tests/test-pin-it.js
```
Expected: all pass.

- [ ] **Step 5: Commit**
```bash
git add js/pin-it.js tests/test-pin-it.js
git commit -m "feat: mini-game 2 — Pin It! with review mode"
```

---

## Task 12: City Sorter (Mini-Game 3)

**Files:**
- Create: `tests/test-city-sorter.js`
- Write: `js/city-sorter.js`

- [ ] **Step 1: Write tests/test-city-sorter.js**
```javascript
// tests/test-city-sorter.js
import { suite, test, assertEqual, assert, summary } from './test-runner.js';
import { buildRound, checkPlacement, isRoundComplete } from '../js/city-sorter.js';

const cities = [
  {name:'Houston',   stateCode:'TX', stateName:'Texas'},
  {name:'Dallas',    stateCode:'TX', stateName:'Texas'},
  {name:'San Antonio',stateCode:'TX',stateName:'Texas'},
  {name:'Chicago',   stateCode:'IL', stateName:'Illinois'},
  {name:'Aurora',    stateCode:'IL', stateName:'Illinois'},
  {name:'Rockford',  stateCode:'IL', stateName:'Illinois'},
  {name:'Miami',     stateCode:'FL', stateName:'Florida'},
  {name:'Tampa',     stateCode:'FL', stateName:'Florida'},
  {name:'Orlando',   stateCode:'FL', stateName:'Florida'},
];

suite('buildRound');

test('returns 3 buckets and 6 cities', () => {
  const round = buildRound(cities);
  assertEqual(round.buckets.length, 3);
  assertEqual(round.cityCards.length, 6);
});

test('exactly 2 cities per bucket', () => {
  const round = buildRound(cities);
  round.buckets.forEach(b => {
    const cityCount = round.cityCards.filter(c => c.stateCode === b.code).length;
    assertEqual(cityCount, 2);
  });
});

suite('checkPlacement');

test('correct placement returns true', () => {
  assert(checkPlacement('TX', 'TX'));
});

test('wrong placement returns false', () => {
  assert(!checkPlacement('TX', 'FL'));
});

suite('isRoundComplete');

test('complete when all 6 placed correctly', () => {
  const placements = {
    'Houston': true, 'Dallas': true, 'Chicago': true,
    'Aurora': true, 'Miami': true, 'Tampa': true
  };
  assert(isRoundComplete(placements, 6));
});

test('not complete when any unplaced', () => {
  const placements = { 'Houston': true, 'Dallas': true };
  assert(!isRoundComplete(placements, 6));
});

test('not complete when any wrong', () => {
  const placements = {
    'Houston': true, 'Dallas': false, 'Chicago': true,
    'Aurora': true, 'Miami': true, 'Tampa': true
  };
  assert(!isRoundComplete(placements, 6));
});

summary();
```

- [ ] **Step 2: Run test to verify it fails**
```bash
node tests/test-city-sorter.js
```

- [ ] **Step 3: Write js/city-sorter.js**
```javascript
// js/city-sorter.js
import { calculatePoints, isPassed } from './scoring.js';

const TOTAL_ROUNDS   = 4;
const CITIES_PER_ROUND = 6; // 3 buckets × 2 cities
const TIME_PER_ROUND = 90;  // seconds
const SPEED_WINDOW   = 45;  // seconds for speed bonus

// ── Pure logic ──────────────────────────────────────────────────────────────

/**
 * Build one round: pick 3 states with ≥2 cities each, take 2 cities per state.
 */
export function buildRound(allCities) {
  // Group cities by stateCode
  const byState = {};
  allCities.forEach(c => {
    if (!byState[c.stateCode]) byState[c.stateCode] = [];
    byState[c.stateCode].push(c);
  });

  // States with at least 2 cities (need exactly 2 per bucket)
  const eligible = Object.keys(byState).filter(k => byState[k].length >= 2);
  const chosen   = shuffle(eligible).slice(0, 3);

  const buckets = chosen.map(code => ({
    code,
    name: byState[code][0].stateName,
  }));

  const cityCards = shuffle(
    chosen.flatMap(code => shuffle(byState[code]).slice(0, 2))
  );

  return { buckets, cityCards };
}

export function checkPlacement(cityStateCode, bucketStateCode) {
  return cityStateCode === bucketStateCode;
}

/**
 * placements: { [cityName]: boolean } — true = correct, false = wrong
 */
export function isRoundComplete(placements, totalCities) {
  const values = Object.values(placements);
  return values.length === totalCities && values.every(v => v === true);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Game mount ──────────────────────────────────────────────────────────────

export async function mountCitySorter(container, onComplete, options = {}) {
  const { isRetry = false } = options;
  const citiesData = await fetch('data/cities.json').then(r => r.json());

  let currentRound  = 0;
  let totalScore    = 0;
  let totalCorrect  = 0;
  let roundTimerInterval = null;

  // Pre-generate all 4 rounds
  const rounds = Array.from({ length: TOTAL_ROUNDS }, () => buildRound(citiesData));

  function renderRound() {
    const { buckets, cityCards } = rounds[currentRound];
    const placements = {};        // cityName → boolean
    let cardInFlight = null;      // cityName being dragged
    let roundStart   = Date.now();
    let roundComplete = false;

    container.innerHTML = `
      <div class="game-card">
        <div class="game-header">
          <span class="game-title">${isRetry ? 'City Sorter (Retry)' : 'City Sorter'}</span>
          <span class="game-progress">Round ${currentRound + 1} / ${TOTAL_ROUNDS}</span>
        </div>
        <div class="timer-bar"><div class="timer-bar-fill" id="timer-fill" style="width:100%"></div></div>
        <div class="sorter-layout">
          <div class="city-cards-row" id="cards-row">
            ${cityCards.map(c => `
              <div class="city-card" draggable="true"
                   data-city="${c.name}"
                   data-state="${c.stateCode}">
                ${c.name}
              </div>
            `).join('')}
          </div>
          <div class="buckets-row" id="buckets-row">
            ${buckets.map(b => `
              <div class="bucket" data-state="${b.code}">
                <div class="bucket-label">${b.name}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Drag events
    document.getElementById('cards-row').addEventListener('dragstart', e => {
      const card = e.target.closest('.city-card');
      if (!card) return;
      cardInFlight = card.dataset.city;
      e.dataTransfer.setData('city', card.dataset.city);
      e.dataTransfer.setData('stateCode', card.dataset.state);
      card.classList.add('dragging');
    });

    document.querySelectorAll('.city-card').forEach(card => {
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        cardInFlight = null;
      });
    });

    document.querySelectorAll('.bucket').forEach(bucket => {
      bucket.addEventListener('dragover', e => { e.preventDefault(); bucket.classList.add('drag-over'); });
      bucket.addEventListener('dragleave', () => bucket.classList.remove('drag-over'));
      bucket.addEventListener('drop', e => {
        e.preventDefault();
        bucket.classList.remove('drag-over');
        const cityName    = e.dataTransfer.getData('city');
        const cityState   = e.dataTransfer.getData('stateCode');
        const bucketState = bucket.dataset.state;
        const isCorrect   = checkPlacement(cityState, bucketState);
        cardInFlight = null;

        if (!isCorrect) {
          // Bounce back — find the card and return it to the cards row
          const originalCard = document.querySelector(`.city-card[data-city="${cityName}"]`);
          if (originalCard) {
            originalCard.classList.add('wrong-drop');
            setTimeout(() => originalCard.classList.remove('wrong-drop'), 400);
          }
          return;
        }

        placements[cityName] = true;
        // Move card into bucket with correct styling
        const card = document.querySelector(`.city-card[data-city="${cityName}"]`);
        if (card) {
          card.draggable = false;
          card.classList.add('placed-correct');
          bucket.appendChild(card);
        }

        if (isRoundComplete(placements, CITIES_PER_ROUND)) {
          roundComplete = true;
          const elapsed = (Date.now() - roundStart) / 1000;
          clearInterval(roundTimerInterval);
          const speedBonus = elapsed <= SPEED_WINDOW && cardInFlight === null;
          finishRound(CITIES_PER_ROUND, CITIES_PER_ROUND, speedBonus);
        }
      });
    });

    startRoundTimer(() => {
      if (!roundComplete) {
        // Count correct placements made so far
        const correctSoFar = Object.values(placements).filter(v => v).length;
        finishRound(correctSoFar, CITIES_PER_ROUND, false);
      }
    });
  }

  function startRoundTimer(onExpiry) {
    clearInterval(roundTimerInterval);
    let remaining = TIME_PER_ROUND;
    roundTimerInterval = setInterval(() => {
      remaining--;
      const fill = document.getElementById('timer-fill');
      if (fill) {
        const pct = (remaining / TIME_PER_ROUND) * 100;
        fill.style.width = pct + '%';
        if (pct < 30) fill.classList.add('warning');
      }
      if (remaining <= 0) {
        clearInterval(roundTimerInterval);
        onExpiry();
      }
    }, 1000);
  }

  function finishRound(correct, total, speedBonus) {
    const pts = correct * (10 + (speedBonus ? 3 : 0));
    totalScore   += pts;
    totalCorrect += correct;
    currentRound++;

    if (currentRound < TOTAL_ROUNDS) {
      setTimeout(renderRound, 600);
    } else {
      onComplete({ score: totalScore, correctCount: totalCorrect, totalCount: TOTAL_ROUNDS * CITIES_PER_ROUND });
    }
  }

  renderRound();
}
```

- [ ] **Step 4: Run tests**
```bash
node tests/test-city-sorter.js
```
Expected: all pass.

- [ ] **Step 5: Commit**
```bash
git add js/city-sorter.js tests/test-city-sorter.js
git commit -m "feat: mini-game 3 — City Sorter"
```

---

## Task 13: Region Ranger (Mini-Game 4)

**Files:**
- Create: `tests/test-region-ranger.js`
- Write: `js/region-ranger.js`

- [ ] **Step 1: Write tests/test-region-ranger.js**
```javascript
// tests/test-region-ranger.js
import { suite, test, assertEqual, assert, summary } from './test-runner.js';
import { pickQuestions, checkAnswer, shouldShowLegend } from '../js/region-ranger.js';

const states = [
  {code:'TX',name:'Texas',region:'Southwest',common:true},
  {code:'CA',name:'California',region:'West',common:true},
  {code:'NY',name:'New York',region:'Northeast',common:true},
  {code:'FL',name:'Florida',region:'Southeast',common:true},
  {code:'IL',name:'Illinois',region:'Midwest',common:true},
  {code:'ON',name:'Ontario',region:'Eastern Canada',common:true},
  {code:'BC',name:'British Columbia',region:'Western Canada',common:true},
  {code:'AL',name:'Alabama',region:'Southeast',common:false},
  {code:'AK',name:'Alaska',region:'West',common:false},
  {code:'AZ',name:'Arizona',region:'Southwest',common:true},
  {code:'CO',name:'Colorado',region:'West',common:true},
  {code:'GA',name:'Georgia',region:'Southeast',common:true},
  {code:'PA',name:'Pennsylvania',region:'Northeast',common:true},
  {code:'OH',name:'Ohio',region:'Midwest',common:true},
  {code:'NC',name:'North Carolina',region:'Southeast',common:true},
  {code:'MI',name:'Michigan',region:'Midwest',common:true},
  {code:'VA',name:'Virginia',region:'Southeast',common:true},
  {code:'MA',name:'Massachusetts',region:'Northeast',common:true},
  {code:'TN',name:'Tennessee',region:'Southeast',common:true},
  {code:'NJ',name:'New Jersey',region:'Northeast',common:true},
];

suite('pickQuestions');

test('returns exactly 20 questions', () => {
  assertEqual(pickQuestions(states, 20).length, 20);
});

test('no duplicates', () => {
  const qs = pickQuestions(states, 20);
  assertEqual(new Set(qs.map(q => q.code)).size, 20);
});

suite('checkAnswer');

test('correct region returns true', () => {
  assert(checkAnswer('TX', 'Southwest', states));
});

test('wrong region returns false', () => {
  assert(!checkAnswer('TX', 'Northeast', states));
});

suite('shouldShowLegend');

test('shows legend for questions 1–15 (index 0–14)', () => {
  assert(shouldShowLegend(0));
  assert(shouldShowLegend(14));
});

test('hides legend for questions 16–20 (index 15–19)', () => {
  assert(!shouldShowLegend(15));
  assert(!shouldShowLegend(19));
});

summary();
```

- [ ] **Step 2: Run test to verify it fails**
```bash
node tests/test-region-ranger.js
```

- [ ] **Step 3: Write js/region-ranger.js**
```javascript
// js/region-ranger.js
import { calculatePoints, isPassed } from './scoring.js';

const TOTAL_QUESTIONS = 20;
const TIME_PER_Q      = 45;
const SPEED_WINDOW    = 15;
const LEGEND_CUTOFF   = 15; // hide legend from question 16 onward (index 15+)

export const REGIONS = [
  'Northeast', 'Southeast', 'Midwest', 'Southwest', 'West',
  'Eastern Canada', 'Western Canada',
];

// ── Pure logic ──────────────────────────────────────────────────────────────

export function pickQuestions(allStates, total) {
  return shuffle(allStates).slice(0, total);
}

export function checkAnswer(stateCode, selectedRegion, allStates) {
  const state = allStates.find(s => s.code === stateCode);
  return state ? state.region === selectedRegion : false;
}

export function shouldShowLegend(questionIndex) {
  return questionIndex < LEGEND_CUTOFF;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Game mount ──────────────────────────────────────────────────────────────

export async function mountRegionRanger(container, onComplete, options = {}) {
  const { isRetry = false } = options;
  const statesData = await fetch('data/states.json').then(r => r.json());
  const questions  = pickQuestions(statesData, TOTAL_QUESTIONS);

  let currentIndex = 0;
  let totalScore   = 0;
  let correctCount = 0;
  let timerInterval = null;
  let questionStart = 0;

  function render() {
    const q           = questions[currentIndex];
    const showLegend  = shouldShowLegend(currentIndex);

    container.innerHTML = `
      <div class="game-card">
        <div class="game-header">
          <span class="game-title">${isRetry ? 'Region Ranger (Retry)' : 'Region Ranger'}</span>
          <span class="game-progress">${currentIndex + 1} / ${TOTAL_QUESTIONS}</span>
        </div>
        <div class="timer-bar"><div class="timer-bar-fill" id="timer-fill" style="width:100%"></div></div>
        ${!showLegend ? '<p style="text-align:center;color:var(--accent);font-weight:600;margin-bottom:8px">No legend — recall from memory!</p>' : ''}
        <div class="region-prompt">${q.name}</div>
        <div class="region-options">
          ${REGIONS.map(r => `<button class="region-btn" data-region="${r}">${r}</button>`).join('')}
        </div>
        <div class="region-legend ${showLegend ? '' : 'legend-hidden'}">
          <img src="assets/region-map.png" alt="Region reference map"
               onerror="this.parentElement.innerHTML='<p style=color:var(--muted)>Region map asset not yet loaded — add assets/region-map.png from Canva.</p>'">
        </div>
      </div>
    `;

    questionStart = Date.now();
    startTimer();

    document.querySelectorAll('.region-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const elapsed = (Date.now() - questionStart) / 1000;
        handleAnswer(btn.dataset.region, q.code);
      });
    });
  }

  function startTimer() {
    clearInterval(timerInterval);
    let remaining = TIME_PER_Q;
    timerInterval = setInterval(() => {
      remaining--;
      const fill = document.getElementById('timer-fill');
      if (fill) {
        const pct = (remaining / TIME_PER_Q) * 100;
        fill.style.width = pct + '%';
        if (pct < 30) fill.classList.add('warning');
      }
      if (remaining <= 0) {
        clearInterval(timerInterval);
        handleAnswer(null, questions[currentIndex].code);
      }
    }, 1000);
  }

  function handleAnswer(selectedRegion, stateCode) {
    clearInterval(timerInterval);
    const elapsed   = (Date.now() - questionStart) / 1000;
    const isCorrect = selectedRegion ? checkAnswer(stateCode, selectedRegion, statesData) : false;
    if (isCorrect) correctCount++;
    totalScore += calculatePoints(isCorrect, elapsed, SPEED_WINDOW);

    document.querySelectorAll('.region-btn').forEach(btn => {
      btn.disabled = true;
      const state    = statesData.find(s => s.code === stateCode);
      const correct  = state ? state.region : '';
      if (btn.dataset.region === correct)         btn.classList.add('correct');
      if (btn.dataset.region === selectedRegion && !isCorrect) btn.classList.add('wrong');
    });

    setTimeout(() => {
      currentIndex++;
      if (currentIndex < TOTAL_QUESTIONS) {
        render();
      } else {
        onComplete({ score: totalScore, correctCount, totalCount: TOTAL_QUESTIONS });
      }
    }, 800);
  }

  render();
}
```

- [ ] **Step 4: Run tests**
```bash
node tests/test-region-ranger.js
```
Expected: all pass.

- [ ] **Step 5: Commit**
```bash
git add js/region-ranger.js tests/test-region-ranger.js
git commit -m "feat: mini-game 4 — Region Ranger"
```

---

## Task 14: Results Screen

**Files:**
- Write: `js/results.js`

- [ ] **Step 1: Write js/results.js**
```javascript
// js/results.js
import { isAllPassed, isFlagged, getTotalScore, getTotalStars, getSubmissionPayload } from './session.js';
import { submitScore, renderLeaderboard } from './leaderboard.js';

const GAME_NAMES = ['Crack the Code', 'Pin It!', 'City Sorter', 'Region Ranger'];
const STAR_CHARS = ['☆☆☆', '★☆☆', '★★☆', '★★★'];

export async function mountResults(container, session) {
  const allPassed = isAllPassed(session);
  const flagged   = isFlagged(session);
  const total     = getTotalScore(session);
  const stars     = getTotalStars(session);

  container.innerHTML = `
    <div class="game-card results-card">
      <h2 class="${allPassed ? 'pass' : 'fail'}">
        ${allPassed ? 'Well Done!' : flagged ? 'Needs Review' : 'Not Passed'}
      </h2>
      <p style="color:var(--muted);margin:8px 0 24px">
        ${allPassed
          ? 'You passed all 4 geography challenges.'
          : flagged
            ? 'One or more games were not passed. Your trainer will follow up.'
            : 'You did not pass all games. Try again.'}
      </p>

      <div class="stars-row">
        ${session.games.map((g, i) => `
          <div class="game-star-block">
            <div class="stars">${STAR_CHARS[g.stars] || '☆☆☆'}</div>
            <div class="label">${GAME_NAMES[i]}</div>
            <div style="font-size:0.8rem;color:var(--muted)">${g.score} pts</div>
          </div>
        `).join('')}
      </div>

      <div class="total-score">${total} <span style="font-size:1rem;color:var(--muted)">/ 1,027 pts</span></div>
      <p style="color:var(--muted);font-size:0.85rem">${stars}/12 stars earned</p>

      ${flagged ? `
        <div class="flagged-notice">
          Your trainer has been notified that you need additional support on one or more games.
        </div>
      ` : ''}

      <div id="submit-status" style="color:var(--muted);text-align:center;margin:20px 0">
        Submitting score...
      </div>

      <div id="leaderboard-container"></div>

      ${allPassed && !flagged ? `
        <div style="text-align:center;margin-top:24px">
          <a href="assets/certificate.png" download="atlas-certificate.png"
             class="btn btn-success">
            Download Certificate
          </a>
        </div>
      ` : ''}
    </div>
  `;

  // Submit score to Google Sheets
  try {
    const payload = getSubmissionPayload(session);
    const leaderboard = await submitScore(payload);
    document.getElementById('submit-status').textContent = 'Score saved!';
    renderLeaderboard(
      document.getElementById('leaderboard-container'),
      leaderboard,
      session.name
    );
  } catch (err) {
    document.getElementById('submit-status').textContent =
      'Could not save score — check your connection.';
    console.error('Score submission failed:', err);
  }
}
```

- [ ] **Step 2: Manual test** — Play through all 4 mini-games (or stub onComplete calls) and verify results screen renders with correct stars, total score, leaderboard, and certificate link.

- [ ] **Step 3: Commit**
```bash
git add js/results.js
git commit -m "feat: results screen with leaderboard and certificate"
```

---

## Task 15: Full Run Test & Bug Fixes

- [ ] **Step 1: Run all unit tests**
```bash
npm test
```
Expected: all test files pass with 0 failures.

- [ ] **Step 2: Start a local server**
```bash
npx serve .
```
Or use VS Code Live Server extension. Open `http://localhost:3000`.

- [ ] **Step 3: End-to-end test — Happy path**
  1. Enter a name and select a batch → click Start
  2. Play through all 4 mini-games (can intentionally answer correctly)
  3. Verify results screen shows: 4 star blocks, total score, leaderboard, certificate link
  4. Check Google Sheet — confirm a row was appended with correct values

- [ ] **Step 4: End-to-end test — Blocked path**
  1. Start a new session
  2. In Crack the Code, get fewer than 14/20 correct twice
  3. Verify: results screen shows Fail, Flagged notice shown, no certificate link
  4. Check Google Sheet — confirm Flagged = Yes

- [ ] **Step 5: Verify leaderboard filters by batch**
  1. Submit two scores with different batch IDs
  2. Verify each session's leaderboard shows only their own batch

- [ ] **Step 6: Fix any bugs found, then commit**
```bash
git add -A
git commit -m "fix: end-to-end test fixes"
```

---

## Task 16: GitHub Pages & README

**Files:**
- Write: `README.md`
- Push to GitHub

- [ ] **Step 1: Write README.md**
```markdown
# Atlas Explorer

A web-based geography training game for recruitment screening agents.
Covers US states and Canadian provinces across 4 mini-games.

## Mini-Games
1. **Crack the Code** — Decode state/province abbreviations (20 questions, 60s each)
2. **Pin It!** — Click the correct region on a map (15 questions, 45s each)
3. **City Sorter** — Drag cities to the correct state/province (4 rounds)
4. **Region Ranger** — Classify states into geographic regions (20 questions, 45s each)

## Setup

### 1. Google Sheets Backend

1. Create a Google Sheet named "Atlas Explorer Scores"
2. Rename the sheet tab to `Scores`
3. Add header row: `Timestamp | Agent Name | Batch ID | Game1 | Game2 | Game3 | Game4 | Total | Stars | Pass/Fail | Flagged`
4. Open Extensions → Apps Script → paste contents of `apps-script/Code.gs`
5. Replace `REPLACE_WITH_YOUR_SPREADSHEET_ID` with your sheet ID (from the URL)
6. Deploy → New Deployment → Web App → Execute as Me → Access: Anyone
7. Copy the Web App URL

### 2. Configure the Game

1. Open `js/leaderboard.js`
2. Replace `REPLACE_WITH_YOUR_APPS_SCRIPT_URL` with your Web App URL

### 3. Add Canva Assets

Place the following files in the `assets/` folder (export from Canva):

| File | Description |
|---|---|
| `logo.png` | Atlas Explorer logo/banner |
| `intro-crack.png` | Crack the Code intro card |
| `intro-pinit.png` | Pin It! intro card |
| `intro-sorter.png` | City Sorter intro card |
| `intro-ranger.png` | Region Ranger intro card |
| `region-map.png` | Color-coded region reference map |
| `star-1.png` | 1-star badge |
| `star-2.png` | 2-star badge |
| `star-3.png` | 3-star badge |
| `results-bg.png` | Results screen background |
| `certificate.png` | Completion certificate (PNG for download) |
| `certificate.pdf` | Completion certificate (PDF for printing/records — optional, link separately in results.js if needed) |

### 4. Add Batch IDs

Edit `data/batches.json` to add your batch IDs before each cohort:
```json
["APR-2026-01", "APR-2026-02", "MAY-2026-01"]
```

### 5. Deploy to GitHub Pages

1. Push this repository to GitHub
2. Go to Settings → Pages → Source: Deploy from branch → Branch: main → / (root)
3. Your game URL: `https://{your-username}.github.io/atlas-explorer/`

## Pass Criteria

Agents must score ≥70% on all 4 games to pass.
Agents who fail a game twice are flagged for trainer review (visible in Google Sheets).
Completion certificate is available only to agents who pass all 4 games without flags.

## Leaderboard

Scores are filtered by batch ID — agents only see their own cohort's rankings.
View all scores directly in Google Sheets.
```

- [ ] **Step 2: Create GitHub repository**
  1. Go to github.com → New Repository → name: `atlas-explorer` → Public
  2. Do NOT initialize with README (we have one)

- [ ] **Step 3: Push to GitHub**
```bash
git remote add origin https://github.com/YOUR_USERNAME/atlas-explorer.git
git branch -M main
git push -u origin main
```

- [ ] **Step 4: Enable GitHub Pages**
  1. GitHub → Settings → Pages → Source: Deploy from branch
  2. Branch: main | Folder: / (root) → Save
  3. Wait ~2 minutes → your URL appears at the top of the Pages settings

- [ ] **Step 5: Verify deployed URL**
  Open `https://YOUR_USERNAME.github.io/atlas-explorer/` in a browser.
  Confirm: landing page loads, batch dropdown populates, game plays end-to-end.

- [ ] **Step 6: Final commit**
```bash
git add README.md
git commit -m "docs: README with setup and deployment guide"
git push
```

---

## Canva Asset Checklist (For User)

These assets are created by you in Canva and placed in the `assets/` folder:

- [ ] `logo.png` — "Atlas Explorer" title with map/globe theme (recommended: 360×120px)
- [ ] `intro-crack.png` — Crack the Code splash card (recommended: 400×300px)
- [ ] `intro-pinit.png` — Pin It! splash card (400×300px)
- [ ] `intro-sorter.png` — City Sorter splash card (400×300px)
- [ ] `intro-ranger.png` — Region Ranger splash card (400×300px)
- [ ] `region-map.png` — Color-coded static map: 5 US regions (Northeast/Southeast/Midwest/Southwest/West) + 2 Canada regions (Eastern/Western). Each region a distinct color with a legend. (recommended: 800×500px)
- [ ] `star-1.png`, `star-2.png`, `star-3.png` — Star badge icons (80×80px each)
- [ ] `results-bg.png` — Celebratory background for results screen (1200×400px)
- [ ] `certificate.png` — Completion certificate with space for agent name (A4 landscape)

The game works without these assets (text fallbacks are in place), but adding them elevates the visual quality significantly.
```
