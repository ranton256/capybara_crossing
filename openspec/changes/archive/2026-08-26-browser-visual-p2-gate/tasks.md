## 1. Playwright setup

- [x] 1.1 Add `@playwright/test` as a devDependency and run `npx playwright install chromium`.
- [x] 1.2 Add `playwright.config.mjs` with `webServer` (`npm run serve`), `baseURL` `http://127.0.0.1:8765`, and a single Chromium project.
- [x] 1.3 Add `test:e2e` and `test:e2e:update` scripts to `package.json`; confirm `npm test` and pre-commit hook are unchanged.
- [x] 1.4 Ignore Playwright report dirs in `.gitignore` (not snapshot baselines).

## 2. P2 board visual spec

- [x] 2.1 Add `tests/e2e/board.spec.mjs`: goto `/index.html`, wait for canvas tile paint via pixel probe, optional 576×336 size check.
- [x] 2.2 Assert `#game` canvas `toHaveScreenshot('p2-board.png', { maxDiffPixelRatio: 0.01 })`.
- [x] 2.3 Run `npm run test:e2e:update`, verify baseline PNG shows spa / roads / median / riverbank; commit snapshot file(s).

## 3. Verify scope

- [x] 3.1 Confirm `npm test` still passes and pre-commit still runs unit tests only.
- [x] 3.2 Confirm no edits to `game.js` or `index.html`; no `fetch`, keyboard handlers, or test hooks added.
- [x] 3.3 Run `npm run test:e2e` twice to confirm stable pass against committed baseline.
