import { suite, test, assert, assertEqual, summary } from './test-runner.js';
import { checkMapClick, pickPinQuestions } from '../js/pin-it.js';

const states = [
  { code: 'TX', name: 'Texas' },
  { code: 'CA', name: 'California' },
  { code: 'ON', name: 'Ontario' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'NY', name: 'New York' },
  ...Array.from({ length: 20 }, (_, index) => ({ code: `X${index}`, name: `Extra ${index}` }))
];

suite('pin it');

test('pickPinQuestions returns requested count', () => {
  assertEqual(pickPinQuestions(states, 15).length, 15);
});

test('opening questions include major regions first', () => {
  const questions = pickPinQuestions(states, 6);
  assertEqual(questions[0].code, 'TX');
  assertEqual(questions[1].code, 'CA');
  assertEqual(questions[2].code, 'ON');
});

test('checkMapClick compares codes', () => {
  assert(checkMapClick('TX', 'TX'));
  assert(!checkMapClick('TX', 'CA'));
});

summary();
