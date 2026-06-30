import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StateEntry } from '@/types';
import { useSession } from '@/hooks/useSession';
import { useAudio } from '@/hooks/useAudio';
import { useData } from '@/hooks/useData';
import AppLayout from '@/components/layout/AppLayout';
import { LottiePlayer } from '@/components/ui/LottiePlayer';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { BADGE_DEFS } from '@/lib/badges';
import { publicAsset } from '@/lib/assets';
import { GAME_DEFINITIONS } from '@/lib/session';
import { fetchLeaderboard } from '@/lib/leaderboard';
import { getRegionFlag, getRegionOfDay, getRegionTrivia } from '@/lib/region-of-day';
import { X, Users, GraduationCap, ChevronRight, MapPin } from 'lucide-react';

// ─── Badge icon emojis (landing preview) ─────────────────────────────────────

const BADGE_ICONS: Record<string, string> = {
  'first-blood':    '🚀',
  'perfect-agent':  '💯',
  'hot-streak':     '🔥',
  'globe-trotter':  '🌍',
  'diamond-agent':  '💎',
  'star-collector': '⭐',
  'never-quit':     '🏅',
  'speed-run':      '⚡',
};

const BADGE_DESCS: Record<string, string> = {
  'first-blood':    'Pass on the first try',
  'perfect-agent':  'Score 100% in any level',
  'hot-streak':     'Chain 3 correct answers',
  'globe-trotter':  `Pass all ${GAME_DEFINITIONS.length} games`,
  'diamond-agent':  `Pass all ${GAME_DEFINITIONS.length} on the first try`,
  'star-collector': `Collect all ${GAME_DEFINITIONS.length * 3} stars`,
  'never-quit':     'Pass after 3 failed tries',
  'speed-run':      'Perfect timed finish',
};

// ─── 5-step challenge track ───────────────────────────────────────────────────

const STEPS = [
  { num: '01', label: 'Map Explorer',  desc: 'Click every state and province on the live SVG map',  tag: 'Train' },
  { num: '02', label: 'Code Drop',     desc: 'Catch the right state code before the block lands',   tag: 'Play'  },
  { num: '03', label: 'Pin Rush',      desc: 'Tap the right target while the map is live',          tag: 'Play'  },
  { num: '04', label: 'Tz Sorter',     desc: 'Drag states & provinces into the right timezone zone for combo points', tag: 'Play'  },
];

// ─── Floating Particles Component ─────────────────────────────────────────────
function FloatingParticles({ visible }: { visible: boolean }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-1000 ${visible ? 'opacity-40' : 'opacity-0'}`}>
      <div className="absolute top-[15%] left-[20%] text-3xl animate-[ambient-float_8s_ease-in-out_infinite]">🧭</div>
      <div className="absolute top-[60%] left-[10%] text-2xl animate-[ambient-float_12s_ease-in-out_infinite_reverse]">📍</div>
      <div className="absolute top-[25%] right-[15%] text-4xl animate-[ambient-float_10s_ease-in-out_infinite]">🗺️</div>
      <div className="absolute top-[75%] right-[25%] text-2xl animate-[ambient-float_9s_ease-in-out_infinite_reverse]">🏔️</div>
      <div className="absolute top-[45%] left-[50%] text-xl animate-[ambient-float_15s_ease-in-out_infinite]">✈️</div>
    </div>
  );
}

// ─── BadgeShelfModal ──────────────────────────────────────────────────────────

function BadgeShelfModal({
  earnedBadges,
  onClose,
}: {
  earnedBadges: string[];
  onClose: () => void;
}) {
  const earned = new Set(earnedBadges);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-atlas-ink/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Badge shelf"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-atlas-warm border border-atlas-border rounded-3xl w-full max-w-sm max-h-[80vh] overflow-auto animate-in slide-in-from-bottom duration-300 shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-atlas-border bg-atlas-warm/95 backdrop-blur-sm">
          <h2 className="text-atlas-ink font-bold text-lg font-display">Badge Shelf</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-atlas-muted hover:text-atlas-ink text-2xl leading-none transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          {BADGE_DEFS.map((badge) => {
            const isEarned = earned.has(badge.id);
            return (
               <div
                 key={badge.id}
                 className={[
                   'flex items-start gap-3 p-4 rounded-2xl border transition-all duration-300 shadow-sm',
                   isEarned
                     ? 'border-atlas-gold bg-atlas-gold/10 scale-100'
                     : 'border-atlas-border bg-atlas-card opacity-60 grayscale scale-95',
                 ].join(' ')}
               >
                 <span className="text-2xl leading-none mt-0.5 select-none" aria-hidden="true">
                   {BADGE_ICONS[badge.id] ?? '⭐'}
                 </span>
                 <div className="min-w-0">
                   <p className="text-sm font-semibold text-atlas-ink leading-tight font-display">{badge.name}</p>
                   <p className="text-atlas-muted text-xs mt-0.5 leading-snug font-medium">
                     {BADGE_DESCS[badge.id] ?? ''}
                   </p>
                   <span className={`text-xs font-bold block mt-1 ${isEarned ? 'text-atlas-ink font-display' : 'text-atlas-muted/50'}`}>
                     {isEarned ? 'Earned' : 'Locked'}
                   </span>
                 </div>
               </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── LandingPage ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { createNewSession, session, clearCurrentSession } = useSession();
  const { playSound } = useAudio();
  const { states } = useData();
  const navigate = useNavigate();

  const [name,        setName]        = useState('');
  const [waveCode,    setWaveCode]    = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [badgeOpen,   setBadgeOpen]   = useState(false);
  const [participantCount, setParticipantCount] = useState<number | null>(null);
  const [particlesVisible, setParticlesVisible] = useState(true);
  const [regionOfDay, setRegionOfDay] = useState<StateEntry | null>(() => {
    return states.length > 0 ? getRegionOfDay(states) : null;
  });
  const [isNavigating, setIsNavigating] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (session && session.waveCode) {
      fetchLeaderboard(session.agent, session.waveCode).then((res) => {
        setParticipantCount(res.top10 ? res.top10.length : 1);
      }).catch(() => setParticipantCount(1));
    }
  }, [session]);

  useEffect(() => {
    const timer = setTimeout(() => setParticlesVisible(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (states.length > 0) {
      setRegionOfDay(getRegionOfDay(states));
    }
  }, [states]);

  const dismissParticles = () => {
    if (particlesVisible) setParticlesVisible(false);
  };

  const formValid =
    name.trim().length >= 2 &&
    waveCode.trim().length >= 2 &&
    trainerName.trim().length >= 2;

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid) return;
    playSound('click');
    setIsNavigating(true);
    createNewSession(name.trim(), waveCode.trim(), trainerName.trim());
    navigate('/train/map');
  }

  function handleTrain() {
    if (!session) return;
    playSound('click');
    navigate('/train/map');
  }

  function handlePlay() {
    if (!session) return;
    playSound('click');
    if (session.completed) {
      navigate('/play/results');
    } else {
      navigate('/play');
    }
  }

  const earnedBadges = session?.earnedBadges ?? [];
  const previewIcons = earnedBadges.slice(0, 3);

  return (
    <AppLayout>
      <main 
        onClick={dismissParticles}
        className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden bg-atlas-warm relative font-sans text-atlas-ink"
      >
        
        <FloatingParticles visible={particlesVisible} />

        {/* ── Left Panel: Entry/Form ────────────────────────────────────── */}
        <section className="relative z-10 w-full lg:w-[450px] flex-shrink-0 flex flex-col p-6 lg:p-12 overflow-y-auto lg:overflow-visible border-r border-atlas-border bg-atlas-card/80 backdrop-blur-xl shadow-sm">
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-10 font-display">
              <div className="w-12 h-12 rounded-2xl bg-atlas-accent flex items-center justify-center text-white font-black text-xl shadow-sm transform transition-transform hover:scale-105">
                AE
              </div>
              <div>
                <h1 className="text-2xl font-black text-atlas-ink leading-tight font-display tracking-tight">Atlas Explorer</h1>
                <p className="text-atlas-accent text-xs font-bold uppercase tracking-widest mt-0.5">Geo Rush</p>
              </div>
            </div>

            <h2 className="text-4xl font-black text-atlas-ink mb-4 leading-[1.1] font-display tracking-tight">
              Begin Your<br />Expedition
            </h2>
            <p className="text-atlas-muted text-sm max-w-xs mb-8 leading-relaxed font-medium">
              Welcome, Explorer. Discover every <strong className="text-atlas-accent font-semibold">Region</strong> to unlock access to the <strong className="text-atlas-accent font-semibold">3 exploration games</strong>.
            </p>
          </div>

          <div className="flex-1">
            {session && !isNavigating ? (
              <div className="flex flex-col flex-1">
              <AnimatedCard className="mb-8 rounded-2xl bg-atlas-card border border-atlas-border p-6 shadow-md relative overflow-hidden font-display">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <LottiePlayer src={publicAsset('assets/lottie/level-up.json')} className="w-24 h-24" />
                </div>
                
                <p className="text-atlas-muted text-xs uppercase tracking-widest font-black mb-2">Active Session</p>
                <p className="font-black text-atlas-ink text-3xl mb-2 font-display truncate">{session.name}</p>
                
                <div className="flex flex-col gap-2 mb-6 p-4 rounded-xl bg-atlas-warm border border-atlas-border shadow-sm">
                  <p className="text-atlas-accent text-sm font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2"><Users className="w-5 h-5 text-atlas-accent" /> You're with {session.waveCode}</span>
                    {participantCount !== null && (
                      <span className="text-atlas-muted text-xs font-normal bg-atlas-card px-3 py-0.5 rounded-full border border-atlas-border shadow-sm">
                        {participantCount} {participantCount === 1 ? 'explorer' : 'explorers'}
                      </span>
                    )}
                  </p>
                  <p className="text-atlas-muted text-sm flex items-center gap-2 font-medium">
                    <GraduationCap className="w-5 h-5 text-atlas-muted" /> Trainer: <span className="font-semibold text-atlas-ink">{session.trainerName}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => { playSound('click'); setBadgeOpen(true); }}
                  className="flex items-center gap-4 w-full text-left p-4 rounded-xl border border-atlas-border bg-atlas-warm hover:bg-atlas-card hover:shadow-md transition-all mb-6 group cursor-pointer"
                >
                  <div className="flex -space-x-2">
                    {previewIcons.map((id) => (
                      <div key={id} className="w-10 h-10 rounded-full bg-atlas-card border-2 border-atlas-border flex items-center justify-center text-xl shadow-sm" aria-hidden="true">
                        {BADGE_ICONS[id] ?? '⭐'}
                      </div>
                    ))}
                    {earnedBadges.length === 0 && (
                      <div className="w-10 h-10 rounded-full bg-atlas-warm border-2 border-atlas-border flex items-center justify-center text-xl opacity-40 grayscale shadow-sm" aria-hidden="true">
                        🏅
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 font-display">
                    <strong className="text-sm text-atlas-ink group-hover:text-atlas-accent transition-colors">Badge Shelf</strong>
                    <p className="text-atlas-muted text-xs font-bold">{earnedBadges.length}/{BADGE_DEFS.length} discovered</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-atlas-muted group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleTrain}
                    className="flex-1 py-4 rounded-xl bg-atlas-accent text-white font-bold hover:bg-atlas-accent/90 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md text-sm cursor-pointer font-display"
                  >
                    Train
                  </button>
                  <button
                    type="button"
                    onClick={handlePlay}
                    disabled={!session.training.completed}
                    className="flex-1 py-4 rounded-xl bg-atlas-gold text-atlas-ink font-bold hover:bg-atlas-gold/80 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md text-sm cursor-pointer font-display disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Play
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => { playSound('click'); clearCurrentSession(); }}
                  className="w-full py-3 mt-4 rounded-xl border border-atlas-border text-atlas-muted font-bold hover:bg-atlas-warm hover:text-atlas-ink transition-colors text-xs cursor-pointer font-display"
                >
                  Skip & Start Fresh
                </button>
              </AnimatedCard>
              </div>
            ) : (
              <form onSubmit={handleStart} className="flex flex-col flex-1 gap-6 font-display">
                <div className="space-y-6 flex-1">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="agent-name" className="text-atlas-muted text-xs uppercase tracking-widest font-black flex items-center gap-1 font-display">
                      Explorer Name <span className="text-atlas-error">*</span>
                    </label>
                    <input
                      id="agent-name"
                      type="text"
                      minLength={2}
                      required
                      placeholder="e.g. Amelia Earhart"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      ref={nameInputRef}
                      className="border border-atlas-border bg-atlas-card rounded-xl px-5 py-3.5 text-atlas-ink text-base focus:border-atlas-accent focus:ring-4 focus:ring-atlas-accent/10 transition-all placeholder:text-atlas-muted/50 font-medium shadow-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-2 bg-atlas-accent/5 p-4 rounded-xl border border-atlas-accent/20 shadow-sm">
                    <label htmlFor="wave-code" className="text-atlas-accent text-xs uppercase tracking-widest font-black flex items-center gap-1 font-display">
                      Wave <span className="text-atlas-error">*</span>
                    </label>
                    <input
                      id="wave-code"
                      type="text"
                      minLength={2}
                      required
                      placeholder="e.g. WAVE-24"
                      value={waveCode}
                      onChange={(e) => setWaveCode(e.target.value.toUpperCase())}
                      className="border border-atlas-accent/30 bg-atlas-card rounded-xl px-5 py-4 text-atlas-ink text-xl font-bold tracking-widest uppercase focus:border-atlas-accent focus:ring-4 focus:ring-atlas-accent/20 transition-all placeholder:text-atlas-accent/30 shadow-sm font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="trainer-name" className="text-atlas-muted text-xs uppercase tracking-widest font-black flex items-center gap-1 font-display">
                      Trainer <span className="text-atlas-error">*</span>
                    </label>
                    <input
                      id="trainer-name"
                      type="text"
                      minLength={2}
                      required
                      placeholder="e.g. Sarah J."
                      value={trainerName}
                      onChange={(e) => setTrainerName(e.target.value)}
                      className="border border-atlas-border bg-atlas-card rounded-xl px-5 py-3.5 text-atlas-ink text-base focus:border-atlas-accent focus:ring-4 focus:ring-atlas-accent/10 transition-all placeholder:text-atlas-muted/50 font-medium shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-6 mt-auto">
                  <button
                    type="submit"
                    disabled={!formValid}
                    className="w-full py-4 rounded-xl bg-atlas-accent text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-atlas-accent/90 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md text-base cursor-pointer font-display"
                  >
                    Begin Your Expedition
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* ── Right Panel: Visual Showcase ──────────────────────────────── */}
        <section className="hidden lg:flex flex-1 flex-col p-8 lg:p-16 relative overflow-y-auto custom-scrollbar z-10">
          
          {/* Background fill behind headline */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-atlas-accent/[0.03] via-transparent to-atlas-gold/[0.03]" />
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("${publicAsset('/assets/patterns/dots-pattern.png')}")`, backgroundSize: '120px' }} />
            <div className="absolute top-[30%] left-[20%] w-96 h-96 bg-atlas-accent/5 rounded-full blur-3xl" />
            <img
              src={publicAsset('/maps/north-america.svg')}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-contain opacity-[0.07] select-none"
              style={{ filter: 'grayscale(0.4) sepia(0.15)' }}
            />
          </div>

          <div className="relative z-10 h-full flex flex-col items-center justify-center">
            
            {/* Prominent Hero Animation */}
            <div className="flex justify-center items-center mb-16 relative">
              <div className="absolute inset-0 bg-atlas-accent/5 blur-3xl rounded-full scale-150"></div>
              <LottiePlayer 
                src={publicAsset('assets/lottie/globe.json')} 
                className="w-72 h-72 drop-shadow-2xl z-10 opacity-90"
              />
            </div>

            <div className="flex-1 flex flex-col justify-center items-center gap-12 lg:gap-16 w-full max-w-4xl text-center">
              <div>
                <h2 className="text-5xl lg:text-6xl font-black text-atlas-ink mb-6 leading-tight font-display tracking-tight">
                  Discover the map.<br />
                  <span className="text-atlas-accent font-serif italic font-medium">Master the continent.</span>
                </h2>
                <p className="text-atlas-muted text-xl leading-relaxed max-w-2xl mx-auto font-medium">
                  Discover every <strong className="text-atlas-ink font-semibold">Region</strong> to prove your readiness for the <strong className="text-atlas-ink font-semibold">3 exploration games</strong> in North America.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full font-display">
                {STEPS.map((step) => (
                  <AnimatedCard key={step.num} tiltAmount={4} className="p-6 rounded-3xl bg-atlas-card border border-atlas-border shadow-sm hover:shadow-md transition-shadow relative group text-left flex flex-col h-full">
                    <div className={[
                      "absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm",
                      step.tag === 'Train' 
                        ? "bg-atlas-accent/15 text-atlas-accent border border-atlas-accent/30" 
                        : "bg-atlas-warm text-atlas-ink border border-atlas-border"
                    ].join(' ')}>
                      {step.tag}
                    </div>
                    <div className={[
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg mb-6 shadow-sm",
                      step.tag === 'Train' ? "bg-atlas-accent/15 text-atlas-accent border border-atlas-accent/30" : "bg-atlas-warm text-atlas-ink border border-atlas-border"
                    ].join(' ')}>
                      {step.num}
                    </div>
                    <h3 className="text-atlas-ink font-bold text-lg mb-3 group-hover:text-atlas-accent transition-colors font-display">{step.label}</h3>
                    <p className="text-atlas-muted text-sm leading-relaxed mt-auto font-sans font-medium">{step.desc}</p>
                  </AnimatedCard>
                ))}
              </div>

              {regionOfDay && (
                <AnimatedCard className="w-full max-w-3xl rounded-3xl border border-atlas-border bg-atlas-card p-6 text-left shadow-sm">
                  <div className="flex items-start gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-atlas-accent/20 bg-atlas-accent/10 text-xl font-black text-atlas-accent font-display">
                      {regionOfDay.code}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-atlas-gold/40 bg-atlas-gold/15 px-3 py-1 text-xs font-black uppercase tracking-widest text-atlas-ink font-display">
                          Region of the day
                        </span>
                        <span className="rounded-full border border-atlas-border bg-atlas-warm px-3 py-1 text-xs font-bold text-atlas-muted font-display">
                          {getRegionFlag(regionOfDay)}
                        </span>
                        <span className="rounded-full border border-atlas-border bg-atlas-warm px-3 py-1 text-xs font-bold text-atlas-muted font-display">
                          {regionOfDay.timezone}
                        </span>
                      </div>
                      <h3 className="text-3xl font-black text-atlas-ink font-display tracking-tight">
                        {regionOfDay.name}
                      </h3>
                      <p className="mt-3 text-base leading-relaxed text-atlas-muted">
                        {getRegionTrivia(regionOfDay)}
                      </p>
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full border border-atlas-border bg-atlas-warm px-4 py-2 text-sm font-semibold text-atlas-ink">
                          <MapPin className="h-4 w-4 text-atlas-accent" />
                          Capital: {regionOfDay.capital}
                        </span>
                        <button
                          type="button"
                          onClick={() => nameInputRef.current?.focus()}
                          className="inline-flex items-center gap-2 rounded-full bg-atlas-accent px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-atlas-accent/90"
                        >
                          This is what awaits you
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Badge shelf modal */}
      {badgeOpen && (
        <BadgeShelfModal
          earnedBadges={earnedBadges}
          onClose={() => setBadgeOpen(false)}
        />
      )}
    </AppLayout>
  );
}
