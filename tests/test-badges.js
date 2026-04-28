import { suite, test, assert, assertEqual, summary } from './test-runner.js';
import { evaluateBadges } from '../js/badges.js';

// Helper: build a minimal session with given game states
function makeSession(games, earnedBadges = []) {
  return {
    earnedBadges,
    games: games.map(g => ({
      key: g.key || 'crack',
      passed: g.passed || false,
      stars: g.stars || 0,
      streakPeak: g.streakPeak || 0,
      attempts: g.attempts || []
    }))
  };
}

suite('badges');

test('first-blood: awarded when first attempt passes', () => {
  const session = makeSession([{ passed: true, attempts: [{}] }]);
  const result = evaluateBadges(0, { correctCount: 16, totalCount: 20, timerRatio: -1 }, session);
  assert(result.some(b => b.id === 'first-blood'), 'first-blood not awarded');
});

test('first-blood: not awarded when second attempt passes', () => {
  const session = makeSession([{ passed: true, attempts: [{}, {}] }]);
  const result = evaluateBadges(0, { correctCount: 16, totalCount: 20, timerRatio: -1 }, session);
  assert(!result.some(b => b.id === 'first-blood'), 'first-blood should not fire on attempt 2');
});

test('perfect-agent: awarded on 100% score', () => {
  const session = makeSession([{ passed: true, attempts: [{}] }]);
  const result = evaluateBadges(0, { correctCount: 20, totalCount: 20, timerRatio: -1 }, session);
  assert(result.some(b => b.id === 'perfect-agent'));
});

test('perfect-agent: not awarded on < 100%', () => {
  const session = makeSession([{ passed: true, attempts: [{}] }]);
  const result = evaluateBadges(0, { correctCount: 19, totalCount: 20, timerRatio: -1 }, session);
  assert(!result.some(b => b.id === 'perfect-agent'));
});

test('hot-streak: awarded when streakPeak >= 3', () => {
  const session = makeSession([{ passed: true, streakPeak: 3, attempts: [{}] }]);
  const result = evaluateBadges(0, { correctCount: 14, totalCount: 20, timerRatio: -1 }, session);
  assert(result.some(b => b.id === 'hot-streak'));
});

test('hot-streak: not awarded when streakPeak < 3', () => {
  const session = makeSession([{ passed: true, streakPeak: 2, attempts: [{}] }]);
  const result = evaluateBadges(0, { correctCount: 14, totalCount: 20, timerRatio: -1 }, session);
  assert(!result.some(b => b.id === 'hot-streak'));
});

test('globe-trotter: awarded when all active games passed', () => {
  const session = makeSession([
    { passed: true, attempts: [{}] },
    { passed: true, attempts: [{}] },
    { passed: true, attempts: [{}] }
  ]);
  const result = evaluateBadges(2, { correctCount: 14, totalCount: 20, timerRatio: -1 }, session);
  assert(result.some(b => b.id === 'globe-trotter'));
});

test('globe-trotter: not awarded when any game is unpassed', () => {
  const session = makeSession([
    { passed: true, attempts: [{}] },
    { passed: true, attempts: [{}] },
    { passed: false, attempts: [{}] }
  ]);
  const result = evaluateBadges(2, { correctCount: 14, totalCount: 20, timerRatio: -1 }, session);
  assert(!result.some(b => b.id === 'globe-trotter'));
});

test('diamond-agent: awarded when all active games passed on first attempt each', () => {
  const session = makeSession([
    { passed: true, attempts: [{}] },
    { passed: true, attempts: [{}] },
    { passed: true, attempts: [{}] }
  ]);
  const result = evaluateBadges(2, { correctCount: 14, totalCount: 20, timerRatio: -1 }, session);
  assert(result.some(b => b.id === 'diamond-agent'));
});

test('diamond-agent: not awarded when any game needed 2+ attempts', () => {
  const session = makeSession([
    { passed: true, attempts: [{}, {}] },
    { passed: true, attempts: [{}] },
    { passed: true, attempts: [{}] }
  ]);
  const result = evaluateBadges(2, { correctCount: 14, totalCount: 20, timerRatio: -1 }, session);
  assert(!result.some(b => b.id === 'diamond-agent'));
});

test('star-collector: awarded when all active games have 3 stars', () => {
  const session = makeSession([
    { passed: true, stars: 3, attempts: [{}] },
    { passed: true, stars: 3, attempts: [{}] },
    { passed: true, stars: 3, attempts: [{}] }
  ]);
  const result = evaluateBadges(2, { correctCount: 20, totalCount: 20, timerRatio: -1 }, session);
  assert(result.some(b => b.id === 'star-collector'));
});

test('star-collector: not awarded when total stars are below max', () => {
  const session = makeSession([
    { passed: true, stars: 3, attempts: [{}] },
    { passed: true, stars: 3, attempts: [{}] },
    { passed: true, stars: 2, attempts: [{}] }
  ]);
  const result = evaluateBadges(2, { correctCount: 14, totalCount: 20, timerRatio: -1 }, session);
  assert(!result.some(b => b.id === 'star-collector'));
});

test('never-quit: awarded when passing on 4th+ attempt', () => {
  const session = makeSession([{ passed: true, attempts: [{}, {}, {}, {}] }]);
  const result = evaluateBadges(0, { correctCount: 14, totalCount: 20, timerRatio: -1 }, session);
  assert(result.some(b => b.id === 'never-quit'));
});

test('never-quit: not awarded when passing on 3rd attempt', () => {
  const session = makeSession([{ passed: true, attempts: [{}, {}, {}] }]);
  const result = evaluateBadges(0, { correctCount: 14, totalCount: 20, timerRatio: -1 }, session);
  assert(!result.some(b => b.id === 'never-quit'));
});

test('speed-run: awarded on 100% score with timerRatio > 0.5', () => {
  const session = makeSession([{ passed: true, attempts: [{}] }]);
  const result = evaluateBadges(0, { correctCount: 20, totalCount: 20, timerRatio: 0.6 }, session);
  assert(result.some(b => b.id === 'speed-run'));
});

test('speed-run: not awarded when timerRatio is -1 (no timer game)', () => {
  const session = makeSession([{ passed: true, attempts: [{}] }]);
  const result = evaluateBadges(0, { correctCount: 20, totalCount: 20, timerRatio: -1 }, session);
  assert(!result.some(b => b.id === 'speed-run'));
});

test('already-earned badges are not returned again', () => {
  const session = makeSession([{ passed: true, attempts: [{}] }], ['first-blood']);
  const result = evaluateBadges(0, { correctCount: 16, totalCount: 20, timerRatio: -1 }, session);
  assert(!result.some(b => b.id === 'first-blood'), 'first-blood should not re-award');
});

summary();
