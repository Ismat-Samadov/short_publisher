import { Difficulty, DifficultyConfig } from './types';

// Number of tree segments visible on screen
export const NUM_SEGMENTS = 8;

// Timer cap in seconds (cannot exceed this)
export const MAX_TIMER = 10;

// How often we update the timer (ms)
export const GAME_TICK_MS = 50;

// How long the chop animation lasts (ms)
export const CHOP_ANIM_DURATION = 120;

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  EASY: {
    label: '🌲 Easy',
    startTime: 7,
    timePerChop: 0.32,
    timeDecayRate: 0.85,
    branchDensity: 0.33,
  },
  MEDIUM: {
    label: '🪓 Medium',
    startTime: 5,
    timePerChop: 0.2,
    timeDecayRate: 1.0,
    branchDensity: 0.44,
  },
  HARD: {
    label: '💀 Hard',
    startTime: 3,
    timePerChop: 0.12,
    timeDecayRate: 1.2,
    branchDensity: 0.55,
  },
};
