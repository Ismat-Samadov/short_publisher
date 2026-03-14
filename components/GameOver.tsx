'use client';

import { useEffect, useState } from 'react';
import { Difficulty } from '@/lib/types';
import { formatScore } from '@/lib/utils';

interface Props {
  score: number;
  highScore: number;
  difficulty: Difficulty;
  isNewBest: boolean;
  onRestart: () => void;
  onMenu: () => void;
}

/** Animated game-over overlay */
export default function GameOver({
  score,
  highScore,
  difficulty,
  isNewBest,
  onRestart,
  onMenu,
}: Props) {
  const [visible, setVisible] = useState(false);

  // Fade in after a short death-animation delay
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`
        flex flex-col items-center gap-5 text-center
        transition-all duration-500
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {/* Death icon */}
      <div
        className="text-6xl"
        style={{ filter: 'drop-shadow(0 0 15px rgba(239,68,68,0.7))' }}
      >
        💀
      </div>

      <div>
        <h2 className="text-4xl font-black text-white mb-1" style={{ textShadow: '0 0 20px rgba(239,68,68,0.6)' }}>
          GAME OVER
        </h2>
        <p className="text-white/50 text-sm uppercase tracking-widest">A branch got you!</p>
      </div>

      {/* Score display */}
      <div className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex justify-around">
        <div>
          <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Score</p>
          <p className="text-4xl font-black text-white">{formatScore(score)}</p>
        </div>
        <div className="w-px bg-white/10" />
        <div>
          <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Best</p>
          <p className={`text-4xl font-black ${isNewBest ? 'text-amber-400' : 'text-white/70'}`}>
            {formatScore(highScore)}
          </p>
          {isNewBest && (
            <p className="text-xs text-amber-400 font-bold animate-bounce mt-1">NEW BEST! 🎉</p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="w-full flex flex-col gap-3">
        <button
          onClick={onRestart}
          className="
            w-full py-4 rounded-2xl text-lg font-black text-gray-900
            bg-gradient-to-b from-amber-300 to-amber-500
            hover:from-amber-200 hover:to-amber-400
            active:scale-95
            shadow-[0_0_25px_rgba(251,191,36,0.5),0_4px_0_#92400e]
            transition-all duration-150 border border-amber-200
            uppercase tracking-wider
          "
        >
          🪓 Play Again
        </button>

        <button
          onClick={onMenu}
          className="
            w-full py-3 rounded-2xl text-sm font-bold text-white/70
            bg-white/5 hover:bg-white/10 border border-white/10
            active:scale-95 transition-all duration-150
          "
        >
          ← Main Menu
        </button>
      </div>
    </div>
  );
}
