const APPS_SCRIPT_URL = ''; // Paste your deployed Apps Script /exec URL here
const LOCAL_LEADERBOARD_KEY = 'atlas-explorer-local-leaderboard';

const GAME_SHEET_KEYS = {
  crack: 'crack-the-code',
  pin: 'pin-it',
  sorter: 'city-sorter',
  ranger: 'region-ranger'
};

export async function submitAttemptScore({ agent, waveCode, trainerName, game, attempt, scorePct, stars, passed }) {
  const gameSlug = GAME_SHEET_KEYS[game] || game;
  const payload = { agent, waveCode, trainerName, game: gameSlug, attempt, scorePct, stars, passed: Boolean(passed) };

  if (!isConfigured()) {
    saveLocalScore(payload);
    return;
  }

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'submit', ...payload })
    });
  } catch {
    saveLocalScore(payload);
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
  } catch {
    // Local session state still reflects the unlock.
  }
}

export async function fetchBadges(agent) {
  if (!isConfigured()) return [];
  try {
    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.set('action', 'fetchBadges');
    url.searchParams.set('agent', agent);
    const response = await fetch(url);
    const data = await response.json();
    return (data.badges || []).map((badge) => badge.badgeId);
  } catch {
    return [];
  }
}

export async function fetchLeaderboard(agent) {
  if (!isConfigured()) {
    const top10 = getLocalScores();
    const currentRow = top10.find((row) => row.agent === agent) || null;
    return { top10, currentRow };
  }

  try {
    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.set('action', 'fetchLeaderboard');
    url.searchParams.set('agent', agent);
    const response = await fetch(url);
    return await response.json();
  } catch {
    const top10 = getLocalScores();
    const currentRow = top10.find((row) => row.agent === agent) || null;
    return { top10, currentRow };
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
        ${shown.map((row, index) => `
          <div class="leaderboard-row ${row.agent === currentName ? 'current' : ''}" role="row">
            <span>${row.rank || index + 1}</span>
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
  const scores = readLocalScores();
  scores.push({ ...payload, timestamp: new Date().toISOString() });
  localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(scores));
}

export function getLocalScores() {
  const totals = new Map();

  readLocalScores().forEach((row) => {
    if (!row.agent) return;
    if (!totals.has(row.agent)) {
      totals.set(row.agent, {
        agent: row.agent,
        totalStars: 0,
        gamesPassed: 0,
        badgeCount: 0,
        _gamesPassed: new Set()
      });
    }
    const entry = totals.get(row.agent);
    entry.totalStars += Number(row.stars) || 0;
    if (row.passed) entry._gamesPassed.add(row.game);
  });

  return [...totals.values()]
    .map((entry, index) => ({
      agent: entry.agent,
      totalStars: entry.totalStars,
      gamesPassed: entry._gamesPassed.size,
      badgeCount: entry.badgeCount,
      rank: index + 1
    }))
    .sort((a, b) => b.totalStars - a.totalStars || b.gamesPassed - a.gamesPassed || a.agent.localeCompare(b.agent))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
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
