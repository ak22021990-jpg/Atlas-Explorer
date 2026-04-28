import { calculatePoints } from './scoring.js';
import { showStreak, triggerFeedbackFlash } from './ui-effects.js';

const TOTAL_QUESTIONS = 20;
const PRIORITY_QUESTIONS = 10;
const FALL_DURATION_MS = 5000;
const SPEED_WINDOW = 2;

export function pickQuestions(allStates, total = TOTAL_QUESTIONS, priorityCount = PRIORITY_QUESTIONS) {
  const priority = shuffle(allStates.filter((state) => state.common)).slice(0, Math.min(priorityCount, total));
  const usedCodes = new Set(priority.map((state) => state.code));
  const remaining = shuffle(allStates.filter((state) => !usedCodes.has(state.code))).slice(0, total - priority.length);
  return [...priority, ...remaining];
}

export function buildChoices(question, allStates) {
  const decoys = shuffle(allStates.filter((state) => state.code !== question.code)).slice(0, 3);
  return shuffle([question, ...decoys]);
}

export function checkAnswer(expected, actual, allStates) {
  if (Array.isArray(allStates)) {
    const state = allStates.find((item) => item.code === expected);
    return Boolean(state && state.name === actual);
  }
  return String(expected).toUpperCase() === String(actual).toUpperCase();
}

export async function mountCrackTheCode(container, onComplete, options = {}) {
  const states = await fetch('data/states.json').then((response) => response.json());
  const questions = pickQuestions(states);
  let currentIndex = 0;
  let score = 0;
  let correctCount = 0;
  let streak = 0;
  let streakPeak = 0;
  let fallTimer = null;
  let fallAnimationFrame = null;
  let startedAt = 0;
  let currentBlock = null;
  let activeDropId = 0;

  container.innerHTML = `
    <section class="game-card arcade-card code-drop-card">
      <div class="code-drop-topbar">
        <div class="code-drop-brand">
          <span class="code-drop-compass" aria-hidden="true">AE</span>
          <div>
            <span class="code-drop-title">Atlas Explorer</span>
            <span class="code-drop-sector">${options.isRetry ? 'Retry Code Drop Sector' : 'Code Drop Sector'}</span>
          </div>
        </div>
        <div class="code-drop-hud">
          <div>
            <span>Score</span>
            <strong id="code-score">0</strong>
          </div>
          <div class="code-drop-divider"></div>
          <div>
            <span>Streak</span>
            <strong id="code-streak">0x</strong>
          </div>
        </div>
      </div>

      <div id="falling-zone" class="code-drop-zone" style="position:relative;width:100%;height:520px;overflow:hidden;">
        <div class="code-drop-progress">
          <span>Level 1: Coastal Regions</span>
          <div><i id="code-progress-bar"></i></div>
          <strong id="progress-text">1/${TOTAL_QUESTIONS}</strong>
        </div>
        <span class="code-drop-ghost ghost-west">British Columbia</span>
        <span class="code-drop-ghost ghost-east">Ontario</span>
        <div class="code-drop-floor"></div>
        <div class="code-drop-vanish-zone" aria-hidden="true"></div>
      </div>

      <form id="type-form" class="code-drop-form">
        <label for="code-input">Type the 2-letter code</label>
        <div class="code-drop-actions">
          <input type="text" id="code-input" autocomplete="off" autofocus maxlength="2"
                 placeholder="CA"
                 style="text-transform:uppercase;">
          <button class="btn btn-primary" type="submit">Submit</button>
        </div>
      </form>

      <div class="code-drop-footer" aria-hidden="true">
        <span>LAT: 36.7783 N, LON: 119.4179 W</span>
        <span><i></i><i></i><i></i></span>
      </div>
    </section>
  `;

  const fallingZone = container.querySelector('#falling-zone');
  const input = container.querySelector('#code-input');
  const form = container.querySelector('#type-form');
  const progressText = container.querySelector('#progress-text');
  const progressBar = container.querySelector('#code-progress-bar');
  const scoreText = container.querySelector('#code-score');
  const streakText = container.querySelector('#code-streak');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleType();
  });

  input.addEventListener('input', () => {
    if (input.value.length === 2) {
      handleType();
    }
  });

  function stopCurrentDrop() {
    clearTimeout(fallTimer);
    fallTimer = null;
    if (fallAnimationFrame) {
      cancelAnimationFrame(fallAnimationFrame);
      fallAnimationFrame = null;
    }
  }

  function renderQuestion() {
    stopCurrentDrop();
    input.value = '';
    input.disabled = false;
    input.focus();
    progressText.textContent = `${currentIndex + 1}/${TOTAL_QUESTIONS}`;
    progressBar.style.width = `${Math.round((currentIndex / TOTAL_QUESTIONS) * 100)}%`;
    const question = questions[currentIndex];

    const prevBlock = fallingZone.querySelector('.falling-block');
    if (prevBlock) prevBlock.remove();

    currentBlock = document.createElement('div');
    currentBlock.className = 'falling-block';
    currentBlock.innerHTML = `<span>${question.name}</span><i aria-hidden="true">drop</i>`;
    currentBlock.style.cssText = [
      'position:absolute',
      'top:-56px',
      'left:50%',
      'transform:translateX(-50%)'
    ].join(';');
    fallingZone.appendChild(currentBlock);

    startedAt = Date.now();
    activeDropId += 1;
    const dropId = activeDropId;

    const startTop = 132;
    const endTop = Math.max(startTop, fallingZone.clientHeight - 24);
    currentBlock.style.top = `${startTop}px`;

    const animateDrop = () => {
      if (dropId !== activeDropId || currentBlock === null) {
        fallAnimationFrame = null;
        return;
      }

      const elapsed = Date.now() - startedAt;
      const progress = Math.min(1, elapsed / FALL_DURATION_MS);
      const currentTop = startTop + ((endTop - startTop) * progress);
      currentBlock.style.top = `${currentTop}px`;

      if (progress < 1) {
        fallAnimationFrame = requestAnimationFrame(animateDrop);
      } else {
        fallAnimationFrame = null;
      }
    };

    fallAnimationFrame = requestAnimationFrame(animateDrop);

    fallTimer = setTimeout(() => {
      handleMiss();
    }, FALL_DURATION_MS);
  }

  function handleType() {
    const val = input.value.trim();
    if (!val || !currentBlock) return;

    const question = questions[currentIndex];
    if (checkAnswer(question.code, val)) {
      stopCurrentDrop();
      correctCount += 1;
      streak += 1;
      if (streak > streakPeak) streakPeak = streak;
      showStreak(streak);
      const elapsed = (Date.now() - startedAt) / 1000;
      score += calculatePoints(true, elapsed, SPEED_WINDOW);
      scoreText.textContent = score.toLocaleString();
      streakText.textContent = `${streak}x`;

      const rect = currentBlock.getBoundingClientRect();
      const zoneRect = fallingZone.getBoundingClientRect();
      const currentTop = rect.top - zoneRect.top;

      currentBlock.style.transition = 'none';
      currentBlock.style.top = `${currentTop}px`;
      currentBlock.classList.add('locked');
      currentBlock.innerHTML = '<span>Locked in</span><i aria-hidden="true">ok</i>';
      triggerFeedbackFlash(input, 'correct');

      input.disabled = true;

      setTimeout(nextQuestion, 500);
      currentBlock = null;
    } else {
      input.value = '';
      input.classList.remove('flash-wrong');
      triggerFeedbackFlash(input, 'wrong');
      input.style.borderColor = 'var(--red)';
      setTimeout(() => {
        input.style.borderColor = 'rgba(255,255,255,0.12)';
      }, 200);
    }
  }

  function handleMiss() {
    stopCurrentDrop();
    streak = 0;
    streakText.textContent = '0x';
    if (currentBlock) {
      currentBlock.remove();
    }
    input.disabled = true;
    setTimeout(nextQuestion, 1000);
    currentBlock = null;
  }

  function nextQuestion() {
    currentIndex += 1;
    if (currentIndex >= TOTAL_QUESTIONS) {
      progressBar.style.width = '100%';
      onComplete({ score, correctCount, totalCount: TOTAL_QUESTIONS, streakPeak, timerRatio: -1 });
      return;
    }
    renderQuestion();
  }

  setTimeout(renderQuestion, 500);
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}
