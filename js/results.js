import {
  GAME_DEFINITIONS,
  getSubmissionPayload,
  getTotalScore,
  getTotalStars,
  isAllPassed,
  isFlagged
} from './session.js';
import { submitScore, renderLeaderboard } from './leaderboard.js';

export async function mountResults(container, session) {
  const allPassed = isAllPassed(session);
  const flagged = isFlagged(session);
  const total = getTotalScore(session);
  const stars = getTotalStars(session);

  container.innerHTML = `
    <section class="results-panel">
      <div class="result-status ${allPassed ? 'pass' : 'fail'}">
        <span>${allPassed ? 'Pass' : flagged ? 'Trainer Review' : 'Not Passed'}</span>
        <strong>${total}</strong>
        <small>${stars}/12 stars</small>
      </div>

      <div class="results-grid">
        ${session.games.map((game, index) => `
          <article class="result-card">
            <h3>${GAME_DEFINITIONS[index].label}</h3>
            <p>${game.score} pts</p>
            <span>${game.stars}/3 stars</span>
          </article>
        `).join('')}
      </div>

      ${flagged ? `
        <div class="notice danger">
          This session is flagged for trainer review.
        </div>
      ` : ''}

      <div id="submit-status" class="submit-status">Saving score...</div>
      <div id="leaderboard-container"></div>

      ${allPassed && !flagged ? `
        <div class="result-actions">
          <button id="certificate-button" class="btn btn-success" type="button">Download Certificate</button>
        </div>
      ` : ''}
    </section>
  `;

  const certificateButton = container.querySelector('#certificate-button');
  if (certificateButton) {
    certificateButton.addEventListener('click', () => downloadCertificate(session));
  }

  try {
    const leaderboard = await submitScore(getSubmissionPayload(session));
    container.querySelector('#submit-status').textContent = 'Score saved.';
    renderLeaderboard(container.querySelector('#leaderboard-container'), leaderboard, session.name);
  } catch (error) {
    container.querySelector('#submit-status').textContent = 'Could not save score. Trainer can record it manually.';
    console.error(error);
  }
}

function downloadCertificate(session) {
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Atlas Explorer Certificate</title>
<style>
body{font-family:Arial,sans-serif;margin:0;padding:48px;color:#20302d;background:#f8f4ea}
.certificate{border:8px solid #1f7a68;padding:56px;text-align:center;min-height:420px;background:#fff}
h1{font-size:42px;margin:0 0 24px} h2{font-size:34px;margin:10px 0;color:#1f7a68}
p{font-size:18px;line-height:1.5}.meta{margin-top:42px;color:#66706d}
</style></head><body><section class="certificate">
<h1>Atlas Explorer</h1><p>Certificate of Completion</p>
<h2>${escapeHtml(session.name)}</h2>
<p>completed the US and Canada geography training run.</p>
<p class="meta">Batch ${escapeHtml(session.batchId)} | ${new Date().toLocaleDateString()}</p>
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
