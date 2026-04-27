import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

const BASE = 'http://localhost:8080';
const OUT = './screenshots';
const STORAGE_KEY = 'atlas-explorer-session';

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });

function buildSession(currentGameIndex = 0) {
  const labels = ['Crack the Code', 'Pin It!', 'City Sorter', 'Region Ranger'];
  return {
    id: 'atlas-playwright-session',
    agent: 'TestAgent',
    name: 'TestAgent',
    batchId: 'BATCH-01',
    currentGameIndex,
    completed: false,
    createdAt: new Date().toISOString(),
    earnedBadges: [],
    lastKnownRank: null,
    justEarnedBadgeIds: [],
    games: labels.map((label, index) => ({
      key: ['crack', 'pin', 'sorter', 'ranger'][index],
      label,
      attempts: [],
      score: index < currentGameIndex ? 180 : 0,
      correctCount: index < currentGameIndex ? 12 : 0,
      totalCount: index < currentGameIndex ? 15 : 0,
      stars: index < currentGameIndex ? 3 : 0,
      passed: index < currentGameIndex,
      retryAvailable: false,
      completed: index < currentGameIndex,
      streakPeak: index < currentGameIndex ? 4 : 0,
      attemptNumber: index < currentGameIndex ? 1 : 0,
      earnedBadges: []
    }))
  };
}

async function setSession(session) {
  await page.addInitScript(([key, value]) => {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem('atlas_agent', value.agent);
  }, [STORAGE_KEY, session]);
}

async function clearBootData() {
  await page.context().clearCookies();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.localStorage.clear());
}

async function captureLanding() {
  await clearBootData();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/01-landing.png`, fullPage: true });
  console.log('landing');
}

async function captureIntro() {
  await clearBootData();
  await setSession(buildSession(0));
  await page.goto(`${BASE}/game.html`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/02-game-intro.png`, fullPage: true });
  console.log('game intro');
}

async function captureGame(levelIndex, outFile) {
  await clearBootData();
  await setSession(buildSession(levelIndex));
  await page.goto(`${BASE}/game.html`, { waitUntil: 'networkidle' });
  await page.locator('#start-game').click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${outFile}`, fullPage: true });
  console.log(outFile);
}

await captureLanding();
await captureIntro();
await captureGame(1, '03-pin-it.png');
await captureGame(2, '04-city-sorter.png');
await captureGame(3, '05-region-ranger.png');

await browser.close();
console.log(`Done -> ${OUT}`);
