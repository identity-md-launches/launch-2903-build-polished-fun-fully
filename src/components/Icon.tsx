import type { CSSProperties } from 'react';

const paths = {
  play: <path d="m9 5 11 7-11 7z" />,
  arrow: <><path d="M4 12h15M13 6l6 6-6 6" /></>,
  external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" /></>,
  bolt: <path d="m13 2-8 12h6l-1 8 9-13h-6z" />,
  trophy: <><path d="M8 3h8v6a4 4 0 0 1-8 0zM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 13v5M8 21h8M10 18h4" /></>,
  wallet: <><path d="M20 8V5H5a2 2 0 0 0 0 4h16v11H5a2 2 0 0 1-2-2V7M17 13h4v4h-4a2 2 0 0 1 0-4z" /></>,
  sound: <><path d="m11 4-6 5H2v6h3l6 5zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
  mute: <><path d="m11 4-6 5H2v6h3l6 5zM16 9l6 6m0-6-6 6" /></>,
  pause: <><path d="M7 5v14M17 5v14" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 8a2.5 2.5 0 1 1 4 2c-1.5 1-1.5 1.3-1.5 3M12 17h.01" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.1 6a8 8 0 0 1 13.3 3M4.6 15a8 8 0 0 0 13.3 3" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  seed: <><path d="M6 18C-1 5 9-1 17 5c8 6-2 19-11 13z" /><path d="m7 17 9-11M9 13l-3-2m6-1 1-4" /></>,
  shield: <><path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6z" /><path d="m8 12 3 3 5-6" /></>,
  copy: <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V3H3v13h5" /></>,
  flag: <><path d="M5 22V3m0 1c6-4 8 4 15 0v10c-7 4-9-4-15 0" /></>,
};
export type IconName = keyof typeof paths;
export function Icon({ name, size = 20, style, className = '' }: { name: IconName; size?: number; style?: CSSProperties; className?: string }) {
  return <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>{paths[name]}</svg>;
}
