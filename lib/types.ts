// Core type definitions for Timberman game

export type Side = 'LEFT' | 'RIGHT' | 'NONE';
export type GameStatus = 'IDLE' | 'PLAYING' | 'GAME_OVER';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface TreeSegment {
  branch: Side;
  id: number;
}

export interface DifficultyConfig {
  label: string;
  startTime: number;    // initial timer in seconds
  timePerChop: number;  // seconds added per chop
  timeDecayRate: number; // timer drain multiplier (1.0 = 1s/s)
  branchDensity: number; // 0–1 probability that a segment has a branch
}

export interface ChopAnimation {
  side: Side;
  timestamp: number;
}

export interface GameState {
  status: GameStatus;
  segments: TreeSegment[]; // index 0 = bottom
  playerSide: Side;
  score: number;
  timer: number;
  difficulty: Difficulty;
  chopAnimation: ChopAnimation | null;
  isDeathAnimating: boolean;
  combo: number;
}
