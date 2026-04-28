import { suite, test, assert, assertEqual, assertDeepEqual, summary } from './test-runner.js';
import {
  createSession,
  createDemoSession,
  loadSession,
  getSubmissionPayload,
  getTotalScore,
  getTotalStars,
  isAllPassed,
  isFlagged,
  recordGameAttempt,
  shouldRetryGame
} from '../js/session.js';

suite('session');

test('creates three game slots', () => {
  const session = createSession('Priya', 'APR-2026-01');
  assertEqual(session.games.length, 3);
  assertEqual(session.currentGameIndex, 0);
});

test('passing a game advances the session', () => {
  const session = createSession('Priya', 'APR-2026-01');
  const outcome = recordGameAttempt(session, 0, { score: 160, correctCount: 16, totalCount: 20 });
  assertEqual(outcome.status, 'passed');
  assertEqual(session.currentGameIndex, 1);
  assertEqual(session.games[0].stars, 2);
});

test('first failure unlocks a retry', () => {
  const session = createSession('Priya', 'APR-2026-01');
  const outcome = recordGameAttempt(session, 0, { score: 60, correctCount: 6, totalCount: 20 });
  assertEqual(outcome.status, 'retry');
  assert(shouldRetryGame(session, 0));
  assert(!isFlagged(session));
});

test('multiple failures always return retry', () => {
  const session = createSession('Priya', 'APR-2026-01');
  recordGameAttempt(session, 0, { score: 60, correctCount: 6, totalCount: 20 });
  const outcome = recordGameAttempt(session, 0, { score: 65, correctCount: 7, totalCount: 20 });
  assertEqual(outcome.status, 'retry');
  assert(!session.blocked);
  assert(!session.flagged);
});

test('third failure still retries', () => {
  const session = createSession('Priya', 'APR-2026-01');
  recordGameAttempt(session, 0, { score: 60, correctCount: 6, totalCount: 20 });
  recordGameAttempt(session, 0, { score: 60, correctCount: 6, totalCount: 20 });
  const outcome = recordGameAttempt(session, 0, { score: 60, correctCount: 6, totalCount: 20 });
  assertEqual(outcome.status, 'retry');
});

test('pass after multiple failures resolves correctly', () => {
  const session = createSession('Priya', 'APR-2026-01');
  recordGameAttempt(session, 0, { score: 60, correctCount: 6, totalCount: 20 });
  recordGameAttempt(session, 0, { score: 60, correctCount: 6, totalCount: 20 });
  const outcome = recordGameAttempt(session, 0, { score: 160, correctCount: 16, totalCount: 20 });
  assertEqual(outcome.status, 'passed');
  assertEqual(session.currentGameIndex, 1);
});

test('submission payload totals scores and flags', () => {
  const session = createSession('Priya', 'APR-2026-01');
  recordGameAttempt(session, 0, { score: 160, correctCount: 16, totalCount: 20 });
  recordGameAttempt(session, 1, { score: 143, correctCount: 11, totalCount: 15 });
  recordGameAttempt(session, 2, { score: 221, correctCount: 17, totalCount: 24 });
  const payload = getSubmissionPayload(session);
  assert(isAllPassed(session));
  assertEqual(getTotalScore(session), 524);
  assertEqual(getTotalStars(session), 4);
  assertEqual(payload.passFail, 'Pass');
  assertEqual(payload.flagged, 'No');
});

test('createSession initialises earnedBadges and lastKnownRank', () => {
  const session = createSession('Priya', 'APR-2026-01');
  assertDeepEqual(session.earnedBadges, []);
  assertEqual(session.lastKnownRank, null);
  assertEqual(session.mode, 'player');
});

test('createDemoSession marks session as demo without progress', () => {
  const session = createDemoSession();
  assertEqual(session.mode, 'demo');
  assertEqual(session.demo, true);
  assertEqual(session.agent, 'Manager Demo');
  assertEqual(session.currentGameIndex, 0);
  assert(session.games.every((game) => !game.passed && game.attempts.length === 0));
});

test('each game slot initialises streakPeak to 0', () => {
  const session = createSession('Priya', 'APR-2026-01');
  assert(session.games.every(g => g.streakPeak === 0));
});

test('recordGameAttempt updates streakPeak from rawAttempt', () => {
  const session = createSession('Priya', 'APR-2026-01');
  recordGameAttempt(session, 0, { score: 160, correctCount: 16, totalCount: 20, streakPeak: 5 });
  assertEqual(session.games[0].streakPeak, 5);
});

test('streakPeak keeps highest value across attempts', () => {
  const session = createSession('Priya', 'APR-2026-01');
  recordGameAttempt(session, 0, { score: 60, correctCount: 6, totalCount: 20, streakPeak: 3 });
  recordGameAttempt(session, 0, { score: 160, correctCount: 16, totalCount: 20, streakPeak: 2 });
  assertEqual(session.games[0].streakPeak, 3); // keeps the higher value
});

test('loadSession hydrates earned badges and rank defaults', () => {
  const storage = {
    getItem() {
      return JSON.stringify({
        agent: 'Priya',
        games: [{ attempts: [] }]
      });
    }
  };
  const session = loadSession(storage);
  assertDeepEqual(session.earnedBadges, []);
  assertEqual(session.lastKnownRank, null);
  assertEqual(session.games[0].attemptNumber, 0);
  assertEqual(session.mode, 'player');
});

test('loadSession preserves legacy demo flag', () => {
  const storage = {
    getItem() {
      return JSON.stringify({
        agent: 'Manager Demo',
        demo: true,
        games: [{ attempts: [] }]
      });
    }
  };
  const session = loadSession(storage);
  assertEqual(session.mode, 'demo');
  assertEqual(session.demo, true);
});

test('loadSession removes retired region ranger slot', () => {
  const storage = {
    getItem() {
      return JSON.stringify({
        agent: 'Priya',
        currentGameIndex: 4,
        games: [
          { key: 'crack', attempts: [] },
          { key: 'pin', attempts: [] },
          { key: 'sorter', attempts: [] },
          { key: 'ranger', attempts: [] }
        ]
      });
    }
  };
  const session = loadSession(storage);
  assertEqual(session.games.length, 3);
  assertEqual(session.games.some((game) => game.key === 'ranger'), false);
  assertEqual(session.currentGameIndex, 3);
});

summary();
