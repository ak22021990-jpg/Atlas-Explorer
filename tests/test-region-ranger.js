import { suite, test, assert, assertEqual, summary } from './test-runner.js';
import { checkAnswer, pickQuestions, shouldShowLegend } from '../js/region-ranger.js';

const states = Array.from({ length: 25 }, (_, index) => ({
  code: `S${index}`,
  name: `State ${index}`,
  region: index % 2 === 0 ? 'West' : 'Northeast'
}));

suite('region ranger');

test('pickQuestions returns requested count', () => {
  assertEqual(pickQuestions(states, 20).length, 20);
});

test('pickQuestions avoids duplicates', () => {
  const questions = pickQuestions(states, 20);
  assertEqual(new Set(questions.map((question) => question.code)).size, 20);
});

test('checkAnswer validates region', () => {
  assert(checkAnswer('S0', 'West', states));
  assert(!checkAnswer('S0', 'Northeast', states));
});

test('shouldShowLegend hides after question fifteen', () => {
  assert(shouldShowLegend(0));
  assert(shouldShowLegend(14));
  assert(!shouldShowLegend(15));
  assert(!shouldShowLegend(19));
});

summary();
