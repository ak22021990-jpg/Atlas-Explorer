// badges.js — pure badge evaluation, no DOM dependencies

export const BADGE_DEFS = [
  { id: 'first-blood',    name: 'First Blood' },
  { id: 'perfect-agent',  name: 'Perfect Agent' },
  { id: 'hot-streak',     name: 'Hot Streak' },
  { id: 'globe-trotter',  name: 'Globe Trotter' },
  { id: 'diamond-agent',  name: 'Diamond Agent' },
  { id: 'star-collector', name: 'Star Collector' },
  { id: 'never-quit',     name: 'Never Quit' },
  { id: 'speed-run',      name: 'Speed Run' }
];

/**
 * Evaluate which badges are newly earned after a passing attempt.
 * Called AFTER recordGameAttempt() has already appended the current attempt.
 *
 * @param {number} gameIndex - index of the completed game in session.games
 * @param {object} result    - raw onComplete payload: { correctCount, totalCount, timerRatio }
 * @param {object} session   - full session object (session.earnedBadges mutated on award)
 * @returns {{ id: string, name: string }[]} newly earned badges
 */
export function evaluateBadges(gameIndex, result, session, ratioOverride) {
  const game     = session.games[gameIndex];
  const allGames = session.games;
  const newBadges = [];

  function maybeAdd(id) {
    if (session.earnedBadges.includes(id)) return;
    const def = BADGE_DEFS.find(b => b.id === id);
    if (!def) return;
    newBadges.push({ id: def.id, name: def.name });
    session.earnedBadges.push(id);
  }

  const ratio = typeof ratioOverride === 'number'
    ? ratioOverride
    : result.correctCount / result.totalCount;

  // first-blood: only one attempt recorded (this is it)
  if (game.attempts.length === 1) maybeAdd('first-blood');

  // perfect-agent: 100% correct
  if (ratio === 1) maybeAdd('perfect-agent');

  // hot-streak: peak consecutive-correct run >= 3 for this game
  if (game.streakPeak >= 3) maybeAdd('hot-streak');

  // globe-trotter: all games passed
  if (allGames.length === 4 && allGames.every(g => g.passed)) maybeAdd('globe-trotter');

  // diamond-agent: all games passed on first attempt each
  if (allGames.length === 4 && allGames.every(g => g.passed && g.attempts.length === 1))
    maybeAdd('diamond-agent');

  // star-collector: 12 total stars (max possible in a session)
  const totalStars = allGames.reduce((sum, g) => sum + (g.stars || 0), 0);
  if (totalStars >= 12) maybeAdd('star-collector');

  // never-quit: passed on 4th or later attempt (3+ prior fails)
  if (game.attempts.length >= 4) maybeAdd('never-quit');

  // speed-run: 100% score AND timerRatio > 0.5 AND game has a timer (timerRatio !== -1)
  if (ratio === 1 && result.timerRatio > 0.5) maybeAdd('speed-run');

  return newBadges;
}
