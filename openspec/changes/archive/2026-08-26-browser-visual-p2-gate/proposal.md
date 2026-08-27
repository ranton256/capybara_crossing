## Why

Node unit tests validate `game.js` logic and draw calls with stubs, but they cannot prove the live browser canvas looks correct after the atlas loads. P2 is complete; a minimal Playwright screenshot gate catches rendering regressions (wrong tiles, broken atlas path, layout drift) without slowing the existing pre-commit unit test run.

## What Changes

- Add `@playwright/test` as a dev-only dependency with a `playwright.config.mjs` that starts the existing `npm run serve` web server.
- Add one end-to-end spec that opens `index.html`, waits until the P2 tile board is painted, and compares a `#game` canvas screenshot to a committed baseline.
- Add `npm run test:e2e` (and optionally document `test:all`); keep `npm test` and the pre-commit hook on unit tests only.
- No changes to `game.js`, `index.html`, or runtime game behavior; no test hooks or keyboard automation in this change.

## Capabilities

### New Capabilities

- `testing`: Dev-only browser visual regression for the P2 tile board via Playwright canvas screenshots.

### Modified Capabilities

- (none)

## Impact

- New dev files: `playwright.config.mjs`, `tests/e2e/board.spec.mjs`, committed snapshot PNG(s) under Playwright’s snapshot directory.
- `package.json`: devDependency and scripts only.
- `.gitignore`: Playwright report/artifact dirs (not committed baselines).
- Out of scope: pre-commit e2e, `file://` Playwright suite, test hooks in `game.js`, capybara/input/hazard visuals, multi-browser matrix, CI wiring.
