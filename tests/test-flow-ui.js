import { suite, test, assert, assertEqual, summary } from './test-runner.js';
import { getMotivationalCopy, hasPersonalBest, renderAttemptDots } from '../js/flow-ui.js';

suite('flow ui');

test('personal best excludes current attempt from comparison', () => {
  const attempts = [{ ratio: 0.3 }, { ratio: 0.5 }, { ratio: 0.7 }];
  assert(hasPersonalBest(attempts, 0.7));
});

test('motivational copy rotates through approved messages', () => {
  assertEqual(getMotivationalCopy(1), "Close one. Run it back and keep the streak alive.");
  assertEqual(getMotivationalCopy(6), "Close one. Run it back and keep the streak alive.");
});

test('attempt dots render current marker and pass fail classes', () => {
  const html = renderAttemptDots([{ passed: false }, { passed: true }]);
  assert(html.includes('attempt-dot fail'));
  assert(html.includes('attempt-dot pass current'));
});

summary();
