export const PASS_RATIO = 0.7;
export const BASE_POINTS = 10;
export const SPEED_BONUS_POINTS = 3;

export function requiredCorrect(totalCount, passRatio = PASS_RATIO) {
  return Math.ceil(totalCount * passRatio);
}

export function percentCorrect(correctCount, totalCount) {
  if (!totalCount) return 0;
  return correctCount / totalCount;
}

export function isPassed(correctCount, totalCount, passRatio = PASS_RATIO) {
  if (!totalCount) return false;
  return correctCount >= requiredCorrect(totalCount, passRatio);
}

export function calculatePoints(isCorrect, elapsedSeconds, speedWindowSeconds) {
  if (!isCorrect) return 0;
  return BASE_POINTS + (elapsedSeconds <= speedWindowSeconds ? SPEED_BONUS_POINTS : 0);
}

export function calculateStars(correctCount, totalCount) {
  const pct = percentCorrect(correctCount, totalCount);
  if (!isPassed(correctCount, totalCount)) return 0;
  if (pct >= 0.95) return 3;
  if (pct >= 0.8) return 2;
  return 1;
}

export function normalizeAttempt({
  score = 0,
  correctCount = 0,
  totalCount = 0,
  ratio = percentCorrect(correctCount, totalCount),
  attemptNumber = 1
} = {}) {
  const passed = isPassed(correctCount, totalCount);
  return {
    score,
    correctCount,
    totalCount,
    ratio,
    attemptNumber,
    passed,
    stars: passed ? calculateStars(correctCount, totalCount) : 0,
    recordedAt: new Date().toISOString()
  };
}
