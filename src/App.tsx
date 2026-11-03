import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useFeed } from './useFeed';
import { useArena, type RoundResult } from './useArena';
import { DRAW_SCORE, ROUND_MS, TARGET_RADIUS, WIN_SCORE, flavor, hamsterMood } from './game';
import { addScore, readScores, saveScores, type Identity, type ScoreEntry } from './storage';
import { Icon } from './components/Icon';
import { Hamster, HamsterMark } from './components/Hamster';
import { Modal } from './components/Modal';

const WalletControl = lazy(() => import('./components/WalletControl'));
const number = (n: number) => n.toLocaleString('en-US');
const modeLabel = { live: 'Live boost', mixed: 'Mixed feed', practice: 'Base boost' };

class WalletBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <button className="button" onClick={() => this.setState({ failed: false })}>Retry wallet</button> : this.props.children; }
}

function PowerPanel({ feed, onOpen }: { feed: ReturnType<typeof useFeed>; onOpen: () => void }) {
  const { influence, usable, wheel, state } = feed;
  const [details, setDetails] = useState(false);
  const work = usable ? influence?.work : null;
  const maxWork = Math.max(...(influence?.rounds.map((r) => r.work) ?? [1]), 1);
  const wheelLabel = wheel?.state === 'running' ? 'Wheel is turning' : wheel?.state === 'resting' ? 'Taking a breather' : wheel?.state === 'stale' ? 'Wheel reading is stale' : wheel?.state === 'fault' ? 'Wheel sensor fault' : 'Wheel status unknown';
  return <section className="power-panel" aria-labelledby="power-heading">
    <div className="section-heading"><h2 id="power-heading"><Icon name="bolt"/>Hamster power</h2><span className={`feed-badge ${usable ? 'online' : ''}`}><span className="status-dot"/>{state === 'loading' ? 'Syncing' : usable ? 'Synced' : 'Offline'}</span></div>
    <div className="power-readout"><strong className="power-number">{feed.multiplier.toFixed(2)}<span>×</span></strong><div><span className="caption muted">Score multiplier</span><p>{work === null || work === undefined ? 'Base boost' : hamsterMood(work)}</p></div></div>
    <div className="power-context"><span>{work === null || work === undefined ? 'Settled work unknown' : <><strong>{number(work)}</strong> work units</>}</span><button className="icon-button small-icon" type="button" aria-label="How hamster power works" onClick={() => { onOpen(); setDetails(true); }}><Icon name="help" size={18}/></button></div>
    <div className="round-chart" role="img" aria-label={influence ? `${usable ? '' : 'Last known: '}${influence.rounds.map((r) => `round ${r.round}: ${r.work} work units`).join(', ')}` : 'Settled activity has not loaded'}>
      {Array.from({ length: 6 }, (_, i) => {
        const r = influence?.rounds[i];
        return <div className="chart-column" key={i}><span className={`chart-bar ${r?.work ? 'has-work' : ''} ${!usable ? 'is-stale' : ''}`} style={{ height: r ? `${Math.max(5, r.work / maxWork * 100)}%` : '5%' }}/></div>;
      })}
    </div>
    <div className="chart-caption caption muted"><span>{influence && !usable ? 'Last known rounds' : 'Last 6 settled rounds'}</span><span>~60 min</span></div>
    <div className="wheel-status"><span className="wheel-status-icon"><Icon name="seed" size={18}/></span><div><p>{wheelLabel}</p><span className="caption muted">{wheel?.provenance && wheel.state !== 'stale' ? `${wheel.provenance === 'hardware' ? 'Hardware' : wheel.provenance} reading` : 'Live wheel telemetry'}{wheel?.rpm !== null && wheel?.rpm !== undefined ? ` · ${wheel.rpm.toFixed(1)} rpm` : ''}</span></div></div>
    <div className="feed-note" role="status">{feed.message}</div>
    <div className="power-footer"><button className="text-button" disabled={feed.refreshing || feed.retryIn > 0} onClick={() => void feed.refresh()}><Icon name="refresh" size={14} className={feed.refreshing ? 'refreshing' : ''}/>{feed.refreshing ? 'Refreshing…' : feed.retryIn ? `Retry in ${feed.retryIn}s` : 'Refresh feed'}</button>{influence && <a href={`https://sepolia.etherscan.io/tx/${influence.tx}`} target="_blank" rel="noreferrer" className="text-link caption">Round #{influence.frontier}<Icon name="external" size={13}/></a>}</div>
    {details && <Modal title="A boost from the real world" onClose={() => setDetails(false)}>
      <p className="modal-description">Squeektoshi’s physical wheel work is settled on Ethereum Sepolia. The latest six certified 10-minute rounds power your game.</p>
      <div className="formula">1 + min(work ÷ 1,200, 1.5)</div>
      <p>That gives a <strong>1.00×–2.50×</strong> boost. We refresh every 12 seconds, including during your round. Each successful hit uses the multiplier shown at that moment.</p>
      <p className="muted">Certified quiet rounds count as zero. Missing or unavailable data uses the base 1.00× boost. The live wheel reading is separate and never changes your score.</p>
      {influence && <><h3>Latest certified window</h3><ul className="round-list">{influence.rounds.map((r) => <li key={r.round}><span>Round #{r.round}</span><strong>{number(r.work)} work</strong></li>)}</ul><p className="caption muted">Read at safe Ethereum block {influence.safeBlock}. Squeekchain’s API waits for 12 confirmations.</p></>}
      <a className="text-link" href="https://docs.squeekchain.com/developers/api/" target="_blank" rel="noreferrer">Read the official API docs<Icon name="external" size={16}/></a>
    </Modal>}
  </section>;
}

function Leaderboard({ scores, latestId, onRegister, identity, error }: { scores: ScoreEntry[]; latestId?: string; onRegister: () => void; identity: Identity | null; error: string | null }) {
  return <section className="leaderboard" aria-labelledby="leaderboard-heading" id="leaderboard">
    <div className="section-heading"><h2 id="leaderboard-heading"><Icon name="trophy"/>Local legends</h2><span className="caption muted">Top 10</span></div>
    <p className="leaderboard-subtitle caption muted">Your scores, saved in this browser.</p>
    {scores.length ? <ol className="score-list">{scores.map((s, i) => <li key={s.id} className={s.id === latestId ? 'latest-score' : ''}>
      <span className={`rank ${i === 0 ? 'first-place' : ''}`}>{String(i + 1).padStart(2, '0')}</span><div className="score-player"><span className="player-name"><bdi>{s.name}</bdi>{s.address && <Icon name="check" size={13}/>}</span><span className="caption muted">{modeLabel[s.dataMode]} · {s.averagePower.toFixed(2)}×</span></div><strong className="leaderboard-score">{number(s.score)}</strong>
    </li>)}</ol> : <div className="leaderboard-empty"><Icon name="trophy" size={32}/><h3>The first spot is yours.</h3><p className="caption muted">Finish a round. Set the score to beat.</p></div>}
    <div className="leaderboard-bottom"><button className="text-button" onClick={onRegister}><Icon name={identity ? 'check' : 'wallet'} size={16}/>{identity ? 'Change player name' : 'Register player name'}<Icon name="arrow" size={14}/></button><p className="caption muted">A signature saves your local name.</p></div>
    {error && <p className="error-message caption" role="status">{error}</p>}
  </section>;
}

export default function App() {
  const feed = useFeed();
  const [board, setBoard] = useState(readScores);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [registerRequested, setRegisterRequested] = useState(false);
  const [help, setHelp] = useState(false);
  const [sound, setSound] = useState(() => { try { return localStorage.getItem('squeek-arena:sound') === 'true'; } catch { return false; } });
  const [result, setResult] = useState<{ entry: ScoreEntry; work: number | null; newBest: boolean } | null>(null);
  const [copyNote, setCopyNote] = useState('');
  const boardRef = useRef(board); boardRef.current = board;
  const feedRef = useRef(feed); feedRef.current = feed;
  const playerRef = useRef<Identity | null>(null);
  const resultRef = useRef(result); resultRef.current = result;
  const finish = useCallback((round: RoundResult) => {
    const who = playerRef.current;
    const entry: ScoreEntry = { ...round, id: crypto.randomUUID(), name: who?.name ?? 'Guest', ...(who ? { address: who.address } : {}), at: Date.now() };
    const newBest = entry.score > (boardRef.current.scores[0]?.score ?? 0);
    const scores = addScore(boardRef.current.scores, entry);
    const error = saveScores(scores);
    setBoard({ scores, error });
    setResult({ entry, work: feedRef.current.usable ? feedRef.current.influence?.work ?? null : null, newBest });
  }, []);
  const game = useArena({ multiplier: feed.multiplier, live: feed.usable, sound, onFinish: finish });
  const pauseRef = useRef(game.pause); pauseRef.current = game.pause;
  const onWalletOpen = useCallback(() => pauseRef.current(), []);
  const registerHandled = useCallback(() => setRegisterRequested(false), []);
  const setPlayer = useCallback((who: Identity | null) => {
    setIdentity(who);
    const last = resultRef.current;
    if (who && last && !last.entry.address) {
      const entry = { ...last.entry, name: who.name, address: who.address };
      const scores = addScore(boardRef.current.scores, entry);
      setBoard({ scores, error: saveScores(scores) });
      setResult({ ...last, entry });
    }
  }, []);

  useEffect(() => {
    const handler = (e: StorageEvent) => { if (e.key?.startsWith('squeek-arena:scores')) setBoard(readScores()); };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  const register = () => { game.pause(); setRegisterRequested(true); };
  const start = () => { playerRef.current = identity; setResult(null); setCopyNote(''); void feed.refresh(); game.start(); };
  const toggleSound = () => {
    const next = !sound; setSound(next);
    try { localStorage.setItem('squeek-arena:sound', String(next)); } catch { /* Remains available for this visit. */ }
  };
  const showHelp = () => { game.pause(); setHelp(true); };
  const active = game.phase === 'playing' || game.phase === 'countdown';
  const remaining = Math.ceil((ROUND_MS - (game.phase === 'countdown' ? 0 : game.elapsed)) / 1_000);
  const best = board.scores[0]?.score ?? 0;
  const countdownText = game.phase === 'countdown' ? `Starting in ${game.countdown}` : game.phase === 'paused' ? 'Round paused' : game.phase === 'finished' ? `Round complete. ${result?.entry.verdict}. Score ${game.score}.` : game.phase === 'playing' ? 'Round started. Time your boost in the green zone.' : '';

  async function copyScore() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(`I scored ${number(result.entry.score)} in Squeek Arena! ${result.entry.verdict} · ${result.entry.averagePower.toFixed(2)}× hamster power. ${location.href.split('#')[0]}`);
      setCopyNote('Score copied');
    } catch { setCopyNote('Copy unavailable. Your score is shown above.'); }
  }

  return <>
    <a className="skip-link" href="#arena">Skip to arena</a>
    <header className="site-header shell">
      <a className="brand" href="#arena" aria-label="Squeek Arena home"><HamsterMark/><span>Squeek{' '}<span className="brand-light">Arena</span></span></a>
      <nav className="main-nav" aria-label="Main navigation"><a className="active" href="#arena" aria-current="page">Arena</a><a href="#how-to-play" onClick={game.pause}>How to play</a><a href="#about" onClick={game.pause}>About</a></nav>
      <div className="header-actions"><span className="network-label"><span className="network-mark"/>Sepolia</span><WalletBoundary><Suspense fallback={<button className="button wallet-button" disabled><Icon name="wallet" size={18}/>Connect</button>}><WalletControl registerRequested={registerRequested} onRegisterHandled={registerHandled} onIdentity={setPlayer} onOpen={onWalletOpen}/></Suspense></WalletBoundary></div>
    </header>

    <main className="shell">
      <div className="page-intro"><div><h1>Tiny paws.<br className="mobile-break"/> <span>Massive scores.</span></h1><p>A 35-second rhythm game powered by a real hamster.</p></div><div className="personal-best"><Icon name="trophy" size={18}/><div><span className="caption muted">Personal best</span><strong>{best ? number(best) : 'Yours to set'}</strong></div></div></div>
      <div className="arena-layout">
        <section className={`arena-panel phase-${game.phase}`} id="arena" aria-labelledby="arena-heading">
          <div className="arena-heading"><h2 id="arena-heading"><span className="arena-dot"/>The arena</h2><div className="arena-tools"><button type="button" className="icon-button" aria-label={sound ? 'Mute sound' : 'Enable sound'} aria-pressed={sound} onClick={toggleSound}><Icon name={sound ? 'sound' : 'mute'} size={18}/></button><button className="icon-button" type="button" onClick={showHelp} aria-label="How to play"><Icon name="help" size={18}/></button>{(active || game.phase === 'paused') && <button className="icon-button" aria-label={game.phase === 'paused' ? 'Resume round' : 'Pause round'} onClick={game.phase === 'paused' ? game.resume : game.pause}><Icon name={game.phase === 'paused' ? 'play' : 'pause'} size={18}/></button>}</div></div>
          <div className="scoreboard"><div className="scoreboard-item"><span className="caption muted">Your score</span><strong data-testid="score">{String(game.score).padStart(4, '0')}</strong></div><div className={`scoreboard-item timer ${remaining <= 10 && game.phase === 'playing' ? 'time-low' : ''}`}><span className="caption muted">Time left</span><strong>{String(Math.floor(remaining / 60)).padStart(2, '0')}<span className="timer-colon">:</span>{String(remaining % 60).padStart(2, '0')}</strong></div><div className="scoreboard-item goal"><span className="caption muted">Score to win</span><strong>{number(WIN_SCORE)}<Icon name="flag" size={18}/></strong></div></div>

          {game.phase === 'finished' && result ? <div className="round-result" data-testid="round-result"><div className={`result-medallion result-${result.entry.verdict.toLowerCase()}`}><Icon name={result.entry.verdict === 'Win' ? 'trophy' : 'bolt'} size={32}/></div><p className="result-kicker">{result.newBest ? 'A new personal best' : 'Round complete'}</p><h2>{result.entry.verdict === 'Win' ? 'Win! Snack secured.' : result.entry.verdict === 'Draw' ? 'Draw! So squeek-close.' : 'Lose. One more lap?'}</h2><strong className="result-score">{number(result.entry.score)}<span>points</span></strong><p className="result-flavor">{flavor(result.work)}</p><div className="result-stats"><div><strong>{result.entry.perfects}</strong><span className="caption muted">Perfect hits</span></div><div><strong>{result.entry.combo}×</strong><span className="caption muted">Best combo</span></div><div><strong>{result.entry.averagePower.toFixed(2)}×</strong><span className="caption muted">Avg. power</span></div></div><p className="caption muted">{modeLabel[result.entry.dataMode]} · {board.scores.some((s) => s.id === result.entry.id) ? board.error ? 'Saved for this visit' : 'Saved to this browser’s top scores' : 'Outside the local top 10'}</p></div> :
            <div className="arena-scene"><div className="scene-topline"><span className="scene-mode">{feed.multiplier.toFixed(2)}× {feed.usable ? 'live' : 'base'} power</span><span className="combo-readout"><Icon name="bolt" size={14}/>{game.combo ? `${game.combo} hit combo` : 'Build your combo'}</span></div><Hamster playing={game.phase === 'playing'}/>
              {game.phase === 'ready' && <div className="hamster-name"><span className="status-dot"/>Squeektoshi, your tiny teammate</div>}
              {game.phase === 'playing' && <div key={game.feedbackId} className={`hit-feedback ${game.feedback === 'Miss' || game.feedback === 'Missed a sweep' ? 'miss-feedback' : ''}`} aria-hidden="true"><strong>{game.feedback || 'Find your rhythm'}</strong>{game.points > 0 && <span>+{game.points}</span>}</div>}
              {game.phase === 'countdown' && <div className="scene-cover"><p>Ready your paws</p><strong className="countdown-number">{game.countdown}</strong><span className="caption muted">One boost per sweep</span></div>}
              {game.phase === 'paused' && <div className="scene-cover"><Icon name="pause" size={32}/><h2>Take a breather.</h2><p>Your timer is paused.</p></div>}
            </div>}

          <div className="arena-controls">
            {game.phase !== 'finished' && <div className="timing-area"><div className="timing-label"><span>Time your boost</span><span className="caption muted">Aim for green</span></div><div className={`timing-track ${game.attempted ? 'sweep-used' : ''}`} aria-hidden="true"><span className="target-zone" style={{ left: `${(game.target - TARGET_RADIUS) * 100}%`, width: `${TARGET_RADIUS * 200}%` }}><span className="perfect-zone"/></span><span className="timing-needle" ref={game.needle}/></div><div className="timing-scale caption muted"><span>Early</span><span>Sweet spot</span><span>Late</span></div></div>}
            <button type="button" className={`button primary start-button ${game.phase === 'playing' ? 'boost-button' : ''}`} disabled={game.phase === 'countdown'} onClick={game.phase === 'playing' ? game.boost : game.phase === 'paused' ? game.resume : start}>
              <Icon name={game.phase === 'playing' ? 'bolt' : 'play'} size={20}/><span>{game.phase === 'ready' ? 'Start round' : game.phase === 'countdown' ? 'Get ready…' : game.phase === 'playing' ? 'Boost' : game.phase === 'paused' ? 'Resume round' : 'Play again'}</span>{game.phase !== 'playing' && game.phase !== 'countdown' && <Icon name="arrow" size={20}/>}</button>
            {game.phase === 'finished' && result ? <div className="result-actions">{!result.entry.address && <button className="text-button" onClick={register}><Icon name="wallet" size={16}/>Name this score</button>}<button className="text-button" onClick={() => void copyScore()}><Icon name="copy" size={16}/>{copyNote || 'Copy score'}</button></div> : <p className="play-instruction">{game.phase === 'paused' ? 'Pick up right where you left off.' : <>Tap Boost or press <kbd>Space</kbd> when the marker hits green.</>}</p>}
          </div>
          <div className="arena-bottomline"><span><span className="guest-dot"/>{playerRef.current?.name ?? identity?.name ?? 'Guest'}{!identity && !playerRef.current && ' mode'}</span><span><Icon name="shield" size={13}/>Free to play · No gas</span></div>
          <p className="sr-only" role="status" aria-atomic="true">{countdownText}</p>
        </section>

        <aside className="arena-sidebar"><PowerPanel feed={feed} onOpen={game.pause}/><Leaderboard scores={board.scores} latestId={result?.entry.id} onRegister={register} identity={identity} error={board.error}/></aside>
      </div>

      <section className="how-to-section" id="how-to-play" aria-labelledby="how-heading"><div className="how-heading"><h2 id="how-heading">Find your squeek spot.</h2><p className="muted">Three steps to your next personal best.</p></div><ol className="how-steps"><li><span className="step-number">01</span><div><h3>Catch the green</h3><p>Tap Boost or press Space as the marker enters the green zone. The center lands a perfect hit.</p></div></li><li><span className="step-number">02</span><div><h3>Keep the streak</h3><p>You get one boost per sweep. Chain hits for a combo bonus; a miss resets the streak.</p></div></li><li><span className="step-number">03</span><div><h3>Ride the hamster power</h3><p>Real settled work adds up to 2.50× power. Reach 2,500 points in 35 seconds to win.</p></div></li></ol></section>

      <section className="about-section" id="about" aria-labelledby="about-heading"><div className="about-mark"><HamsterMark/></div><div><h2 id="about-heading">A community game for Squeekchain</h2><p>Squeek Arena is a community project built for the Squeekchain Buildooooor badge. A little skill, a little hamster energy, and a lot of reasons to try one more round.</p><p className="caption muted">Built on public Squeekchain data on Ethereum Sepolia. Scores and names stay in your browser. Bragging rights only.</p></div><a className="button" href="https://sepolia.squeekchain.com/" target="_blank" rel="noreferrer">Meet Squeekchain<Icon name="external" size={16}/></a></section>
    </main>
    <footer className="site-footer shell"><span>Made for the love of tiny paws.</span><div><span className="network-label"><span className="network-mark"/>Ethereum Sepolia</span><a href="https://docs.squeekchain.com/developers/api/" target="_blank" rel="noreferrer">Data source<Icon name="external" size={13}/></a></div></footer>

    {help && <Modal title="Your next 35 seconds" onClose={() => setHelp(false)}>
      <ol className="help-list"><li>Start a round and watch the marker sweep across the timing bar.</li><li>Tap <strong>Boost</strong> or press <kbd>Space</kbd> in the green zone. One attempt per sweep.</li><li>A perfect center hit earns 100 base points; a good hit earns 60. Misses earn zero and break your combo.</li><li>Every five consecutive hits adds 10% combo power, up to 50%. The real hamster multiplier applies to each hit.</li></ol>
      <div className="win-rules"><p><strong>Win</strong><span>{number(WIN_SCORE)}+ points</span></p><p><strong>Draw</strong><span>{number(DRAW_SCORE)}–{number(WIN_SCORE - 1)} points</span></p><p><strong>Lose</strong><span>Below {number(DRAW_SCORE)} points</span></p></div>
      <p className="muted">Press Escape or the pause button for a break. Switching tabs pauses the round automatically. Feed unavailable? Keep playing with the base 1.00× boost.</p>
      <button className="button primary full-width" onClick={() => setHelp(false)}><Icon name="check" size={18}/>Got it</button>
    </Modal>}
  </>;
}
