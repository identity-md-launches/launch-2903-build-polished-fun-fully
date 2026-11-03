import { useEffect, useRef, useState, type FormEvent } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useConnection, useConnect, useDisconnect, useSignMessage, useSwitchChain, usePublicClient, type Connector } from 'wagmi';
import { getAddress, verifyMessage } from 'viem';
import { sepolia } from 'viem/chains';
import { config } from '../chain';
import { OPEN_IN, isMobileBrowser } from '../open-in';
import { PROFILE_KEY, type Identity } from '../storage';
import { Icon } from './Icon';
import { Modal } from './Modal';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const asset = (name: string) => `${import.meta.env.BASE_URL}wallets/${name}.svg`;
interface Props { registerRequested: boolean; onRegisterHandled: () => void; onIdentity: (identity: Identity | null) => void; onOpen: () => void }
interface SignedProfile extends Identity { message: string; signature: `0x${string}` }

function WalletInner({ registerRequested, onRegisterHandled, onIdentity, onOpen }: Props) {
  const { address, isConnected, chainId } = useConnection();
  const { connectors, connectAsync, isPending, variables } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync, isPending: signing } = useSignMessage();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const client = usePublicClient({ chainId: sepolia.id });
  const [open, setOpen] = useState<'connect' | 'account' | 'register' | null>(null);
  const [name, setName] = useState('');
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [notice, setNotice] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [nameError, setNameError] = useState('');
  const addressRef = useRef(address); addressRef.current = address;
  const wantsRegister = useRef(false);
  const pendingId = useRef(0);
  const mobile = isMobileBrowser();
  const connected = isConnected && !!address;
  const wrongChain = connected && chainId !== sepolia.id;

  async function checkSignature(profile: SignedProfile) {
    try { if (await verifyMessage({ address: profile.address, message: profile.message, signature: profile.signature })) return true; }
    catch { /* Contract-wallet signatures use the public client below. */ }
    return await client?.verifyMessage({ address: profile.address, message: profile.message, signature: profile.signature }) ?? false;
  }

  useEffect(() => {
    let cancelled = false;
    pendingId.current++;
    setIdentity(null); onIdentity(null);
    if (!connected || !address) return;
    const currentAddress = address;
    async function restore() {
      try {
        const p: SignedProfile | null = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null');
        if (!p || typeof p.name !== 'string' || p.name.length < 2 || p.name.length > 20 ||
          p.address?.toLowerCase() !== currentAddress.toLowerCase() || typeof p.message !== 'string' ||
          !p.message.includes(`Name: ${p.name}\n`) || !p.message.includes(`Site: ${location.origin}\n`) ||
          !p.message.startsWith('Squeek Arena registration\n') || typeof p.signature !== 'string') return;
        if (await checkSignature(p) && !cancelled) {
          const who = { name: p.name, address: getAddress(currentAddress) };
          setIdentity(who); setName(p.name); onIdentity(who);
        }
      } catch { /* An unreadable or invalid registration can be replaced with a fresh signature. */ }
    }
    void restore();
    return () => { cancelled = true; };
    // Registration is rechecked for each connected address, including automatic reconnection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, connected]);

  useEffect(() => {
    if (registerRequested) {
      wantsRegister.current = true; setNotice('');
      setOpen(connected ? 'register' : 'connect'); onOpen(); onRegisterHandled();
    }
  }, [registerRequested, connected, onRegisterHandled, onOpen]);

  function close() {
    setOpen(null); setNotice(''); setNameError(''); wantsRegister.current = false;
  }
  async function connectWallet(connector: Connector) {
    setNotice('');
    try {
      await connectAsync({ connector });
      setOpen(wantsRegister.current ? 'register' : null);
    } catch {
      setNotice('Connection was not completed. Try again or choose another wallet.');
    }
  }
  async function switchNetwork() {
    setNotice('');
    try { await switchChainAsync({ chainId: sepolia.id }); }
    catch { setNotice('Could not switch to Sepolia. Approve the network in your wallet and try again.'); }
  }
  function messageFor(displayName: string, nonce: string, issued: string) {
    return `Squeek Arena registration\n\nName: ${displayName}\nWallet: ${address}\nSite: ${location.origin}\nChain: Ethereum Sepolia (11155111)\nNonce: ${nonce}\nIssued: ${issued}\n\nSave this name and my scores only in this browser. This signature does not authorize transactions, transfers, or spending.`;
  }
  async function register(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice(''); setNameError('');
    const clean = name.trim();
    if (clean.length < 2 || clean.length > 20 || !/^[\p{L}\p{N} _.-]+$/u.test(clean)) {
      setNameError('Use 2–20 letters, numbers, spaces, dots, hyphens or underscores.');
      document.getElementById('player-name')?.focus(); return;
    }
    if (!address || wrongChain) return;
    const registeringAddress = address;
    const request = ++pendingId.current;
    try {
      const message = messageFor(clean, crypto.randomUUID(), new Date().toISOString());
      const signature = await signMessageAsync({ message });
      setVerifying(true);
      const profile: SignedProfile = { name: clean, address: getAddress(registeringAddress), message, signature };
      const valid = await checkSignature(profile);
      if (request !== pendingId.current || addressRef.current !== registeringAddress) return;
      if (!valid) throw new Error('Signature could not be verified');
      let saved = true;
      try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch { saved = false; }
      setIdentity(profile); onIdentity({ name: clean, address: profile.address });
      if (saved) close();
      else setNotice('Name registered for this visit. Browser storage is unavailable, so it cannot survive a reload.');
    } catch {
      setNotice('Registration was not completed. Check your wallet and try signing again.');
    } finally { setVerifying(false); }
  }

  const named = connectors.some((c) => c.type === 'injected' && c.id !== 'injected');
  const listed = [...connectors.filter((c) => c.type === 'injected'), ...connectors.filter((c) => c.type !== 'injected')]
    .filter((c) => !(c.id === 'injected' && named));
  const label = (c: Connector) => c.id === 'injected' ? 'Browser wallet' : c.id === 'coinbaseWalletSDK' ? mobile ? 'Coinbase Smart Wallet' : 'Coinbase Wallet' : c.name;
  const modalTitle = open === 'connect' ? 'Connect a wallet' : open === 'register' ? 'Make a name for yourself' : 'Your arena identity';

  return <>
    <button type="button" className={`button wallet-button ${wrongChain ? 'network-warning' : ''}`} onClick={() => {
      onOpen(); setNotice(''); setOpen(connected ? 'account' : 'connect');
    }}><Icon name="wallet" size={18} /><span>{wrongChain ? 'Switch to Sepolia' : connected ? short(address) : 'Connect'}</span></button>
    {open && <Modal title={modalTitle} onClose={close} className="wallet-modal">
      {open === 'connect' && <>
        <p className="modal-description">Bring a name to the leaderboard. Playing as a guest is always free.</p>
        <div className="wallet-list">
          {mobile && !named && OPEN_IN.map((w) => <a className="wallet-row" href={w.href(location.href)} key={w.id}>
            <img src={asset(w.id)} alt="" width="28" height="28" /><span>Open in {w.name}</span><Icon name="external" size={16}/>
          </a>)}
          {listed.filter((c) => !mobile || named || c.type !== 'injected').map((c) => <button type="button" key={c.uid} className="wallet-row" disabled={isPending} onClick={() => void connectWallet(c)}>
            {c.icon ? <img src={c.icon} alt="" width="28" height="28" /> : c.id === 'coinbaseWalletSDK' ? <img src={asset('coinbase')} alt="" width="28" height="28" /> : <Icon name="wallet" size={28} />}
            <span>{label(c)}</span>{isPending && variables?.connector === c ? <span className="spinner" aria-label="Opening wallet"/> : <Icon name="arrow" size={18}/>}
          </button>)}
        </div>
        <p className="caption muted"><Icon name="shield" size={16}/> A signature for a local name. No gas or transactions.</p>
      </>}
      {open === 'account' && connected && <>
        <p className="account-name">{identity?.name ?? 'Guest with a wallet'}</p>
        <p className="address-full">{getAddress(address)}</p>
        <p className="muted">{wrongChain ? 'Switch to Ethereum Sepolia to register a name.' : 'Ethereum Sepolia · Connected'}</p>
        <div className="stack">
          {wrongChain && <button className="button primary" disabled={switching} onClick={() => void switchNetwork()}>{switching ? 'Switching…' : 'Switch to Sepolia'}</button>}
          <button className={`button ${wrongChain ? '' : 'primary'}`} onClick={() => { setOpen('register'); setNotice(''); }}>{identity ? 'Change player name' : 'Register player name'}</button>
          <button className="button" onClick={() => { pendingId.current++; disconnect(); setIdentity(null); onIdentity(null); close(); }}>Disconnect</button>
        </div>
      </>}
      {open === 'register' && <form onSubmit={(e) => void register(e)}>
        <p className="modal-description">Sign once to save your name on this browser’s leaderboard. Your latest round gets the name, too.</p>
        <label className="input-label" htmlFor="player-name">Player name</label>
        <input id="player-name" name="nickname" autoComplete="nickname" maxLength={20} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. SnackBandit" aria-invalid={!!nameError} aria-describedby={nameError ? 'name-error' : 'name-hint'} />
        <p id="name-hint" className="caption muted">2–20 characters. Pick something squeek-worthy.</p>
        {nameError && <p id="name-error" role="alert" className="error-message">{nameError}</p>}
        <details className="signature-details"><summary>What am I signing?</summary><p>“Squeek Arena registration”, your name, wallet, this site’s origin, Sepolia chain ID, a random nonce and the time. It authorizes only a local player name and grants no spending permission.</p></details>
        {wrongChain ? <button type="button" className="button primary full-width" disabled={switching} onClick={() => void switchNetwork()}>{switching ? 'Switching…' : 'Switch to Sepolia'}</button> :
          <button type="submit" className="button primary full-width" disabled={!connected || signing || verifying}><Icon name="wallet" size={18}/>{signing ? 'Register · Check your wallet…' : verifying ? 'Register · Verifying…' : 'Register with signature'}</button>}
      </form>}
      <p className="wallet-notice error-message" role="status">{notice}</p>
    </Modal>}
  </>;
}

export default function WalletControl(props: Props) {
  return <WagmiProvider config={config}><QueryClientProvider client={queryClient}><WalletInner {...props}/></QueryClientProvider></WagmiProvider>;
}
