let audio: AudioContext | null = null;
export function tone(kind: 'perfect' | 'nice' | 'miss' | 'start' | 'finish', enabled: boolean) {
  if (!enabled) return;
  try {
    audio ??= new AudioContext();
    void audio.resume();
    const now = audio.currentTime;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = kind === 'miss' ? 'triangle' : 'sine';
    const frequency = { perfect: 880, nice: 660, miss: 160, start: 440, finish: 1_046 }[kind];
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * (kind === 'miss' ? 0.6 : 1.4), now + 0.12);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    oscillator.connect(gain); gain.connect(audio.destination);
    oscillator.start(now); oscillator.stop(now + 0.2);
  } catch { /* Sound is optional; gameplay still works if the browser blocks audio. */ }
}
