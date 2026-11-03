# Squeek Arena design system

## Overview

Squeek Arena is a small arcade game for repeat play, with optional wallet identity. The visual idea is a warm, headphone-wearing hamster inside a precise neon wheel. A charcoal green interface, lime energy cues, restrained grid lines and violet combo details carry the cyber aesthetic without competing with the hamster.

The game is the main surface. The desktop sidebar explains its live power and holds the local leaderboard. On a phone, the game comes first and its current multiplier stays inside the scene, so the live influence is visible while playing. The short headline and one descriptive sentence introduce the product without displacing the Start action.

The canonical implementation is [`src/styles.css`](src/styles.css), with original SVG artwork in [`Hamster.tsx`](src/components/Hamster.tsx). This document describes the final source, including local component colors; it does not prescribe a second theme or a new component framework.

## Colors

The UI uses sRGB hex custom properties in `src/styles.css :root`:

| Token | Value | Implemented role |
| --- | --- | --- |
| `--page` | `#101112` | Page background |
| `--surface` | `#181c18` | Arena surface |
| `--surface-hover` | `#2b3328` | Neutral action hover |
| `--text` | `#f2f3eb` | Primary text |
| `--text-secondary` | `#a7afa3` | Descriptions and supporting information |
| `--text-subtle` | `#9aa491` | Small game labels and chart captions |
| `--border` | `#30392e` | Panel structure and separators |
| `--accent` | `#bbef7b` | Primary action, score power and energy cues |
| `--accent-hover` | `#d1ff99` | Primary action hover |
| `--accent-ink` | `#192510` | Text on lime actions and text selection |
| `--violet` | `#c4b1ee` | Combo, network and secondary game cues |
| `--error` | `#f1b09f` | Miss feedback, urgent timer and recoverable errors |
| `--focus` | `#f2f3eb` | Keyboard focus outline |

Component-specific backgrounds remain explicit in the same stylesheet: scene/result `#141b16`, sidebar panels `#181b18`, modal `#1a201a`, wallet rows `#252e22`, and text-input well `#11180f`. The timing bar uses `#2a3228`, a `#5f7f39` green target and `#b4e67c` perfect zone, with a white marker that becomes violet after an attempt. Text labels explain every status; color alone never establishes a result, connection or feed state.

The SVG artwork has its own warm fur, cream, pink and rim gradients. Those colors are illustration paint, not UI tokens. Text contrast measurements and the six overlay text boxes not covered by the probe are recorded in `artifacts/validation.md` and `artifacts/browser-observations.json`; this document makes no blanket contrast-compliance claim.

## Typography

One locally bundled variable family, **Space Grotesk**, with `Arial, sans-serif` fallback. `public/fonts/space-grotesk-latin.woff2` supplies weights 300–700; the interface uses only **400, 600 and 700**. The font loads with `font-display: swap` and an HTML preload. Its OFL license is included locally. The final browser inspection confirms the local face loaded.

The six-size scale is defined as rem values, with a 16px default root:

| Token | Size | Role |
| --- | --- | --- |
| `--text-xs` | `.75rem` / 12px | Captions, telemetry, hints and leaderboard metadata |
| `--text-sm` | `.875rem` / 14px | Compact prose, action labels, player names |
| `--text-base` | `1rem` / 16px | Main action, input text, sidebar headings |
| `--text-lg` | `1.25rem` / 20px | Section/dialog headings, brand, hit feedback |
| `--text-xl` | `2rem` / 32px | Scoreboard numbers and mobile/tablet headline |
| `--text-display` | `3rem` / 48px | Desktop headline, power readout, countdown and final score |

Body line-height is 1.5. The main headline is 1.1, section headings 1.25 and supporting headings 1.4. The mobile headline uses 1.15. Large headings use tight negative tracking (`-.05em` desktop headline, `-.045em` phone headline); reading text retains natural spacing. Headings balance their wrapping and paragraphs use pretty wrapping. All changing numbers use `font-variant-numeric: tabular-nums`. There is no monospace prose, tracked capitals or synthetic font emphasis.

Inputs stay at 16px at the default root, preventing automatic iOS input zoom. Player names use `<bdi>` and wrap; full addresses use `overflow-wrap: anywhere` and remain selectable. Numeric readouts and header groups wrap under enlarged text instead of shrinking the text or clipping values.

## Layout

`.shell` caps desktop content at **1200px**, otherwise using the viewport minus 80px. At 70rem and below it uses 48px outer subtraction; at 40rem and below it uses 32px, giving 16px phone margins. The general spacing rhythm is 4px, with 8/12px within small groups and 20/24/28/32/44/48px between larger regions. Individual optical insets such as 18px and 22px are local component values.

The desktop `.arena-layout` is `minmax(0, 1fr) 320px`, with a 24px gap. At 70rem it becomes a 290px sidebar with a 20px gap. At **55rem**, the game occupies a full row and the two sidebar sections form two columns. At **40rem**, those sections stack below the game; header navigation and the desktop personal-best summary are hidden, while their information remains available in the game/leaderboard and lower sections. The headline intentionally breaks over two lines. Under **23rem**, brand and scoreboard typography use smaller existing steps.

The scoreboard, header, power readout, intro and help thresholds use wrapping flex groups so enlarged text remains available. The scene height is 18.625rem on desktop, 19.375rem in the middle layout and 13.5rem on a phone. This reserves space for labels and grows with enlarged text. The SVG keeps its aspect ratio and does not crop its content. Only the timing marker uses physical left-to-right positioning, because this is gameplay geometry.

The Start/Boost action remains in normal document flow. At the checked 390×844 default view, the complete action is on the first screen. The main game, live power, timing target and controls do not require opening a sheet. Default widths 320, 390, 768, 1280 and 1440 and 200% root-text enlargement at 320/390/768/1440 were inspected or measured; native browser zoom is listed separately as unperformed in validation.

## Elevation and depth

The interface is deliberately flat. Panels use one structural hairline and a tonal background; there are no panel shadows, nested display cards or gradient text. A subtle two-axis grid and the illustrated wheel supply depth within the scene.

Native dialogs form the raised layer, with a `#070b09cf` backdrop and 5px backdrop blur. The content remains usable without the blur. Dialogs use `showModal()`, so browser modality handles the focus boundary and background interaction. Mobile dialogs become bottom sheets with safe viewport-based maximum height and scrolling content. The normal page has no fixed or sticky action that can obscure text; the skip link appears only when focused.

## Shapes

Main surfaces use `--radius: 16px`, with the arena becoming 12px on a phone. Buttons use 9px, neutral icon actions 8px, inputs 8px and dialog shells 18px. Wallet logos retain their original marks and use a small presentation radius. Tiny circles indicate statuses, and the wheel/countdown circles belong to the game illustration. The timing target is rectangular so its scoring boundaries remain precise.

## Components

| Component/pattern | Source | States and behavior |
| --- | --- | --- |
| Arena | `src/App.tsx`, `src/useArena.ts`, `src/game.ts` | Ready, three-count countdown, play, paused and finished. One attempt per sweep, perfect/good/miss feedback, combo, score goal, reset for replay. |
| Primary and neutral actions | `.button`, `.button.primary`, `.icon-button`, `.text-button` in `src/styles.css` | Rest, hover, active `.96` press scale, explicit 2px offset keyboard outline, and native disabled state. Main action is 50px on phone/52px desktop; minor utilities are 32–40px, exceeding the 24px baseline but not all 44px comfort targets. |
| Hamster illustration | `src/components/Hamster.tsx`, `Hamster({ playing })` | Static while ready/paused; wheel and tiny body/feet motion only during play and only without reduced-motion preference. Decorative, `aria-hidden`. |
| Power panel | `PowerPanel` in `src/App.tsx`, `src/useFeed.ts`, `src/api.ts` | Loading, certified, unavailable, expired/last-known chart and retry countdown. Six real certified rounds, a separately labeled wheel reading, and formula/detail dialog. |
| Local leaderboard | `Leaderboard` in `src/App.tsx`, `src/storage.ts` | Genuine empty state, up to ten persisted results, latest-score highlight, name/signature marker, live/mixed/base score labels, storage failure notice. Names wrap instead of truncating. |
| Dialog | `src/components/Modal.tsx` | Native modal with a title, one close button, Escape and outside-backdrop close, scroll containment, focus restoration, centered desktop or bottom phone presentation. |
| Wallet control and registration | `src/components/WalletControl.tsx`, `src/chain.ts`, `src/open-in.ts` | Discovered extensions, browser fallback, mobile app links, Coinbase SDK, per-row pending state, connection rejection, wrong-chain switch/add fallback, signature validation/error, connected account and disconnect. No transaction action exists. |
| Result | `.round-result` and `result-actions` in `src/App.tsx` | Win/Draw/Lose wording, score, real-work flavor, perfect count, best combo, average power, local save status, replay, name-this-score and copy action with persistent feedback. |
| Inputs and validation | Registration form in `WalletControl.tsx` | Visible label and hint, 2–20 character validation on submit, `aria-invalid`/`aria-describedby`, focus on invalid name, signing/verifying disabled submit and recoverable notice. |

The icon family is the small local outline set in `src/components/Icon.tsx`, normally 18–20px with 1.8px strokes and `currentColor`. Official wallet marks are separate, locally bundled color assets.

Interactive transitions use **150ms** and `cubic-bezier(.2, 0, 0, 1)`, explicitly naming the changed properties. Feedback lasts 150ms; game-only wheel motion is 4 seconds per revolution and hamster motion 280ms. There is no entrance animation on page load and no `transition: all`. Reduced motion disables CSS animations, transitions and button scaling. The essential timing marker continues through JavaScript so the game still works. Opening help/wallet/data details pauses play; a hidden tab also pauses it.

## Reuse rules

- Start with `.shell`, the six text tokens and existing action classes. Use one filled action for the active task.
- Use the established text and status roles; keep warm illustration colors out of controls and form errors.
- Keep numeric values tabular, names readable and full wallet addresses reachable. Let groups wrap when text grows.
- Keep the real-data and base-power states explicit. Never add seeded players, random live metrics or implied shared rankings.
- Respect the native dialog’s keyboard behavior and reduced-motion path when adding a game setting or explanation.
- For another small surface, reuse the section heading and neutral surface styling, put a 14–16px description underneath, and use the existing dialog for optional detail. A new page would require an explicit static-routing decision; this product currently uses one page and anchors.

Design guidance: Jakub Krehel’s Better Interface (MIT); documentation method: Paul Bakaus’s Impeccable (Apache-2.0). Pinned source commits and retained licenses are listed in `README.md` and `artifacts/design-guidance-LICENSE.txt`.
