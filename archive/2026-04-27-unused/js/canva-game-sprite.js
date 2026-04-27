import { getCanvaGameAsset } from './generated/canva-game-assets.js';

const DEFAULT_ASSET_KEY = 'canvaGameAsset';
const HTMLElementBase = typeof HTMLElement === 'undefined' ? class {} : HTMLElement;

function coerceNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeBooleanAttribute(value) {
  return value !== null && value !== 'false';
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export class CanvaGameSprite extends HTMLElementBase {
  static observedAttributes = ['alt', 'asset', 'motion', 'paused', 'size', 'speed', 'src', 'state'];

  constructor() {
    super();
    if (typeof this.attachShadow === 'function') {
      this.attachShadow({ mode: 'open' });
    }
    this._stateTimer = null;
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    globalThis.clearTimeout(this._stateTimer);
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  play(motion = 'float') {
    this.removeAttribute('paused');
    this.setAttribute('motion', motion);
  }

  pause() {
    this.setAttribute('paused', '');
  }

  setPosition(x, y) {
    if (!this.style) return;
    this.style.left = `${x}px`;
    this.style.top = `${y}px`;
  }

  getHitbox() {
    return typeof this.getBoundingClientRect === 'function' ? this.getBoundingClientRect() : null;
  }

  flash(state = 'hit', duration = 520) {
    globalThis.clearTimeout(this._stateTimer);
    this.setAttribute('state', state);
    this._stateTimer = globalThis.setTimeout(() => {
      if (this.getAttribute('state') === state) this.setAttribute('state', 'idle');
    }, duration);
  }

  success(duration = 900) {
    this.flash('success', duration);
  }

  hit(duration = 520) {
    this.flash('hit', duration);
  }

  danger(duration = 900) {
    this.flash('danger', duration);
  }

  render() {
    if (!this.shadowRoot || !this.style) return;

    const asset = getCanvaGameAsset(this.getAttribute('asset') || DEFAULT_ASSET_KEY);
    const src = this.getAttribute('src') || asset.src;
    const alt = this.getAttribute('alt') || asset.name || 'Game asset';
    const motion = this.getAttribute('motion') || 'float';
    const state = this.getAttribute('state') || 'idle';
    const speed = Math.max(coerceNumber(this.getAttribute('speed'), 1), 0.1);
    const size = this.getAttribute('size') || '';
    const paused = normalizeBooleanAttribute(this.getAttribute('paused'));

    this.style.setProperty('--canva-sprite-speed', String(speed));
    if (size) this.style.setProperty('--canva-sprite-size', size);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --canva-sprite-size: clamp(96px, 18vw, 220px);
          --canva-sprite-speed: 1;
          --canva-sprite-glow: rgba(255, 153, 0, 0.42);
          display: inline-grid;
          inline-size: var(--canva-sprite-size);
          aspect-ratio: ${asset.width && asset.height ? `${asset.width} / ${asset.height}` : '1 / 1'};
          place-items: center;
          pointer-events: auto;
          transform-origin: 50% 75%;
          user-select: none;
        }

        .wrap {
          position: relative;
          display: grid;
          inline-size: 100%;
          block-size: 100%;
          place-items: center;
          transform-origin: 50% 75%;
          will-change: transform, filter, opacity;
        }

        .wrap::after {
          content: "";
          position: absolute;
          inset: auto 16% 3% 16%;
          height: 11%;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.26);
          filter: blur(10px);
          opacity: 0.5;
          transform: scaleX(0.86);
          animation: canva-shadow calc(2.8s / var(--canva-sprite-speed)) ease-in-out infinite;
          z-index: -1;
        }

        img {
          display: block;
          inline-size: 100%;
          block-size: 100%;
          object-fit: contain;
          transform-origin: 50% 75%;
          -webkit-user-drag: none;
        }

        :host([motion="none"]) .wrap,
        :host([paused]) .wrap,
        :host([paused]) .wrap::after {
          animation-play-state: paused;
        }

        :host([motion="float"]) .wrap {
          animation: canva-float calc(2.8s / var(--canva-sprite-speed)) ease-in-out infinite;
        }

        :host([motion="pulse"]) .wrap {
          animation: canva-pulse calc(1.45s / var(--canva-sprite-speed)) ease-in-out infinite;
        }

        :host([motion="pop"]) .wrap {
          animation: canva-pop calc(0.65s / var(--canva-sprite-speed)) cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        :host([motion="drift"]) .wrap {
          animation: canva-drift calc(4.2s / var(--canva-sprite-speed)) ease-in-out infinite;
        }

        :host([state="success"]) .wrap {
          filter: drop-shadow(0 0 18px rgba(53, 208, 127, 0.75));
          animation: canva-success calc(0.78s / var(--canva-sprite-speed)) ease-out both;
        }

        :host([state="hit"]) .wrap {
          filter: drop-shadow(0 0 14px rgba(255, 101, 119, 0.72));
          animation: canva-hit calc(0.46s / var(--canva-sprite-speed)) linear both;
        }

        :host([state="danger"]) .wrap {
          filter: drop-shadow(0 0 14px rgba(255, 209, 102, 0.8));
          animation: canva-danger calc(0.38s / var(--canva-sprite-speed)) linear infinite;
        }

        @keyframes canva-float {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(-1deg); }
          50% { transform: translate3d(0, -7%, 0) rotate(1deg); }
        }

        @keyframes canva-shadow {
          0%, 100% { opacity: 0.48; transform: scaleX(0.86); }
          50% { opacity: 0.25; transform: scaleX(0.68); }
        }

        @keyframes canva-pulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0 var(--canva-sprite-glow)); }
          50% { transform: scale(1.06); filter: drop-shadow(0 0 18px var(--canva-sprite-glow)); }
        }

        @keyframes canva-pop {
          0% { opacity: 0; transform: translateY(18%) scale(0.68); }
          65% { opacity: 1; transform: translateY(-4%) scale(1.08); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes canva-drift {
          0%, 100% { transform: translate3d(-5%, 0, 0) rotate(-2deg); }
          50% { transform: translate3d(5%, -5%, 0) rotate(2deg); }
        }

        @keyframes canva-success {
          0% { transform: scale(1); }
          35% { transform: translateY(-9%) scale(1.12) rotate(-4deg); }
          70% { transform: translateY(0) scale(0.96) rotate(2deg); }
          100% { transform: scale(1) rotate(0); }
        }

        @keyframes canva-hit {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-7%) rotate(-4deg); }
          40% { transform: translateX(7%) rotate(4deg); }
          60% { transform: translateX(-5%) rotate(-3deg); }
          80% { transform: translateX(4%) rotate(2deg); }
        }

        @keyframes canva-danger {
          0%, 100% { transform: translateX(0) rotate(0); }
          25% { transform: translateX(-2%) rotate(-1.5deg); }
          75% { transform: translateX(2%) rotate(1.5deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .wrap,
          .wrap::after {
            animation: none !important;
          }
        }
      </style>
      <span class="wrap" data-motion="${escapeHtmlAttribute(motion)}" data-state="${escapeHtmlAttribute(state)}">
        <img src="${escapeHtmlAttribute(src)}" alt="${escapeHtmlAttribute(alt)}" decoding="async">
      </span>
    `;

    if (paused) {
      this.shadowRoot.querySelector('.wrap').style.animationPlayState = 'paused';
    }
  }
}

export function defineCanvaGameSprite(tagName = 'canva-game-sprite') {
  if (typeof window === 'undefined' || window.customElements.get(tagName)) return;
  window.customElements.define(tagName, CanvaGameSprite);
}

export function createCanvaGameSprite(options = {}) {
  defineCanvaGameSprite();
  const sprite = document.createElement('canva-game-sprite');
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) sprite.setAttribute(key, String(value));
  });
  return sprite;
}

defineCanvaGameSprite();
