import { calculatePoints } from './scoring.js';

const TOTAL_QUESTIONS = 20;
const PRIORITY_QUESTIONS = 10;
const TIME_PER_QUESTION = 60;
const SPEED_WINDOW = 20;

export function pickQuestions(allStates, total = TOTAL_QUESTIONS, priorityCount = PRIORITY_QUESTIONS) {
  const priority = shuffle(allStates.filter((state) => state.common)).slice(0, Math.min(priorityCount, total));
  const usedCodes = new Set(priority.map((state) => state.code));
  const remaining = shuffle(allStates.filter((state) => !usedCodes.has(state.code))).slice(0, total - priority.length);
  return [...priority, ...remaining];
}

export function buildChoices(question, allStates, choiceCount = 4) {
  const wrongChoices = shuffle(allStates.filter((state) => state.code !== question.code)).slice(0, choiceCount - 1);
  return shuffle([question, ...wrongChoices]);
}

export function checkAnswer(code, selectedName, allStates) {
  const state = allStates.find((item) => item.code === code);
  return Boolean(state && state.name === selectedName);
}

export async function mountCrackTheCode(container, onComplete, options = {}) {
  const states = await fetch('data/states.json').then((response) => response.json());
  const questions = pickQuestions(states);
  let currentIndex = 0;
  let score = 0;
  let correctCount = 0;
  let timer = null;
  let startedAt = 0;

  function renderQuestion() {
    const question = questions[currentIndex];
    const choices = buildChoices(question, states);
    container.innerHTML = `
      <section class="game-card quiz-card">
        <div class="game-header">
          <div>
            <span class="eyebrow">${options.isRetry ? 'Retry' : 'Crack the Code'}</span>
            <h1>${question.code}</h1>
          </div>
          <span class="game-progress">${currentIndex + 1}/${TOTAL_QUESTIONS}</span>
        </div>
        <div class="timer-bar"><div id="timer-fill" class="timer-bar-fill"></div></div>
        <div class="answer-grid">
          ${choices.map((choice) => `
            <button class="answer-option" type="button" data-answer="${escapeHtml(choice.name)}">
              ${escapeHtml(choice.name)}
            </button>
          `).join('')}
        </div>
      </section>
    `;

    startedAt = Date.now();
    startTimer();
    container.querySelectorAll('.answer-option').forEach((button) => {
      button.addEventListener('click', () => handleAnswer(button.dataset.answer));
    });
  }

  function startTimer() {
    clearInterval(timer);
    let remaining = TIME_PER_QUESTION;
    updateTimer(remaining);
    timer = setInterval(() => {
      remaining -= 1;
      updateTimer(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        handleAnswer(null);
      }
    }, 1000);
  }

  function handleAnswer(selectedName) {
    clearInterval(timer);
    const question = questions[currentIndex];
    const elapsed = (Date.now() - startedAt) / 1000;
    const isCorrect = selectedName ? checkAnswer(question.code, selectedName, states) : false;
    if (isCorrect) correctCount += 1;
    score += calculatePoints(isCorrect, elapsed, SPEED_WINDOW);

    container.querySelectorAll('.answer-option').forEach((button) => {
      button.disabled = true;
      if (button.dataset.answer === question.name) button.classList.add('correct');
      if (button.dataset.answer === selectedName && !isCorrect) button.classList.add('wrong');
    });

    setTimeout(nextQuestion, 650);
  }

  function nextQuestion() {
    currentIndex += 1;
    if (currentIndex >= TOTAL_QUESTIONS) {
      onComplete({ score, correctCount, totalCount: TOTAL_QUESTIONS });
      return;
    }
    renderQuestion();
  }

  renderQuestion();
}

function updateTimer(remaining) {
  const fill = document.getElementById('timer-fill');
  if (!fill) return;
  const pct = Math.max(0, (remaining / TIME_PER_QUESTION) * 100);
  fill.style.width = `${pct}%`;
  fill.classList.toggle('warning', pct < 30);
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
