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
  let timer = null;
  let roundStartedAt = 0;
  let cardInFlight = null;
  let finished = false;

  function renderRound() {
    const round = rounds[currentRound];
    const cityLookup = new Map(round.cities.map((city) => [city.id, city]));
    const placed = new Set();
    finished = false;

    container.innerHTML = `
      <section class="game-card sorter-card">
        <div class="game-header">
          <div>
            <span class="eyebrow">${options.isRetry ? 'Retry' : 'City Sorter'}</span>
            <h1>Round ${currentRound + 1}</h1>
          </div>
          <span class="game-progress">${currentRound + 1}/${TOTAL_ROUNDS}</span>
        </div>
        <div class="timer-bar"><div id="timer-fill" class="timer-bar-fill"></div></div>
        <div class="sorter-layout">
          <div class="city-tray">
            ${round.cities.map((city) => `
              <button class="city-card" type="button" draggable="true" data-city-id="${city.id}">
                ${escapeHtml(city.name)}
              </button>
            `).join('')}
          </div>
          <div class="bucket-grid">
            ${round.buckets.map((bucket) => `
              <div class="drop-bucket" data-state-code="${bucket.stateCode}">
                <h2>${escapeHtml(bucket.stateName)}</h2>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;

    bindCards(cityLookup, placed);
    bindBuckets(cityLookup, placed);
    roundStartedAt = Date.now();
    startTimer(() => finishRound(placed.size, false));
  }

  function bindCards(cityLookup) {
    container.querySelectorAll('.city-card').forEach((card) => {
      card.addEventListener('dragstart', (event) => {
        cardInFlight = card.dataset.cityId;
        event.dataTransfer.setData('text/plain', card.dataset.cityId);
        event.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => {
        cardInFlight = null;
      });
      card.addEventListener('click', () => {
        const city = cityLookup.get(card.dataset.cityId);
        card.classList.toggle('selected');
        card.title = city ? city.name : '';
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
          const card = container.querySelector(`[data-city-id="${cityIdValue}"]`);
          card.draggable = false;
          card.classList.remove('selected');
          card.classList.add('placed-correct');
          bucket.appendChild(card);
          cardInFlight = null;
          if (placed.size === BUCKETS_PER_ROUND * CITIES_PER_BUCKET) {
            const elapsed = (Date.now() - roundStartedAt) / 1000;
            finishRound(placed.size, elapsed <= SPEED_WINDOW && cardInFlight === null);
          }
          return;
        }

        const card = container.querySelector(`[data-city-id="${cityIdValue}"]`);
        card.classList.add('bounce');
        setTimeout(() => card.classList.remove('bounce'), 350);
      });
    });
  }

  function startTimer(onExpire) {
    clearInterval(timer);
    let remaining = TIME_PER_ROUND;
    updateTimer(remaining);
    timer = setInterval(() => {
      remaining -= 1;
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
    correctCount += correctInRound;
    score += correctInRound * (10 + (speedBonus ? 3 : 0));
    currentRound += 1;

    if (currentRound >= TOTAL_ROUNDS) {
      onComplete({ score, correctCount, totalCount: TOTAL_ROUNDS * BUCKETS_PER_ROUND * CITIES_PER_BUCKET });
      return;
    }

    setTimeout(renderRound, 650);
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
