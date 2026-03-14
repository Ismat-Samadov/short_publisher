'use client';

import { useState, useCallback, useEffect } from 'react';

const HIGH_SCORE_KEY = 'timberman_highscore';

export function useHighScore() {
  const [highScore, setHighScoreState] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HIGH_SCORE_KEY);
      if (stored) setHighScoreState(parseInt(stored, 10));
    } catch {
      // localStorage not available (SSR / private browsing)
    }
  }, []);

  const setHighScore = useCallback((score: number) => {
    setHighScoreState(prev => {
      if (score > prev) {
        try {
          localStorage.setItem(HIGH_SCORE_KEY, score.toString());
        } catch {
          // ignore
        }
        return score;
      }
      return prev;
    });
  }, []);

  const resetHighScore = useCallback(() => {
    try {
      localStorage.removeItem(HIGH_SCORE_KEY);
    } catch {
      // ignore
    }
    setHighScoreState(0);
  }, []);

  return { highScore, setHighScore, resetHighScore };
}
