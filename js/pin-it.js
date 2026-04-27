import { calculatePoints } from './scoring.js';
import { setRegionAnimationDelays, showStreak, triggerFeedbackFlash } from './ui-effects.js';

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
  let streak = 0;
  let streakPeak = 0;
  let timer = null;
  let startedAt = 0;
  let timeRemaining = TIME_PER_QUESTION;
  let locked = false;

  function renderQuestion() {
    const question = questions[currentIndex];
    locked = false;
    container.innerHTML = `
      <section class="game-card arcade-card">
        <div class="game-header">
          <div>
            <span class="eyebrow">${options.isRetry ? 'Retry mix' : 'Pin Rush'}</span>
            <h1 style="margin:4px 0 0;">Find the target</h1>
          </div>
          <span class="game-progress">${currentIndex + 1}/${TOTAL_QUESTIONS}</span>
        </div>
        <div class="timer-bar"><div id="timer-fill" class="timer-bar-fill"></div></div>

        <div class="radar-container" style="position:relative;background:radial-gradient(circle at center, rgba(255,255,255,0.05), transparent 55%), rgba(8,12,17,0.88);border:1px solid rgba(255,255,255,0.08);overflow:hidden;box-shadow:inset 0 0 36px rgba(255,255,255,0.04);border-radius:28px;">
          <div class="radar-sweep" style="position:absolute;top:50%;left:50%;width:200%;height:200%;background:conic-gradient(from 0deg,transparent 70%,rgba(20,110,180,0.18) 100%);transform-origin:0 0;animation:radar-spin 4s linear infinite;pointer-events:none;z-index:10;"></div>
          <div style="position:absolute;top:16px;left:50%;transform:translateX(-50%);font-family:var(--display-font);font-size:0.95rem;color:var(--ink);z-index:20;pointer-events:none;text-align:center;background:rgba(19,26,34,0.82);padding:10px 16px;border:1px solid rgba(255,255,255,0.08);white-space:nowrap;border-radius:999px;">
            Target: ${escapeHtml(question.name)}
          </div>
          <div id="atlas-map" class="atlas-map gameplay-mode" style="background:transparent;border:none;">${svg}</div>
        </div>
      </section>
    `;

    if (!document.getElementById('radar-anim')) {
      const style = document.createElement('style');
      style.id = 'radar-anim';
      style.innerHTML = `
        @keyframes radar-spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse-correct {
          0% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.04); filter: brightness(1.4); }
          100% { transform: scale(1); filter: brightness(1); }
        }
        .atlas-map.gameplay-mode svg { filter: drop-shadow(0 0 8px rgba(20,110,180,0.2)); width: 100%; height: auto; }
        .atlas-map.gameplay-mode .atlas-region { fill: rgba(255,255,255,0.07); stroke: rgba(255,255,255,0.16); transition: all 0.2s; }
        .atlas-map.gameplay-mode .atlas-region:hover { fill: rgba(255,153,0,0.18); stroke: rgba(255,184,77,0.8); }
        .atlas-map.gameplay-mode .atlas-region.correct { fill: rgba(53,208,127,0.22) !important; animation: pulse-correct 0.5s ease-out; }
        .atlas-map.gameplay-mode .atlas-region.wrong { fill: rgba(255,101,119,0.18) !important; }
      `;
      document.head.appendChild(style);
    }

    startedAt = Date.now();
    startTimer();
    bindRegions(question);
    setRegionAnimationDelays(container);
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
    timeRemaining = TIME_PER_QUESTION;
    updateTimer(timeRemaining);
    timer = setInterval(() => {
      timeRemaining -= 1;
      updateTimer(timeRemaining);
      if (timeRemaining <= 0) {
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
    if (isCorrect) {
      correctCount += 1;
      streak += 1;
      if (streak > streakPeak) streakPeak = streak;
      showStreak(streak);
    } else {
      streak = 0;
    }
    score += calculatePoints(isCorrect, elapsed, SPEED_WINDOW);

    const clicked = clickedCode ? container.querySelector(`[data-code="${clickedCode}"]`) : null;
    const correct = container.querySelector(`[data-code="${question.code}"]`);
    if (clicked && !isCorrect) {
      clicked.classList.add('wrong');
      triggerFeedbackFlash(clicked, 'wrong');
    }
    if (correct) {
      correct.classList.add('correct');
      triggerFeedbackFlash(correct, 'correct');
    }

    setTimeout(nextQuestion, 1000);
  }

  function nextQuestion() {
    currentIndex += 1;
    if (currentIndex >= TOTAL_QUESTIONS) {
      onComplete({
        score,
        correctCount,
        totalCount: TOTAL_QUESTIONS,
        streakPeak,
        timerRatio: timeRemaining / TIME_PER_QUESTION
      });
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
    <section class="game-card map-card review-card arcade-card">
      <div class="game-header">
        <div>
          <span class="eyebrow">Map review</span>
          <h1>Explore the atlas</h1>
        </div>
        <button id="finish-review" class="btn btn-primary" type="button">Continue</button>
      </div>
      <div class="review-layout" style="display:grid;grid-template-columns:1fr 280px;gap:16px;">
        <div id="atlas-map" class="atlas-map review-mode" style="background:transparent;border:none;">${svg}</div>
        <aside class="review-details" style="padding:20px;color:var(--ink);">
          <span class="eyebrow">Selected</span>
          <strong id="review-name" style="display:block;margin-top:16px;font-size:1.4rem;">Pick a region</strong>
          <span id="review-meta" style="display:block;margin-top:12px;color:var(--muted);"></span>
        </aside>
      </div>
    </section>
  `;

  if (!document.getElementById('review-anim')) {
    const style = document.createElement('style');
    style.id = 'review-anim';
    style.innerHTML = `
      .atlas-map.review-mode svg { width: 100%; height: auto; }
      .atlas-map.review-mode .atlas-region { fill: rgba(255,255,255,0.07); stroke: rgba(255,255,255,0.16); transition: fill 0.2s; }
      .atlas-map.review-mode .atlas-region:hover { fill: rgba(255,153,0,0.18); cursor: crosshair; }
    `;
    document.head.appendChild(style);
  }

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
  if (pct < 30) {
    fill.style.background = 'linear-gradient(90deg, var(--red), #ff9a7c)';
  } else {
    fill.style.background = 'linear-gradient(90deg, var(--amazon-blue), var(--amazon-orange), var(--amber))';
  }
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
