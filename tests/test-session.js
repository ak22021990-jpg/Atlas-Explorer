import { suite, test, assert, assertEqual, assertDeepEqual, summary } from './test-runner.js';
import {
  createSession,
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

test('creates four game slots', () => {
  const session = createSession('Priya', 'APR-2026-01');
  assertEqual(session.games.length, 4);
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
  recordGameAttempt(session, 3, { score: 182, correctCount: 14, totalCount: 20 });
  const payload = getSubmissionPayload(session);
  assert(isAllPassed(session));
  assertEqual(getTotalScore(session), 706);
  assertEqual(getTotalStars(session), 5);
  assertEqual(payload.passFail, 'Pass');
  assertEqual(payload.flagged, 'No');
});

test('createSession initialises earnedBadges and lastKnownRank', () => {
  const session = createSession('Priya', 'APR-2026-01');
  assertDeepEqual(session.earnedBadges, []);
  assertEqual(session.lastKnownRank, null);
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
});

summary();
