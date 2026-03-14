'use client';

import { useState } from 'react';
import { Difficulty } from '@/lib/types';
import { DIFFICULTY_CONFIG } from '@/lib/constants';

interface Props {
  onStart: (difficulty: Difficulty) => void;
  highScore: number;
  onResetHighScore: () => void;
}

/** Initial game menu with difficulty selection */
export default function StartScreen({ onStart, highScore, onResetHighScore }: Props) {
  const [selected, setSelected] = useState<Difficulty>('MEDIUM');

  const difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      {/* Logo / title */}
      <div className="text-center">
        <div className="text-7xl mb-2" style={{ filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.6))' }}>
          🪓
        </div>
        <h1
          className="text-5xl font-black tracking-tight text-white"
          style={{ textShadow: '0 0 30px rgba(251,191,36,0.7), 0 2px 0 rgba(0,0,0,0.5)' }}
        >
          TIMBERMAN
        </h1>
        <p className="text-white/60 text-sm mt-1 font-medium tracking-wider uppercase">
          Chop fast · Dodge branches
        </p>
      </div>

      {/* Controls legend */}
      <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-center w-full">
        <p className="text-white/70 text-sm font-semibold mb-2">Controls</p>
        <div className="flex justify-center gap-6 text-sm text-white/60">
          <span>⬅️ <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">A</kbd> / <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">←</kbd> Chop Left</span>
          <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">D</kbd> / <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">→</kbd> Chop Right ➡️</span>
        </div>
        <p className="text-white/40 text-xs mt-2">Tap left / right half on mobile</p>
      </div>

      {/* Difficulty selection */}
      <div className="w-full">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2 text-center">
          Difficulty
        </p>
        <div className="flex gap-2 w-full">
          {difficulties.map(d => (
            <button
              key={d}
              onClick={() => setSelected(d)}
              className={`
                flex-1 py-3 rounded-2xl text-sm font-bold transition-all duration-200 border
                ${selected === d
                  ? 'bg-amber-400 text-gray-900 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.5)]'
                  : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                }
              `}
            >
              {DIFFICULTY_CONFIG[d].label}
            </button>
          ))}
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={() => onStart(selected)}
        className="
          w-full py-5 rounded-2xl text-xl font-black text-gray-900
          bg-gradient-to-b from-amber-300 to-amber-500
          hover:from-amber-200 hover:to-amber-400
          active:scale-95 active:shadow-none
          shadow-[0_0_30px_rgba(251,191,36,0.6),0_4px_0_#92400e]
          transition-all duration-150 border border-amber-200
          uppercase tracking-wider
        "
      >
        🌲 Start Chopping!
      </button>

      {/* High score */}
      {highScore > 0 && (
        <div className="flex items-center gap-3">
          <p className="text-white/50 text-sm">
            🏆 Best: <span className="text-amber-400 font-bold">{highScore}</span>
          </p>
          <button
            onClick={onResetHighScore}
            className="text-white/30 text-xs hover:text-white/60 transition-colors"
          >
            reset
          </button>
        </div>
      )}
    </div>
  );
}
