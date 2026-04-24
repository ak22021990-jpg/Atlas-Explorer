import {
  GAME_DEFINITIONS,
  getTotalScore,
  loadSession,
  recordGameAttempt,
  saveSession
} from './session.js';
import { mountCrackTheCode } from './crack-the-code.js';
import { mountPinIt, mountPinReview } from './pin-it.js';
import { mountCitySorter } from './city-sorter.js';
import { mountRegionRanger } from './region-ranger.js';
import { mountResults } from './results.js';

const container = document.getElementById('game-container');
const playerSummary = document.getElementById('player-summary');

const GAME_MOUNTS = {
  crack: mountCrackTheCode,
  pin: mountPinIt,
  sorter: mountCitySorter,
  ranger: mountRegionRanger
};

let session = loadSession();

if (!session) {
  window.location.href = 'index.html';
} else {
  renderShell();
  route();
}

function renderShell() {
  playerSummary.textContent = `${session.name} | ${session.batchId} | ${getTotalScore(session)} pts`;
}

function route() {
  renderShell();
  if (session.completed || session.blocked || session.currentGameIndex >= GAME_DEFINITIONS.length) {
    mountResults(container, session);
    return;
  }
  renderIntro(session.currentGameIndex);
}

function renderIntro(gameIndex) {
  const game = session.games[gameIndex];
  const definition = GAME_DEFINITIONS[gameIndex];
  const isRetry = game.retryAvailable;
  container.innerHTML = `
    <section class="intro-panel">
      <span class="eyebrow">Game ${gameIndex + 1} of ${GAME_DEFINITIONS.length}</span>
      <h1>${definition.label}${isRetry ? ' Retry' : ''}</h1>
      <p>${introCopy(definition.key)}</p>
      <div class="intro-meta">
        <span>${attemptLabel(game)}</span>
        <span>Pass at 70%</span>
      </div>
      <button id="start-game" class="btn btn-primary" type="button">${isRetry ? 'Start Retry' : 'Start Game'}</button>
    </section>
  `;
  container.querySelector('#start-game').addEventListener('click', () => startGame(gameIndex, isRetry));
}

function startGame(gameIndex, isRetry) {
  const definition = GAME_DEFINITIONS[gameIndex];
  const mount = GAME_MOUNTS[definition.key];
  mount(container, (result) => handleGameComplete(gameIndex, result), { isRetry });
}

function handleGameComplete(gameIndex, result) {
  const outcome = recordGameAttempt(session, gameIndex, result);
  saveSession(session);
  renderShell();
  renderAttemptResult(outcome);
}

function renderAttemptResult(outcome) {
  const definition = GAME_DEFINITIONS[outcome.gameIndex];
  const passed = outcome.status === 'passed';
  const blocked = outcome.status === 'blocked';
  const retry = outcome.status === 'retry';

  container.innerHTML = `
    <section class="interstitial-panel ${passed ? 'pass' : 'fail'}">
      <span class="eyebrow">${definition.label}</span>
      <h1>${passed ? 'Passed' : blocked ? 'Blocked' : 'Retry Available'}</h1>
      <div class="attempt-score">
        <strong>${outcome.attempt.score}</strong>
        <span>${outcome.attempt.correctCount}/${outcome.attempt.totalCount} correct</span>
      </div>
      <div class="action-row">
        ${definition.key === 'pin' ? '<button id="review-map" class="btn btn-secondary" type="button">Review Map</button>' : ''}
        ${retry ? '<button id="retry-game" class="btn btn-primary" type="button">Retry</button>' : ''}
        ${passed ? '<button id="continue-game" class="btn btn-primary" type="button">Continue</button>' : ''}
        ${blocked ? '<button id="view-results" class="btn btn-primary" type="button">View Results</button>' : ''}
      </div>
    </section>
  `;

  const reviewButton = container.querySelector('#review-map');
  if (reviewButton) {
    reviewButton.addEventListener('click', () => {
      mountPinReview(container, () => renderAttemptResult(outcome));
    });
  }

  const retryButton = container.querySelector('#retry-game');
  if (retryButton) retryButton.addEventListener('click', () => startGame(outcome.gameIndex, true));

  const continueButton = container.querySelector('#continue-game');
  if (continueButton) continueButton.addEventListener('click', route);

  const resultsButton = container.querySelector('#view-results');
  if (resultsButton) resultsButton.addEventListener('click', route);
}

function introCopy(key) {
  const copy = {
    crack: 'Decode location shorthand before it slows down a screening call.',
    pin: 'Find the requested state, province, or territory on the atlas.',
    sorter: 'Drop city cards into the places they belong.',
    ranger: 'Call the broad region from memory when the legend disappears.'
  };
  return copy[key] || '';
}

function attemptLabel(game) {
  return game.attempts.length ? `Attempt ${game.attempts.length + 1} of 2` : 'Attempt 1 of 2';
}
