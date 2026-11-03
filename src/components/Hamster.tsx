export function Hamster({ playing = false }: { playing?: boolean }) {
  return <svg className={`hamster-scene ${playing ? 'is-running' : ''}`} viewBox="0 0 600 330" fill="none" aria-hidden="true">
    <defs>
      <radialGradient id="ambient"><stop stopColor="#b5ed65" stopOpacity=".13"/><stop offset="1" stopColor="#b5ed65" stopOpacity="0"/></radialGradient>
      <linearGradient id="rim" x1="170" y1="40" x2="425" y2="290" gradientUnits="userSpaceOnUse"><stop stopColor="#778778"/><stop offset=".4" stopColor="#344b36"/><stop offset="1" stopColor="#26372a"/></linearGradient>
      <linearGradient id="fur" x1="260" y1="130" x2="330" y2="257" gradientUnits="userSpaceOnUse"><stop stopColor="#efc996"/><stop offset="1" stopColor="#bd8556"/></linearGradient>
      <linearGradient id="head" x1="260" y1="90" x2="330" y2="193" gradientUnits="userSpaceOnUse"><stop stopColor="#f4d2a4"/><stop offset="1" stopColor="#d7a16e"/></linearGradient>
      <linearGradient id="belly" x1="290" y1="166" x2="310" y2="246" gradientUnits="userSpaceOnUse"><stop stopColor="#fff1d6"/><stop offset="1" stopColor="#e7c49b"/></linearGradient>
    </defs>
    <ellipse cx="300" cy="180" rx="225" ry="157" fill="url(#ambient)"/>
    <g opacity=".38" stroke="#4a5749" strokeWidth="1"><path d="M65 266h470M85 284h430M110 305h380M220 253l-35 62m75-62-15 62m55-62v62m40-62 15 62m25-62 35 62"/></g>
    <ellipse cx="300" cy="283" rx="141" ry="14" fill="#b5ed65" opacity=".08"/>
    <path d="m251 257-17 27h132l-17-27" fill="#202c23" stroke="#526348" strokeWidth="2"/>
    <path d="M225 284h150" stroke="#a9d67d" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="300" cy="155" r="128" stroke="#1e2921" strokeWidth="16"/>
    <circle cx="300" cy="155" r="128" stroke="url(#rim)" strokeWidth="6"/>
    <circle cx="300" cy="155" r="113" fill="#141b17" fillOpacity=".5" stroke="#394c37" strokeWidth="2"/>
    <g className="wheel-treads" style={{ transformOrigin: '300px 155px' }}>
      <circle cx="300" cy="155" r="121" stroke="#6d8359" strokeWidth="5" strokeDasharray="2 18"/>
      <path d="M300 46v218M191 155h218M223 78l154 154M223 232 377 78" stroke="#3e5335" strokeWidth="1.5" opacity=".48"/>
      <circle cx="300" cy="155" r="128" stroke="#b6ed70" strokeWidth="5" strokeDasharray="122 682" strokeLinecap="round" transform="rotate(-65 300 155)"/>
      <circle cx="300" cy="155" r="128" stroke="#c1a1ec" strokeWidth="4" strokeDasharray="30 774" strokeLinecap="round" transform="rotate(125 300 155)"/>
    </g>
    <g className="hamster-body">
      <path d="M248 214c-32 1-33 30-11 29 13-1 20-13 20-13" fill="#c99566"/>
      <ellipse cx="300" cy="209" rx="55" ry="56" fill="url(#fur)"/>
      <ellipse cx="300" cy="214" rx="34" ry="38" fill="url(#belly)"/>
      <g className="hamster-feet"><ellipse cx="269" cy="255" rx="23" ry="12" transform="rotate(-10 269 255)" fill="#efc59b"/><ellipse cx="333" cy="255" rx="23" ry="12" transform="rotate(10 333 255)" fill="#efc59b"/><path d="m261 255 1 5m7-6 1 5m58-5-1 5m8-4-1 5" stroke="#be8a6d" strokeWidth="2" strokeLinecap="round"/></g>
      <ellipse cx="253" cy="110" rx="24" ry="27" transform="rotate(-24 253 110)" fill="#d9a574"/>
      <ellipse cx="253" cy="110" rx="15" ry="18" transform="rotate(-24 253 110)" fill="#d78d88"/>
      <ellipse cx="347" cy="110" rx="24" ry="27" transform="rotate(24 347 110)" fill="#d9a574"/>
      <ellipse cx="347" cy="110" rx="15" ry="18" transform="rotate(24 347 110)" fill="#d78d88"/>
      <path d="M236 154c-1-46 27-62 64-62s65 16 64 62c-1 37-28 51-64 51s-63-14-64-51" fill="url(#head)"/>
      <path d="M300 106c-11 15-13 28-11 40h22c2-12 0-25-11-40" fill="#fae2bc"/>
      <path d="M253 170c4-17 23-19 47-15 24-4 43-2 47 15 5 21-18 31-47 31s-52-10-47-31" fill="#fff0d2"/>
      <ellipse cx="270" cy="147" rx="9" ry="12" transform="rotate(-6 270 147)" fill="#211e21"/>
      <ellipse cx="330" cy="147" rx="9" ry="12" transform="rotate(6 330 147)" fill="#211e21"/>
      <circle cx="267" cy="143" r="3" fill="#fff"/><circle cx="327" cy="143" r="3" fill="#fff"/>
      <circle cx="272" cy="153" r="1.5" fill="#9c7d6b"/><circle cx="332" cy="153" r="1.5" fill="#9c7d6b"/>
      <ellipse cx="258" cy="169" rx="10" ry="6" fill="#e7a09a" opacity=".65"/><ellipse cx="342" cy="169" rx="10" ry="6" fill="#e7a09a" opacity=".65"/>
      <path d="M293 163c2-5 12-5 14 0 0 4-7 7-7 7s-7-3-7-7" fill="#cc8584"/>
      <path d="M300 170v6m0 0c-4 6-8 5-11 3m11-3c4 6 8 5 11 3" stroke="#83614f" strokeWidth="2" strokeLinecap="round"/>
      <path d="M295 182h10v8a5 5 0 0 1-10 0z" fill="#fffdf1"/><path d="M300 183v8" stroke="#d7c9a9"/>
      <path d="m247 173-22-5m24 12-26 3m130-10 22-5m-24 12 26 3" stroke="#d7bf9c" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M237 146c-8-66 134-66 126 0" stroke="#1f2924" strokeWidth="10"/>
      <path d="M241 123c20-36 98-36 118 0" stroke="#b9ed77" strokeWidth="4"/>
      <rect x="231" y="131" width="14" height="30" rx="6" fill="#354936" stroke="#8cba64" strokeWidth="2"/>
      <rect x="355" y="131" width="14" height="30" rx="6" fill="#354936" stroke="#8cba64" strokeWidth="2"/>
      <path d="m360 160-9 18h-12" stroke="#85b765" strokeWidth="3" strokeLinecap="round"/><rect x="333" y="174" width="11" height="7" rx="3" fill="#c0f47e"/>
      <ellipse cx="255" cy="216" rx="13" ry="19" transform="rotate(-33 255 216)" fill="#e5b487"/>
      <ellipse cx="345" cy="216" rx="13" ry="19" transform="rotate(33 345 216)" fill="#e5b487"/>
      <path d="m292 211 12-8-2 12 9-1-17 18 2-15-8 2z" fill="#b8d987"/>
    </g>
    <g stroke="#b9ed77" strokeWidth="2" strokeLinecap="round"><path d="M145 125v10m-5-5h10M444 219v8m-4-4h8"/><path d="m431 80 7 4-7 4-7-4z" fill="#b9ed77" fillOpacity=".25"/></g>
    <g stroke="#c1a1ec" strokeWidth="2"><path d="m160 233 6 4-6 4-6-4z" fill="#c1a1ec" fillOpacity=".2"/><circle cx="449" cy="143" r="3"/></g>
    <g opacity=".5" fill="#7d9970"><circle cx="184" cy="66" r="2"/><circle cx="408" cy="261" r="2"/><circle cx="473" cy="188" r="2"/><circle cx="127" cy="191" r="2"/></g>
    <path d="M97 154h37m-25 7h25M465 103h37m-37 7h25M431 255h43" stroke="#4d6351" strokeWidth="1.5"/>
  </svg>;
}

export function HamsterMark() {
  return <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M7 15C0-1 16 0 16 9h8C24 0 40-1 33 15c9 18-3 23-13 23S-2 33 7 15" fill="#b9ed77"/><circle cx="13" cy="21" r="2.5" fill="#141914"/><circle cx="27" cy="21" r="2.5" fill="#141914"/><path d="m17 27 3 3 3-3" stroke="#141914" strokeWidth="2.5" strokeLinecap="round"/><path d="M6 13c-1-7 4-8 6-3m22 3c1-7-4-8-6-3" stroke="#141914" strokeWidth="2.5" strokeLinecap="round"/></svg>;
}
