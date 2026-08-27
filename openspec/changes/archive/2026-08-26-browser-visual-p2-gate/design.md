## Context

See proposal.md. P2 (`rendering` spec) draws a static 12×7 tile board; Node tests in `tests/rendering.test.mjs` stub the atlas. `npm run serve` already serves the repo for manual checks. Pre-commit runs `npm test` with 80% coverage on `game.js`. Spec: `specs/testing/spec.md`.

## Goals / Non-Goals

**Goals:**
- One Playwright spec, one canvas screenshot baseline for the P2 board.
- Auto-start `scripts/serve.mjs` via Playwright `webServer`.
- Wait for atlas paint using in-page canvas pixel probe (no `game.js` changes).
- `npm run test:e2e`; pre-commit unchanged.

**Non-Goals:**
- Playwright in pre-commit or coverage on `game.js`.
- `file://` Playwright tests, keyboard/input, capybara sprites, multi-browser.
- `window.__capybaraTest` hooks or CI workflow files (can follow later).

## Decisions

### 1. Playwright Test (`@playwright/test`)

Standard test runner with `toHaveScreenshot()`, `webServer`, and Chromium install. DevDependency only.

**Alternative considered:** Puppeteer + pixelmatch. Rejected: more wiring for the same outcome.

### 2. Single spec: `tests/e2e/board.spec.mjs`

Flow:
1. `page.goto('/index.html')` against `baseURL` `http://127.0.0.1:8765`
2. `waitForFunction`: sample canvas pixel (e.g. center of spa row y≈24) until RGB sum indicates tiles painted (not P1 clear fill)
3. Assert `#game` width 576 and height 336 (optional sanity check in same spec)
4. `expect(page.locator('#game')).toHaveScreenshot('p2-board.png', { maxDiffPixelRatio: 0.01 })`

Canvas-only locator keeps snapshots stable (no page chrome).

**Alternative considered:** Full-page screenshot. Rejected: unnecessary background variance.

### 3. `playwright.config.mjs`

```js
export default {
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:8765' },
  webServer: {
    command: 'npm run serve',
    url: 'http://127.0.0.1:8765/index.html',
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
};
```

Chromium-only is enough for canvas pixel art. `reuseExistingServer` allows local dev with serve already running.

Port/host must match `scripts/serve.mjs` defaults (8765, 127.0.0.1).

### 4. Scripts and gitignore

```json
"test:e2e": "playwright test",
"test:e2e:update": "playwright test --update-snapshots"
```

Do **not** add e2e to `npm test` or `.githooks/pre-commit`.

`.gitignore` additions: `test-results/`, `playwright-report/`, `blob-report/`, `.playwright/` (if created). **Commit** snapshot PNGs under `tests/e2e/*-snapshots/`.

### 5. Baseline creation

First apply run: `npm run test:e2e:update` after implementation, human verifies PNG shows correct P2 board, then commit baseline.

Document in a short comment at top of `board.spec.mjs` or in apply summary — no new markdown file unless user asks.

### 6. Atlas wait without game hooks

Probe via `page.waitForFunction` reading `getImageData` on `#game` 2d context. Timeout 10s. No modifications to `game.js`.

## Risks / Trade-offs

- [OS/GPU snapshot drift] → Start local-only; `maxDiffPixelRatio: 0.01`; canvas-only crop. Re-baseline if intentional art changes.
- [Playwright browser install] → Document `npx playwright install chromium` once after `npm install`.
- [Serve port clash] → Config uses same 8765 as serve.mjs; reuseExistingServer helps locally.

## Migration Plan

Add devDeps and test files. No game rollback concerns. Removing the gate later is delete e2e + config + devDep.

## Open Questions

None for this minimal gate.
