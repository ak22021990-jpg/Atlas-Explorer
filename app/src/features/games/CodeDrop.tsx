import { useEffect, useRef, useState } from 'react';
import type { GameProps, StateEntry } from '@/types';
import InfoCard from '@/components/ui/InfoCard';
import { useParticles } from '@/components/ui/ParticleSystem';
import { useAudio } from '@/hooks/useAudio';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { useData } from '@/hooks/useData';
import { useSession } from '@/hooks/useSession';
import { computeMistakeWeights } from '@/lib/scoring';
import { publicAsset } from '@/lib/assets';
import { useScorePopups } from '@/components/ui/ScorePopup';
import {
  pickQuestions,
  checkCodeAnswer,
  checkTimezoneAnswer,
  calculatePoints,
  type DropQuestion,
  TOTAL_QUESTIONS,
  FALL_DURATION_MS,
  SPEED_WINDOW,
  START_TOP,
} from '@/lib/crack-the-code';

import Typewriter from '@/components/ui/Typewriter';
import RollingNumber from '@/components/ui/RollingNumber';
import { gameEvents } from '@/hooks/useGameEvents';

// ─── Component ────────────────────────────────────────────────────────────────

export default function CodeDrop({ onComplete, onStreakChange, isRetry }: GameProps) {
  const { playSound } = useAudio();
  const { triggerBurst } = useParticles();
  const { triggerScore, ScorePopups } = useScorePopups();
  
  // ── Data ──────────────────────────────────────────────────────────────────
  const { states } = useData();
  const { session } = useSession();
  const [questions, setQuestions] = useState<DropQuestion[]>([]);
  const [loading,   setLoading]   = useState(true);

  // ── Game state ────────────────────────────────────────────────────────────
  const [qi,           setQi]           = useState(0);
  const [score,        setScore]        = useState(0);
  const [streak,       setStreak]       = useState(0);
  const [inputVal,     setInputVal]     = useState('');
  const [locked,       setLocked]       = useState(false);
  const [blockTopPx,   setBlockTopPx]   = useState(-60);
  const [blockVisible, setBlockVisible] = useState(false);
  const [blockLocked,  setBlockLocked]  = useState(false);
  const [wrongFlash,   setWrongFlash]   = useState(false);

  const [correctState, setCorrectState] = useState<StateEntry | null>(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const startedAtRef           = useRef(0);
  const zoneRef                = useRef<HTMLDivElement>(null);
  const inputRef               = useRef<HTMLInputElement>(null);
  const cancelCurrentRef       = useRef<() => void>(() => {});
  const scoreRef               = useRef(0);
  const correctCountRef        = useRef(0);
  const streakRef              = useRef(0);
  const streakPeakRef          = useRef(0);
  const mistakesRef            = useRef<Set<string>>(new Set());
  const correctsRef            = useRef<Set<string>>(new Set());
  const timerRef               = useRef<ReturnType<typeof setTimeout>>(undefined);
  const advanceTimerRef        = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef           = useRef<HTMLDivElement>(null);
  const inputValRef            = useRef('');

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (states.length === 0) return;
    const weights = isRetry ? computeMistakeWeights(session, 0) : undefined;
    setQuestions(pickQuestions(states, weights));
    setLoading(false);
  }, [states, isRetry, session]);

  // ── Start each question ───────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !questions.length || qi >= TOTAL_QUESTIONS) return;

    setInputVal('');
    inputValRef.current = '';
    setLocked(false);
    setBlockLocked(false);
    setBlockVisible(true);
    setBlockTopPx(START_TOP);
    setCorrectState(null);
    startedAtRef.current = Date.now();

    const zoneHeight = zoneRef.current?.clientHeight ?? 520;
    const endTop     = Math.max(START_TOP + 50, zoneHeight - 48);

    let rafId:  number;
    let timer1: ReturnType<typeof setTimeout>;
    let done = false;
    let warningPlayed = false;

    function cancel() {
      done = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timer1);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    cancelCurrentRef.current = cancel;

    function animate() {
      if (done) return;
      const elapsed   = Date.now() - startedAtRef.current;
      const progress  = Math.min(1, elapsed / FALL_DURATION_MS);
      setBlockTopPx(START_TOP + (endTop - START_TOP) * progress);

      if (progress > 0.7 && !warningPlayed) {
        warningPlayed = true;
        playSound('timer-warning');
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    }
    rafId = requestAnimationFrame(animate);

    // Miss timer
    timer1 = setTimeout(() => {
      if (done) return;
      done = true;
      cancelAnimationFrame(rafId);
      playSound('wrong');
      const q = questions[qi];
      if (q) {
        mistakesRef.current.add(q.state.code);
        gameEvents.emit('answerWrong', {
          gameIndex: 0,
          code: q.state.code,
          streak: 0,
        });
      }
      gameEvents.emit('scoreUpdate', {
        gameIndex: 0,
        score: scoreRef.current,
        streak: 0,
      });
      streakRef.current = 0;
      setStreak(0);
      setBlockVisible(false);
      setLocked(true);
      timerRef.current = setTimeout(() => {
        const next = qi + 1;
        if (next >= TOTAL_QUESTIONS) {
          onComplete({
            score:        scoreRef.current,
            correctCount: correctCountRef.current,
            totalCount:   TOTAL_QUESTIONS,
            streakPeak:   streakPeakRef.current,
            mistakes:     Array.from(mistakesRef.current),
            corrects:     Array.from(correctsRef.current).filter(c => !mistakesRef.current.has(c)),
          });
        } else {
          setQi(next);
        }
      }, 1000);
    }, FALL_DURATION_MS);

    return cancel;
  }, [qi, loading, questions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fix 6: Enter Key to Dismiss Info Card
  useEffect(() => {
    if (!correctState) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        setCorrectState(null);
        advanceQuestion();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [correctState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus input each question
  useEffect(() => {
    if (!locked && !loading) inputRef.current?.focus();
  }, [qi, locked, loading]);

  function advanceQuestion() {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    const next = qi + 1;
    if (next >= TOTAL_QUESTIONS) {
      onComplete({ 
        score: scoreRef.current, 
        correctCount: correctCountRef.current, 
        totalCount: TOTAL_QUESTIONS, 
        streakPeak: streakPeakRef.current,
        mistakes:     Array.from(mistakesRef.current),
        corrects:     Array.from(correctsRef.current).filter(c => !mistakesRef.current.has(c)),
      });
    } else {
      setQi(next);
    }
  }

  // ── Answer handlers ───────────────────────────────────────────────────────

  function commitCorrect(element?: HTMLElement) {
    cancelCurrentRef.current();
    playSound('correct');
    const q = questions[qi];
    if (q) correctsRef.current.add(q.state.code);
    triggerBurst(element || null, 'gold-spark');
    
    const elapsed    = (Date.now() - startedAtRef.current) / 1000;
    const pts        = calculatePoints(true, elapsed, SPEED_WINDOW);
    const newScore   = scoreRef.current + pts;
    const newCorrect = correctCountRef.current + 1;
    const newStreak  = streakRef.current + 1;
    const newPeak    = Math.max(streakPeakRef.current, newStreak);

    scoreRef.current        = newScore;
    correctCountRef.current = newCorrect;
    streakRef.current       = newStreak;
    streakPeakRef.current   = newPeak;

    gameEvents.emit('answerCorrect', {
      gameIndex: 0,
      points: pts,
      streak: newStreak,
      code: q.state.code,
    });
    gameEvents.emit('scoreUpdate', {
      gameIndex: 0,
      score: newScore,
      streak: newStreak,
    });
    onStreakChange?.(newStreak);

    if (newStreak >= 3) playSound('streak');

    // Trigger score popup
    if (element) {
      const rect = element.getBoundingClientRect();
      triggerScore(rect.left + rect.width / 2, rect.top, pts);
    } else {
      triggerScore(window.innerWidth / 2, window.innerHeight / 2, pts);
    }

    setScore(newScore);
    setStreak(newStreak);
    setBlockLocked(true);
    setLocked(true);

    setCorrectState(questions[qi].state);

    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(advanceQuestion, 15000);
  }

  function handleCodeSubmit(explicitVal?: string) {
    if (locked || !questions.length) return;
    const q = questions[qi];
    if (q.type !== 'code') return;

    const valToMatch = explicitVal ?? inputValRef.current;

    if (checkCodeAnswer(q.state.code, valToMatch)) {
      commitCorrect(inputRef.current || undefined);
    } else {
      gameEvents.emit('answerWrong', {
        gameIndex: 0,
        code: q.state.code,
        streak: 0,
      });
      gameEvents.emit('scoreUpdate', {
        gameIndex: 0,
        score: scoreRef.current,
        streak: 0,
      });
      playSound('wrong');
      mistakesRef.current.add(q.state.code);
      setInputVal('');
      inputValRef.current = '';
      streakRef.current = 0;
      onStreakChange?.(0);
      setWrongFlash(true);
      setTimeout(() => {
        setWrongFlash(false);
      }, 1000);
    }
  }

  function handleTimezoneChoice(choice: string) {
    if (locked || !questions.length) return;
    const q = questions[qi];
    if (q.type !== 'timezone') return;
    setLocked(true);
    playSound('click');

    if (checkTimezoneAnswer(q.state.timezone, choice as Parameters<typeof checkTimezoneAnswer>[0])) {
      commitCorrect();
    } else {
      playSound('wrong');
      mistakesRef.current.add(q.state.code);
      setWrongFlash(true);
      setTimeout(() => {
        setWrongFlash(false);
        advanceQuestion();
      }, 1500);
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const currentQ   = questions[qi];
  const progress   = questions.length ? Math.round((qi / TOTAL_QUESTIONS) * 100) : 0;
  const timerPct   = 100 - ((Date.now() - startedAtRef.current) / FALL_DURATION_MS) * 100;
  const timerUrgent = timerPct < 30 && blockVisible && !blockLocked;

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-[#080c11] text-white">
        <div className="w-12 h-12 rounded-full border-2 border-[#FF9900] border-t-transparent animate-spin mb-4" />
        <p className="text-[#FF9900] text-xs uppercase tracking-[0.2em] font-bold">Cracking Ciphers</p>
      </main>
    );
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <main ref={containerRef} className="flex-1 flex flex-col bg-[#001f3f] p-5 gap-4 overflow-hidden relative">
      
      {/* Thematic Background: Ocean Descent (Performance Optimized) */}
      <div 
        className="absolute inset-0 w-full h-full object-cover opacity-[0.15] pointer-events-none z-0 animate-ambient-float"
        style={{ 
          backgroundImage: `url(${publicAsset('/assets/generated/poster-water.png')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Terrain Pattern Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.08]" 
        style={{ backgroundImage: `url("${publicAsset('/assets/patterns/topo-pattern.png')}")`, backgroundSize: '400px' }} 
      />

      {/* Timer Urgency Vignette */}
      <div className={`timer-urgency ${timerUrgent ? 'active' : ''}`} />

      {/* Score Popups */}
      <ScorePopups />

      {/* Top bar */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/20 border border-[#06B6D4]/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <span className="font-black text-[#06B6D4] text-xl">AE</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-black text-lg tracking-tight">Code Drop</span>
            <span className="text-[#06B6D4] text-[9px] uppercase tracking-widest font-black">
              Ocean Descent
            </span>
          </div>
        </div>
        
        <AnimatedCard tiltAmount={2} className="flex items-center gap-6 bg-white/[0.05] border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
          <div className="flex flex-col items-center">
            <span className="text-white/30 text-[8px] font-black tracking-widest mb-0.5">POINTS</span>
            <RollingNumber value={score} className="text-white font-mono text-xl leading-none" />
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-white/30 text-[8px] font-black tracking-widest mb-0.5">STREAK</span>
            <div className={`relative ${streak >= 3 ? 'animate-bounce' : ''}`}>
              <strong className={`font-mono text-xl leading-none transition-colors duration-300 ${streak >= 3 ? 'text-[#8B5CF6] drop-shadow-[0_0_10px_rgba(139,92,246,0.8)] animate-glow-pulse' : 'text-[#06B6D4]'}`}>
                {streak}x
              </strong>
              {streak >= 5 && (
                <img 
                  src={publicAsset('/assets/stickers/fire.gif')} 
                  className="absolute -top-4 -right-4 w-6 h-6 pointer-events-none animate-glow-pulse" 
                  alt="" 
                />
              )}
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Progress Header */}
      <div className="relative z-10 px-2 space-y-1.5">
        <div className="flex justify-between items-end text-[10px] font-black tracking-wider uppercase">
          <span className="text-[#06B6D4]">Depth: {qi + 1} <span className="text-white/20">/</span> {TOTAL_QUESTIONS}</span>
          <span className="text-white/30">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/10 mission-progress-bar">
          <div
            className="h-full bg-gradient-to-r from-[#06B6D4] to-[#22C55E] transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] relative"
            style={{ width: `${progress}%` }}
          >
          </div>
        </div>
      </div>

      {/* Falling zone */}
      <div
        ref={zoneRef}
        className="relative flex-1 rounded-3xl overflow-hidden border border-white/5 bg-black/40 backdrop-blur-sm shadow-2xl mt-2"
        style={{ minHeight: 300 }}
      >
        {/* Falling block */}
        {blockVisible && currentQ && (
          <div
            className={[
              'absolute left-1/2 -translate-x-1/2 transition-none px-10 py-6 rounded-3xl border shadow-[0_0_30px_rgba(6,182,212,0.2)] backdrop-blur-xl',
              blockLocked
                ? 'bg-[#22C55E]/20 border-[#22C55E]/40 text-[#22C55E] scale-110 rotate-0'
                : 'bg-white/[0.08] border-[#06B6D4]/30 text-white animate-in slide-in-from-top-12 duration-500',
            ].join(' ')}
            style={{ 
              top: blockTopPx,
              transform: `translateX(-50%) rotate(${(qi % 2 === 0 ? 1 : -1) * (blockLocked ? 0 : 2)}deg)`
            }}
          >
            <span className="block text-[#06B6D4] text-[10px] uppercase tracking-wider font-bold mb-2 text-center">Cipher Signal</span>
            <span className="block font-black text-3xl tracking-tight text-center">
              {blockLocked ? (
                <Typewriter text="Secured" delay={0.05} />
              ) : (
                <Typewriter key={currentQ.state.name} text={currentQ.state.name} delay={0.05} />
              )}
            </span>
            {!blockLocked && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse" />
                <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold">
                  {currentQ.type === 'code' ? 'Input ID' : 'Select Zone'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Floating Bubbles (Decorative) */}
        <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="absolute bottom-0 rounded-full border border-white/40 bg-white/10 shadow-[0_0_12px_rgba(255,255,255,0.3)] animate-bubble-rise" 
              style={{ 
                left: `${(i * 11) % 94 + 3}%`,
                width: `${(i % 3 + 1) * 6 + 4}px`,
                height: `${(i % 3 + 1) * 6 + 4}px`,
                animationDelay: `${i * 0.6}s`, 
                animationDuration: `${7 + (i % 6)}s`,
                opacity: 0
              }}
            />
          ))}
        </div>
      </div>

      {/* Interaction Panel */}
      <AnimatedCard tiltAmount={1} className="relative z-10 p-6 rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-2xl">
        {currentQ?.type === 'code' ? (
          <form
            onSubmit={(e) => { e.preventDefault(); handleCodeSubmit(); }}
            className="flex flex-col gap-4"
          >
            <div className="relative">
              <input
                id="code-input"
                ref={inputRef}
                type="text"
                maxLength={2}
                autoComplete="off"
                placeholder="--"
                disabled={locked}
                value={inputVal}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setInputVal(val);
                  inputValRef.current = val;
                  if (val.length === 2) {
                    setTimeout(() => handleCodeSubmit(val), 50);
                  }
                }}
                className={[
                  'w-full rounded-2xl border-2 px-6 py-5 text-center text-4xl font-mono font-black uppercase tracking-[0.5em]',
                  'bg-[#1E3A5F]/80 text-white placeholder:text-white/60 transition-all duration-300 shadow-inner',
                  wrongFlash
                    ? 'border-[#EF4444] bg-[#EF4444]/20 text-[#EF4444]'
                    : 'border-white/30 focus:border-[#06B6D4]/50 focus:shadow-[0_0_25px_rgba(6,182,212,0.2)]',
                  locked && 'opacity-40 cursor-not-allowed',
                ].join(' ')}
              />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] font-black text-white/20 uppercase tracking-widest">Code Cipher</div>
            </div>
            
            <button
              type="submit"
              disabled={locked || inputVal.length < 2}
              className={[
                'w-full rounded-2xl border-2 px-6 py-4 font-black text-lg uppercase tracking-widest transition-all duration-300',
                locked || inputVal.length < 2
                  ? 'border-white/10 bg-white/5 text-white/30 cursor-not-allowed'
                  : 'border-[#06B6D4]/50 bg-[#06B6D4]/20 text-[#06B6D4] hover:bg-[#06B6D4]/30 hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]',
                locked && 'animate-transmitting'
              ].join(' ')}
            >
              {locked ? 'Transmitting...' : inputVal.length < 2 ? 'Type the code' : 'Commit Key'}
            </button>
          </form>
        ) : currentQ?.type === 'timezone' ? (
          <div className="space-y-3">
            <div className="text-[9px] font-black text-white/30 uppercase tracking-widest text-center">Sector Sync Protocol</div>

            {/* Timezone Map Legend */}
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 px-2 py-2 rounded-2xl bg-white/[0.03] border border-white/5 max-w-full overflow-x-auto">
              {[
                { tz: 'EST', color: '#A684C7' },
                { tz: 'CST', color: '#4FAA76' },
                { tz: 'MST', color: '#E8A86B' },
                { tz: 'PST', color: '#5B8DEF' },
                { tz: 'AKST', color: '#4B9CD3' },
                { tz: 'AST', color: '#8265A6' },
                { tz: 'NST', color: '#D977A6' },
                { tz: 'HST', color: '#4FA8B8' },
              ].map(({ tz, color }) => (
                <span key={tz} className="flex items-center gap-1.5 text-[9px] font-bold text-white/50 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                  {tz}
                </span>
              ))}
            </div>

            <div className={`grid grid-cols-2 gap-4 ${wrongFlash ? 'animate-shake' : ''}`}>
              {currentQ.choices.map((tz, i) => {
                const isCorrect = correctState && tz === currentQ.state.timezone;
                return (
                  <button
                    key={tz}
                    disabled={locked}
                    onClick={() => handleTimezoneChoice(tz)}
                    className={[
                      'rounded-2xl border-2 px-6 py-4 font-black text-sm tracking-wider transition-all duration-300 relative overflow-hidden group',
                      isCorrect 
                        ? 'bg-[#10B981]/20 border-[#10B981] text-white animate-green-sweep' 
                        : 'bg-white/[0.05] border-white/10 text-white hover:border-[#06B6D4]/50 hover:bg-[#06B6D4]/10',
                      locked && !isCorrect ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.03] active:scale-95 animate-stagger-in hover:translate-x-2 selection-glow',
                    ].join(' ')}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10">{tz}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </AnimatedCard>



      {/* Info Card Overlay */}
      {correctState && (
        <div 
          className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-cyan-900/60 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => { setCorrectState(null); advanceQuestion(); }}
        >
          <InfoCard state={correctState} theme="water" accentColor="#06B6D4" />
          <button className="mt-6 font-bold text-white/70 tracking-widest text-[10px] border border-white/20 px-4 py-2 rounded-full hover:bg-white/10 hover:text-white transition-all animate-pulse">
            Tap anywhere to continue
          </button>
        </div>
      )}

      {/* Water Watercolor Accent */}
      <div 
        className="watercolor-splash left-[-30px] bottom-[-30px]" 
        style={{ backgroundImage: `url("${publicAsset('/assets/illustrations/splash-water.png')}")` }} 
      />

      {/* Decoration */}
      <img src={publicAsset('/assets/illustrations/anchor.svg')} className="absolute bottom-6 right-6 w-12 h-12 opacity-10 pointer-events-none grayscale" alt="" />
    </main>
  );
}
