'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Side, GameStatus, Difficulty, GameState } from '@/lib/types';
import {
  NUM_SEGMENTS,
  DIFFICULTY_CONFIG,
  MAX_TIMER,
  GAME_TICK_MS,
} from '@/lib/constants';
import {
  generateSegment,
  generateInitialSegments,
  resetIdCounter,
} from '@/lib/utils';

interface UseGameCallbacks {
  highScore: number;
  setHighScore: (score: number) => void;
  onChop?: () => void;
  onDeath?: () => void;
  onGameStart?: () => void;
}

export function useGame({
  highScore,
  setHighScore,
  onChop,
  onDeath,
  onGameStart,
}: UseGameCallbacks) {
  const [state, setState] = useState<GameState>({
    status: 'IDLE',
    segments: [],
    playerSide: 'LEFT',
    score: 0,
    timer: 5,
    difficulty: 'MEDIUM',
    chopAnimation: null,
    isDeathAnimating: false,
    combo: 0,
  });

  // Keep a ref for reading inside setInterval without stale closure
  const stateRef = useRef(state);
  stateRef.current = state;

  const lastTickRef = useRef<number>(0);

  // ─── Start / Restart ────────────────────────────────────────────────────────
  const startGame = useCallback(
    (difficulty: Difficulty) => {
      resetIdCounter();
      const config = DIFFICULTY_CONFIG[difficulty];
      const segments = generateInitialSegments(config, NUM_SEGMENTS);

      setState({
        status: 'PLAYING',
        segments,
        playerSide: 'LEFT',
        score: 0,
        timer: config.startTime,
        difficulty,
        chopAnimation: null,
        isDeathAnimating: false,
        combo: 0,
      });

      onGameStart?.();
    },
    [onGameStart]
  );

  // ─── Chop ───────────────────────────────────────────────────────────────────
  const chop = useCallback(
    (side: Side) => {
      const current = stateRef.current;
      if (current.status !== 'PLAYING') return;

      const config = DIFFICULTY_CONFIG[current.difficulty];
      const newSegments = [...current.segments];

      // Remove the bottom segment (it's been chopped away)
      newSegments.shift();

      // The former segment[1] is now the new bottom – check collision
      const newBottom = newSegments[0];
      const isDead = newBottom.branch === side;

      if (isDead) {
        // Player walked into a branch
        onDeath?.();

        const finalScore = current.score + 1;
        if (finalScore > highScore) setHighScore(finalScore);

        setState(prev => ({
          ...prev,
          status: 'GAME_OVER',
          playerSide: side,
          score: finalScore,
          chopAnimation: { side, timestamp: Date.now() },
          isDeathAnimating: true,
        }));

        setTimeout(
          () => setState(prev => ({ ...prev, isDeathAnimating: false })),
          900
        );
        return;
      }

      // Alive — add a new segment at the top
      const topSegment = newSegments[newSegments.length - 1];
      newSegments.push(
        generateSegment(config.branchDensity, topSegment.branch)
      );

      const newTimer = Math.min(current.timer + config.timePerChop, MAX_TIMER);
      const newScore = current.score + 1;

      onChop?.();

      if (newScore > highScore) setHighScore(newScore);

      setState(prev => ({
        ...prev,
        segments: newSegments,
        playerSide: side,
        score: newScore,
        timer: newTimer,
        chopAnimation: { side, timestamp: Date.now() },
        combo: prev.combo + 1,
      }));
    },
    [highScore, setHighScore, onChop, onDeath]
  );

  // ─── Select difficulty before game start ───────────────────────────────────
  const setDifficulty = useCallback((difficulty: Difficulty) => {
    setState(prev => ({ ...prev, difficulty }));
  }, []);

  // ─── Timer tick ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.status !== 'PLAYING') return;

    lastTickRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setState(prev => {
        if (prev.status !== 'PLAYING') return prev;

        const decay = DIFFICULTY_CONFIG[prev.difficulty].timeDecayRate;
        const newTimer = prev.timer - delta * decay;

        if (newTimer <= 0) {
          // Time's up
          onDeath?.();
          if (prev.score > highScore) setHighScore(prev.score);
          return {
            ...prev,
            timer: 0,
            status: 'GAME_OVER',
            isDeathAnimating: true,
          };
        }

        return { ...prev, timer: newTimer };
      });
    }, GAME_TICK_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  // ─── Expose pause / resume (optional future feature) ─────────────────────
  const pauseGame = useCallback(() => {
    setState(prev =>
      prev.status === 'PLAYING' ? { ...prev, status: 'IDLE' } : prev
    );
  }, []);

  const resumeGame = useCallback(() => {
    setState(prev =>
      prev.status === 'IDLE' && prev.score > 0
        ? { ...prev, status: 'PLAYING' }
        : prev
    );
  }, []);

  return { state, startGame, chop, setDifficulty, pauseGame, resumeGame };
}
