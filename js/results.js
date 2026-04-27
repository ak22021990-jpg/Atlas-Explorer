import {
  GAME_DEFINITIONS,
  getTotalScore,
  getTotalStars,
  isAllPassed
} from './session.js';
import { BADGE_DEFS } from './badges.js';
import { renderLeaderboard } from './leaderboard.js';
import { animateCount, wrapStarsMarkup } from './ui-effects.js';

export function mountResults(container, session, options = {}) {
  const leaderboard = options.leaderboard || { top10: [], currentRow: null };
  const rankFlash = options.rankFlash || '';
  const justEarnedBadgeIds = options.justEarnedBadgeIds || [];
  const allPassed = isAllPassed(session);
  const total = getTotalScore(session);
  const stars = getTotalStars(session);

  container.innerHTML = `
    <section class="results-panel">
      <div class="result-status ${allPassed ? 'pass' : 'fail'}">
        <span>${allPassed ? 'Full run complete' : 'Your run is still live'}</span>
        <strong>${allPassed ? 'RUN COMPLETE' : 'KEEP GOING'}</strong>
        <span>${escapeHtml(session.agent || session.name)}</span>
      </div>

      <div class="score-preview">
        <div>
          <p>Total Score</p>
          <strong class="metric" data-count-target="${total}">0</strong>
          <span>Across all four levels</span>
        </div>
        <div>
          <p>Stars</p>
          <strong class="metric" data-count-target="${stars}">0</strong>
          <span>${wrapStarsMarkup(Math.min(stars, 3))}</span>
        </div>
        <div>
          <p>Levels Cleared</p>
          <strong class="metric" data-count-target="${session.games.filter((game) => game.passed).length}">0</strong>
          <span>Levels cleared this run</span>
        </div>
      </div>

      <div class="section-heading">
        <h2>Level Breakdown</h2>
        <span>${stars}/12 stars banked</span>
      </div>
      <div class="results-grid">
        ${session.games.map((game, index) => `
          <article class="result-card">
            <p>${displayLabel(GAME_DEFINITIONS[index].key)}</p>
            <strong class="metric" data-count-target="${game.score || 0}">0</strong>
            <span>${game.correctCount}/${game.totalCount} correct · ${game.attempts.length} ${game.attempts.length === 1 ? 'attempt' : 'attempts'}</span>
            <div class="mini-stars">${wrapStarsMarkup(game.stars || 0)}</div>
          </article>
        `).join('')}
      </div>

      ${rankFlash ? `<div class="rank-up-flash">${escapeHtml(rankFlash)}</div>` : ''}
      <div id="leaderboard-container"></div>

      <section class="badge-section">
        <div class="section-heading">
          <h2>Badge Shelf</h2>
          <span>${session.earnedBadges.length}/${BADGE_DEFS.length} earned</span>
        </div>
        ${renderBadgeShelf(session.earnedBadges || [], justEarnedBadgeIds)}
      </section>

      ${allPassed ? `
        <div class="result-actions">
          <button id="certificate-button" class="btn btn-primary" type="button">Download certificate</button>
        </div>
      ` : ''}
    </section>
  `;

  container.querySelectorAll('[data-count-target]').forEach((node) => {
    animateCount(node, Number(node.dataset.countTarget) || 0, 700);
  });

  renderLeaderboard(container.querySelector('#leaderboard-container'), leaderboard.top10 || [], session.agent || session.name);

  const certificateButton = container.querySelector('#certificate-button');
  if (certificateButton) {
    certificateButton.addEventListener('click', () => downloadCertificate(session));
  }
}

export function renderBadgeShelf(earnedBadgeIds = [], justEarnedBadgeIds = []) {
  const earned = new Set(earnedBadgeIds);
  const justEarned = new Set(justEarnedBadgeIds);

  return `
    <div class="badge-shelf">
      ${BADGE_DEFS.map((badge) => {
        const isEarned = earned.has(badge.id);
        const classes = [
          'badge-card',
          isEarned ? 'earned' : 'locked',
          justEarned.has(badge.id) ? 'just-earned' : ''
        ].filter(Boolean).join(' ');

        return `
          <article class="${classes}" data-badge-id="${badge.id}">
            <span class="badge-icon">${badgeIcon(badge.id)}</span>
            <span class="badge-name">${escapeHtml(badge.name)}</span>
            <span class="badge-desc">${escapeHtml(badgeDescription(badge.id))}</span>
            <span class="badge-status">${isEarned ? 'Earned' : 'Locked'}</span>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function badgeIcon(id) {
  const icons = {
    'first-blood': 'rocket',
    'perfect-agent': '100',
    'hot-streak': 'fire',
    'globe-trotter': 'globe',
    'diamond-agent': 'diamond',
    'star-collector': 'star',
    'never-quit': 'medal',
    'speed-run': 'bolt'
  };
  return icons[id] || 'star';
}

function badgeDescription(id) {
  const descriptions = {
    'first-blood': 'Pass on the first try',
    'perfect-agent': 'Score 100% in any level',
    'hot-streak': 'Chain 3 correct answers',
    'globe-trotter': 'Pass all 4 games',
    'diamond-agent': 'Pass all 4 on the first try',
    'star-collector': 'Collect all 12 stars',
    'never-quit': 'Pass after 3 failed tries',
    'speed-run': 'Perfect timed finish'
  };
  return descriptions[id] || 'Run unlock';
}

function displayLabel(key) {
  const labels = {
    crack: 'Code Drop',
    pin: 'Pin Rush',
    sorter: 'City Stack',
    ranger: 'Zone Sprint'
  };
  return labels[key] || key;
}

function downloadCertificate(session) {
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Atlas Explorer Certificate</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Space+Grotesk:wght@500;700&display=swap');
body{font-family:Outfit,sans-serif;margin:0;padding:40px;background:#10161f;color:#f6fbff}
.certificate{max-width:860px;margin:0 auto;padding:48px;border:1px solid rgba(255,255,255,.08);border-radius:28px;background:linear-gradient(160deg,#161f2b,#131a22);box-shadow:0 18px 48px rgba(0,0,0,.35)}
h1,h2{font-family:'Space Grotesk',sans-serif}
h1{font-size:32px;color:#f6fbff;margin:0 0 18px}
h2{font-size:20px;color:#ff9900;margin:12px 0 28px}
p{font-size:16px;line-height:1.6;color:#d3d9df}
.stamp{display:inline-block;margin-top:24px;padding:12px 18px;border-radius:999px;background:linear-gradient(135deg,#ff9900,#ffb84d);color:#131a22;font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:700}
</style></head><body><section class="certificate">
<h1>Atlas Explorer</h1>
<h2>Certificate of Completion</h2>
<p>This certifies that <strong>${escapeHtml(session.agent || session.name)}</strong> completed the Atlas Explorer game run for batch <strong>${escapeHtml(session.batchId)}</strong>.</p>
<p>Total Score: <strong>${getTotalScore(session)}</strong><br>Stars Earned: <strong>${getTotalStars(session)}/12</strong><br>Date: <strong>${new Date().toLocaleDateString()}</strong></p>
<div class="stamp">Run complete</div>
</section></body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'atlas-explorer-certificate.html';
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
