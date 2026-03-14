'use client';

import { useState, useCallback, useRef } from 'react';

export type SoundType = 'chop' | 'death' | 'start' | 'urgent';

export function useSound() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const ctxRef = useRef<AudioContext | null>(null);

  /** Lazily create (or resume) the AudioContext */
  const getCtx = useCallback((): AudioContext | null => {
    try {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).webkitAudioContext)();
      }
      if (ctxRef.current.state === 'suspended') {
        ctxRef.current.resume();
      }
      return ctxRef.current;
    } catch {
      return null;
    }
  }, []);

  const playSound = useCallback(
    (type: SoundType) => {
      if (!soundEnabled) return;
      const ctx = getCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const t = ctx.currentTime;

      switch (type) {
        case 'chop':
          // Short woody thud
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, t);
          osc.frequency.exponentialRampToValueAtTime(60, t + 0.09);
          gain.gain.setValueAtTime(0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          osc.start(t);
          osc.stop(t + 0.1);
          break;

        case 'death':
          // Descending crash
          osc.type = 'square';
          osc.frequency.setValueAtTime(380, t);
          osc.frequency.exponentialRampToValueAtTime(40, t + 0.55);
          gain.gain.setValueAtTime(0.45, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
          osc.start(t);
          osc.stop(t + 0.6);
          break;

        case 'start':
          // Happy ascending ding
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, t);
          osc.frequency.setValueAtTime(550, t + 0.1);
          osc.frequency.setValueAtTime(660, t + 0.2);
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          osc.start(t);
          osc.stop(t + 0.4);
          break;

        case 'urgent':
          // Alarm tick for low timer
          osc.type = 'sine';
          osc.frequency.setValueAtTime(900, t);
          gain.gain.setValueAtTime(0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
          osc.start(t);
          osc.stop(t + 0.06);
          break;
      }
    },
    [soundEnabled, getCtx]
  );

  const toggleSound = useCallback(() => setSoundEnabled(p => !p), []);

  return { soundEnabled, toggleSound, playSound };
}
