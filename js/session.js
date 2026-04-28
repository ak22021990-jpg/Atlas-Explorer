import { normalizeAttempt } from './scoring.js';

export const STORAGE_KEY = 'atlas-explorer-session';

export const GAME_DEFINITIONS = [
  { key: 'crack', label: 'Crack the Code', maxScore: 260 },
  { key: 'pin', label: 'Pin It!', maxScore: 195 },
  { key: 'sorter', label: 'City Sorter', maxScore: 312 }
];

export function createSession(name, waveCode, trainerName) {
  return {
    id: `atlas-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    mode: 'player',
    agent: name,
    name,
    waveCode,
    trainerName,
    currentGameIndex: 0,
    completed: false,
    createdAt: new Date().toISOString(),
    earnedBadges: [],
    lastKnownRank: null,
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
      completed: false,
      streakPeak: 0,
      attemptNumber: 0,
      earnedBadges: []
    }))
  };
}

export function createDemoSession() {
  const session = createSession('Manager Demo', 'DEMO', 'Demo Mode');
  session.mode = 'demo';
  session.demo = true;
  session.id = `atlas-demo-${Date.now()}`;
  return session;
}

export function recordGameAttempt(session, gameIndexOrKey, rawAttempt) {
  const index = resolveGameIndex(gameIndexOrKey);
  const game = session.games[index];
  if (!game) throw new Error(`Unknown game: ${gameIndexOrKey}`);

  // Update per-game streakPeak from rawAttempt BEFORE normalizeAttempt strips it
  if (typeof rawAttempt.streakPeak === 'number') {
    game.streakPeak = Math.max(game.streakPeak, rawAttempt.streakPeak);
  }

  const attempt = normalizeAttempt(rawAttempt);
  game.attempts.push(attempt);
  game.attemptNumber = attempt.attemptNumber;

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
  game.completed = false;
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
    waveCode: session.waveCode,
    trainerName: session.trainerName,
    game1: session.games[0]?.score || 0,
    game2: session.games[1]?.score || 0,
    game3: session.games[2]?.score || 0,
    game4: 0,
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
  if (!raw) return null;
  const session = JSON.parse(raw);
  session.mode = session.mode || (session.demo ? 'demo' : 'player');
  session.demo = session.mode === 'demo' || Boolean(session.demo);
  if (!session.agent && session.name) session.agent = session.name;
  session.earnedBadges = Array.isArray(session.earnedBadges) ? session.earnedBadges : [];
  session.lastKnownRank = Number.isFinite(session.lastKnownRank) ? session.lastKnownRank : null;
  const legacyGames = session.games || [];
  session.games = GAME_DEFINITIONS.map((definition, index) => {
    const game = legacyGames.find((candidate) => candidate?.key === definition.key) || legacyGames[index] || {};
    const attempts = Array.isArray(game.attempts) ? game.attempts : [];
    return {
      streakPeak: 0,
      attemptNumber: attempts.length,
      earnedBadges: [],
      ...game,
      key: definition.key,
      label: definition.label,
      earnedBadges: Array.isArray(game.earnedBadges) ? game.earnedBadges : [],
      attempts
    };
  });
  session.currentGameIndex = Math.min(session.currentGameIndex || 0, session.games.length);
  session.completed = Boolean(session.completed || session.currentGameIndex >= session.games.length);
  return session;
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
  game.attemptNumber = attempt.attemptNumber;
  game.completed = true;
}
