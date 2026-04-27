export function animateCount(el, target, duration = 600) {
  if (!el) return;
  const numericTarget = Number(target) || 0;
  const start = performance.now();

  function step(ts) {
    const progress = Math.min((ts - start) / duration, 1);
    el.textContent = String(Math.floor(progress * numericTarget));
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = String(numericTarget);
    }
  }

  requestAnimationFrame(step);
}

export function pageWipe() {
  if (typeof document === 'undefined') return;
  const existing = document.querySelector('.page-wipe-bar');
  if (existing) existing.remove();
  const bar = document.createElement('div');
  bar.className = 'page-wipe-bar';
  document.body.appendChild(bar);
  setTimeout(() => bar.remove(), 350);
}

export function wrapStarsMarkup(stars, max = 3) {
  return Array.from({ length: max }, (_, index) => `
    <span class="star-pop ${index < stars ? 'earned' : 'locked'}" style="animation-delay:${index * 150}ms">&#9733;</span>
  `).join('');
}

export function launchConfetti(host) {
  if (!host || typeof document === 'undefined') return;
  const layer = document.createElement('div');
  layer.className = 'confetti-burst';
  const colors = ['#FF9900', '#FEBD69', '#FFFFFF', '#146EB4'];

  Array.from({ length: 30 }, (_, index) => {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.background = colors[index % colors.length];
    piece.style.setProperty('--dx', `${Math.round(Math.random() * 320 - 160)}px`);
    piece.style.setProperty('--dy', `${Math.round(-120 - Math.random() * 120)}px`);
    piece.style.setProperty('--rot', `${Math.round(Math.random() * 360)}deg`);
    piece.style.animationDelay = `${(index % 10) * 20}ms`;
    layer.appendChild(piece);
  });

  host.appendChild(layer);
  setTimeout(() => layer.remove(), 2000);
}

export function showStreak(n) {
  if (typeof document === 'undefined' || n < 3) return;
  const existing = document.querySelector('.streak-badge');
  if (existing) existing.remove();
  const badge = document.createElement('div');
  badge.className = 'streak-badge';
  badge.textContent = `Streak x${n}`;
  document.body.appendChild(badge);
  setTimeout(() => badge.remove(), 2400);
}

export function triggerFeedbackFlash(node, type) {
  if (!node) return;
  const flashClass = type === 'correct' ? 'flash-correct' : 'flash-wrong';
  node.classList.remove(flashClass);
  void node.offsetWidth;
  node.classList.add(flashClass);
}

export function setRegionAnimationDelays(root) {
  if (!root) return;
  root.querySelectorAll('.atlas-region').forEach((region, index) => {
    if (index >= 20) {
      region.style.animationDelay = `${index * 0.03}s`;
    }
  });
}

export function injectLandingParticles(host, count = 12) {
  if (!host || host.querySelector('.particle-field')) return;
  const field = document.createElement('div');
  field.className = 'particle-field';
  Array.from({ length: count }, (_, index) => {
    const particle = document.createElement('span');
    particle.className = 'particle';
    particle.style.left = `${Math.round((index / count) * 100 + Math.random() * 8)}%`;
    particle.style.animationDelay = `${Math.round(Math.random() * 8)}s`;
    particle.style.animationDuration = `${8 + Math.round(Math.random() * 6)}s`;
    particle.style.opacity = `${0.12 + Math.random() * 0.06}`;
    field.appendChild(particle);
  });
  host.appendChild(field);
}
