const APPS_SCRIPT_URL = 'REPLACE_WITH_YOUR_APPS_SCRIPT_URL';
const LOCAL_LEADERBOARD_KEY = 'atlas-explorer-local-leaderboard';

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

export async function fetchLeaderboard(batchId) {
  if (!isConfigured()) {
    return getLocalScores(batchId);
  }

  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set('batchId', batchId);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Leaderboard fetch failed: ${response.status}`);
  const result = await response.json();
  return Array.isArray(result) ? result : result.leaderboard || [];
}

export function renderLeaderboard(container, leaderboard, currentName = '') {
  const rows = leaderboard.slice(0, 10);
  container.innerHTML = `
    <section class="leaderboard" aria-labelledby="leaderboard-title">
      <div class="section-heading">
        <h2 id="leaderboard-title">Batch Leaderboard</h2>
        <span>${rows.length} shown</span>
      </div>
      <div class="leaderboard-table" role="table">
        <div class="leaderboard-row header" role="row">
          <span>Rank</span>
          <span>Name</span>
          <span>Total</span>
          <span>Stars</span>
          <span>Status</span>
        </div>
        ${rows.map((row, index) => `
          <div class="leaderboard-row ${row.name === currentName ? 'current' : ''}" role="row">
            <span>${index + 1}</span>
            <span>${escapeHtml(row.name)}</span>
            <span>${row.total}</span>
            <span>${row.stars}/12</span>
            <span>${row.flagged === 'Yes' ? 'Flagged' : row.passFail}</span>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function isConfigured() {
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
