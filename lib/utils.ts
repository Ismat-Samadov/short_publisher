import { Side, TreeSegment, DifficultyConfig } from './types';

let _idCounter = 0;

/** Reset segment ID counter (call at game start) */
export function resetIdCounter(): void {
  _idCounter = 0;
}

/** Generate a single random tree segment */
export function generateSegment(branchDensity: number, prevBranch?: Side): TreeSegment {
  const rand = Math.random();
  let branch: Side = 'NONE';

  // Avoid three consecutive same-side branches for fairness
  const half = branchDensity / 2;
  if (rand < half) {
    branch = prevBranch === 'LEFT' ? 'RIGHT' : 'LEFT'; // alternate if prev was a branch
  } else if (rand < branchDensity) {
    branch = prevBranch === 'RIGHT' ? 'LEFT' : 'RIGHT';
  }

  return { branch, id: _idCounter++ };
}

/** Generate the initial set of segments for a new game */
export function generateInitialSegments(
  config: DifficultyConfig,
  numSegments: number
): TreeSegment[] {
  const segments: TreeSegment[] = [];

  // Bottom 2 segments are always clear so the player can start safely
  segments.push({ branch: 'NONE', id: _idCounter++ });
  segments.push({ branch: 'NONE', id: _idCounter++ });

  for (let i = 2; i < numSegments; i++) {
    segments.push(generateSegment(config.branchDensity, segments[i - 1].branch));
  }

  return segments;
}

/** Return a Tailwind/CSS color string based on timer fraction */
export function getTimerColor(fraction: number): string {
  if (fraction > 0.5) return '#22c55e';  // green-500
  if (fraction > 0.25) return '#f59e0b'; // amber-400
  return '#ef4444';                       // red-500
}

/** Format a score number with commas */
export function formatScore(n: number): string {
  return n.toLocaleString();
}
