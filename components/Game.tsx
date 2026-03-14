'use client';

import { useCallback, useRef, useState } from 'react';
import { Difficulty } from '@/lib/types';
import { DIFFICULTY_CONFIG } from '@/lib/constants';

import { useGame } from '@/hooks/useGame';
import { useHighScore } from '@/hooks/useHighScore';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useSound } from '@/hooks/useSound';

import HUD from './HUD';
import StartScreen from './StartScreen';
import GameOver from './GameOver';
import TreeSection from './TreeSection';
import MobileControls from './MobileControls';

export default function Game() {
  const { highScore, setHighScore, resetHighScore } = useHighScore();
  const { soundEnabled, toggleSound, playSound } = useSound();
  const [prevHighScore, setPrevHighScore] = useState(0);

  const { state, startGame, chop } = useGame({
    highScore,
    setHighScore,
    onChop: useCallback(() => playSound('chop'), [playSound]),
    onDeath: useCallback(() => playSound('death'), [playSound]),
    onGameStart: useCallback(() => playSound('start'), [playSound]),
  });

  // Track whether this game over is a new best
  const handleStart = useCallback(
    (difficulty: Difficulty) => {
      setPrevHighScore(highScore);
      startGame(difficulty);
    },
    [startGame, highScore]
  );

  const handleRestart = useCallback(() => {
    setPrevHighScore(highScore);
    startGame(state.difficulty);
  }, [startGame, state.difficulty, highScore]);

  const handleMenu = useCallback(() => {
    startGame('MEDIUM'); // reset to idle-like state (will be overridden)
    // We need to go to IDLE without actually starting. Work-around: use a tiny state flag.
    // Actually, we'll manage this with a local showMenu flag.
  }, [startGame]);

  // Simpler: track "show menu" in local state
  const [showMenu, setShowMenu] = useState(true);

  const doStart = useCallback(
    (difficulty: Difficulty) => {
      setShowMenu(false);
      handleStart(difficulty);
    },
    [handleStart]
  );

  const doMenu = useCallback(() => {
    setShowMenu(true);
  }, []);

  const doRestart = useCallback(() => {
    setShowMenu(false);
    handleRestart();
  }, [handleRestart]);

  // Keyboard input
  useKeyboard(chop, state.status === 'PLAYING');

  const isGameOver = state.status === 'GAME_OVER';
  const isPlaying = state.status === 'PLAYING';
  const isNewBest = state.score > prevHighScore && state.score > 0;

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-forest relative overflow-hidden">
      {/* Decorative background trees */}
      <BackgroundTrees />

      {/* Game card */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-4 pt-6 pb-4 gap-4">

        {/* HUD (always visible) */}
        <HUD
          score={state.score}
          highScore={highScore}
          timer={state.timer}
          isPlaying={isPlaying}
          onToggleSound={toggleSound}
          soundEnabled={soundEnabled}
        />

        {/* Game area */}
        <div className="relative w-full flex flex-col items-center">

          {/* Tree section */}
          {!showMenu && (
            <TreeSection
              segments={state.segments}
              playerSide={state.playerSide}
              chopAnimation={state.chopAnimation}
              isDeathAnimating={state.isDeathAnimating}
              gameStatus={state.status}
            />
          )}

          {/* Start menu overlay */}
          {showMenu && (
            <div className="w-full">
              <StartScreen
                onStart={doStart}
                highScore={highScore}
                onResetHighScore={resetHighScore}
              />
            </div>
          )}

          {/* Game Over overlay */}
          {isGameOver && !showMenu && (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-3xl"
                style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
              />
              <div className="relative z-10 w-full px-4">
                <GameOver
                  score={state.score}
                  highScore={highScore}
                  difficulty={state.difficulty}
                  isNewBest={isNewBest}
                  onRestart={doRestart}
                  onMenu={doMenu}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile chop controls */}
        {!showMenu && (
          <MobileControls onChop={chop} disabled={!isPlaying} />
        )}

        {/* Pause button during play */}
        {isPlaying && (
          <p className="text-white/30 text-xs text-center">
            ← A / D → to chop · Avoid branches!
          </p>
        )}
      </div>
    </div>
  );
}

/** Purely decorative background silhouette trees */
function BackgroundTrees() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Left trees */}
      <div className="absolute bottom-0 left-0 flex items-end gap-2 opacity-15">
        {[80, 110, 70, 95, 120, 65].map((h, i) => (
          <div key={i} className="flex flex-col items-center">
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${Math.floor(h * 0.4)}px solid transparent`,
                borderRight: `${Math.floor(h * 0.4)}px solid transparent`,
                borderBottom: `${h}px solid #22c55e`,
              }}
            />
            <div style={{ width: 10, height: 20, background: '#7c4a1e' }} />
          </div>
        ))}
      </div>

      {/* Right trees */}
      <div className="absolute bottom-0 right-0 flex items-end gap-2 opacity-15">
        {[90, 70, 115, 80, 105, 60].map((h, i) => (
          <div key={i} className="flex flex-col items-center">
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${Math.floor(h * 0.4)}px solid transparent`,
                borderRight: `${Math.floor(h * 0.4)}px solid transparent`,
                borderBottom: `${h}px solid #16a34a`,
              }}
            />
            <div style={{ width: 10, height: 20, background: '#7c4a1e' }} />
          </div>
        ))}
      </div>

      {/* Stars / particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            width: Math.random() > 0.7 ? 3 : 2,
            height: Math.random() > 0.7 ? 3 : 2,
            top: `${Math.random() * 60}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.3}s`,
            opacity: 0.4,
          }}
        />
      ))}
    </div>
  );
}
