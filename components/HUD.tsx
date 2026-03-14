'use client';

import { useEffect, useRef, useState } from 'react';
import { MAX_TIMER } from '@/lib/constants';
import { getTimerColor, formatScore } from '@/lib/utils';

interface Props {
  score: number;
  highScore: number;
  timer: number;
  isPlaying: boolean;
  onToggleSound: () => void;
  soundEnabled: boolean;
}

/** Score display + timer bar shown during gameplay */
export default function HUD({
  score,
  highScore,
  timer,
  isPlaying,
  onToggleSound,
  soundEnabled,
}: Props) {
  const fraction = Math.min(timer / MAX_TIMER, 1);
  const color = getTimerColor(fraction);

  // Animate score changes with a brief pop
  const [pop, setPop] = useState(false);
  const prevScore = useRef(score);
  useEffect(() => {
    if (score !== prevScore.current) {
      prevScore.current = score;
      setPop(true);
      const t = setTimeout(() => setPop(false), 200);
      return () => clearTimeout(t);
    }
  }, [score]);

  // Pulse timer bar when urgent
  const urgent = fraction < 0.25;

  return (
    <div className="w-full flex flex-col gap-2 px-1">
      {/* Top row: sound | score | high score */}
      <div className="flex items-center justify-between">
        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-lg transition-all duration-150 select-none"
          title={soundEnabled ? 'Mute' : 'Unmute'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>

        {/* Current score */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-white/50 uppercase tracking-widest font-semibold">Score</span>
          <span
            className={`
              text-3xl font-black text-white tabular-nums
              transition-transform duration-100
              ${pop ? 'scale-125' : 'scale-100'}
            `}
            style={{ textShadow: '0 0 20px rgba(251,191,36,0.8)' }}
          >
            {formatScore(score)}
          </span>
        </div>

        {/* High score */}
        <div className="flex flex-col items-end">
          <span className="text-xs text-white/50 uppercase tracking-widest font-semibold">Best</span>
          <span className="text-xl font-bold text-amber-400 tabular-nums">
            {formatScore(highScore)}
          </span>
        </div>
      </div>

      {/* Timer bar */}
      {isPlaying && (
        <div className="w-full h-4 rounded-full bg-white/10 border border-white/20 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-100 ${urgent ? 'animate-pulse' : ''}`}
            style={{
              width: `${fraction * 100}%`,
              backgroundColor: color,
              boxShadow: `0 0 12px ${color}`,
            }}
          />
        </div>
      )}
    </div>
  );
}
