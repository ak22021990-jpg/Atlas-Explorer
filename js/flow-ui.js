export const MOTIVATION_COPY = [
  "Close one. Run it back and keep the streak alive.",
  'You are one cleaner round away from a highlight clip.',
  'Every retry sharpens the route. Go again.',
  'Almost there. One hot streak changes the whole board.',
  'Amazon Geo Rush rewards the comeback.'
];

export function getMotivationalCopy(attemptNumber) {
  return MOTIVATION_COPY[(Math.max(attemptNumber, 1) - 1) % MOTIVATION_COPY.length];
}

export function hasPersonalBest(attempts, ratio) {
  if (!Array.isArray(attempts) || attempts.length <= 1) return false;
  const previousBest = Math.max(0, ...attempts.slice(0, -1).map((attempt) => attempt.ratio || 0));
  return ratio > previousBest;
}

export function renderAttemptDots(attempts = []) {
  return attempts.map((attempt, index) => `
    <span class="attempt-dot ${attempt.passed ? 'pass' : 'fail'} ${index === attempts.length - 1 ? 'current' : ''}"></span>
  `).join('');
}

export function startRetryCountdown(button, seconds = 3) {
  if (!button) return () => {};
  button.disabled = true;
  let remaining = seconds;
  button.textContent = `Try Again (${remaining})`;
  const timerId = setInterval(() => {
    remaining -= 1;
    if (remaining > 0) {
      button.textContent = `Try Again (${remaining})`;
      return;
    }
    clearInterval(timerId);
    button.disabled = false;
    button.textContent = 'Try Again';
  }, 1000);
  return () => clearInterval(timerId);
}
