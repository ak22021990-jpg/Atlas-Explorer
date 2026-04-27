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
    <section class="game-card arcade-card" style="display:flex;flex-direction:column;gap:16px;width:min(100%,760px);">
      <div class="game-header">
        <div>
          <span class="eyebrow">${options.isRetry ? 'Retry mix' : 'Code Drop'}</span>
          <h1 style="margin:4px 0 0;">Catch the code</h1>
        </div>
        <span class="game-progress" id="progress-text">1/${TOTAL_QUESTIONS}</span>
      </div>
      <div id="falling-zone" style="position:relative;width:100%;height:340px;background:radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 55%), rgba(8,12,17,0.85);border:1px solid rgba(255,255,255,0.08);overflow:hidden;box-shadow:inset 0 0 30px rgba(255,255,255,0.04);border-radius:28px;">
        <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 35px,rgba(255,255,255,0.03) 36px);pointer-events:none;"></div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--red),#ff9a7c);box-shadow:0 0 24px rgba(255,101,119,0.35);opacity:0.9;"></div>
      </div>
      <form id="type-form" style="display:flex;flex-direction:column;align-items:center;gap:10px;">
        <span style="font-family:var(--display-font);font-size:0.92rem;color:var(--amz-muted);">Type the 2-letter code</span>
        <input type="text" id="code-input" autocomplete="off" autofocus maxlength="2"
               placeholder="_ _"
               style="text-transform:uppercase;width:240px;text-align:center;font-family:var(--display-font);font-size:2rem;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:var(--ink);padding:14px;letter-spacing:10px;border-radius:22px;">
      </form>
    </section>
  `;

  const fallingZone = container.querySelector('#falling-zone');
  const input = container.querySelector('#code-input');
  const form = container.querySelector('#type-form');
  const progressText = container.querySelector('#progress-text');

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
    const question = questions[currentIndex];

    const prevBlock = fallingZone.querySelector('.falling-block');
    if (prevBlock) prevBlock.remove();

    currentBlock = document.createElement('div');
    currentBlock.className = 'falling-block';
    currentBlock.textContent = question.name;
    currentBlock.style.cssText = [
      'position:absolute',
      'top:-56px',
      'width:100%',
      'text-align:center',
      'color:var(--geo-ink)',
      "font-family:'Inter',sans-serif",
      'font-size:clamp(1.4rem,2.5vw,2rem)',
      'font-weight:700',
      'letter-spacing:0',
      'text-shadow:none',
      'padding:10px 0'
    ].join(';');
    fallingZone.appendChild(currentBlock);

    startedAt = Date.now();
    activeDropId += 1;
    const dropId = activeDropId;

    const startTop = -56;
    const endTop = Math.max(0, fallingZone.clientHeight - 56);
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

      const rect = currentBlock.getBoundingClientRect();
      const zoneRect = fallingZone.getBoundingClientRect();
      const currentTop = rect.top - zoneRect.top;

      currentBlock.style.transition = 'none';
      currentBlock.style.top = `${currentTop}px`;
      currentBlock.style.color = 'var(--green)';
      currentBlock.textContent = 'Locked in';
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
    const question = questions[currentIndex];
    if (currentBlock) {
      currentBlock.style.top = `${Math.max(0, fallingZone.clientHeight - 46)}px`;
      currentBlock.style.color = 'var(--red)';
      currentBlock.textContent = `Missed ${question.code}`;
    }
    input.disabled = true;
    setTimeout(nextQuestion, 1000);
    currentBlock = null;
  }

  function nextQuestion() {
    currentIndex += 1;
    if (currentIndex >= TOTAL_QUESTIONS) {
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
