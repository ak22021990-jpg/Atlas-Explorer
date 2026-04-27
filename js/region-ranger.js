import { calculatePoints } from './scoring.js';
import { showStreak, triggerFeedbackFlash } from './ui-effects.js';

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
  let streak = 0;
  let streakPeak = 0;
  let timer = null;
  let startedAt = 0;
  let timeRemaining = TIME_PER_QUESTION;

  function renderQuestion() {
    const question = questions[currentIndex];

    const radius = 160;
    const centerX = 200;
    const centerY = 200;
    const angleStep = (2 * Math.PI) / REGIONS.length;

    const buttonsHtml = REGIONS.map((region, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle) - 60;
      const y = centerY + radius * Math.sin(angle) - 25;
      return `
        <button class="ring-btn region-btn" type="button" data-region="${region}" style="left:${x}px;top:${y}px;">
          ${region}
        </button>
      `;
    }).join('');

    container.innerHTML = `
      <section class="game-card arcade-card">
        <div class="game-header">
          <div>
            <span class="eyebrow">${options.isRetry ? 'Retry mix' : 'Zone Sprint'}</span>
            <h1 style="margin:4px 0 0;">Lock the region</h1>
          </div>
          <span class="game-progress">${currentIndex + 1}/${TOTAL_QUESTIONS}</span>
        </div>
        <div class="timer-bar"><div id="timer-fill" class="timer-bar-fill"></div></div>

        <div class="tagging-ring" style="position:relative;width:400px;height:400px;margin:40px auto;">
          <div class="center-orb">
            ${escapeHtml(question.name)}
          </div>
          ${buttonsHtml}
        </div>
      </section>
    `;

    if (!document.getElementById('ring-anim')) {
      const style = document.createElement('style');
      style.id = 'ring-anim';
      style.innerHTML = `
        .tagging-ring {
          background:
            radial-gradient(circle at center, rgba(20,110,180,0.12) 0%, transparent 55%),
            radial-gradient(circle at center, rgba(255,153,0,0.08) 0%, transparent 72%),
            rgba(8,12,17,0.68);
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: inset 0 0 40px rgba(255,255,255,0.04);
        }
        .tagging-ring::before {
          content: '';
          position: absolute;
          inset: 10%;
          border-radius: 50%;
          border: 1px dashed rgba(255,255,255,0.12);
          pointer-events: none;
        }
        .center-orb {
          position: absolute; left: 125px; top: 125px;
          width: 150px; height: 150px;
          background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(19,26,34,0.98) 72%);
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center;
          text-align: center;
          color: var(--ink); font-family: var(--display-font);
          font-size: 1rem; line-height: 1.2; font-weight: 700;
          box-shadow: 0 18px 34px rgba(0,0,0,0.22), inset 0 0 20px rgba(255,255,255,0.04);
          z-index: 10; padding: 14px;
        }
        .center-orb.pulse-correct { animation: orb-correct 0.5s ease-out; }
        .center-orb.pulse-wrong { animation: orb-wrong 0.5s ease-out; }
        @keyframes orb-correct {
          50% { background: radial-gradient(circle, rgba(53,208,127,0.35) 0%, rgba(19,26,34,0.98) 75%); border-color: rgba(53,208,127,0.45); transform: scale(1.08); }
        }
        @keyframes orb-wrong {
          50% { background: radial-gradient(circle, rgba(255,101,119,0.35) 0%, rgba(19,26,34,0.98) 75%); border-color: rgba(255,101,119,0.45); transform: scale(1.08); }
        }
        .ring-btn {
          position: absolute; width: 120px; height: 52px;
          background: linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04));
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--ink); font-family: var(--ui-font);
          font-size: 0.92rem; border-radius: 18px;
          transition: border-color 0.15s, transform 0.15s, background 0.15s;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; text-align: center; line-height: 1.15;
          padding: 4px;
        }
        .ring-btn:hover:not(:disabled) {
          border-color: rgba(255,153,0,0.35);
          background: rgba(255,255,255,0.1);
          z-index: 20; transform: scale(1.06);
        }
        .ring-btn.correct {
          background: rgba(53,208,127,0.14) !important;
          color: #ddffe9 !important; border-color: rgba(53,208,127,0.4) !important;
          z-index: 20;
        }
        .ring-btn.wrong {
          background: rgba(255,101,119,0.14) !important;
          color: #ffe2e7 !important; border-color: rgba(255,101,119,0.38) !important;
        }
      `;
      document.head.appendChild(style);
    }

    startedAt = Date.now();
    startTimer();
    container.querySelectorAll('.region-btn').forEach((button) => {
      button.addEventListener('click', () => handleAnswer(button.dataset.region));
    });
  }

  function startTimer() {
    clearInterval(timer);
    let remaining = TIME_PER_QUESTION;
    timeRemaining = remaining;
    updateTimer(remaining);
    timer = setInterval(() => {
      remaining -= 1;
      timeRemaining = remaining;
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
    if (isCorrect) {
      correctCount += 1;
      streak += 1;
      if (streak > streakPeak) streakPeak = streak;
      showStreak(streak);
    } else {
      streak = 0;
    }
    score += calculatePoints(isCorrect, elapsed, SPEED_WINDOW);

    const orb = container.querySelector('.center-orb');
    if (isCorrect) {
      orb.classList.add('pulse-correct');
    } else {
      orb.classList.add('pulse-wrong');
    }

    container.querySelectorAll('.region-btn').forEach((button) => {
      button.disabled = true;
      if (button.dataset.region === question.region) {
        button.classList.add('correct');
        triggerFeedbackFlash(button, 'correct');
      }
      if (button.dataset.region === selectedRegion && !isCorrect) {
        button.classList.add('wrong');
        triggerFeedbackFlash(button, 'wrong');
      }
    });

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

function updateTimer(remaining) {
  const fill = document.getElementById('timer-fill');
  if (!fill) return;
  const pct = Math.max(0, (remaining / TIME_PER_QUESTION) * 100);
  fill.style.width = `${pct}%`;
  if (pct < 30) {
    fill.style.background = 'linear-gradient(90deg, var(--red), #ff9a7c)';
  } else {
    fill.style.background = 'linear-gradient(90deg, var(--amz-dark), var(--amz-orange), var(--amz-amber))';
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
