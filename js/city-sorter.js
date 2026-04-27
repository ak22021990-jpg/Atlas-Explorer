import { showStreak, triggerFeedbackFlash } from './ui-effects.js';

const TOTAL_ROUNDS = 4;
const BUCKETS_PER_ROUND = 3;
const CITIES_PER_BUCKET = 2;
const TIME_PER_ROUND = 90;
const SPEED_WINDOW = 45;

export function groupCitiesByState(cities) {
  const groups = new Map();
  cities.forEach((city) => {
    if (!groups.has(city.stateCode)) {
      groups.set(city.stateCode, {
        stateCode: city.stateCode,
        stateName: city.stateName,
        country: city.country,
        cities: []
      });
    }
    groups.get(city.stateCode).cities.push(city);
  });
  return [...groups.values()];
}

export function buildRounds(cities, roundCount = TOTAL_ROUNDS) {
  const eligibleGroups = shuffle(groupCitiesByState(cities).filter((group) => group.cities.length >= CITIES_PER_BUCKET));
  const needed = roundCount * BUCKETS_PER_ROUND;
  if (eligibleGroups.length < needed) {
    throw new Error(`Need at least ${needed} city groups with ${CITIES_PER_BUCKET} cities each`);
  }

  return Array.from({ length: roundCount }, (_, roundIndex) => {
    const buckets = eligibleGroups
      .slice(roundIndex * BUCKETS_PER_ROUND, roundIndex * BUCKETS_PER_ROUND + BUCKETS_PER_ROUND)
      .map((group) => ({
        stateCode: group.stateCode,
        stateName: group.stateName,
        country: group.country,
        cities: shuffle(group.cities).slice(0, CITIES_PER_BUCKET).map((city) => ({
          ...city,
          id: cityId(city)
        }))
      }));

    return {
      buckets: buckets.map(({ stateCode, stateName, country }) => ({ stateCode, stateName, country })),
      cities: shuffle(buckets.flatMap((bucket) => bucket.cities))
    };
  });
}

export function isCorrectPlacement(city, stateCode) {
  return city.stateCode === stateCode;
}

export async function mountCitySorter(container, onComplete, options = {}) {
  const cities = await fetch('data/cities.json').then((response) => response.json());
  const rounds = buildRounds(cities);
  let currentRound = 0;
  let score = 0;
  let correctCount = 0;
  let streak = 0;
  let streakPeak = 0;
  let timer = null;
  let roundStartedAt = 0;
  let timeRemaining = TIME_PER_ROUND;
  let cardInFlight = null;
  let finished = false;

  function renderRound() {
    const round = rounds[currentRound];
    const cityLookup = new Map(round.cities.map((city) => [city.id, city]));
    const placed = new Set();
    finished = false;

    container.innerHTML = `
      <section class="game-card arcade-card">
        <div class="game-header">
          <div>
            <span class="eyebrow">${options.isRetry ? 'Retry mix' : 'City Stack'}</span>
            <h1 style="margin:4px 0 0;">Stack the cities</h1>
          </div>
          <span class="game-progress">Lvl ${currentRound + 1}/${TOTAL_ROUNDS}</span>
        </div>
        <div class="timer-bar"><div id="timer-fill" class="timer-bar-fill"></div></div>
        <div class="kanban-layout">
          <div class="kanban-tray" id="city-tray">
            ${round.cities.map((city) => `
              <button class="neon-ticket city-card" type="button" draggable="true" data-city-id="${city.id}">
                ${escapeHtml(city.name)}
              </button>
            `).join('')}
          </div>
          <div class="kanban-board">
            ${round.buckets.map((bucket) => `
              <div class="kanban-column drop-bucket" data-state-code="${bucket.stateCode}">
                <h2>${escapeHtml(bucket.stateName)}</h2>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;

    if (!document.getElementById('kanban-anim')) {
      const style = document.createElement('style');
      style.id = 'kanban-anim';
      style.innerHTML = `
        .kanban-layout { display: flex; flex-direction: column; gap: 18px; margin-top: 16px; }
        .kanban-tray {
          display: flex; flex-wrap: wrap; gap: 10px;
          min-height: 86px; padding: 16px 18px;
          background: radial-gradient(circle at top, rgba(255,255,255,0.05), transparent 60%), rgba(8,12,17,0.82);
          border: 1px solid rgba(255,255,255,0.08);
          justify-content: center; align-items: center;
          border-radius: 28px;
        }
        .kanban-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .kanban-column {
          padding: 16px; min-height: 250px;
          display: flex; flex-direction: column; gap: 10px;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03));
          border: 1px solid rgba(255,255,255,0.08);
        }
        .kanban-column h2 {
          font-family: var(--display-font); font-size: 1.1rem;
          color: var(--ink); line-height: 1.2;
          padding-bottom: 10px; text-align: center; margin-bottom: 4px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .kanban-column.hover {
          border-color: rgba(255,153,0,0.34);
          transform: translateY(-2px);
          background: linear-gradient(180deg, rgba(255,153,0,0.12), rgba(255,255,255,0.04));
        }
        .neon-ticket {
          background: linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04));
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--ink); padding: 10px 14px;
          font-family: var(--ui-font); font-size: 1rem;
          cursor: grab; text-align: center;
          transition: transform 0.1s, border-color 0.1s, background 0.1s;
          display: inline-block; min-width: 100px; border-radius: 18px;
        }
        .neon-ticket:hover { transform: translateY(-2px); border-color: rgba(255,153,0,0.35); background: rgba(255,255,255,0.1); }
        .neon-ticket:active { cursor: grabbing; transform: translate(1px,1px); }
        .neon-ticket.placed-correct {
          background: rgba(53,208,127,0.14);
          color: #ddffe9; border-color: rgba(53,208,127,0.4);
          cursor: default;
        }
        .neon-ticket.bounce { animation: bounce 0.3s ease; border-color: var(--red); color: #ffe2e7; }
        @keyframes bounce {
          0%, 100% { transform: translateX(0); }
          33% { transform: translateX(-7px); }
          66% { transform: translateX(7px); }
        }
      `;
      document.head.appendChild(style);
    }

    bindCards(cityLookup, placed);
    bindBuckets(cityLookup, placed);
    roundStartedAt = Date.now();
    startTimer(() => finishRound(placed.size, false));
  }

  function bindCards() {
    container.querySelectorAll('.city-card').forEach((card) => {
      card.addEventListener('dragstart', (event) => {
        cardInFlight = card.dataset.cityId;
        event.dataTransfer.setData('text/plain', card.dataset.cityId);
        event.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => {
        cardInFlight = null;
      });
    });
  }

  function bindBuckets(cityLookup, placed) {
    container.querySelectorAll('.drop-bucket').forEach((bucket) => {
      bucket.addEventListener('dragover', (event) => {
        event.preventDefault();
        bucket.classList.add('hover');
      });
      bucket.addEventListener('dragleave', () => bucket.classList.remove('hover'));
      bucket.addEventListener('drop', (event) => {
        event.preventDefault();
        bucket.classList.remove('hover');
        const cityIdValue = event.dataTransfer.getData('text/plain');
        const city = cityLookup.get(cityIdValue);
        if (!city || placed.has(cityIdValue) || finished) return;

        if (isCorrectPlacement(city, bucket.dataset.stateCode)) {
          placed.add(cityIdValue);
          streak += 1;
          if (streak > streakPeak) streakPeak = streak;
          showStreak(streak);
          const card = container.querySelector(`[data-city-id="${cityIdValue}"]`);
          card.draggable = false;
          card.classList.remove('selected');
          card.classList.add('placed-correct');
          triggerFeedbackFlash(card, 'correct');
          bucket.appendChild(card);
          cardInFlight = null;
          if (placed.size === BUCKETS_PER_ROUND * CITIES_PER_BUCKET) {
            const elapsed = (Date.now() - roundStartedAt) / 1000;
            finishRound(placed.size, elapsed <= SPEED_WINDOW && cardInFlight === null);
          }
          return;
        }

        const card = container.querySelector(`[data-city-id="${cityIdValue}"]`);
        streak = 0;
        card.classList.add('bounce');
        triggerFeedbackFlash(card, 'wrong');
        setTimeout(() => card.classList.remove('bounce'), 350);
      });
    });
  }

  function startTimer(onExpire) {
    clearInterval(timer);
    let remaining = TIME_PER_ROUND;
    timeRemaining = remaining;
    updateTimer(remaining);
    timer = setInterval(() => {
      remaining -= 1;
      timeRemaining = remaining;
      updateTimer(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        onExpire();
      }
    }, 1000);
  }

  function finishRound(correctInRound, speedBonus) {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    if (!speedBonus && correctInRound === 0) {
      streak = 0;
    }
    correctCount += correctInRound;
    score += correctInRound * (10 + (speedBonus ? 3 : 0));
    currentRound += 1;

    if (currentRound >= TOTAL_ROUNDS) {
      onComplete({
        score,
        correctCount,
        totalCount: TOTAL_ROUNDS * BUCKETS_PER_ROUND * CITIES_PER_BUCKET,
        streakPeak,
        timerRatio: timeRemaining / TIME_PER_ROUND
      });
      return;
    }

    setTimeout(renderRound, 1000);
  }

  renderRound();
}

function cityId(city) {
  return `${city.stateCode}-${city.name}`.replaceAll(/\s+/g, '-').replaceAll(/[^A-Za-z0-9-]/g, '');
}

function updateTimer(remaining) {
  const fill = document.getElementById('timer-fill');
  if (!fill) return;
  const pct = Math.max(0, (remaining / TIME_PER_ROUND) * 100);
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
