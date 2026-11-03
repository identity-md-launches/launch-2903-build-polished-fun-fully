/** Deliberately synthetic API responses for deterministic tests, never bundled in the game. */
export function coreFixture(work = 1200) {
  const events = Array.from({length:7}, (_, i) => ({
    eventName:'BatchSettled', blockNumber:String(100-i), transactionHash:`test-only-${i}`,
    arguments:[{name:'previousSettledThroughRound',value:String(19-i)}, {name:'settledThroughRound',value:String(20-i)}],
  }));
  if (work > 0) events.push({eventName:'RoundRecorded',blockNumber:'100',transactionHash:'test-only',arguments:[{name:'roundId',value:'20'},{name:'work',value:String(work)}]});
  return {schemaVersion:1,status:'available',chain:{chainId:'11155111',target:'sepolia',safeThroughBlock:'112'},core:{settledThroughRound:'20'},events};
}
export function statusFixture() {
  return {schemaVersion:1,measurement:{freshness:'online',observedAt:new Date().toISOString(),receivedAt:new Date().toISOString(),staleAfterSeconds:120,rpmMilli:12000,distanceMm:1500000,coreStatus:'ACTIVE',provenance:'hardware'}};
}
