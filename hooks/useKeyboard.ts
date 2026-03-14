'use client';

import { useEffect, useCallback } from 'react';
import { Side } from '@/lib/types';

/**
 * Listens for keyboard input and fires onChop with the chosen side.
 * Left / A → LEFT chop   Right / D → RIGHT chop
 * Space / Enter → also accepted to start a game (handled separately)
 */
export function useKeyboard(
  onChop: (side: Side) => void,
  enabled: boolean
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        onChop('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        onChop('RIGHT');
      }
    },
    [onChop, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
