import { suite, test, assert, assertEqual, summary } from './test-runner.js';
import {
  calculatePoints,
  calculateStars,
  isPassed,
  percentCorrect,
  requiredCorrect
} from '../js/scoring.js';

suite('scoring');

test('requiredCorrect rounds up 70 percent thresholds', () => {
  assertEqual(requiredCorrect(15), 11);
  assertEqual(requiredCorrect(20), 14);
  assertEqual(requiredCorrect(24), 17);
});

test('isPassed uses required correct count', () => {
  assert(isPassed(14, 20));
  assert(!isPassed(13, 20));
});

test('calculatePoints adds speed bonus only for correct fast answers', () => {
  assertEqual(calculatePoints(true, 10, 15), 13);
  assertEqual(calculatePoints(true, 16, 15), 10);
  assertEqual(calculatePoints(false, 1, 15), 0);
});

test('calculateStars maps pass percentages', () => {
  assertEqual(calculateStars(13, 20), 0);
  assertEqual(calculateStars(14, 20), 1);
  assertEqual(calculateStars(16, 20), 2);
  assertEqual(calculateStars(19, 20), 3);
});

test('percentCorrect handles empty totals', () => {
  assertEqual(percentCorrect(0, 0), 0);
});

summary();
