import { suite, test, assert, assertEqual, summary } from './test-runner.js';
import { buildChoices, checkAnswer, pickQuestions } from '../js/crack-the-code.js';

const states = Array.from({ length: 30 }, (_, index) => ({
  code: `S${index}`,
  name: `State ${index}`,
  common: index < 20
}));

suite('crack the code');

test('pickQuestions returns requested count', () => {
  assertEqual(pickQuestions(states, 20).length, 20);
});

test('first section comes from common pool', () => {
  const questions = pickQuestions(states, 20, 10);
  assert(questions.slice(0, 10).every((question) => question.common));
});

test('questions do not repeat codes', () => {
  const questions = pickQuestions(states, 20);
  assertEqual(new Set(questions.map((question) => question.code)).size, 20);
});

test('buildChoices includes the correct answer', () => {
  const question = states[0];
  const choices = buildChoices(question, states);
  assertEqual(choices.length, 4);
  assert(choices.some((choice) => choice.code === question.code));
});

test('checkAnswer validates state names', () => {
  assert(checkAnswer('S1', 'State 1', states));
  assert(!checkAnswer('S1', 'State 2', states));
});

summary();
