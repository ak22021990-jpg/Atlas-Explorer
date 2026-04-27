import { suite, test, assert, assertEqual, summary } from './test-runner.js';
import { renderBadgeShelf } from '../js/results.js';

suite('results');

test('badge shelf renders earned and locked states', () => {
  const html = renderBadgeShelf(['first-blood'], []);
  assert(html.includes('data-badge-id="first-blood"'));
  assert(html.includes('badge-card earned'));
  assert(html.includes('badge-card locked'));
});

test('badge shelf marks just-earned badges for animation', () => {
  const html = renderBadgeShelf(['perfect-agent'], ['perfect-agent']);
  assert(html.includes('badge-card earned just-earned'));
  assertEqual((html.match(/just-earned/g) || []).length, 1);
});

summary();
