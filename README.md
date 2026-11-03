# Squeek Arena

A complete, static, single-page rhythm game for Squeekchain on **Ethereum Sepolia (11155111)**. Time your boosts, build a combo, and chase a personal best with help from Squeektoshi’s real settled wheel work. This community project was built for the **Squeekchain Buildooooor badge**.

The finished site is in **`dist/`**. It includes all required JavaScript, artwork, fonts, wallet marks, favicon and share-card assets, with relative URLs. It works at a static gateway subpath or an `*.imd.site` address, without a backend, API key, environment file, relay or WalletConnect project ID.

## Play

1. Select **Start round**. A three-count countdown leads into a **35-second** game.
2. Tap **Boost**, activate the button with the keyboard, or press **Space** over the game when the marker reaches green. There is one attempt per sweep. The center is a perfect hit.
3. Keep the streak going. A miss, including an unplayed sweep, resets the combo. Chase a higher score next round.

Use the pause control or **Escape** for a break. Opening help, a wallet sheet, hamster-power details, or a navigation section pauses play. Hiding the browser tab pauses the timer automatically. Resume explicitly when ready. Sound starts off; the sound button saves your preference locally. Reduced-motion preferences stop the decorative wheel and hamster animation; the essential timing marker remains playable.

| Result | Final score |
| --- | --- |
| Win | 2,500 or more |
| Draw | 2,250–2,499 |
| Lose | Below 2,250 |

There are no prizes, token rewards or paid entries. The competitive goal is a better personal best on this browser’s top-ten leaderboard.

## How the real hamster affects play

The client fetches the official public endpoints [pipeline status](https://api.squeekchain.com/v1/status) and [SqueekCore state](https://api.squeekchain.com/v1/core) at startup, at round start and every **12 seconds**, including during play. See the [official API reference](https://docs.squeekchain.com/developers/api/).

`/v1/core` supplies the settled frontier and `RoundRecorded` / `BatchSettled` events. The app reconstructs the **latest six certified 10-minute rounds**, including certified zero-work rounds. Work from older rounds, queued work and optimistic projections never contribute. An event batch that may be truncated is treated as unknown, rather than silently assigning zero work. Integer identifiers are handled as `bigint`; used work values are checked before conversion to numbers. The response must have supported schema version 1, available status and Sepolia chain identity.

For the total work `W` in that six-round window:

```text
hamster multiplier = round(1 + min(W / 1200, 1.5), 2 decimals)
hit score = round(base points × combo bonus × current hamster multiplier)
```

A perfect hit has **100** base points; a good green-zone hit has **60**. Every five consecutive hits adds 10% combo bonus, capped at 50%. Hamster power ranges from **1.00× to 2.50×**. For example, 600 real work units gives 1.50×; 1,800 gives the 2.50× maximum. Each successful hit uses the power shown at that instant, so a newly settled batch can change the boost during the round.

`/v1/status` supplies independent wheel telemetry: running/resting status, freshness, RPM and sensor provenance. Distance is parsed in kilometres from `distanceMm`; it does not affect scoring. The wheel can be resting now while earlier settled work still gives a boost. On-chain round time is separate from the game’s 35-second timer; official rounds may have settlement and confirmation delays. The API’s safe indexed view waits for 12 confirmations.

Unavailable, malformed, unsupported or timed-out settlement data switches play to the explicitly labeled **1.00× base power**. The last known chart is labeled as such. Requests time out after 8 seconds. Failed reads back off from 12 to 60 seconds, and `Retry-After` from either endpoint is respected. A retry countdown explains when the feed can be refreshed. Last successful data expires after 45 seconds without a usable refresh. Scores record whether their successful hits used live data, base power, or a mixture, plus their average multiplier. A valid quiet window is a real 1.00× live result, not an outage.

## Optional wallet registration

Play immediately as Guest. **Connect** offers EIP-6963-discovered browser wallets by their own names and icons, a browser-wallet fallback, and Coinbase Wallet / Smart Wallet through the Coinbase SDK. A phone without an extension gets links to open this exact page in MetaMask, Coinbase Wallet, Rabby or Phantom. Rabby’s link follows its [public mobile universal-link handler](https://github.com/RabbyHub/rabby-mobile/blob/develop/apps/mobile/src/hooks/universalLink.ts). No relay or project ID is used.

**Register player name** requests a plain wallet signature containing the chosen name, wallet address, current site origin, Sepolia ID, fresh nonce and timestamp, and an explicit statement that it only saves a local name. The app verifies the signature before saving it. EOA signatures verify locally; ERC-1271 / ERC-6492 contract-wallet signatures use a read-only public client. The RPC is configured in `src/chain.ts`. Wallets on another chain get a Sepolia switch, with the connector’s add-network fallback. There are no transaction, approval, transfer, balance or private-key flows.

The verified profile and best ten round records persist in `localStorage`. Registering after a guest round can attach that name to the latest score; future rounds use the connected registered name. A restored profile is reverified. A signature rejection leaves the form usable and gives a retry instruction. Disconnecting returns future play to Guest.

Scores are **local and editable by the browser owner**, not a shared or cheat-resistant ranking. Signing proves ownership of a local player name; it does not certify gameplay. Browser storage, the wallet SDK, installed wallet apps and the public data service have their own availability constraints. When storage is denied, the game keeps working for the current visit and says that scores cannot survive a reload.

## Install, develop, preview and rebuild

Use **Node.js 22.12+** and npm. Dependencies are pinned in `package-lock.json`.

```sh
npm ci
npm run dev
```

Build and inspect the production export:

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

Open the URL printed by Vite. Serve `dist/` over HTTP; opening `index.html` directly with `file://` is unsupported. The export uses `base: './'`, one page and ordinary fragment anchors. There is no server-side routing. Rebuilding replaces `dist/`, which is intentionally included in the delivery. Hosting and publication are handled outside this repository task.

For repeatable browser checks of the actual export at `/preview/`:

```sh
npx playwright install chromium webkit
# On Linux, install Playwright's required system libraries if needed.
npm run build
npm run test:browser
```

The browser runner starts and stops its own static preview server. API fixtures are restricted to `tests/`; none are bundled into the application. Wallet tests create an ephemeral account inside the Node test runner and expose only its public address and signing interface to a simulated EIP-6963 provider. No test private key is stored or shipped.

Final worker results on 2026-11-03:

| Check | Actual result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm test` | 13/13 passed |
| `npm run build` | Passed; complete relative-URL export in `dist/` |
| `npm run test:browser` | 22/22 passed across Chromium and WebKit |
| Pinned `taste.mjs` design probe | 16/16 passed at 320, 390 and 1440px |
| Live API round | Both official endpoints returned HTTP 200; 2,552-point Win at the real 1.00× quiet-window multiplier |
| Text enlarged to 200% | No horizontal overflow at 320, 390, 768 or 1440px |

The screenshot evidence and measured details are in `artifacts/`. Physical wallet-app handoffs, a real Coinbase passkey account, native browser zoom and screen-reader sessions were not performed. Six scene text boxes over gradients/images were not contrast-measured by the probe; the measured solid text pairs passed. These are worker checks, not an independent certification.

## Validation and design

Actual executed checks, observations, fixes and remaining limits are recorded in [`artifacts/validation.md`](artifacts/validation.md). The implemented six-domain design system is documented in [`DESIGN.md`](DESIGN.md), and the explicit submission/ignore-path budget is in [`artifacts/PATH_BUDGET.md`](artifacts/PATH_BUDGET.md).

The worker installs dependencies and browser libraries outside the repository and runs the same package scripts on an otherwise identical source copy, respecting this task’s repository restrictions. The resulting export is copied to the required `dist/` delivery path. A dependency emits a Vite `node:worker_threads` browser-externalization warning from `ox`’s unused Tempo code. Actual browser runs checked gameplay and the simulated-wallet registration path despite that warning.

## Assets and acknowledgements

Hamster artwork, favicon and share-card composition are original inline/vector assets in `src/components/Hamster.tsx`, `public/favicon.svg` and `src/assets/social-card.svg`. `public/social-card.png` is the local 1200×630 raster share card. Space Grotesk is bundled as WOFF2 with its SIL Open Font License. Wallet marks come from RainbowKit with its MIT notice in `public/wallets/LICENSE.txt`.

The design process applies Jakub Krehel’s **Better Interface** (MIT, pinned commit `267330e1adfc66a718fb65fa6918c1f06d0a689e`) and Paul Bakaus’s **Impeccable** documentation method (Apache-2.0, pinned commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`). The supplied combined notices are retained in `artifacts/design-guidance-LICENSE.txt`. Squeekchain API data is fetched at runtime from the official service; the game is an independent community project.
