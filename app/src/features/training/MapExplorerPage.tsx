import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Compass, Map, MapPin, Trophy, X } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useAudio } from '@/hooks/useAudio';
import { useData } from '@/hooks/useData';
import { publicAsset } from '@/lib/assets';
import AppLayout from '@/components/layout/AppLayout';
import InteractiveMap, { type RegionFlightSource } from '@/components/map/InteractiveMap';
import StateInfoPanel from '@/components/map/StateInfoPanel';
import TrainingTopBar from '@/components/layout/TrainingTopBar';
import { triggerClusterComplete, triggerMilestoneCeremony } from '@/lib/celebrations';
import { TOTAL_REGIONS } from '@/lib/session';
import { TZ_FILLS } from '@/lib/timezones';

const PIN_POSITIONS = [
  { top: '25%', left: '30%' },
  { top: '45%', left: '60%' },
  { top: '70%', left: '42%' },
];

const MILESTONES = [
  { count: 10, label: 'Scout', icon: '🧭' },
  { count: 25, label: 'Wayfinder', icon: '📍' },
  { count: 50, label: 'Cartographer', icon: '🗺️' },
  { count: TOTAL_REGIONS, label: 'Completionist', icon: '🏆' },
];

const MILESTONE_ICON_COMPONENTS: Record<number, typeof Compass> = {
  10: Compass,
  25: MapPin,
  50: Map,
  [TOTAL_REGIONS]: Trophy,
};

const CLUSTER_CHECKPOINTS: Record<string, string[]> = {
  'Pacific Coast': ['WA', 'OR', 'CA', 'AK', 'HI'],
  'Mountain West': ['MT', 'ID', 'WY', 'NV', 'UT', 'CO', 'AZ', 'NM'],
  'Midwest Heartland': ['ND', 'SD', 'NE', 'KS', 'MN', 'IA', 'MO', 'WI', 'IL', 'MI', 'IN', 'OH'],
  'Southern Belt': ['TX', 'OK', 'AR', 'LA', 'MS', 'AL', 'TN', 'KY', 'GA', 'FL', 'SC', 'NC', 'VA', 'WV'],
  'Northeast Corridor': ['MD', 'DE', 'PA', 'NJ', 'NY', 'CT', 'RI', 'MA', 'VT', 'NH', 'ME']
};

const EMPTY_CLUSTER_CODES: string[] = [];

type RegionFlight = RegionFlightSource & {
  id: number;
  dx: number;
  dy: number;
  sx: number;
  sy: number;
};

const PANEL_WIDTH = 340;
const FLIGHT_DURATION_MS = 300;

export default function MapExplorerPage() {
  const { session, updateTraining, saveJournalEntry } = useSession();
  const { playSound } = useAudio();
  const { states } = useData();
  const navigate = useNavigate();
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [phase, setPhase] = useState<'intro' | 'exploring'>('intro');
  const [passportOpen, setPassportOpen] = useState(() => {
    return localStorage.getItem('atlas_passportOpen') === 'true';
  });
  const [showLegend, setShowLegend] = useState(() => {
    return localStorage.getItem('atlas_showLegend') === 'true';
  });
  const [selectedTimezone, setSelectedTimezone] = useState<string | null>(() =>
    localStorage.getItem('atlas_selectedTimezone') || null
  );
  const [milestonePopup, setMilestonePopup] = useState<{ count: number; label: string; icon: string } | null>(null);
  const [completedCluster, setCompletedCluster] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<{ code: string; pos: { x: number; y: number } } | null>(null);
  const [panelCode, setPanelCode] = useState<string | null>(null);
  const [regionFlight, setRegionFlight] = useState<RegionFlight | null>(null);
  const [tourStep, setTourStep] = useState(() => {
    if (localStorage.getItem('atlas_tour_seen')) return -1;
    return 0;
  });
  const panelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Time budget tracking (B4)
  const [elapsedBudget, setElapsedBudget] = useState(() => {
    const stored = localStorage.getItem('atlas_training_budget');
    return stored ? parseInt(stored, 10) : 0;
  });

  useEffect(() => {
    if (phase !== 'exploring' || milestonePopup) return;
    const interval = setInterval(() => {
      setElapsedBudget(prev => {
        const next = Math.min(900, prev + 1); // 15 min budget
        localStorage.setItem('atlas_training_budget', next.toString());
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [milestonePopup, phase]);

  // Tour auto-dismiss timer (C1)
  useEffect(() => {
    if (tourStep < 0 || tourStep > 2) return;
    const timer = setTimeout(() => {
      setTourStep(-1);
      localStorage.setItem('atlas_tour_seen', 'true');
    }, 15000);
    return () => clearTimeout(timer);
  }, [tourStep]);

  function dismissTour() {
    setTourStep(-1);
    localStorage.setItem('atlas_tour_seen', 'true');
  }

  const clicked = useMemo(() => session?.training?.mapExplorerClicked || [], [session]);
  const explorationOrder = useMemo(() => session?.training?.mapExplorerOrder || [], [session]);
  const allDone = useMemo(() => clicked.length >= states.length && states.length > 0, [clicked.length, states.length]);

  const timezoneMap = useMemo(() => {
    const map: Record<string, string> = {};
    states.forEach(s => { map[s.code] = s.timezone; });
    return map;
  }, [states]);

  const hoveredTimezone = useMemo(() => {
    if (!hoveredRegion) return null;
    return timezoneMap[hoveredRegion.code] || null;
  }, [hoveredRegion, timezoneMap]);

  const pulsingClusterCodes = useMemo(
    () => (completedCluster ? (CLUSTER_CHECKPOINTS[completedCluster] ?? EMPTY_CLUSTER_CODES) : EMPTY_CLUSTER_CODES),
    [completedCluster],
  );


  useEffect(() => {
    localStorage.setItem('atlas_passportOpen', passportOpen.toString());
  }, [passportOpen]);

  useEffect(() => {
    localStorage.setItem('atlas_showLegend', showLegend.toString());
  }, [showLegend]);

  useEffect(() => {
    if (selectedTimezone) {
      localStorage.setItem('atlas_selectedTimezone', selectedTimezone);
    } else {
      localStorage.removeItem('atlas_selectedTimezone');
    }
  }, [selectedTimezone]);


  useEffect(() => {
    return () => {
      if (panelTimerRef.current) clearTimeout(panelTimerRef.current);
      if (flightTimerRef.current) clearTimeout(flightTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!milestonePopup) return;

    const dismissMilestone = () => setMilestonePopup(null);
    const timer = setTimeout(dismissMilestone, 2000);

    window.addEventListener('keydown', dismissMilestone);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', dismissMilestone);
    };
  }, [milestonePopup]);

  function buildRegionFlight(source?: RegionFlightSource): RegionFlight | null {
    if (!source || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

    const panelLeft = Math.max(24, window.innerWidth - PANEL_WIDTH - 24);
    const panelTop = Math.max(96, Math.min(window.innerHeight - 560, window.innerHeight * 0.16));
    const targetWidth = 88;
    const targetHeight = Math.max(44, targetWidth * (source.rect.height / source.rect.width));
    const targetCenterX = panelLeft + 44;
    const targetCenterY = panelTop + 80;
    const sourceCenterX = source.rect.left + source.rect.width / 2;
    const sourceCenterY = source.rect.top + source.rect.height / 2;

    return {
      ...source,
      id: Date.now(),
      dx: targetCenterX - sourceCenterX,
      dy: targetCenterY - sourceCenterY,
      sx: targetWidth / source.rect.width,
      sy: targetHeight / source.rect.height,
    };
  }

  function revealPanelAfterFlight(code: string, source?: RegionFlightSource) {
    if (panelTimerRef.current) clearTimeout(panelTimerRef.current);
    if (flightTimerRef.current) clearTimeout(flightTimerRef.current);

    const flight = buildRegionFlight(source);
    setPanelCode(null);
    setRegionFlight(flight);

    const delay = flight ? FLIGHT_DURATION_MS : 0;
    panelTimerRef.current = setTimeout(() => {
      setPanelCode(code);
    }, delay);
    flightTimerRef.current = setTimeout(() => {
      setRegionFlight(null);
    }, delay + 80);
  }

  function handleRegionClick(code: string, flightSource?: RegionFlightSource) {
    if (milestonePopup) return;

    const wasAlreadyClicked = clicked.includes(code);
    setActiveCode(code);
    revealPanelAfterFlight(code, flightSource);
    
    if (!wasAlreadyClicked) {
      playSound('click');
      updateTraining('map', code);
      
      const newCount = clicked.length + 1;
      const milestone = MILESTONES.find(m => m.count === newCount);
      if (milestone) {
        playSound('milestone');
        triggerMilestoneCeremony();
        setMilestonePopup(milestone);
      }

      // Check Cluster Completion (B3)
      for (const [clusterName, codes] of Object.entries(CLUSTER_CHECKPOINTS)) {
        const newlyCompleted = codes.every(c => c === code || clicked.includes(c));
        const previouslyCompleted = codes.every(c => clicked.includes(c));
        if (newlyCompleted && !previouslyCompleted) {
          playSound('cluster');
          triggerClusterComplete();
          setCompletedCluster(clusterName);
          setTimeout(() => setCompletedCluster(null), 3500);
          break;
        }
      }
    }
  }

  function handleExit() {
    if (window.confirm('Are you sure you want to exit the training session?')) {
      navigate('/');
    }
  }

  // Budget calculations
  const budgetPct = Math.min(100, (elapsedBudget / 900) * 100);
  const budgetMinutes = Math.floor(elapsedBudget / 60);
  const budgetSeconds = elapsedBudget % 60;
  const budgetStatusColor = elapsedBudget > 900 ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]' : elapsedBudget > 600 ? 'bg-atlas-gold shadow-[0_0_12px_rgba(255,153,0,0.5)]' : 'bg-atlas-accent shadow-[0_0_12px_rgba(46,125,50,0.5)]';
  const selectedState = useMemo(() => states.find((state) => state.code === panelCode) ?? null, [panelCode, states]);
  const MilestoneIcon = milestonePopup ? MILESTONE_ICON_COMPONENTS[milestonePopup.count] ?? Trophy : Trophy;

  return (
    <>
    <AppLayout>
      {phase === 'intro' ? (
        <main className="flex min-h-screen items-center justify-center bg-atlas-warm p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-atlas-card shadow-2xl border border-atlas-border">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left Column: Visual Map Preview */}
              <div className="relative flex items-center justify-center bg-atlas-warm p-8 lg:col-span-7 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(46,125,50,0.15),transparent_70%)]" />
                <img
                  src={publicAsset('/maps/north-america.svg')}
                  alt=""
                  className="relative z-10 h-full w-full max-w-3xl object-contain p-8 lg:p-14 opacity-80 drop-shadow-[0_30px_70px_rgba(0,0,0,0.5)]"
                />
                <img
                  src={publicAsset('/assets/illustrations/globe-illustration.png')}
                  alt=""
                  className="absolute bottom-5 left-6 z-20 w-24 sm:w-32 lg:w-40 opacity-90 drop-shadow-2xl"
                />
                <img
                  src={publicAsset('/assets/illustrations/compass-rose.svg')}
                  alt=""
                  className="absolute right-5 top-5 z-20 w-20 sm:w-28 opacity-45"
                />
                {PIN_POSITIONS.map((pin) => (
                  <img
                    key={`${pin.top}-${pin.left}`}
                    src={publicAsset('/assets/stickers/pin-bounce.gif')}
                    alt=""
                    className="absolute z-30 w-10 sm:w-14 drop-shadow-lg"
                    style={{ top: pin.top, left: pin.left }}
                  />
                ))}
              </div>

              {/* Right Column: Expedition Briefing */}
              <div className="flex flex-col justify-between p-8 sm:p-10 lg:col-span-5 lg:p-12 bg-atlas-card">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-atlas-warm px-4 py-1.5 text-xs font-black uppercase tracking-widest text-atlas-accent border border-atlas-border shadow-sm">
                    <span>🧭</span> Explore the Map
                  </div>
                  <h1 className="mt-6 font-serif text-4xl sm:text-5xl font-black tracking-tight text-atlas-ink leading-none">
                    Discover North America
                  </h1>
                  <p className="mt-4 text-sm sm:text-base text-atlas-muted leading-relaxed font-medium">
                    Explore and memorize the geography of North America. Select regions to reveal useful facts, timezones, and regional notes.
                  </p>

                  <div className="mt-8 space-y-4 border-t border-atlas-border pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-atlas-warm text-xl shadow-inner border border-atlas-border text-atlas-ink">
                        📍
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-atlas-ink">Interactive Map</h3>
                        <p className="text-xs text-atlas-muted font-medium">Click regions to discover facts and timezones.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center h-12 w-12 shrink-0 rounded-2xl bg-atlas-warm text-xl shadow-inner border border-atlas-border text-atlas-ink">
                        ⚡
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-atlas-ink">Timezone Mastery</h3>
                        <p className="text-xs text-atlas-muted font-medium">Learn which states share each timezone.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex flex-col gap-4">
                  <button
                    onClick={() => setPhase('exploring')}
                    className="w-full btn-chunky btn-chunky-primary py-4 text-base shadow-lg"
                  >
                    {allDone ? 'Return to Map' : 'Begin Exploration'}
                  </button>
                  {allDone && (
                    <button
                      onClick={() => navigate('/train/complete')}
                      className="w-full btn-chunky btn-chunky-orange py-4 text-base shadow-lg"
                    >
                      Continue to Results
                    </button>
                  )}
                  <p className="mt-2 text-center text-xs font-bold text-atlas-muted">
                    {clicked.length} / {states.length || TOTAL_REGIONS} regions explored
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex h-screen w-screen flex-col bg-atlas-warm overflow-hidden">
          {/* Top Bar */}
          <TrainingTopBar
            explored={clicked.length}
            total={states.length || TOTAL_REGIONS}
            label="Discover North America"
            onExit={handleExit}
          />

          {/* Time Budget Bar (B4) */}
          <div className="w-full bg-atlas-card border-b border-atlas-border px-6 py-2 flex items-center justify-between text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-atlas-ink uppercase tracking-wider text-xs">Pace Monitor</span>
              <span className="text-atlas-muted font-mono">({budgetMinutes}m {budgetSeconds}s / 15m)</span>
            </div>
            <div className="flex-1 max-w-md mx-4 h-2 bg-atlas-warm rounded-full overflow-hidden border border-atlas-border shadow-inner">
              <div className={`h-full transition-all duration-1000 ${budgetStatusColor}`} style={{ width: `${budgetPct}%` }} />
            </div>
            <span className={`font-black text-xs uppercase tracking-widest ${elapsedBudget > 900 ? 'text-rose-600 animate-pulse' : elapsedBudget > 600 ? 'text-atlas-gold' : 'text-atlas-accent'}`}>
              {elapsedBudget > 900 ? 'Over Budget' : elapsedBudget > 600 ? 'Pace Warning' : 'On Pace'}
            </span>
          </div>

          <div className="relative flex-1 overflow-hidden">
            {/* Interactive Map */}
            <div className="absolute inset-0 p-4 sm:p-6 lg:p-8">
              <InteractiveMap
                onRegionClick={handleRegionClick}
                onRegionHover={(code, pos) => setHoveredRegion(code && pos ? { code, pos } : null)}
                highlightedCodes={clicked}
                masteredCodes={clicked}
                explorationOrder={explorationOrder}
                pulsingClusterCodes={pulsingClusterCodes}
                activeCode={activeCode}
                mode="explore"
                timezoneMap={timezoneMap}
                hoveredTimezone={selectedTimezone ?? hoveredTimezone}
              />
            </div>

            {regionFlight && (
              <div
                key={regionFlight.id}
                className="fixed pointer-events-none z-[65] origin-center animate-region-fly-to-panel"
                style={{
                  left: regionFlight.rect.left,
                  top: regionFlight.rect.top,
                  width: regionFlight.rect.width,
                  height: regionFlight.rect.height,
                  ['--fly-x' as string]: `${regionFlight.dx}px`,
                  ['--fly-y' as string]: `${regionFlight.dy}px`,
                  ['--fly-scale-x' as string]: regionFlight.sx,
                  ['--fly-scale-y' as string]: regionFlight.sy,
                }}
                aria-hidden="true"
              >
                <svg
                  viewBox={`${regionFlight.bbox.x} ${regionFlight.bbox.y} ${regionFlight.bbox.width} ${regionFlight.bbox.height}`}
                  className="h-full w-full overflow-hidden drop-shadow-2xl"
                >
                  <path
                    d={regionFlight.pathD}
                    fill={regionFlight.fill}
                    stroke="none"
                  />
                </svg>
              </div>
            )}

            {/* Region Hover Tooltip (B1) */}
            {hoveredRegion && !activeCode && (
              <div 
                className="fixed z-50 pointer-events-none bg-atlas-ink/95 text-white px-4 py-2.5 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-md animate-pop-in flex items-center gap-3"
                style={{ top: hoveredRegion.pos.y - 60, left: hoveredRegion.pos.x - 80 }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-atlas-accent animate-pulse" />
                <div>
                  <div className="text-xs font-black tracking-tight">{states.find(s => s.code === hoveredRegion.code)?.name || hoveredRegion.code}</div>
                  <div className="text-xs text-white/60 font-mono font-bold uppercase tracking-widest">{hoveredTimezone || 'UTC'}</div>
                </div>
              </div>
            )}

            {/* Milestone Ceremony (D4) */}
            {milestonePopup && (
              <div
                className="fixed inset-0 z-[120] flex items-center justify-center bg-atlas-ink/90 px-5 text-center text-white backdrop-blur-md animate-milestone-takeover"
                aria-modal="true"
                role="dialog"
                aria-labelledby="milestone-title"
                aria-describedby="milestone-subtitle"
              >
                <button
                  type="button"
                  onClick={() => setMilestonePopup(null)}
                  className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 shadow-2xl transition hover:bg-white/15 hover:text-white sm:right-6 sm:top-6"
                  aria-label="Dismiss milestone ceremony"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
                <div className="relative flex w-full max-w-3xl flex-col items-center">
                  <div className="absolute -inset-x-8 top-1/2 h-28 -translate-y-1/2 bg-atlas-gold/20 blur-3xl" aria-hidden="true" />
                  <div className="relative mb-8 flex h-28 w-28 items-center justify-center rounded-full border border-atlas-gold/50 bg-atlas-gold text-atlas-ink shadow-[0_0_70px_rgba(249,168,37,0.45)] sm:h-36 sm:w-36">
                    <MilestoneIcon className="h-14 w-14 animate-milestone-icon sm:h-20 sm:w-20" strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <p className="relative mb-3 text-xs font-black uppercase tracking-[0.4em] text-atlas-gold">
                    Milestone achieved
                  </p>
                  <h2 id="milestone-title" className="relative font-display text-5xl font-black leading-none tracking-normal sm:text-7xl">
                    {milestonePopup.label} reached
                  </h2>
                  <p id="milestone-subtitle" className="relative mt-5 text-base font-bold text-white/75 sm:text-xl">
                    {milestonePopup.count} regions explored
                  </p>
                </div>
              </div>
            )}

            {/* Cluster Completion Popup (B3) */}
            {completedCluster && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-atlas-card border-2 border-atlas-accent text-atlas-ink px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-4 animate-bounce-in backdrop-blur-md">
                <span className="text-3xl animate-bounce">✨</span>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-atlas-accent">Regional Cluster Mastered</div>
                  <div className="text-xl font-black text-atlas-ink">{completedCluster}</div>
                </div>
              </div>
            )}

            {/* State Info Panel */}
            {selectedState ? (
              <div className="absolute right-6 top-6 z-[55] w-[min(340px,calc(100vw-3rem))] animate-panel-after-flight">
                <StateInfoPanel
                  key={selectedState.code}
                  state={selectedState}
                  onSaveFact={saveJournalEntry}
                  onClose={() => {
                    setActiveCode(null);
                    setPanelCode(null);
                    setRegionFlight(null);
                  }}
                />
              </div>
            ) : (
              <div className="absolute bottom-6 right-6 z-[55] hidden w-80 flex-col gap-4 sm:flex lg:w-96 animate-fade-in">
                <div className="rounded-3xl bg-atlas-card p-6 shadow-2xl border border-atlas-border backdrop-blur-md">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-atlas-border">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-atlas-warm text-atlas-ink shadow-inner border border-atlas-border">
                      🧭
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-atlas-ink">Expedition Status</h3>
                      <p className="text-xs text-atlas-muted font-medium">Click a region to learn more</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-black text-atlas-ink mb-1">
                        <span>Progress</span>
                        <span className="font-mono">{clicked.length} / {states.length || TOTAL_REGIONS}</span>
                      </div>
                      <div className="h-2 w-full bg-atlas-warm rounded-full overflow-hidden border border-atlas-border shadow-inner">
                        <div
                          className="h-full bg-atlas-accent transition-all duration-500 shadow-[0_0_10px_rgba(46,125,50,0.5)]"
                          style={{ width: `${(clicked.length / (states.length || TOTAL_REGIONS)) * 100}%` }}
                        />
                      </div>
                    </div>

                    {allDone && (
                      <div className="pt-2 animate-fade-in">
                        <button
                          onClick={() => navigate('/train/complete')}
                          className="w-full btn-chunky btn-chunky-orange py-3 text-sm shadow-lg flex items-center justify-center gap-2"
                        >
                          Continue to Results <span>➔</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Legend Toggle */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowLegend(!showLegend)}
                    className="flex items-center gap-2 rounded-full bg-atlas-card px-4 py-2 text-xs font-black uppercase tracking-widest text-atlas-muted hover:text-atlas-ink border border-atlas-border shadow-md transition-all"
                  >
                    <span>🏷️</span> {showLegend ? 'Hide Legend' : 'Show Legend'}
                  </button>
                </div>

                {showLegend && (
                  <div className="rounded-3xl bg-atlas-card p-6 shadow-2xl border border-atlas-border animate-pop-in backdrop-blur-md">
                    <h4 className="text-xs font-black uppercase tracking-widest text-atlas-muted mb-1">Timezone Fills</h4>
                    <p className="text-xs text-atlas-muted mb-3 font-medium">Tap a zone to highlight it</p>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { tz: 'EST', label: 'Eastern' },
                        { tz: 'CST', label: 'Central' },
                        { tz: 'MST', label: 'Mountain' },
                        { tz: 'PST', label: 'Pacific' },
                        { tz: 'AKST', label: 'Alaska' },
                        { tz: 'HST', label: 'Hawaii' },
                        { tz: 'AST', label: 'Atlantic' },
                        { tz: 'NST', label: 'Newfoundland' },
                      ] as const).map(({ tz, label }) => (
                        <button
                          key={tz}
                          type="button"
                          onClick={() => setSelectedTimezone(prev => prev === tz ? null : tz)}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all border ${selectedTimezone === tz ? 'border-atlas-ink bg-atlas-warm shadow-md' : 'border-transparent hover:bg-atlas-warm/60'}`}
                        >
                          <div
                            className="h-3.5 w-3.5 rounded-md shadow-sm flex-shrink-0"
                            style={{ backgroundColor: TZ_FILLS[tz] }}
                          />
                          <span className="text-xs font-bold text-atlas-ink leading-tight">{label} ({tz})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* First-Run Guided Tour (C1) */}
          {tourStep >= 0 && (
            <div className="absolute inset-0 z-[100] pointer-events-none">
              <div className="absolute inset-0 bg-atlas-ink/60 pointer-events-auto" onClick={dismissTour} />
              <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 pointer-events-auto animate-pop-in">
                <div className="bg-atlas-card border-2 border-atlas-accent rounded-3xl p-6 shadow-2xl max-w-sm text-center">
                  <div className="flex justify-center gap-1.5 mb-4">
                    {[0, 1, 2].map(s => (
                      <div key={s} className={`w-2 h-2 rounded-full transition-all ${s === tourStep ? 'bg-atlas-accent w-6' : 'bg-atlas-border'}`} />
                    ))}
                  </div>
                  <p className="text-atlas-ink font-black text-lg mb-2">
                    {tourStep === 0 && 'Click any region on the map to learn about it'}
                    {tourStep === 1 && 'Read the facts, then click another region'}
                    {tourStep === 2 && `Explore all ${TOTAL_REGIONS} regions, then test your knowledge!`}
                  </p>
                  <p className="text-atlas-muted text-sm mb-4">
                    {tourStep === 0 && 'Each region has interesting facts and timezone info'}
                    {tourStep === 1 && 'The info panel shows facts you can save to your journal'}
                    {tourStep === 2 && 'You\'ll play 3 games to test what you\'ve learned'}
                  </p>
                  <button
                    onClick={() => {
                      if (tourStep < 2) {
                        setTourStep(tourStep + 1);
                      } else {
                        dismissTour();
                      }
                    }}
                    className="btn-chunky btn-chunky-primary px-6 py-2 text-sm"
                  >
                    {tourStep < 2 ? 'Next' : "Let's Go!"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      )}
    </AppLayout>
    {phase === 'exploring' && createPortal(
      <>
        <button
          onClick={() => setPassportOpen(!passportOpen)}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 btn-chunky px-5 py-3 text-xs shadow-2xl transition-all whitespace-nowrap ${passportOpen ? 'btn-chunky-orange' : 'btn-chunky-primary'}`}
        >
          <span>{passportOpen ? '📖' : '🛂'}</span>
          {passportOpen ? 'Close Passport' : 'Atlas Passport'}
        </button>
        <div
          className={`fixed bottom-0 left-0 right-0 z-[9998] max-h-[85vh] w-full overflow-y-auto rounded-t-[3rem] bg-atlas-warm p-8 sm:p-10 lg:p-12 transition-transform duration-500 ease-in-out border-t border-atlas-border shadow-[0_-20px_50px_rgba(0,0,0,0.15)] ${
            passportOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="mx-auto max-w-6xl pb-16 pt-6">
            <div className="mb-10 flex items-center justify-between border-b border-atlas-border pb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-atlas-warm text-2xl shadow-inner border border-white/10 text-atlas-ink">
                  🛂
                </div>
                <div>
                  <h2 className="font-serif text-3xl font-black text-atlas-ink tracking-tight">Atlas Passport</h2>
                  <p className="text-xs text-atlas-muted font-medium mt-0.5">Your Exploration Progress</p>
                </div>
              </div>
              <button
                onClick={() => setPassportOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-atlas-card text-atlas-muted hover:bg-atlas-border hover:text-atlas-ink border border-atlas-border transition-all"
              >
                ✕
              </button>
            </div>
            {/* Overall progress */}
            <div className="mb-8">
              <div className="flex justify-between items-center text-xs font-black text-atlas-ink mb-2">
                <span className="uppercase tracking-widest">Overall Progress</span>
                <span className="font-mono text-atlas-muted">{clicked.length} / {states.length || TOTAL_REGIONS} explored</span>
              </div>
              <div className="h-2.5 w-full bg-atlas-warm rounded-full overflow-hidden border border-atlas-border shadow-inner">
                <div
                  className="h-full bg-atlas-accent transition-all duration-500 shadow-[0_0_10px_rgba(46,125,50,0.5)]"
                  style={{ width: `${(clicked.length / (states.length || TOTAL_REGIONS)) * 100}%` }}
                />
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 mb-8 text-xs font-bold text-atlas-muted">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-atlas-accent shadow-sm" />
                <span>Explored</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-atlas-border shadow-sm" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1.5 rounded-full bg-atlas-gold opacity-70" />
                <span>Timezone color</span>
              </div>
            </div>

            {/* US States */}
            <div className="mb-10">
              <h3 className="text-xs font-black uppercase tracking-widest text-atlas-gold mb-4 flex items-center gap-2">
                <span>🇺🇸</span> United States
                <span className="ml-auto font-mono text-atlas-muted normal-case tracking-normal">
                  {states.filter(s => s.country === 'US' && clicked.includes(s.code)).length} / {states.filter(s => s.country === 'US').length}
                </span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {states
                  .filter(s => s.country === 'US')
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(state => {
                    const isExplored = clicked.includes(state.code);
                    const tzColor = TZ_FILLS[state.timezone] ?? '#888888';
                    return (
                      <div
                        key={state.code}
                        className={`flex items-center gap-2 rounded-xl px-2.5 py-2 border transition-all ${
                          isExplored
                            ? 'bg-atlas-accent/10 border-atlas-accent/40 text-atlas-ink'
                            : 'bg-atlas-warm border-atlas-border text-atlas-muted'
                        }`}
                      >
                        <div
                          className="w-1 self-stretch rounded-full flex-shrink-0 min-h-[28px]"
                          style={{ backgroundColor: isExplored ? tzColor : '#d0c9be' }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-black leading-tight truncate">{state.name}</div>
                          <div className="text-xs font-mono opacity-50 leading-tight">{state.code}</div>
                        </div>
                        {isExplored && (
                          <span className="ml-auto text-atlas-accent text-xs flex-shrink-0">✓</span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Canadian Provinces */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-atlas-accent mb-4 flex items-center gap-2">
                <span>🍁</span> Canadian Provinces
                <span className="ml-auto font-mono text-atlas-muted normal-case tracking-normal">
                  {states.filter(s => s.country === 'CA' && clicked.includes(s.code)).length} / {states.filter(s => s.country === 'CA').length}
                </span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {states
                  .filter(s => s.country === 'CA')
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(state => {
                    const isExplored = clicked.includes(state.code);
                    const tzColor = TZ_FILLS[state.timezone] ?? '#888888';
                    return (
                      <div
                        key={state.code}
                        className={`flex items-center gap-2 rounded-xl px-2.5 py-2 border transition-all ${
                          isExplored
                            ? 'bg-atlas-accent/10 border-atlas-accent/40 text-atlas-ink'
                            : 'bg-atlas-warm border-atlas-border text-atlas-muted'
                        }`}
                      >
                        <div
                          className="w-1 self-stretch rounded-full flex-shrink-0 min-h-[28px]"
                          style={{ backgroundColor: isExplored ? tzColor : '#d0c9be' }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-black leading-tight truncate">{state.name}</div>
                          <div className="text-xs font-mono opacity-50 leading-tight">{state.code}</div>
                        </div>
                        {isExplored && (
                          <span className="ml-auto text-atlas-accent text-xs flex-shrink-0">✓</span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </>,
      document.body
    )}
    </>
  );
}
