import { calculatePoints } from './scoring.js';

const TOTAL_QUESTIONS = 20;
const TIME_PER_QUESTION = 45;
const SPEED_WINDOW = 15;
const LEGEND_CUTOFF = 15;

export const REGIONS = [
  'Northeast',
  'Southeast',
  'Midwest',
  'Southwest',
  'West',
  'Eastern Canada',
  'Western Canada'
];

export function pickQuestions(allStates, total = TOTAL_QUESTIONS) {
  return shuffle(allStates).slice(0, total);
}

export function checkAnswer(stateCode, selectedRegion, allStates) {
  const state = allStates.find((item) => item.code === stateCode);
  return Boolean(state && state.region === selectedRegion);
}

export function shouldShowLegend(questionIndex) {
  return questionIndex < LEGEND_CUTOFF;
}

export async function mountRegionRanger(container, onComplete, options = {}) {
  const states = await fetch('data/states.json').then((response) => response.json());
  const questions = pickQuestions(states);
  let currentIndex = 0;
  let score = 0;
  let correctCount = 0;
  let timer = null;
  let startedAt = 0;

  function renderQuestion() {
    const question = questions[currentIndex];
    const showLegend = shouldShowLegend(currentIndex);
    container.innerHTML = `
      <section class="game-card ranger-card">
        <div class="game-header">
          <div>
            <span class="eyebrow">${options.isRetry ? 'Retry' : 'Region Ranger'}</span>
            <h1>${escapeHtml(question.name)}</h1>
          </div>
          <span class="game-progress">${currentIndex + 1}/${TOTAL_QUESTIONS}</span>
        </div>
        <div class="timer-bar"><div id="timer-fill" class="timer-bar-fill"></div></div>
        <div class="region-options">
          ${REGIONS.map((region) => `
            <button class="region-btn" type="button" data-region="${region}">
              ${region}
            </button>
          `).join('')}
        </div>
        <div class="region-reference ${showLegend ? '' : 'hidden'}" aria-hidden="${showLegend ? 'false' : 'true'}">
          ${renderRegionLegend()}
        </div>
      </section>
    `;

    startedAt = Date.now();
    startTimer();
    container.querySelectorAll('.region-btn').forEach((button) => {
      button.addEventListener('click', () => handleAnswer(button.dataset.region));
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

  function handleAnswer(selectedRegion) {
    clearInterval(timer);
    const question = questions[currentIndex];
    const elapsed = (Date.now() - startedAt) / 1000;
    const isCorrect = selectedRegion ? checkAnswer(question.code, selectedRegion, states) : false;
    if (isCorrect) correctCount += 1;
    score += calculatePoints(isCorrect, elapsed, SPEED_WINDOW);

    container.querySelectorAll('.region-btn').forEach((button) => {
      button.disabled = true;
      if (button.dataset.region === question.region) button.classList.add('correct');
      if (button.dataset.region === selectedRegion && !isCorrect) button.classList.add('wrong');
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

function renderRegionLegend() {
  return `
    <div class="legend-grid">
      ${REGIONS.map((region, index) => `
        <span class="legend-pill region-${index + 1}">${region}</span>
      `).join('')}
    </div>
  `;
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
