export const ROUND_MS = 35_000;
export const SWEEP_MS = 1_100;
export const WIN_SCORE = 2_500;
export const DRAW_SCORE = 2_250;
export const TARGET_RADIUS = 0.135;
export const PERFECT_RADIUS = 0.045;

export type Verdict = 'Win' | 'Draw' | 'Lose';
export type Hit = 'Perfect' | 'Nice' | 'Miss';

export function sweepAt(elapsed: number) {
  const sweep = Math.floor(elapsed / SWEEP_MS);
  const fraction = (elapsed % SWEEP_MS) / SWEEP_MS;
  const position = sweep % 2 === 0 ? fraction : 1 - fraction;
  // The pattern repeats across games, keeping personal bests comparable.
  const target = 0.5 + Math.sin(sweep * 1.7) * 0.19;
  return { sweep, position, target };
}

export function judgeHit(position: number, target: number): Hit {
  const distance = Math.abs(position - target);
  return distance <= PERFECT_RADIUS ? 'Perfect' : distance <= TARGET_RADIUS ? 'Nice' : 'Miss';
}

export function hitPoints(hit: Hit, combo: number, multiplier: number): number {
  if (hit === 'Miss') return 0;
  const base = hit === 'Perfect' ? 100 : 60;
  const comboBoost = 1 + Math.min(Math.floor(combo / 5) * 0.1, 0.5);
  return Math.round(base * comboBoost * multiplier);
}

export function verdict(score: number): Verdict {
  return score >= WIN_SCORE ? 'Win' : score >= DRAW_SCORE ? 'Draw' : 'Lose';
}

export function powerFor(work: number) {
  return Math.round((1 + Math.min(work / 1_200, 1.5)) * 100) / 100;
}

export function hamsterMood(work: number) {
  return work >= 600 ? 'Full zoomies' : work >= 100 ? 'Finding a rhythm' : 'Nap energy';
}

export function flavor(work: number | null) {
  if (work === null) return 'Flying solo! The hamster feed took a break.';
  if (work >= 600) return 'Squeektoshi went full zoomies! Tiny legs, huge energy.';
  if (work >= 100) return 'Squeektoshi found a rhythm. Those little paws put in work.';
  return 'Quiet nap round… Even champions need a snack break.';
}
