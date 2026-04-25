import { normalizeAttempt } from './scoring.js';

export const STORAGE_KEY = 'atlas-explorer-session';

export const GAME_DEFINITIONS = [
  { key: 'crack', label: 'Crack the Code', maxScore: 260 },
  { key: 'pin', label: 'Pin It!', maxScore: 195 },
  { key: 'sorter', label: 'City Sorter', maxScore: 312 },
  { key: 'ranger', label: 'Region Ranger', maxScore: 260 }
];

export function createSession(name, batchId) {
  return {
    id: `atlas-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    batchId,
    currentGameIndex: 0,
    completed: false,
    createdAt: new Date().toISOString(),
    games: GAME_DEFINITIONS.map((game) => ({
      key: game.key,
      label: game.label,
      attempts: [],
      score: 0,
      correctCount: 0,
      totalCount: 0,
      stars: 0,
      passed: false,
      retryAvailable: false,
      completed: false
    }))
  };
}

export function recordGameAttempt(session, gameIndexOrKey, rawAttempt) {
  const index = resolveGameIndex(gameIndexOrKey);
  const game = session.games[index];
  if (!game) throw new Error(`Unknown game: ${gameIndexOrKey}`);

  const attempt = normalizeAttempt(rawAttempt);
  game.attempts.push(attempt);

  if (attempt.passed) {
    applyFinalAttempt(game, attempt);
    game.retryAvailable = false;
    if (session.currentGameIndex === index) {
      session.currentGameIndex = Math.min(index + 1, session.games.length);
    }
    session.completed = session.currentGameIndex >= session.games.length;
    return { status: 'passed', game, attempt, gameIndex: index };
  }

  // Failed — always allow retry (no attempt cap)
  game.score = attempt.score;
  game.correctCount = attempt.correctCount;
  game.totalCount = attempt.totalCount;
  game.stars = 0;
  game.passed = false;
  game.retryAvailable = true;
  return { status: 'retry', game, attempt, gameIndex: index };
}

export function getCurrentGame(session) {
  return session.games[session.currentGameIndex] || null;
}

export function shouldRetryGame(session, gameIndexOrKey = session.currentGameIndex) {
  const game = session.games[resolveGameIndex(gameIndexOrKey)];
  return Boolean(game?.retryAvailable);
}

export function isAllPassed(session) {
  return session.games.every((game) => game.passed);
}

// isFlagged: session blocking was removed (unlimited retries). Kept for backward
// compatibility — callers in results.js check this; they will always get false.
export function isFlagged(session) {
  return false;
}

export function getTotalScore(session) {
  return session.games.reduce((total, game) => total + (game.score || 0), 0);
}

export function getTotalStars(session) {
  return session.games.reduce((total, game) => total + (game.stars || 0), 0);
}

export function getSubmissionPayload(session) {
  return {
    name: session.name,
    batchId: session.batchId,
    game1: session.games[0]?.score || 0,
    game2: session.games[1]?.score || 0,
    game3: session.games[2]?.score || 0,
    game4: session.games[3]?.score || 0,
    total: getTotalScore(session),
    stars: getTotalStars(session),
    passFail: isAllPassed(session) ? 'Pass' : 'Fail',
    flagged: isFlagged(session) ? 'Yes' : 'No'
  };
}

export function saveSession(session, storage = globalThis.localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadSession(storage = globalThis.localStorage) {
  const raw = storage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSession(storage = globalThis.localStorage) {
  storage.removeItem(STORAGE_KEY);
}

function resolveGameIndex(gameIndexOrKey) {
  if (typeof gameIndexOrKey === 'number') return gameIndexOrKey;
  return GAME_DEFINITIONS.findIndex((game) => game.key === gameIndexOrKey);
}

function applyFinalAttempt(game, attempt) {
  game.score = attempt.score;
  game.correctCount = attempt.correctCount;
  game.totalCount = attempt.totalCount;
  game.stars = attempt.stars;
  game.passed = Boolean(attempt.passed);
  game.completed = true;
}
