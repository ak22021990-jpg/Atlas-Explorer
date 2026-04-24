import { calculatePoints } from './scoring.js';

const TOTAL_QUESTIONS = 15;
const TIME_PER_QUESTION = 45;
const SPEED_WINDOW = 15;

export function pickPinQuestions(allStates, total = TOTAL_QUESTIONS) {
  const openingCodes = ['TX', 'CA', 'ON', 'BC', 'FL', 'NY'];
  const opening = openingCodes
    .map((code) => allStates.find((state) => state.code === code))
    .filter(Boolean);
  const used = new Set(opening.map((state) => state.code));
  const remaining = shuffle(allStates.filter((state) => !used.has(state.code)));
  return [...opening, ...remaining].slice(0, total);
}

export function checkMapClick(targetCode, clickedCode) {
  return targetCode === clickedCode;
}

export async function mountPinIt(container, onComplete, options = {}) {
  const [states, svg] = await Promise.all([
    fetch('data/states.json').then((response) => response.json()),
    fetch('maps/north-america.svg').then((response) => response.text())
  ]);
  const questions = pickPinQuestions(states);
  let currentIndex = 0;
  let score = 0;
  let correctCount = 0;
  let timer = null;
  let startedAt = 0;
  let locked = false;

  function renderQuestion() {
    const question = questions[currentIndex];
    locked = false;
    container.innerHTML = `
      <section class="game-card map-card">
        <div class="game-header">
          <div>
            <span class="eyebrow">${options.isRetry ? 'Retry' : 'Pin It!'}</span>
            <h1>Click ${escapeHtml(question.name)}</h1>
          </div>
          <span class="game-progress">${currentIndex + 1}/${TOTAL_QUESTIONS}</span>
        </div>
        <div class="timer-bar"><div id="timer-fill" class="timer-bar-fill"></div></div>
        <div id="atlas-map" class="atlas-map gameplay-mode">${svg}</div>
      </section>
    `;
    startedAt = Date.now();
    startTimer();
    bindRegions(question);
  }

  function bindRegions(question) {
    container.querySelectorAll('.atlas-region').forEach((region) => {
      region.addEventListener('click', () => {
        if (locked) return;
        handleClick(question, region.dataset.code);
      });
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
        handleClick(questions[currentIndex], null);
      }
    }, 1000);
  }

  function handleClick(question, clickedCode) {
    locked = true;
    clearInterval(timer);
    const elapsed = (Date.now() - startedAt) / 1000;
    const isCorrect = clickedCode ? checkMapClick(question.code, clickedCode) : false;
    if (isCorrect) correctCount += 1;
    score += calculatePoints(isCorrect, elapsed, SPEED_WINDOW);

    const clicked = clickedCode ? container.querySelector(`[data-code="${clickedCode}"]`) : null;
    const correct = container.querySelector(`[data-code="${question.code}"]`);
    if (clicked && !isCorrect) clicked.classList.add('wrong');
    if (correct) correct.classList.add('correct');

    setTimeout(nextQuestion, 750);
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

export async function mountPinReview(container, onDone) {
  const [states, svg] = await Promise.all([
    fetch('data/states.json').then((response) => response.json()),
    fetch('maps/north-america.svg').then((response) => response.text())
  ]);
  const stateByCode = new Map(states.map((state) => [state.code, state]));

  container.innerHTML = `
    <section class="game-card map-card review-card">
      <div class="game-header">
        <div>
          <span class="eyebrow">Review Map</span>
          <h1>North America Atlas</h1>
        </div>
        <button id="finish-review" class="btn btn-primary" type="button">Continue</button>
      </div>
      <div class="review-layout">
        <div id="atlas-map" class="atlas-map review-mode">${svg}</div>
        <aside class="review-details">
          <span class="eyebrow">Selected</span>
          <strong id="review-name">Choose a region</strong>
          <span id="review-meta"></span>
        </aside>
      </div>
    </section>
  `;

  const name = container.querySelector('#review-name');
  const meta = container.querySelector('#review-meta');
  container.querySelectorAll('.atlas-region').forEach((region) => {
    const state = stateByCode.get(region.dataset.code);
    region.addEventListener('mouseenter', () => showRegion(state, name, meta));
    region.addEventListener('click', () => showRegion(state, name, meta));
  });
  container.querySelector('#finish-review').addEventListener('click', onDone);
}

function showRegion(state, nameNode, metaNode) {
  if (!state) return;
  nameNode.textContent = state.name;
  metaNode.textContent = `${state.code} | ${state.region}`;
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
