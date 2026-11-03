import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DRAW_SCORE, WIN_SCORE, hitPoints, judgeHit, powerFor, sweepAt, verdict } from '../src/game.ts';
import { parseInfluence, parseWheel } from '../src/api.ts';
import { addScore, readScores, saveScores, type ScoreEntry } from '../src/storage.ts';

function coreFixture() {
  const events = Array.from({ length: 7 }, (_, i) => ({
    eventName: 'BatchSettled', blockNumber: String(100 - i), transactionHash: `fixture-${i}`,
    arguments: [{ name: 'previousSettledThroughRound', value: String(19 - i) }, { name: 'settledThroughRound', value: String(20 - i) }],
  }));
  return { schemaVersion: 1, status: 'available', chain: { chainId: '11155111', target: 'sepolia', safeThroughBlock: '112' }, core: { settledThroughRound: '20' }, events };
}
test('a sweep reverses direction and stays inside the playable bar', () => {
  assert.equal(sweepAt(0).position, 0);
  assert.equal(sweepAt(550).position, .5);
  assert.equal(sweepAt(1100).position, 1);
  assert.equal(sweepAt(1650).position, .5);
  for (let t = 0; t < 35_000; t += 17) {
    const s = sweepAt(t);
    assert.ok(s.position >= 0 && s.position <= 1);
    assert.ok(s.target >= .31 && s.target <= .69);
  }
});
test('perfect, good and missed timing produce distinct scores', () => {
  assert.equal(judgeHit(.5, .5), 'Perfect');
  assert.equal(judgeHit(.6, .5), 'Nice');
  assert.equal(judgeHit(.8, .5), 'Miss');
  assert.equal(hitPoints('Perfect', 0, 1), 100);
  assert.equal(hitPoints('Nice', 0, 1), 60);
  assert.equal(hitPoints('Miss', 30, 2.5), 0);
});
test('combo grows every five hits and caps at 50 percent', () => {
  assert.equal(hitPoints('Perfect', 4, 1), 100);
  assert.equal(hitPoints('Perfect', 5, 1), 110);
  assert.equal(hitPoints('Perfect', 25, 2), 300);
  assert.equal(hitPoints('Perfect', 100, 2), 300);
});
test('hamster power uses real work and caps at 2.5', () => {
  assert.equal(powerFor(0), 1);
  assert.equal(powerFor(600), 1.5);
  assert.equal(powerFor(1800), 2.5);
  assert.equal(powerFor(10_000), 2.5);
});
test('Win, Draw and Lose have unambiguous score boundaries', () => {
  assert.equal(verdict(WIN_SCORE), 'Win');
  assert.equal(verdict(WIN_SCORE - 1), 'Draw');
  assert.equal(verdict(DRAW_SCORE), 'Draw');
  assert.equal(verdict(DRAW_SCORE - 1), 'Lose');
});
test('certified omitted rounds count as zero', () => {
  const result = parseInfluence(coreFixture(), 1000);
  assert.equal(result.rounds.length, 6);
  assert.deepEqual(result.rounds.map((r) => r.round), ['15', '16', '17', '18', '19', '20']);
  assert.equal(result.work, 0);
  assert.equal(result.multiplier, 1);
  assert.equal(result.fetchedAt, 1000);
});
test('RoundRecorded work contributes only inside the latest six rounds', () => {
  const fixture = coreFixture();
  const record = (round: string, work: string) => ({ eventName: 'RoundRecorded', blockNumber: '101', transactionHash: 'test-only', arguments: [{ name: 'roundId', value: round }, { name: 'work', value: work }] });
  fixture.events.push(record('20', '600'), record('14', '9000'));
  const parsed = parseInfluence(fixture);
  assert.equal(parsed.work, 600);
  assert.equal(parsed.multiplier, 1.5);
});
test('unavailable, wrong-network and unknown-version responses never turn into zero work', () => {
  assert.throws(() => parseInfluence({ ...coreFixture(), status: 'unavailable' }));
  assert.throws(() => parseInfluence({ ...coreFixture(), schemaVersion: 2 }));
  assert.throws(() => parseInfluence({ ...coreFixture(), chain: { chainId: '1', target: 'mainnet' } }));
});
test('incomplete or truncated settlement history is rejected', () => {
  const fixture = coreFixture(); fixture.events = fixture.events.slice(0, 3);
  assert.throws(() => parseInfluence(fixture));
  const truncated = coreFixture();
  truncated.events = Array.from({length:25}, () => ({ ...truncated.events[0], blockNumber: '100' }));
  assert.throws(() => parseInfluence(truncated));
});
test('oversized and malformed uints are rejected without losing precision', () => {
  const fixture = coreFixture();
  fixture.events.push({ eventName: 'RoundRecorded', blockNumber: '101', transactionHash: 'test-only', arguments: [{name:'roundId',value:'20'}, {name:'work',value:'9007199254740992'}] });
  assert.throws(() => parseInfluence(fixture));
  assert.throws(() => parseInfluence({ ...coreFixture(), core: { settledThroughRound: '-1' } }));
});
test('wheel status respects hardware freshness, units and unavailable state', () => {
  const now = Date.now();
  const measurement = { freshness:'online',observedAt:new Date(now).toISOString(),receivedAt:new Date(now).toISOString(),staleAfterSeconds:120,rpmMilli:12400,distanceMm:1500000,coreStatus:'ACTIVE',provenance:'hardware' };
  const parsed = parseWheel({schemaVersion:1,measurement}, now);
  assert.equal(parsed.state, 'running'); assert.equal(parsed.rpm, 12.4); assert.equal(parsed.distanceKm, 1.5);
  assert.equal(parseWheel({schemaVersion:1,measurement}, now+121000).state, 'stale');
  assert.equal(parseWheel({schemaVersion:1,measurement:{...measurement,coreStatus:'COUNTER_FAULT'}},now).state,'fault');
  assert.equal(parseWheel({schemaVersion:1,measurement:null}).state,'unavailable');
  assert.throws(() => parseWheel({schemaVersion:2,measurement}));
});
const entry = (id: string, score: number): ScoreEntry => ({ id, score, name:'Guest', at:1234,combo:5,perfects:3,hits:5,verdict:'Lose',dataMode:'live',averagePower:1.5 });
test('leaderboard ranks, deduplicates, preserves ties and keeps ten scores', () => {
  let scores: ScoreEntry[] = [];
  for (let n = 0; n < 15; n++) scores = addScore(scores, entry(String(n), n * 100));
  assert.equal(scores.length, 10); assert.equal(scores[0].score, 1400); assert.equal(scores[9].score,500);
  scores=addScore(scores,{...entry('14',1500),name:'Registered'});
  assert.equal(scores.length,10); assert.equal(scores[0].name,'Registered');
});
test('leaderboard persistence tolerates corrupt and denied browser storage', () => {
  let value: string | null = null;
  Object.defineProperty(globalThis, 'localStorage', {configurable:true,value:{ getItem:()=>value,setItem:(_k:string,v:string)=>{value=v;} }});
  assert.equal(saveScores([entry('a',100)]), null);
  assert.equal(readScores().scores[0].score,100);
  const a={...entry('earlier',500),at:1000},b={...entry('later',500),at:2000};
  saveScores(addScore([a],b));assert.deepEqual(readScores().scores.map(s=>s.id),['earlier','later']);
  value='not json'; assert.equal(readScores().scores.length,0); assert.ok(readScores().error);
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>{throw new Error('denied')},setItem:()=>{throw new Error('denied')}}});
  assert.ok(saveScores([])); assert.ok(readScores().error);
});
