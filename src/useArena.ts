import { useCallback, useEffect, useRef, useState } from 'react';
import { ROUND_MS, hitPoints, judgeHit, sweepAt, verdict } from './game';
import { tone } from './audio';
import type { ScoreEntry } from './storage';

export type Phase = 'ready' | 'countdown' | 'playing' | 'paused' | 'finished';
interface ArenaState {
  phase: Phase; elapsed: number; countdown: number; score: number; combo: number; maxCombo: number;
  hits: number; perfects: number; misses: number; sweep: number; attempted: boolean; feedback: string;
  points: number; feedbackId: number; target: number; liveHits: number; practiceHits: number; powerSum: number;
}
const fresh = (): ArenaState => ({
  phase: 'ready', elapsed: 0, countdown: 3, score: 0, combo: 0, maxCombo: 0, hits: 0, perfects: 0,
  misses: 0, sweep: 0, attempted: false, feedback: '', points: 0, feedbackId: 0, target: 0.5,
  liveHits: 0, practiceHits: 0, powerSum: 0,
});
export type RoundResult = Omit<ScoreEntry, 'id' | 'name' | 'address' | 'at'>;

export function useArena(options: {
  multiplier: number; live: boolean; sound: boolean; onFinish: (result: RoundResult) => void;
}) {
  const opts = useRef(options); opts.current = options;
  const state = useRef<ArenaState>(fresh());
  const [view, setView] = useState(state.current);
  const needle = useRef<HTMLSpanElement>(null);
  const resumePhase = useRef<'playing' | 'countdown'>('playing');
  const publish = useCallback(() => setView({ ...state.current }), []);

  const finish = useCallback(() => {
    const s = state.current;
    if (s.phase === 'finished') return;
    s.phase = 'finished'; s.elapsed = ROUND_MS;
    tone('finish', opts.current.sound);
    publish();
    opts.current.onFinish({
      score: s.score, combo: s.maxCombo, perfects: s.perfects, hits: s.hits, verdict: verdict(s.score),
      dataMode: s.liveHits && s.practiceHits ? 'mixed' : s.liveHits ? 'live' : 'practice',
      averagePower: s.hits ? Math.round(s.powerSum / s.hits * 100) / 100 : 1,
    });
  }, [publish]);

  useEffect(() => {
    if (view.phase !== 'playing' && view.phase !== 'countdown') return;
    let frame = 0;
    let last: number | null = null;
    let lastPublish = 0;
    function tick(now: number) {
      const s = state.current;
      if (s.phase !== 'playing' && s.phase !== 'countdown') return;
      const delta = last === null ? 0 : now - last; last = now;
      s.elapsed += delta;
      if (s.phase === 'countdown') {
        s.countdown = Math.max(1, Math.ceil((3_000 - s.elapsed) / 1_000));
        if (s.elapsed >= 3_000) {
          s.phase = 'playing'; s.elapsed = 0;
          tone('start', opts.current.sound); publish();
        }
      } else {
        if (s.elapsed >= ROUND_MS) { finish(); return; }
        const sweep = sweepAt(s.elapsed);
        if (sweep.sweep !== s.sweep) {
          if (!s.attempted) {
            s.combo = 0; s.misses++;
            s.feedback = 'Missed a sweep'; s.points = 0; s.feedbackId++;
          }
          s.sweep = sweep.sweep; s.attempted = false; s.target = sweep.target;
          publish();
        }
        if (needle.current) needle.current.style.left = `${sweep.position * 100}%`;
      }
      if (now - lastPublish >= 90) { publish(); lastPublish = now; }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [view.phase, publish, finish]);

  const boost = useCallback(() => {
    const s = state.current;
    if (s.phase !== 'playing' || s.attempted || s.elapsed >= ROUND_MS) return;
    s.attempted = true;
    const { position, target } = sweepAt(s.elapsed);
    const hit = judgeHit(position, target);
    s.feedback = hit; s.feedbackId++;
    if (hit === 'Miss') { s.combo = 0; s.misses++; s.points = 0; }
    else {
      s.combo++; s.hits++; s.maxCombo = Math.max(s.combo, s.maxCombo);
      if (hit === 'Perfect') s.perfects++;
      if (opts.current.live) s.liveHits++; else s.practiceHits++;
      s.powerSum += opts.current.multiplier;
      s.points = hitPoints(hit, s.combo, opts.current.multiplier); s.score += s.points;
    }
    tone(hit === 'Perfect' ? 'perfect' : hit === 'Nice' ? 'nice' : 'miss', opts.current.sound);
    publish();
  }, [publish]);

  const start = useCallback(() => {
    state.current = { ...fresh(), phase: 'countdown' };
    if (needle.current) needle.current.style.left = '50%';
    tone('start', opts.current.sound); publish();
  }, [publish]);
  const pause = useCallback(() => {
    const s = state.current;
    if (s.phase === 'playing' || s.phase === 'countdown') {
      resumePhase.current = s.phase; s.phase = 'paused'; publish();
    }
  }, [publish]);
  const resume = useCallback(() => {
    if (state.current.phase === 'paused') { state.current.phase = resumePhase.current; publish(); }
  }, [publish]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select, dialog') || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === 'Space' && state.current.phase === 'countdown') { e.preventDefault(); return; }
      if (e.code === 'Space' && !el.closest('button, a, summary') && state.current.phase === 'playing') {
        e.preventDefault(); if (!e.repeat) boost();
      }
      if (e.code === 'Escape') pause();
    };
    const visibility = () => { if (document.hidden) pause(); };
    document.addEventListener('keydown', key);
    document.addEventListener('visibilitychange', visibility);
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('visibilitychange', visibility); };
  }, [boost, pause]);
  return { ...view, needle, start, boost, pause, resume };
}
