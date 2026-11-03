import type { Verdict } from './game';

const SCORES_KEY = 'squeek-arena:scores:v1';
export const PROFILE_KEY = 'squeek-arena:profile:v1';
export interface Identity { address: `0x${string}`; name: string }
export interface ScoreEntry {
  id: string;
  name: string;
  address?: `0x${string}`;
  score: number;
  combo: number;
  perfects: number;
  hits: number;
  verdict: Verdict;
  dataMode: 'live' | 'mixed' | 'practice';
  averagePower: number;
  at: number;
}
export function readScores(): { scores: ScoreEntry[]; error: string | null } {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(SCORES_KEY) ?? '[]');
    if (!Array.isArray(raw)) throw new Error('Invalid leaderboard');
    const scores = raw.filter((s): s is ScoreEntry => !!s && typeof s === 'object' &&
      typeof s.id === 'string' && typeof s.name === 'string' && s.name.length <= 24 &&
      Number.isSafeInteger(s.score) && s.score >= 0 && s.score < 100_000 &&
      Number.isFinite(s.at) && Number.isSafeInteger(s.combo) && Number.isSafeInteger(s.perfects) &&
      Number.isSafeInteger(s.hits) && ['Win', 'Draw', 'Lose'].includes(s.verdict) &&
      ['live', 'mixed', 'practice'].includes(s.dataMode) && Number.isFinite(s.averagePower) &&
      (!s.address || /^0x[a-fA-F0-9]{40}$/.test(s.address)));
    return { scores: scores.sort((a, b) => b.score - a.score || a.at - b.at).slice(0, 10), error: null };
  } catch {
    return { scores: [], error: 'Saved scores could not be read. New scores will start a fresh leaderboard.' };
  }
}
export function saveScores(scores: ScoreEntry[]): string | null {
  try { localStorage.setItem(SCORES_KEY, JSON.stringify(scores)); return null; }
  catch { return 'Storage is unavailable. Scores will last until this page closes.'; }
}
export function addScore(scores: ScoreEntry[], entry: ScoreEntry) {
  return [...scores.filter((s) => s.id !== entry.id), entry].sort((a, b) => b.score - a.score || a.at - b.at).slice(0, 10);
}
