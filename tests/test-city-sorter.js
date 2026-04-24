import { suite, test, assert, assertEqual, summary } from './test-runner.js';
import { buildRounds, groupCitiesByState, isCorrectPlacement } from '../js/city-sorter.js';

const cities = Array.from({ length: 12 }, (_, stateIndex) => ([
  { name: `City ${stateIndex}A`, stateCode: `S${stateIndex}`, stateName: `State ${stateIndex}`, country: 'US' },
  { name: `City ${stateIndex}B`, stateCode: `S${stateIndex}`, stateName: `State ${stateIndex}`, country: 'US' }
])).flat();

suite('city sorter');

test('groupCitiesByState groups by state code', () => {
  const groups = groupCitiesByState(cities);
  assertEqual(groups.length, 12);
  assertEqual(groups[0].cities.length, 2);
});

test('buildRounds creates four rounds with three buckets and six cities each', () => {
  const rounds = buildRounds(cities, 4);
  assertEqual(rounds.length, 4);
  assert(rounds.every((round) => round.buckets.length === 3));
  assert(rounds.every((round) => round.cities.length === 6));
});

test('isCorrectPlacement validates city state code', () => {
  const city = { name: 'Houston', stateCode: 'TX' };
  assert(isCorrectPlacement(city, 'TX'));
  assert(!isCorrectPlacement(city, 'CA'));
});

summary();
