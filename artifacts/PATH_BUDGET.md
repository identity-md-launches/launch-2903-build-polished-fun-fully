# Submission path budget

The assignment caps additions at **8,388,608 bytes**. The intended budgets are:

| Paths | Maximum bytes | Purpose |
| --- | ---: | --- |
| `src/`, `index.html`, `tests/`, frontend configuration | 700,000 | Complete application and repeatable checks |
| `package.json`, `package-lock.json` | 500,000 | Reproducible dependencies |
| `public/` | 500,000 | Local fonts, marks, favicon, share card and licenses |
| `dist/` | 2,000,000 | Required production export, including all runtime assets |
| `artifacts/`, `README.md`, `DESIGN.md`, `.gitignore` | 3,000,000 | Validation evidence, screenshots, design and operating documentation |
| Reserve | 1,688,608 | Unallocated |

The `.gitignore` change has exactly these exclusion scopes: dependency folders named `node_modules` at any depth; Vite caches named `.vite` at any depth; caches named `.cache` or `.npm` at any depth; the assignment's disposable `test/scratch/`; Playwright's generated `test-results/` and `playwright-report/`; and the browser tool's temporary `.playwright-mcp/` captures. These paths have a **zero-byte submission budget**. `artifacts/` and its contents are explicitly included for the validation report and selected final evidence, within the 3,000,000-byte documentation budget. No source or required runtime assets are excluded. `dist/` is deliberately retained. Worker installations and browser downloads live outside the repository. Actual final counts are recorded in `artifacts/validation.md`.
