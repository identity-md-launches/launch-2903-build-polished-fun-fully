# Worker validation

Date: **2026-11-03**. Scope: the finished Squeek Arena single-page frontend, source, lockfile, local runtime assets, `dist/` export, documentation and repeatable checks. This is the worker’s own report, not an independent network certification.

## Outcome

| Area | Final result |
| --- | --- |
| Production build and TypeScript | Passed |
| Logic/API/storage unit tests | 13 passed, 0 failed |
| Chromium/WebKit interactions | 22 passed, 0 failed, 0 skipped, 0 flaky |
| Pinned taste@1 probe | 16/16 checks passed |
| Product and complete Start action at 390×844 | Yes; action box x=35, y=702.36, width=320, height=50 |
| Default reflow | No horizontal overflow at 320, 390, 768 or 1440px; 1280px also inspected through the supplied browser |
| 200% root-text enlargement | No horizontal overflow at 320, 390, 768 or 1440px |
| Share assets | Title, description, favicon, `og:title`, `og:image`; real local 1200×630 PNG |
| Unresolved implementation findings | None observed within the stated scope |

The visual idea is one warm illustrated hamster in a precise neon wheel, with lime energy cues on a quiet charcoal interface. Ordinary choices made without an interview: 35 seconds of play after a three-second countdown; a fixed 2,500-point win goal and a narrow draw band; a local top-ten board; no prizes, shared ranking, backend or on-chain writes.

## Brief coverage

| Requirement | Status and implementation |
| --- | --- |
| “fully playable single-page game” | Met: real timing input, one attempt per sweep, perfect/good/missed hits, combo scoring, timer, pause and replay; `src/useArena.ts`, `src/game.ts`, arena in `src/App.tsx` |
| “Player connects wallet (optional)” | Met: instant Guest play and one header connect control; `WalletControl.tsx` |
| “30–45 seconds” | Met: 35 seconds of active play, excluding countdown and pauses |
| “fetches the latest settled work / distance data” | Met: official `/v1/core` and `/v1/status` fetched at startup, round start and every 12 seconds; work reconstructed from six certified rounds; wheel distance parsed independently |
| “real performance…affects…score multiplier” | Met: real settled work maps to 1.00×–2.50× at each hit; no random activity or seeded live readings |
| “score, result (Win / Lose / Draw)…flavor text” | Met: result view, exact score boundaries, perfect hits/combo/average power and work-based flavor; all three boundaries unit-tested; Win and Lose rendered in browser runs |
| “local leaderboard…localStorage” | Met: best ten real results, persistent sorting, explicit browser-local labeling, storage denial handling |
| “Register…wallet signature…save their name” | Met: signed origin/name/address/chain/nonce/time, verification, local save, guest-score naming, reload/reverification and disconnect tested through a simulated injected provider |
| “Dark…cyber + hamster…smooth…mobile-friendly” | Met: original SVG wheel/hamster, local font, restrained feedback and optional sound, responsive game and bottom sheets |
| “Loading and error states” | Met: syncing, unavailable/unknown, stale/last-known, neutral scoring, retry countdown, signature rejection and recoverable form errors |
| “pure frontend…official public APIs…static site” | Met: Vite/React/TypeScript, no backend/private credentials/transaction requests; tested from `/preview/` with relative assets |
| “About…community…Buildooooor badge” | Met: visible About section and README explanation; no claim that a badge was awarded |
| “dist/index.html…source and lockfile” | Met: complete export retained with all local assets; reproducible manifest/lockfile and source included |
| “build, typecheck…useful interaction validation” | Met: actual commands/results below; tests included for repetition |
| “Better Interface…six domains…DESIGN.md” | Met: all six domains read/applied/reviewed; findings fixed; source-grounded root design document included |

Hosting/publication is outside this task and happens after delivery. No publishing command or Git metadata mutation was performed.

## Commands and actual evidence

Dependencies and browser downloads were installed outside the repository. The worker ran the standard package scripts on an identical source copy, then copied its clean production export into `dist/`. No `node_modules`, npm cache, browser binary or vendored registry is part of this submission.

- `npm run typecheck`: exit 0, `tsc --noEmit` over the application and Vite configuration.
- `npm test`: exit 0, **13/13**. Tests cover sweep geometry, score distinctions, combo limits, win/draw/lose boundaries, work scaling, certified zeros, missing/truncated history, wrong network/schema/unavailable responses, integer overflow, telemetry freshness and units, top-ten ranking, tie stability across reload, corrupt and denied storage.
- `npm run build`: exit 0, Vite 8.3.5 production build. Eight JS chunks and one CSS file, no source maps or dependency archives. The dependency warning about `node:worker_threads` from `ox`’s unused Tempo path remains; it caused no observed application failure in the checked browser paths.
- `npm run test:browser -- --reporter=list,json`: exit 0, **22/22**, 11 flows each in Chromium and WebKit. Final per-test statuses and durations are retained in [`browser-tests.json`](browser-tests.json). The runner owns and closes its static server at a `/preview/` subpath.
- `node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste`: exit 0 against the final export, with Playwright installed externally and supplied through `IMD_PLAYWRIGHT`. **16/16**. Summary and actual probe messages are retained in [`design-probe.json`](design-probe.json). Original probe screenshots were produced in the assignment’s disposable scratch directory.
- A separate live-service browser run used **no API fixtures**. Both `/v1/core` and `/v1/status` returned HTTP 200 through the round. It completed a **2,552-point Win**, 32 successful hits, average real power **1.00×**, and the quiet-work flavor. This was automated play through the rendered timing bar and actual Boost button, without injecting app scores or state. See [`browser-observations.json`](browser-observations.json) and the retained screenshots below.
- The supplied browser tool navigated the actual export at 1280px, inspected its screenshot and accessibility tree, activated Start, scored a real 100-point hit with Space, paused at 00:34 with Escape, opened/closed help, and reported **0 console warnings/errors**. Separate final browser observations recorded **0 script errors and 0 missing local assets**.

The cross-browser suite exercises countdown, successful input, one-hit-per-sweep spam guard, native Space on pause, Escape after resume, paused timer stability, replay/reset, loss persistence, real-time winning rounds, in-round polling, API loading/failure/HTTP-200 unavailability/recovery, mixed live/base scoring, telemetry `Retry-After`, denied storage, mobile wallet rows, EIP-6963 discovery, wrong-network/add-network fallback, name validation, rejected signing, actual EOA signature verification, naming a completed Guest score, profile reload and disconnect. It also checks reduced-motion decoration and default/200% text reflow. Axe found **zero violations** in the checked initial page, help dialog and mobile wallet sheet in both engines.

WebKit initially lacked system libraries. Compatible runtime libraries were downloaded/extracted under temporary storage and supplied at launch; the browser then ran successfully. None of those libraries are submitted. Early timing-test failures came from aiming the automation at too narrow a pixel window and letting multi-click tool latency cross into another legal sweep. The final test uses the rendered green zone and six synchronous clicks in one frame, so it tests the intended one-attempt rule without changing game logic. The 429 fixture was corrected to expose `Retry-After` through CORS, matching the actual public API.

## Better Interface coverage

The workflow, six domains’ core principles and relevant keyboard/form/motion/documentation guidance were read from the supplied pinned references before/during implementation. The final source was reviewed after fixes.

| Domain | Coverage and evidence | Remaining coverage limits |
| --- | --- | --- |
| Accessibility | Checked: native buttons/links/form/dialog; labeled inputs/icons; visible keyboard focus; modal Escape/focus return; keyboard game input; text alongside statuses; reduced-motion path; axe on representative states in both engines | No native screen-reader session, physical device, forced-colors session or complete assistive-technology audit |
| Layout | Checked: product/action first at 390; default 320/390/768/1280/1440; no probe overlap/clipping/floating obstruction; flexible enlarged-text layout; native scrolling dialog | Root text was enlarged to 200%; native browser zoom is unperformed. English LTR only; whole-page RTL and pseudo-localization were not tested |
| Writing | Checked: short distinctive headline plus plain explanation; directions beside Boost; verb-led actions; truthful local-data and unknown states; recoverable errors; one remaining two-beat headline | No translation review; flavor intentionally retains game-specific humor |
| Typography | Checked: one loaded local family, three used weights, six size tokens; tabular numbers; label/input sizes; hierarchy/wrapping; full names/addresses; enlarged text | No older-browser font fallback visual sweep or physical iOS input-zoom session |
| Colors | Checked: role tokens, actual solid foreground/background measurements, no color-only outcome; all probe-measured text passes its thresholds | Six scene text boxes over image/gradient content were not measured by the probe; no full alpha-composited overlay contrast audit |
| UI | Checked: normal actions, focus/disabled/loading/error/result states; explicit transitions; tactile press; original consistent icon set; sheet/dialog behavior; no panel shadows plus borders, nested display cards or gradient text | No 10%-speed DevTools animation-timeline review or real wallet-app/passkey interaction |

Actual computed solid pairs from the browser:

| Text/background | Ratio |
| --- | ---: |
| Primary action `#192510` / `#bbef7b` | 11.99:1 |
| Secondary panel text `#a7afa3` / `#181b18` | 7.70:1 |
| Score label `#9aa491` / `#181c18` | 6.64:1 |
| Body text `#f2f3eb` / rendered root `#101112` | 16.92:1 |

The Start focus outline was measured as 2px solid `rgb(242,243,235)` and visually inspected in the retained focus screenshot. These measurements do not establish all combinations or full accessibility compliance.

## Findings, corrections and rechecks

1. **High · keyboard shortcuts competed with native controls.** Source: `src/useArena.ts:115`, `:117`, `:120`. Earlier Space handling consumed focused utility buttons, and a subsequent exclusion also swallowed Escape while the resumed action held focus. Changed to preserve native button/link Space semantics while handling Escape independently; countdown Space also avoids scrolling away. Rechecked with keyboard pause/resume tests in Chromium/WebKit and the real API browser-tool round.

2. **High · enlarged text overflowed rigid groups.** Source: `src/styles.css:84` (`.site-header`), `:96` (`.page-intro`), `:112` (`.scoreboard`). At 200% text, 390px had a 536px document and colliding score values; 320px reached 389px, 1440px reached 1493px. Changed those groups and the power/help readouts to wrap, removed headline nowrap and made scene/countdown space grow with rem text. Final measured document widths equal **320/390/768/1440** at those viewport widths. The default first-screen action remains entirely visible. Rechecked in both engines and visually in the enlarged-text scratch screenshot.

3. **Medium · visible brand text and accessible name differed.** Source: `src/App.tsx:128`, snippet `Squeek{' '}<span className="brand-light">Arena</span>`. A CSS-only gap produced the content name `SqueekArena` while the label said `Squeek Arena home`; axe reported a label-content mismatch. Added a real space and removed the redundant CSS gap. Final axe scans pass in both engines.

4. **Medium · repeated slogans diluted the game.** Source: `src/App.tsx:142`, `:161`, `:163`. The initial probe counted six two-beat lines. Kept “Tiny paws. Massive scores.”, made the teammate/local-signature/about text factual, and changed the how-to subtitle to “Three steps to your next personal best.” The scene and lower sections retain their spacing. Final probe counts **one**, and all 16 checks pass.

5. **Medium · mobile power was below the active game.** Source: `src/App.tsx:141`, snippet `feed.multiplier.toFixed(2)` plus live/base label. Added the current real/base multiplier to the scene’s existing top line, keeping combo information at its opposite edge. Its live state is present on the final 390px first screen; the larger history panel stays below the game.

6. **Medium · retry affordance did not explain cooldown, and telemetry backoff was incomplete.** Source: `src/useFeed.ts:32`, `:43`, `:79`; `src/App.tsx:39`. Added an explicit disabled retry countdown, honored `Retry-After` from either endpoint, and retained exponential error backoff with neutral scoring. Rechecked HTTP-200 unavailable/failure/recovery, mixed-score and telemetry-429 cases in both engines. A stale request cannot overwrite a replacement request’s busy state.

7. **Medium · Rabby mobile link used an unrecognized query.** Source: `src/open-in.ts:6`, snippet `?_cmd=open-dapp&dapp=`. Corrected against Rabby Mobile’s public universal-link handler and preserved the current page’s full URL. Both engines check the exact command and decoded destination; physical app handoff remains unperformed. Existing legacy injected mobile browsers keep the Browser wallet path.

8. **Low · tied scores reordered after reload.** Source: `src/storage.ts:30`, `:40`. Read and insert sorting now share descending score/ascending timestamp order. A regression assertion saves and reloads equal scores and confirms the earlier score remains first. Unit tests pass.

Result copy was also corrected to say when a score is outside the local top ten rather than claiming a save. No unresolved observed implementation finding remains; the limitations below are retained explicitly.

## Retained screenshots

- [`mobile-390.png`](mobile-390.png): final 390×844 first screen, real quiet-window power and full Start action.
- [`desktop-1440.png`](desktop-1440.png): final full desktop page, live data, genuine empty local board, how-to and About.
- [`result-mobile-390.png`](result-mobile-390.png): actual live-service 2,552-point Win, quiet-hamster flavor, score statistics and replay.
- [`wallet-mobile-390.png`](wallet-mobile-390.png): all four native-app links, official marks and Coinbase Smart Wallet row.
- [`focus-mobile-390.png`](focus-mobile-390.png): actual visible keyboard outline around the main action.

Each image was produced from the final production export and visually inspected. No screenshot is a screen-reader or physical-device session.

## Limits and completion

The API is an external service and may become unavailable; the game explicitly falls back to base scoring. The leaderboard is deliberately local and owner-editable. Actual wallet-app handoffs and Coinbase passkey registration were not completed with real user accounts; EOA signing and the connected/wrong-chain/rejection/reload flows were tested using a simulated provider with an ephemeral signer in the test runner. Contract-wallet verification is implemented through the public client but is not certified by a real ERC-1271/6492 account session. Audio toggle/state is implemented; perceived sound quality on physical devices was not evaluated.

Native screen readers, native browser zoom, physical mobile layouts/handovers, forced-colors rendering, whole-page RTL/pseudo-localization and a complete composited-contrast audit remain unperformed. The checked root-text enlargement and accessibility snapshot are not substitutes for those sessions.

**Complete for the stated implementation and worker-check scope.** The source, lockfile, production export and documentation are present. These results do not claim independent certification or eliminate the stated external/manual verification limits.

## Final packaging check

The production `dist/` contains **849,291 bytes**. The complete delivered source, tests, manifest/lockfile, public assets, export, design/operating documentation and selected evidence occupy **less than 1,800,000 bytes**, checked after this document was written, well below the **8,388,608-byte** limit. The explicit path budgets and ignore scopes are in `PATH_BUDGET.md`.

All required assets remain local and complete. `dist/index.html` references `./assets/`, `./favicon.svg` and `./social-card.png`; the export was actually served and tested from a subpath. No obsolete hashed bundles, source maps, package archives, vendored registry, generated dependency/cache folders or submodule/symlink were left in the delivered paths. Temporary browser-tool captures were removed; the selected final screenshots above remain included. No `.git/`, `.github/`, `.env` or repository `node_modules/` path was modified.
