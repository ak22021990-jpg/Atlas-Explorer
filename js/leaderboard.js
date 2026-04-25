const APPS_SCRIPT_URL = ''; // Paste your deployed Apps Script /exec URL here
const LOCAL_LEADERBOARD_KEY = 'atlas-explorer-local-leaderboard';

const GAME_SHEET_KEYS = {
  crack:  'crack-the-code',
  pin:    'pin-it',
  sorter: 'city-sorter',
  ranger: 'region-ranger'
};

export async function submitScore(payload) {
  if (!isConfigured()) {
    return saveLocalScore(payload);
  }

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error(`Score submission failed: ${response.status}`);
  const result = await response.json();
  return Array.isArray(result) ? result : result.leaderboard || [];
}

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

export function isConfigured() {
  return APPS_SCRIPT_URL.startsWith('https://');
}

function saveLocalScore(payload) {
  const allScores = readLocalScores();
  allScores.push({ ...payload, timestamp: new Date().toISOString() });
  localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(allScores));
  return getLocalScores(payload.batchId);
}

function getLocalScores(batchId) {
  return readLocalScores()
    .filter((score) => score.batchId === batchId)
    .sort((a, b) => b.total - a.total || b.stars - a.stars);
}

function readLocalScores() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_LEADERBOARD_KEY) || '[]');
  } catch {
    return [];
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
