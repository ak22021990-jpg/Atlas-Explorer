import { suite, test, assertEqual, summary } from './test-runner.js';
import { getLocalScores, submitAttemptScore } from '../js/leaderboard.js';

const storage = new Map();

global.localStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, value);
  },
  removeItem(key) {
    storage.delete(key);
  }
};

suite('leaderboard');

test('local fallback aggregates per-attempt rows by agent', () => {
  storage.clear();
  submitAttemptScore({ agent: 'Anoop', waveCode: 'W1', trainerName: 'T1', game: 'crack', attempt: 1, scorePct: 0.8, stars: 2, passed: true });
  submitAttemptScore({ agent: 'Anoop', waveCode: 'W1', trainerName: 'T1', game: 'pin', attempt: 1, scorePct: 0.6, stars: 0, passed: false });
  submitAttemptScore({ agent: 'Mina', waveCode: 'W2', trainerName: 'T2', game: 'crack', attempt: 1, scorePct: 1, stars: 3, passed: true });

  const rows = getLocalScores();
  assertEqual(rows[0].agent, 'Mina');
  assertEqual(rows[0].totalStars, 3);
  assertEqual(rows[1].agent, 'Anoop');
  assertEqual(rows[1].gamesPassed, 1);
});

test('local fallback preserves current row shape data', () => {
  const currentRow = getLocalScores().find((row) => row.agent === 'Anoop');
  assertEqual(currentRow.agent, 'Anoop');
  assertEqual(currentRow.rank, 2);
});

summary();
