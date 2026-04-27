import {
  GAME_DEFINITIONS,
  getTotalScore,
  loadSession,
  recordGameAttempt,
  saveSession
} from './session.js';
import { calculateStars, isPassed, percentCorrect } from './scoring.js';
import { evaluateBadges } from './badges.js';
import { awardBadge, fetchBadges, fetchLeaderboard, isConfigured, submitAttemptScore } from './leaderboard.js';
import { mountCrackTheCode } from './crack-the-code.js';
import { mountPinIt, mountPinReview } from './pin-it.js';
import { mountCitySorter } from './city-sorter.js';
import { mountRegionRanger } from './region-ranger.js';
import { mountResults } from './results.js';
import { getMotivationalCopy, hasPersonalBest, renderAttemptDots, startRetryCountdown } from './flow-ui.js';
import { animateCount, launchConfetti, pageWipe, wrapStarsMarkup } from './ui-effects.js';

const container = document.getElementById('game-container');
const playerSummary = document.getElementById('player-summary');

const GAME_MOUNTS = {
  crack: mountCrackTheCode,
  pin: mountPinIt,
  sorter: mountCitySorter,
  ranger: mountRegionRanger
};

const GAME_ICONS = {
  crack: '01',
  pin: '02',
  sorter: '03',
  ranger: '04'
};

const TERRAIN_MAP = { crack: 'water', pin: 'desert', sorter: 'forest', ranger: 'mountain' };

let session = loadSession();

if (!session) {
  window.location.href = 'index.html';
} else {
  boot();
}

async function boot() {
  session = await initSession(session);
  renderShell();
  await route();
}

async function initSession(currentSession) {
  const hydrated = currentSession;
  hydrated.agent = hydrated.agent || hydrated.name;
  hydrated.earnedBadges = Array.isArray(hydrated.earnedBadges) ? hydrated.earnedBadges : [];
  hydrated.lastKnownRank = readStoredRank(hydrated.agent);
  hydrated.justEarnedBadgeIds = Array.isArray(hydrated.justEarnedBadgeIds) ? hydrated.justEarnedBadgeIds : [];
  localStorage.setItem('atlas_agent', hydrated.agent);

  const remoteBadges = await fetchBadges(hydrated.agent);
  if (remoteBadges.length) {
    hydrated.earnedBadges = [...new Set([...hydrated.earnedBadges, ...remoteBadges])];
  }

  saveSession(hydrated);
  return hydrated;
}

function renderShell() {
  const score = getTotalScore(session);
  const missionIdx = Math.min(session.currentGameIndex + (session.completed ? 0 : 1), GAME_DEFINITIONS.length);
  playerSummary.innerHTML = `
    <span>${escapeHtml(session.agent)}</span>
    <span class="summary-divider">|</span>
    <span>${escapeHtml(session.waveCode || '')}</span>
    <span class="summary-divider">|</span>
    <span class="summary-score">${score} pts</span>
    <span class="summary-divider">|</span>
    <span>Lvl ${missionIdx}/${GAME_DEFINITIONS.length}</span>
  `;
}

async function route(targetGameKey) {
  container.dataset.terrain = '';
  pageWipe();
  renderShell();

  if (session.completed || session.currentGameIndex >= GAME_DEFINITIONS.length) {
    await showResults();
    return;
  }

  if (typeof targetGameKey === 'string') {
    const targetIndex = GAME_DEFINITIONS.findIndex((game) => game.key === targetGameKey);
    if (targetIndex >= 0) {
      startGame(targetIndex, true);
      return;
    }
  }

  renderIntro(session.currentGameIndex);
}

function renderIntro(gameIndex) {
  const game = session.games[gameIndex];
  const definition = GAME_DEFINITIONS[gameIndex];
  container.dataset.terrain = TERRAIN_MAP[definition.key] ?? '';
  const isRetry = game.retryAvailable;
  const pinStates = [
    { top: '65%', left: '35%' },
    { top: '45%', left: '20%' },
    { top: '35%', left: '55%' },
    { top: '50%', left: '75%' }
  ];
  const icon = GAME_ICONS[definition.key] || 'PLAY';

  container.innerHTML = `
    <section class="hub-panel">
      <div class="hub-map-container">
        <img src="maps/north-america.svg" alt="" class="hub-map-img">
        <div class="hub-pins">
          ${pinStates.map((pos, index) => `
            <div class="hub-pin ${index === gameIndex ? 'active' : (index < gameIndex ? 'completed' : '')}"
                 style="top:${pos.top};left:${pos.left};">${index + 1}</div>
          `).join('')}
        </div>
      </div>
      <div class="mission-brief">
        <span class="eyebrow">Level ${gameIndex + 1} of ${GAME_DEFINITIONS.length}</span>
        <h1>${icon} ${displayLabel(definition.key)}${isRetry ? ' Remix' : ''}</h1>
        <p>${introCopy(definition.key)}</p>
        <div class="intro-meta">
          <span>${attemptLabel(game)}</span>
          <span>Clear at 70%</span>
        </div>
        <button id="start-game" class="btn btn-primary" type="button">
          ${isRetry ? 'Run it back' : 'Play level'}
        </button>
      </div>
    </section>
  `;

  container.querySelector('#start-game').addEventListener('click', () => startGame(gameIndex, isRetry));
}

function startGame(gameIndex, isRetry) {
  const definition = GAME_DEFINITIONS[gameIndex];
  container.dataset.terrain = TERRAIN_MAP[definition.key] ?? '';
  const mount = GAME_MOUNTS[definition.key];
  mount(container, (result) => {
    handleGameComplete(gameIndex, result).catch((error) => {
      console.error(error);
      renderFatalState('We could not sync that level. Refresh and jump back in.');
    });
  }, { isRetry });
}

async function handleGameComplete(gameIndex, result) {
  const game = session.games[gameIndex];
  const ratio = percentCorrect(result.correctCount, result.totalCount);
  const passed = isPassed(result.correctCount, result.totalCount);
  const stars = calculateStars(result.correctCount, result.totalCount);
  const attemptNumber = game.attempts.length + 1;

  const outcome = recordGameAttempt(session, gameIndex, {
    ...result,
    ratio,
    passed,
    stars,
    attemptNumber
  });

  await submitAttemptScore({
    agent: session.agent,
    waveCode: session.waveCode,
    trainerName: session.trainerName,
    game: game.key,
    attempt: attemptNumber,
    scorePct: ratio,
    stars,
    passed
  });

  let newBadges = [];
  if (passed) {
    newBadges = evaluateBadges(gameIndex, result, session, ratio);
    if (newBadges.length) {
      outcome.game.earnedBadges = [...new Set([
        ...(outcome.game.earnedBadges || []),
        ...newBadges.map((badge) => badge.id)
      ])];
    }
    session.justEarnedBadgeIds = newBadges.map((badge) => badge.id);
    awardBadgesSequentially(newBadges, session.agent);
  } else {
    session.justEarnedBadgeIds = [];
  }

  saveSession(session);
  renderShell();

  if (passed) {
    renderPassInterstitial(outcome, newBadges);
  } else {
    renderFailInterstitial(outcome);
  }
}

async function showResults() {
  const leaderboard = await fetchLeaderboard(session.agent);
  const improvedRank = Boolean(
    leaderboard.currentRow &&
    session.lastKnownRank &&
    leaderboard.currentRow.rank < session.lastKnownRank
  );

  if (leaderboard.currentRow) {
    session.lastKnownRank = leaderboard.currentRow.rank;
    localStorage.setItem(`atlas_rank_${session.agent}`, String(leaderboard.currentRow.rank));
    saveSession(session);
  }

  mountResults(container, session, {
    leaderboard,
    rankFlash: improvedRank ? `Rank up! You're now #${leaderboard.currentRow.rank}` : '',
    justEarnedBadgeIds: session.justEarnedBadgeIds || []
  });
}

function renderPassInterstitial(outcome, newBadges) {
  const definition = GAME_DEFINITIONS[outcome.gameIndex];
  const isFinalMission = session.completed || session.currentGameIndex >= GAME_DEFINITIONS.length;

  container.innerHTML = `
    <section class="interstitial-panel pass enhanced-result">
      <span class="eyebrow">${displayLabel(definition.key)}</span>
      <h1>LEVEL CLEARED</h1>
      <div class="attempt-score">
        <strong data-rollup-target="${outcome.attempt.score}">0</strong>
        <span>${outcome.attempt.correctCount}/${outcome.attempt.totalCount} correct · ${Math.round((outcome.attempt.ratio || 0) * 100)}%</span>
      </div>
      <div class="star-strip" aria-label="${outcome.attempt.stars} stars earned">
        ${wrapStarsMarkup(outcome.attempt.stars)}
      </div>
      ${newBadges.length ? `<p class="unlock-copy">${newBadges.map((badge) => escapeHtml(badge.name)).join(' · ')} unlocked</p>` : ''}
      <div class="action-row">
        ${definition.key === 'pin' ? '<button id="review-map" class="btn btn-secondary" type="button">Review map</button>' : ''}
        <button id="continue-game" class="btn btn-primary" type="button">${isFinalMission ? 'View results' : 'Next level'}</button>
      </div>
    </section>
  `;

  animateCount(container.querySelector('[data-rollup-target]'), outcome.attempt.score, 650);
  launchConfetti(container.querySelector('.interstitial-panel.pass'));

  const reviewButton = container.querySelector('#review-map');
  if (reviewButton) {
    reviewButton.addEventListener('click', () => {
      mountPinReview(container, () => renderPassInterstitial(outcome, newBadges));
    });
  }

  container.querySelector('#continue-game').addEventListener('click', () => {
    route().catch((error) => {
      console.error(error);
      renderFatalState('We could not move to the next level.');
    });
  });
}

function renderFailInterstitial(outcome) {
  const definition = GAME_DEFINITIONS[outcome.gameIndex];
  const attempts = outcome.game.attempts;
  const attemptNumber = outcome.attempt.attemptNumber;
  const personalBest = hasPersonalBest(attempts, outcome.attempt.ratio || 0);
  const message = getMotivationalCopy(attemptNumber);

  container.innerHTML = `
    <section class="interstitial-panel fail enhanced-result">
      <span class="eyebrow">${displayLabel(definition.key)}</span>
      <h1>RUN IT BACK</h1>
      <div class="attempt-counter">Attempt ${attemptNumber}</div>
      <div class="attempt-dots" aria-label="Attempt history">${renderAttemptDots(attempts)}</div>
      ${personalBest ? '<div class="personal-best">New personal best</div>' : ''}
      <div class="attempt-score">
        <strong data-rollup-target="${outcome.attempt.score}">0</strong>
        <span>${outcome.attempt.correctCount}/${outcome.attempt.totalCount} correct · ${Math.round((outcome.attempt.ratio || 0) * 100)}%</span>
      </div>
      <p class="motivation-copy">${escapeHtml(message)}</p>
      <div class="action-row">
        ${definition.key === 'pin' ? '<button id="review-map" class="btn btn-secondary" type="button">Review map</button>' : ''}
        <button id="retry-game" class="btn btn-primary" type="button">Retry level</button>
      </div>
    </section>
  `;

  animateCount(container.querySelector('[data-rollup-target]'), outcome.attempt.score, 650);

  const reviewButton = container.querySelector('#review-map');
  if (reviewButton) {
    reviewButton.addEventListener('click', () => {
      mountPinReview(container, () => renderFailInterstitial(outcome));
    });
  }

  const retryButton = container.querySelector('#retry-game');
  startRetryCountdown(retryButton);
  retryButton.addEventListener('click', () => route(outcome.game.key));
}

function awardBadgesSequentially(badges, agent) {
  badges.forEach(({ id, name }, index) => {
    setTimeout(() => {
      if (isConfigured()) {
        awardBadge(agent, id, name);
      }
      showBadgeToast(name);
      playBadgeChime();
    }, index * 500);
  });
}

function showBadgeToast(name) {
  const toast = document.createElement('div');
  toast.className = 'badge-toast';
  toast.textContent = `Badge unlocked: ${name}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function playBadgeChime() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.start();
  osc.stop(ctx.currentTime + 0.4);
}

function introCopy(key) {
  const copy = {
    crack: 'Catch each falling location tag, type the right code, and keep your streak alive.',
    pin: 'Scan the map, hit the glowing target, and clear each drop before the timer burns out.',
    sorter: 'Drag city cards into the right home column and combo through the board.',
    ranger: 'One place. Seven regions. Trust your instincts and lock it in before time fades.'
  };
  return copy[key] || '';
}

function attemptLabel(game) {
  return `Attempt ${game.attempts.length + 1}`;
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

function readStoredRank(agent) {
  const rank = Number(localStorage.getItem(`atlas_rank_${agent}`));
  return Number.isFinite(rank) && rank > 0 ? rank : null;
}

function renderFatalState(message) {
  container.innerHTML = `
    <section class="interstitial-panel fail">
      <span class="eyebrow">System notice</span>
      <h1>Something glitched</h1>
      <p>${escapeHtml(message)}</p>
      <div class="action-row">
        <button id="reload-shell" class="btn btn-primary" type="button">Reload</button>
      </div>
    </section>
  `;
  container.querySelector('#reload-shell').addEventListener('click', () => window.location.reload());
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
