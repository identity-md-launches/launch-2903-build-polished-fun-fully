import { useCallback, useEffect, useRef, useState } from 'react';
import { FEED_EXPIRY_MS, FeedError, POLL_MS, fetchPublic, parseInfluence, parseWheel, type Influence, type Wheel } from './api';

export type FeedState = 'loading' | 'live' | 'offline';
export function useFeed() {
  const [influence, setInfluence] = useState<Influence | null>(null);
  const [wheel, setWheel] = useState<Wheel | null>(null);
  const [state, setState] = useState<FeedState>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const [message, setMessage] = useState('Connecting to Squeekchain…');
  const [clock, setClock] = useState(Date.now());
  const [retryAt, setRetryAt] = useState(0);
  const busy = useRef(false);
  const nextAllowed = useRef(0);
  const failures = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const active = useRef(true);

  const refresh = useCallback(async () => {
    if (busy.current || Date.now() < nextAllowed.current) return;
    busy.current = true;
    setRefreshing(true);
    const controller = new AbortController();
    abort.current = controller;
    const results = await Promise.allSettled([
      fetchPublic('/core', controller.signal).then((v) => parseInfluence(v)),
      fetchPublic('/status', controller.signal).then((v) => parseWheel(v)),
    ]);
    if (!active.current || controller.signal.aborted || abort.current !== controller) return;
    const [core, measurement] = results;
    const serverDelay = Math.max(...results.map((r) => r.status === 'rejected' && r.reason instanceof FeedError ? r.reason.retryAfter : 0));
    if (core.status === 'fulfilled') {
      setInfluence(core.value);
      setState('live');
      setMessage('Certified on Sepolia');
      setCheckedAt(Date.now());
      failures.current = 0;
      nextAllowed.current = Date.now() + serverDelay;
      setRetryAt(serverDelay ? nextAllowed.current : 0);
    } else {
      failures.current++;
      nextAllowed.current = Date.now() + Math.max(serverDelay, Math.min(60_000, POLL_MS * 2 ** (failures.current - 1)));
      setRetryAt(nextAllowed.current);
      setClock(Date.now());
      setState('offline');
      setMessage('Feed unavailable. Play at 1.00× or retry.');
    }
    setWheel(measurement.status === 'fulfilled' ? measurement.value : null);
    setRefreshing(false);
    busy.current = false;
  }, []);

  useEffect(() => {
    active.current = true;
    void refresh();
    const interval = window.setInterval(() => {
      setClock(Date.now());
      if (!document.hidden) void refresh();
    }, POLL_MS);
    const clockInterval = window.setInterval(() => { if (!document.hidden) setClock(Date.now()); }, 1_000);
    const visible = () => { if (!document.hidden) { setClock(Date.now()); void refresh(); } };
    document.addEventListener('visibilitychange', visible);
    return () => {
      active.current = false;
      abort.current?.abort();
      busy.current = false;
      window.clearInterval(interval);
      window.clearInterval(clockInterval);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [refresh]);

  const expired = influence !== null && clock - influence.fetchedAt > FEED_EXPIRY_MS;
  const usable = state === 'live' && !expired;
  return { influence, wheel, state: expired ? 'offline' as const : state, refreshing, checkedAt,
    message: expired ? 'Feed is out of date. Play at 1.00× or retry.' : message,
    multiplier: usable && influence ? influence.multiplier : 1, usable, refresh,
    retryIn: Math.max(0, Math.ceil((retryAt - clock) / 1_000)) };
}
