import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Minus } from 'lucide-react';

let svgCache: string | null = null;

const COLOR_DEFAULT = 'var(--atlas-border)';
const COLOR_EXPLORED = 'var(--atlas-gold)';
const COLOR_ACTIVE = 'var(--atlas-accent)';
const COLOR_CORRECT = 'var(--atlas-accent)';
const COLOR_WRONG = 'var(--atlas-error)';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const DRAG_THRESHOLD = 5;
const EMPTY_CODES: string[] = [];

function publicAsset(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}

import { TZ_FILLS } from '@/lib/timezones';
import { updateExplorationTrail } from '@/lib/exploration-trail';

interface InteractiveMapProps {
  onRegionClick: (code: string, flightSource?: RegionFlightSource) => void;
  onRegionHover?: (code: string | null, pos?: { x: number; y: number }) => void;
  highlightedCodes?: string[];
  activeCode?: string | null;
  correctCode?: string | null;
  wrongCode?: string | null;
  mode?: 'explore' | 'gameplay';
  timezoneMap?: Record<string, string>;
  hoveredTimezone?: string | null;
  defaultFill?: string;
  heatmapMap?: Record<string, string>;
  miniMap?: boolean;
  explorationOrder?: string[];
  masteredCodes?: string[];
  pulsingClusterCodes?: string[];
}

export type RegionFlightSource = {
  pathD: string;
  bbox: { x: number; y: number; width: number; height: number };
  rect: { left: number; top: number; width: number; height: number };
  fill: string;
  stroke: string;
};

type Transform = {
  zoom: number;
  panX: number;
  panY: number;
};

type PointerPoint = {
  x: number;
  y: number;
};

type DragState = {
  active: boolean;
  startX: number;
  startY: number;
  startPanX: number;
  startPanY: number;
  moved: boolean;
  regionCode?: string;
  regionElement?: SVGPathElement;
};

function getRegionFlightSource(el: SVGPathElement): RegionFlightSource | undefined {
  const pathD = el.getAttribute('d');
  if (!pathD) return undefined;

  const bbox = el.getBBox();
  const rect = el.getBoundingClientRect();
  const styles = window.getComputedStyle(el);

  return {
    pathD,
    bbox: {
      x: bbox.x,
      y: bbox.y,
      width: Math.max(1, bbox.width),
      height: Math.max(1, bbox.height),
    },
    rect: {
      left: rect.left,
      top: rect.top,
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
    },
    fill: styles.fill || 'var(--atlas-accent)',
    stroke: styles.stroke || 'var(--atlas-ink)',
  };
}

export default function InteractiveMap({
  onRegionClick,
  onRegionHover,
  highlightedCodes = [],
  activeCode = null,
  correctCode = null,
  wrongCode = null,
  mode = 'explore',
  timezoneMap = {},
  hoveredTimezone = null,
  defaultFill = COLOR_DEFAULT,
  heatmapMap,
  miniMap = false,
  explorationOrder = [],
  masteredCodes = [],
  pulsingClusterCodes = EMPTY_CODES,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<Transform>({ zoom: 1, panX: 0, panY: 0 });
  const [transform, setTransformState] = useState<Transform>({ zoom: 1, panX: 0, panY: 0 });
  const dragStateRef = useRef<DragState | null>(null);
  const pointersRef = useRef<Map<number, PointerPoint>>(new Map());
  const pinchRef = useRef<{
    distance: number;
    midpoint: PointerPoint;
    transform: Transform;
  } | null>(null);

  const onRegionClickRef = useRef(onRegionClick);

  const onRegionHoverRef = useRef(onRegionHover);

  const prevClassStateRef = useRef(new Map<SVGPathElement, Set<string>>());
  const lastHoverCodeRef = useRef<string | null>(null);
  const lastHoverTimeRef = useRef(0);

  const [svgContent, setSvgContent] = useState<string | null>(svgCache);
  const [loading, setLoading] = useState(!svgCache);

  useEffect(() => {
    onRegionClickRef.current = onRegionClick;
  }, [onRegionClick]);

  useEffect(() => {
    onRegionHoverRef.current = onRegionHover;
  }, [onRegionHover]);

  const clampTransform = useCallback((next: Transform): Transform => {
    const container = containerRef.current;
    if (!container) return next;

    const rect = container.getBoundingClientRect();
    const zoom = Math.max(MIN_ZOOM, Math.min(next.zoom, MAX_ZOOM));
    const scaledWidth = rect.width * zoom;
    const scaledHeight = rect.height * zoom;

    const maxPanX = zoom <= 1 ? 0 : Math.max(0, (scaledWidth + rect.width * 0.4) / 2);
    const maxPanY = zoom <= 1 ? 0 : Math.max(0, (scaledHeight + rect.height * 0.4) / 2);

    return {
      zoom,
      panX: Math.max(-maxPanX, Math.min(next.panX, maxPanX)),
      panY: Math.max(-maxPanY, Math.min(next.panY, maxPanY)),
    };
  }, []);

  const setTransform = useCallback((next: Transform | ((current: Transform) => Transform)) => {
    const raw = typeof next === 'function' ? next(transformRef.current) : next;
    const clamped = clampTransform(raw);
    transformRef.current = clamped;
    setTransformState(clamped);
    
    if (contentRef.current) {
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.style.transform = `translate(${clamped.panX}px, ${clamped.panY}px) scale(${clamped.zoom})`;
        }
      });
    }
  }, [clampTransform]);

  useEffect(() => {
    if (svgCache) return;
    fetch(publicAsset('/maps/north-america.svg'))
      .then((r) => r.text())
      .then((text) => {
        svgCache = text;
        setSvgContent(text);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  // Effect A — Listener registration & Country Classification (runs once when svgContent loads)
  useEffect(() => {
    if (!svgContent || !contentRef.current) return;
    const cleanups: (() => void)[] = [];
    contentRef.current.querySelectorAll('.atlas-region').forEach((el) => {
      if (!(el instanceof SVGPathElement)) return;
      const code = el.getAttribute('data-code') || el.getAttribute('id') || '';

      // Exclude DC from interaction tracking — DC is in SVG (64 paths) but not in states.json (63 entries)
      if (code === 'DC') {
        el.style.pointerEvents = 'none';
        return;
      }

      if (code.startsWith('US-')) {
        el.classList.add('atlas-region-us');
      } else if (code.startsWith('CA-')) {
        el.classList.add('atlas-region-ca');
      }

      // Accessibility: Keyboard navigation
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `Region ${code}`);
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onRegionClickRef.current(code, getRegionFlightSource(el));
        }
      };

      el.addEventListener('keydown', handleKeyDown);
      cleanups.push(() => el.removeEventListener('keydown', handleKeyDown));

      const handlePointerEnter = (e: PointerEvent) => {
        if (onRegionHoverRef.current) {
          const now = Date.now();
          if (code === lastHoverCodeRef.current && now - lastHoverTimeRef.current < 150) return;
          lastHoverCodeRef.current = code;
          lastHoverTimeRef.current = now;
          onRegionHoverRef.current(code, { x: e.clientX, y: e.clientY });
        }
      };

      const handlePointerLeave = () => {
        if (onRegionHoverRef.current) {
          onRegionHoverRef.current(null);
        }
      };

      el.addEventListener('pointerenter', handlePointerEnter);
      el.addEventListener('pointerleave', handlePointerLeave);
      cleanups.push(() => {
        el.removeEventListener('pointerenter', handlePointerEnter);
        el.removeEventListener('pointerleave', handlePointerLeave);
      });
    });

    return () => cleanups.forEach(fn => fn());
  }, [svgContent]);

  // Effect B — Visual state update (synchronous to avoid rAF cancellation on rapid dep changes)
  useEffect(() => {
    if (!svgContent || !contentRef.current) return;

    contentRef.current.querySelectorAll('.atlas-region').forEach((el) => {
      if (!(el instanceof SVGPathElement)) return;
      const code = el.getAttribute('data-code') || el.getAttribute('id') || '';
      const tz = timezoneMap[code];

      const desiredClasses = new Set<string>();

      if (heatmapMap && heatmapMap[code]) {
        el.style.fill = heatmapMap[code];
        desiredClasses.add('is-heatmap');
      } else if (code === correctCode) {
        el.style.fill = COLOR_CORRECT;
        desiredClasses.add('is-correct');
      } else if (code === wrongCode) {
        el.style.fill = COLOR_WRONG;
        desiredClasses.add('is-wrong');
      } else if (code === activeCode && mode !== 'explore') {
        el.style.fill = COLOR_ACTIVE;
        desiredClasses.add('is-active');
      } else if (pulsingClusterCodes.includes(code)) {
        el.style.fill = COLOR_ACTIVE;
        desiredClasses.add('is-cluster-pulse');
      } else if (masteredCodes.includes(code)) {
        el.style.fill = tz ? (TZ_FILLS[tz] ?? COLOR_EXPLORED) : COLOR_EXPLORED;
        desiredClasses.add('is-mastered');
        if (code === activeCode) desiredClasses.add('is-explore-active');
      } else if (highlightedCodes.includes(code)) {
        el.style.fill = tz ? (TZ_FILLS[tz] ?? COLOR_EXPLORED) : COLOR_EXPLORED;
        desiredClasses.add('is-highlighted');
      } else {
        el.style.fill = defaultFill;
      }

      if (hoveredTimezone) {
        if (tz === hoveredTimezone) {
          desiredClasses.add('is-tz-hover');
        } else {
          desiredClasses.add('is-dimmed');
        }
      }

      const prevClasses = prevClassStateRef.current.get(el) || new Set<string>();
      for (const cls of prevClasses) {
        if (!desiredClasses.has(cls)) el.classList.remove(cls);
      }
      for (const cls of desiredClasses) {
        if (!prevClasses.has(cls)) el.classList.add(cls);
      }
      prevClassStateRef.current.set(el, desiredClasses);

      el.style.cursor = mode === 'gameplay' && !correctCode && !wrongCode ? 'crosshair' : 'pointer';
    });
  }, [svgContent, highlightedCodes, masteredCodes, pulsingClusterCodes, activeCode, correctCode, wrongCode, mode, timezoneMap, hoveredTimezone, defaultFill, heatmapMap]);

  useEffect(() => {
    if (!svgContent || !contentRef.current || mode !== 'explore') return;
    updateExplorationTrail(contentRef.current, explorationOrder);
  }, [svgContent, explorationOrder, mode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || loading) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const point = {
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      };

      setTransform((current) => {
        const nextZoom = Math.max(MIN_ZOOM, Math.min(current.zoom - e.deltaY * 0.002, MAX_ZOOM));
        const zoomRatio = nextZoom / current.zoom;
        return {
          zoom: nextZoom,
          panX: point.x - (point.x - current.panX) * zoomRatio,
          panY: point.y - (point.y - current.panY) * zoomRatio,
        };
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [loading, setTransform]);

  useEffect(() => {
    const handleResize = () => setTransform((current) => current);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setTransform]);

  function getPointerPoint(e: React.PointerEvent<HTMLDivElement>): PointerPoint {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function getPinchMetrics(points: PointerPoint[]) {
    const [a, b] = points;
    return {
      distance: Math.hypot(a.x - b.x, a.y - b.y),
      midpoint: {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
      },
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (onRegionHoverRef.current) {
      onRegionHoverRef.current(null);
    }
    const point = getPointerPoint(e);
    pointersRef.current.set(e.pointerId, point);
    e.currentTarget.setPointerCapture(e.pointerId);

    if (pointersRef.current.size === 2) {
      const metrics = getPinchMetrics([...pointersRef.current.values()]);
      pinchRef.current = {
        ...metrics,
        transform: transformRef.current,
      };
      dragStateRef.current = null;
      return;
    }

    const region = (e.target as Element).closest('.atlas-region') as SVGPathElement | null;
    dragStateRef.current = {
      active: true,
      startX: point.x,
      startY: point.y,
      startPanX: transformRef.current.panX,
      startPanY: transformRef.current.panY,
      moved: false,
      regionCode: region?.dataset.code,
      regionElement: region ?? undefined,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(e.pointerId)) return;
    const point = getPointerPoint(e);
    pointersRef.current.set(e.pointerId, point);

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const metrics = getPinchMetrics([...pointersRef.current.values()].slice(0, 2));
      const rect = e.currentTarget.getBoundingClientRect();
      const nextZoom = pinchRef.current.transform.zoom * (metrics.distance / pinchRef.current.distance);
      const zoomRatio = nextZoom / pinchRef.current.transform.zoom;
      const anchor = {
        x: pinchRef.current.midpoint.x - rect.width / 2,
        y: pinchRef.current.midpoint.y - rect.height / 2,
      };
      const shift = {
        x: metrics.midpoint.x - pinchRef.current.midpoint.x,
        y: metrics.midpoint.y - pinchRef.current.midpoint.y,
      };

      setTransform({
        zoom: nextZoom,
        panX: anchor.x - (anchor.x - pinchRef.current.transform.panX) * zoomRatio + shift.x,
        panY: anchor.y - (anchor.y - pinchRef.current.transform.panY) * zoomRatio + shift.y,
      });
      return;
    }

    const drag = dragStateRef.current;
    if (!drag?.active) return;

    const dx = point.x - drag.startX;
    const dy = point.y - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      drag.moved = true;
    }

    if (drag.moved) {
      setTransform({
        zoom: transformRef.current.zoom,
        panX: drag.startPanX + dx,
        panY: drag.startPanY + dy,
      });
    }
  }

  function handlePointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(e.pointerId);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const drag = dragStateRef.current;
    pinchRef.current = null;
    if (pointersRef.current.size === 1) {
      const [remaining] = pointersRef.current.values();
      dragStateRef.current = {
        active: true,
        startX: remaining.x,
        startY: remaining.y,
        startPanX: transformRef.current.panX,
        startPanY: transformRef.current.panY,
        moved: true,
      };
      return;
    }

    if (drag?.active && !drag.moved && drag.regionCode) {
      onRegionClick(drag.regionCode, drag.regionElement ? getRegionFlightSource(drag.regionElement) : undefined);
    }

    dragStateRef.current = null;
  }

  function zoomBy(delta: number) {
    setTransform((current) => ({
      ...current,
      zoom: current.zoom + delta,
    }));
  }

  function resetView() {
    setTransform({ zoom: 1, panX: 0, panY: 0 });
  }

  if (loading) {
    return (
      <div className="w-full h-full bg-atlas-card rounded-xl flex items-center justify-center text-atlas-muted font-display">
        Loading map...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={miniMap ? undefined : handlePointerDown}
      onPointerMove={miniMap ? undefined : handlePointerMove}
      onPointerUp={miniMap ? undefined : handlePointerEnd}
      onPointerCancel={miniMap ? undefined : handlePointerEnd}
      className={['relative w-full h-full rounded-xl select-none bg-atlas-card overflow-hidden', miniMap ? 'pointer-events-none' : 'touch-pan-x touch-pan-y'].join(' ')}
    >
      <div
        ref={contentRef}
        style={{
          transform: `translate(${transform.panX}px, ${transform.panY}px) scale(${transform.zoom})`,
        }}
        className={[
          'absolute inset-0 origin-center [&_svg]:w-full [&_svg]:h-full [&_svg]:block',

          '',
        ].join(' ')}
        dangerouslySetInnerHTML={{ __html: svgContent ?? '' }}
      />

      <style>{`
        .atlas-region {
          cursor: pointer !important;
          paint-order: stroke fill markers;
          outline: none;
        }
        .atlas-region-us {
          stroke: var(--atlas-us-stroke, #1E3A5F);
          stroke-width: 0.8px;
        }
        .atlas-region-ca {
          stroke: var(--atlas-ca-stroke, #6B2121);
          stroke-width: 0.8px;
        }
        [id^="US-"], [data-code^="US-"] {
          filter: drop-shadow(0 0 2px rgba(30, 58, 95, 0.3));
        }
        [id^="CA-"], [data-code^="CA-"] {
          filter: drop-shadow(0 0 2px rgba(107, 33, 33, 0.3));
        }
        .atlas-region:focus-visible {
          stroke: var(--atlas-accent) !important;
          stroke-width: 4px !important;
          filter: brightness(1.2);
          z-index: 50;
          position: relative;
        }
        .atlas-region:hover, .is-tz-hover {
          filter: brightness(1.5) saturate(1.3);
          stroke: #fff !important;
          stroke-width: 2px !important;
        }
        .is-tz-hover {
          filter: brightness(1.8) saturate(1.5);
          stroke-width: 3px !important;
        }
        .is-dimmed {
          opacity: 0.25;
          filter: grayscale(0.8) contrast(0.8);
        }
        .atlas-region:active {
          filter: brightness(0.8);
        }
        .is-highlighted {
          opacity: 0.85;
          filter: saturate(0.85);
        }
        .is-mastered {
          opacity: 1;
          filter: saturate(1) brightness(0.98);
          stroke-width: 1px !important;
        }
        .is-cluster-pulse {
          animation: cluster-pulse-glow 1.5s ease-in-out !important;
          stroke: var(--atlas-accent) !important;
          stroke-width: 3px !important;
          z-index: 40;
          position: relative;
        }
        @keyframes cluster-pulse-glow {
          0% { filter: brightness(1); fill: var(--atlas-accent); stroke-width: 3px; transform: scale(1.01); }
          50% { filter: brightness(1.3) drop-shadow(0 0 12px var(--atlas-accent)); fill: var(--atlas-accent); stroke-width: 4px; transform: scale(1.03); }
          100% { filter: brightness(1); fill: var(--atlas-accent); stroke-width: 3px; transform: scale(1); }
        }
        .is-active, .is-correct, .is-wrong {
          transition: all 0.3s ease;
        }
        .is-explore-active {
          stroke: white !important;
          stroke-width: 3px !important;
          filter: brightness(1.2);
        }
        @media (prefers-reduced-motion: reduce) {
          .is-cluster-pulse {
            animation: none !important;
          }
        }
      `}</style>

      {!miniMap && (
        <div className="absolute bottom-3 right-3 z-[60] flex overflow-hidden rounded-xl border border-atlas-border bg-atlas-card/80 shadow-xl backdrop-blur-md font-display">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => zoomBy(0.25)}
            className="flex h-10 w-10 items-center justify-center border-r border-atlas-border text-lg font-black text-atlas-ink transition-colors hover:bg-atlas-warm"
            aria-label="Zoom in"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => zoomBy(-0.25)}
            className="flex h-10 w-10 items-center justify-center border-r border-atlas-border text-lg font-black text-atlas-ink transition-colors hover:bg-atlas-warm"
            aria-label="Zoom out"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={resetView}
            className="flex h-10 w-14 items-center justify-center text-xs font-black uppercase tracking-widest text-atlas-accent transition-colors hover:bg-atlas-warm"
            aria-label="Reset map view"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
