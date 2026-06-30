import type { GameState } from '@/types';
import { publicAsset } from '@/lib/assets';
import { GAME_DEFINITIONS } from '@/lib/session';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const GAME_ICONS: Record<string, string> = { crack: '01', pin: '02', sorter: '03' };

const START_COPY: Record<string, string> = {
  crack: 'Begin descent',
  pin:   'Open the map',
  sorter:'Sort the zones',
};

const INTRO_COPY: Record<string, string> = {
  crack:  'Catch each falling location tag, type the right code, and keep your streak alive.',
  pin:    'Scan the map, hit the glowing target, and clear each drop before the timer burns out.',
  sorter: 'Drag each state or province into its correct timezone zone. Stack combos to max your score before the clock runs out.',
};

const RETRY_MESSAGES: Record<string, string> = {
  crack:  'The signal was unstable. Stabilize the connection and decode with precision.',
  pin:    'Target lock lost. Recalibrate your map and secure the region.',
  sorter: 'Temporal alignment failed. Re-sort the zones to maintain synchronization.',
};

const DISPLAY_LABELS: Record<string, string> = {
  crack:  'Code Drop',
  pin:    'Pin Rush',
  sorter: 'Tz Sorter',
};

const PIN_POSITIONS = [
  { top: '65%', left: '20%' },
  { top: '34%', left: '35%' },
  { top: '48%', left: '74%' },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface GameIntroProps {
  gameIndex: number;
  game: GameState;
  clearedCount: number;
  totalGames: number;
  onStart: (isRetry: boolean) => void;
}

export default function GameIntro({ gameIndex, game, clearedCount, totalGames, onStart }: GameIntroProps) {
  const definition = GAME_DEFINITIONS[gameIndex];
  const isRetry = game.retryAvailable;
  const label   = DISPLAY_LABELS[definition.key] ?? definition.key;
  const icon    = GAME_ICONS[definition.key]    ?? '??';
  const { isOffline } = useOnlineStatus();
  const startLabel = isRetry
    ? 'Run it back'
    : (START_COPY[definition.key] ?? 'Play level');

  const bestLabel =
    game.attempts.length === 0
      ? '—'
      : `${Math.round(Math.max(...game.attempts.map((a) => a.ratio)) * 100)}%`;

  const attemptNumber = game.attempts.length + 1;
  const retryMessage = RETRY_MESSAGES[definition.key] ?? 'System recalibration required. Run it back.';

  return (
    <main className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-atlas-warm font-display">
      
      {/* ── Map panel ─────────────────────────────────────────────────────── */}
      <div className="relative flex-1 bg-atlas-card flex items-center justify-center overflow-hidden min-h-48 lg:min-h-0 border-r border-atlas-border">
        
        {/* Background Journal Texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.04]" 
          style={{ backgroundImage: `url("${publicAsset('/assets/patterns/paper-grain.png')}")`, backgroundSize: '400px' }} 
        />
        
        {/* Terrain Pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.05]" 
          style={{ backgroundImage: `url("${publicAsset('/assets/patterns/dots-pattern.png')}")`, backgroundSize: '100px' }} 
        />

        {/* Map Container - Ensures pins and paths align with the object-contain map image */}
        <div className="relative w-full h-full max-w-xl p-12 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={publicAsset('/maps/north-america.svg')}
              alt=""
              className="w-full h-full object-contain opacity-30 drop-shadow-[0_0_40px_rgba(46,125,50,0.15)]"
            />
            
            {/* Absolute overlay precisely matching the visible map content */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative aspect-[1157/1914] max-w-full max-h-full w-full h-full">
                
                {/* Route dashed line */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <path
                    d="M20 65 C35 34, 52 28, 74 48"
                    fill="none"
                    stroke="var(--atlas-accent)"
                    strokeWidth="0.8"
                    strokeDasharray="4 3"
                    strokeLinecap="round"
                    className="opacity-40 animate-dash-move"
                  />
                </svg>

                {/* Numbered pins */}
                {PIN_POSITIONS.slice(0, totalGames).map((pos, index) => (
                  <div
                    key={index}
                    className={`absolute w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black border-2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ${
                      index === gameIndex
                        ? 'bg-atlas-gold border-atlas-gold text-atlas-ink scale-125 shadow-[0_0_30px_rgba(249,168,37,0.5)] rotate-0'
                        : index < gameIndex
                        ? 'bg-atlas-accent border-atlas-accent text-white rotate-12'
                        : 'bg-atlas-warm border-atlas-border text-atlas-muted'
                    }`}
                    style={{ top: pos.top, left: pos.left }}
                  >
                    {index < gameIndex ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Map Legend — kept inside map panel bounds */}
        <div className="absolute top-4 left-4 max-w-[calc(100%-2rem)] flex flex-col gap-2 sm:gap-3 z-20 font-display pointer-events-none">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-atlas-accent shadow-[0_0_10px_rgba(46,125,50,0.3)]" />
            <span className="text-atlas-muted text-xs uppercase font-black tracking-widest">Completed Region</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-atlas-gold shadow-[0_0_10px_rgba(249,168,37,0.3)]" />
            <span className="text-atlas-muted text-xs uppercase font-black tracking-widest">Active Signal</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-atlas-border" />
            <span className="text-atlas-muted text-xs uppercase font-black tracking-widest">Pending Guide</span>
          </div>
        </div>

        {/* Caption */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 text-center bg-atlas-card backdrop-blur-md px-6 py-2 rounded-full border shadow-2xl transition-colors duration-500 font-display ${
          isRetry ? 'border-atlas-error' : 'border-atlas-border'
        }`}>
          <div className="text-atlas-muted text-xs uppercase tracking-widest font-black mb-1">{isRetry ? 'Recalculating' : 'Next Target'}</div>
          <div className={`font-black text-sm uppercase tracking-tight ${isRetry ? 'text-atlas-error' : 'text-atlas-gold'}`}>
            {label}
          </div>
        </div>
      </div>

      {/* ── Expedition brief panel ────────────────────────────────────────── */}
      <div className={`w-full lg:w-[420px] flex flex-col justify-center p-12 gap-8 relative overflow-hidden transition-colors duration-700 font-display ${
        isRetry ? 'bg-atlas-error-light/20' : 'bg-atlas-card'
      }`}>
        
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'var(--geo-dot-pattern)', backgroundSize: '24px 24px' }} />

        {/* Kicker */}
        <div className="flex items-center justify-between relative z-10 font-display">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 text-white flex items-center justify-center rounded-lg shadow-lg font-mono text-xs font-black shrink-0 transition-colors duration-500 ${
              isRetry ? 'bg-atlas-error' : 'bg-atlas-gold'
            }`}>
              {icon}
            </div>
            <div className="flex flex-col">
              <span className="text-atlas-muted text-xs font-black uppercase tracking-widest">
                Region Identification
              </span>
              <span className="text-atlas-gold text-xs font-black">
                PHASE {gameIndex + 1} // 0{totalGames}
              </span>
            </div>
          </div>

          {isRetry && (
            <div className="bg-atlas-error text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md animate-pulse font-display">
              Retry Mode
            </div>
          )}
        </div>

        {/* Title + description */}
        <div className="relative z-10 font-display">
          <h1 className="text-4xl font-black text-atlas-ink leading-tight tracking-tighter font-display">
            {label}
            {isRetry && <span className="text-atlas-error ml-2 block text-2xl font-black uppercase tracking-tighter">Remix Protocol</span>}
          </h1>
          <p className="text-atlas-ink/80 mt-4 text-base leading-relaxed font-medium font-sans">
            {isRetry ? retryMessage : (INTRO_COPY[definition.key] ?? '')}
          </p>
          {isRetry && (
            <p className="text-atlas-error mt-2 text-sm font-bold uppercase tracking-wide font-sans">
              "Precision matters. Stabilize the signal and run it back."
            </p>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 relative z-10 font-display">
          {[
            { 
              label: isRetry ? 'Current Attempt' : 'Regions Completed',  
              value: isRetry ? `Attempt ${attemptNumber}` : `${clearedCount}/${totalGames}`, 
              accent: isRetry ? 'var(--atlas-error)' : 'var(--atlas-accent)' 
            },
            { label: 'Best Ratio',  value: bestLabel, accent: 'var(--atlas-gold)' },
          ].map(({ label: l, value, accent }) => (
            <div key={l} className={`bg-atlas-warm border border-atlas-border rounded-2xl p-5 shadow-md transition-colors duration-500 ${
              isRetry && l === 'Current Attempt' ? 'border-atlas-error bg-atlas-error/5' : 'border-atlas-border'
            }`}>
              <div className="text-atlas-muted text-xs font-black tracking-wider mb-2">{l}</div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                <strong className="text-atlas-ink font-mono text-xl leading-none">
                  {value}
                </strong>
              </div>
            </div>
          ))}
        </div>

        {/* Start button */}
        <div className="mt-4 relative z-10 font-display">
          <button
            onClick={() => onStart(isRetry)}
            className="w-full btn-chunky btn-chunky-orange py-5 text-xl font-display"
          >
            {startLabel}
          </button>
          {isOffline && (
            <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
              <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs font-medium text-amber-800">
                Connectivity required for leaderboard — scores will sync later
              </p>
            </div>
          )}
          <div className="mt-6 flex justify-center gap-3">
             {[...Array(totalGames)].map((_, i) => (
               <div 
                 key={i} 
                 className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                   i === gameIndex 
                     ? 'bg-atlas-gold ring-4 ring-atlas-gold/20 scale-125' 
                     : i < gameIndex 
                     ? 'bg-atlas-accent' 
                     : 'bg-atlas-border'
                 }`} 
               />
             ))}
          </div>
        </div>

        <p className="text-atlas-muted text-xs font-bold text-center tracking-widest relative z-10 font-display">
          Unlimited retries · Stars based on precision
        </p>
      </div>

      <style>{`
        @keyframes dash-move {
          to { stroke-dashoffset: -20; }
        }
        .animate-dash-move {
          stroke-dasharray: 4 3;
          animation: dash-move 5s linear infinite;
        }
      `}</style>
    </main>
  );
}
