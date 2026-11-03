import { powerFor } from './game';

export const API_BASE = 'https://api.squeekchain.com/v1';
export const POLL_MS = 12_000;
export const FEED_EXPIRY_MS = 45_000;

export interface Influence {
  work: number;
  multiplier: number;
  rounds: { round: string; work: number }[];
  frontier: string;
  tx: string;
  safeBlock: string;
  fetchedAt: number;
}

export interface Wheel {
  state: 'running' | 'resting' | 'stale' | 'fault' | 'unavailable';
  rpm: number | null;
  distanceKm: number | null;
  provenance: string | null;
  observedAt: number | null;
}

type Obj = Record<string, unknown>;
function object(value: unknown): Obj {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('Unexpected response format');
  return value as Obj;
}
function uint(value: unknown): bigint {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) throw new Error('Invalid work data');
  return BigInt(value);
}
function small(value: unknown): number {
  const n = uint(value);
  if (n > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Work value is too large');
  return Number(n);
}
function measurementNumber(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error('Invalid wheel data');
  return value;
}

export function parseWheel(value: unknown, now = Date.now()): Wheel {
  const data = object(value);
  if (data.schemaVersion !== 1) throw new Error('Unsupported status version');
  if (data.measurement === null) return { state: 'unavailable', rpm: null, distanceKm: null, provenance: null, observedAt: null };
  const m = object(data.measurement);
  const observedAt = Date.parse(String(m.observedAt));
  const receivedAt = Date.parse(String(m.receivedAt));
  const staleAfter = measurementNumber(m.staleAfterSeconds) * 1_000;
  if (!Number.isFinite(observedAt) || !Number.isFinite(receivedAt)) throw new Error('Missing wheel timestamp');
  const rpm = measurementNumber(m.rpmMilli) / 1_000;
  const stale = m.freshness !== 'online' || now - receivedAt > staleAfter || receivedAt - now > 60_000;
  return {
    state: stale ? 'stale' : m.coreStatus === 'COUNTER_FAULT' ? 'fault' : rpm > 0 ? 'running' : 'resting',
    rpm: stale ? null : rpm,
    distanceKm: measurementNumber(m.distanceMm) / 1_000_000,
    provenance: typeof m.provenance === 'string' ? m.provenance : 'unknown',
    observedAt,
  };
}

/** Only certified rounds count. Absence in a truncated event batch is never assumed to be zero. */
export function parseInfluence(value: unknown, now = Date.now()): Influence {
  const data = object(value);
  if (data.schemaVersion !== 1) throw new Error('Unsupported core version');
  if (data.status !== 'available') throw new Error('Settlement data is unavailable');
  const chain = object(data.chain);
  if (chain.chainId !== '11155111' || chain.target !== 'sepolia') throw new Error('Unexpected settlement network');
  const core = object(data.core);
  const frontier = uint(core.settledThroughRound);
  if (!Array.isArray(data.events) || data.events.length === 0) throw new Error('No certified rounds yet');
  const events = data.events.map((v) => {
    const e = object(v);
    if (!Array.isArray(e.arguments)) throw new Error('Missing event arguments');
    const args: Obj = {};
    for (const a of e.arguments) { const arg = object(a); args[String(arg.name)] = arg.value; }
    return { name: e.eventName, block: uint(e.blockNumber), args, tx: String(e.transactionHash) };
  });
  const oldestBlock = events.reduce((n, e) => e.block < n ? e.block : n, events[0].block);
  const batches = events.filter((e) => e.name === 'BatchSettled').map((e) => ({
    first: uint(e.args.previousSettledThroughRound) + 1n,
    last: uint(e.args.settledThroughRound),
    complete: e.block > oldestBlock || events.length < 25,
    tx: e.tx,
  }));
  const recorded = new Map(events.filter((e) => e.name === 'RoundRecorded')
    .map((e) => [uint(e.args.roundId).toString(), small(e.args.work)]));
  const rounds: Influence['rounds'] = [];
  const first = frontier >= 5n ? frontier - 5n : 0n;
  for (let round = first; round <= frontier; round++) {
    const batch = batches.find((b) => b.first <= round && b.last >= round);
    if (!batch) throw new Error('Recent settlement history is incomplete');
    const recordedWork = recorded.get(round.toString());
    if (recordedWork === undefined && !batch.complete) throw new Error('Recent settlement history is incomplete');
    rounds.push({ round: round.toString(), work: recordedWork ?? 0 });
  }
  const work = rounds.reduce((sum, r) => sum + r.work, 0);
  if (!Number.isSafeInteger(work)) throw new Error('Total work is too large');
  return { work, rounds, multiplier: powerFor(work), frontier: frontier.toString(),
    tx: batches.find((b) => b.last === frontier)?.tx ?? batches[0].tx,
    safeBlock: uint(chain.safeThroughBlock).toString(), fetchedAt: now };
}

export class FeedError extends Error {
  constructor(message: string, public retryAfter = 0) { super(message); }
}

export async function fetchPublic(path: '/status' | '/core', signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(`${API_BASE}${path}`, {
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(8_000)]) : AbortSignal.timeout(8_000),
    credentials: 'omit', cache: 'no-cache', headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const retry = response.headers.get('Retry-After');
    const delay = retry ? Number(retry) * 1_000 || Math.max(0, Date.parse(retry) - Date.now()) : 0;
    throw new FeedError(`Hamster feed returned ${response.status}`, Number.isFinite(delay) ? delay : 0);
  }
  return response.json();
}
