## Why

P2 draws the board, but its end-to-end check could not be completed: Firefox's
`--screenshot` fires before a JS-created `<img>` decodes, so the shot of
`index.html` came back blank even though the board renders correctly. The render
path was confirmed through a probe page and unit tests instead. That leaves the
one thing unit tests cannot cover — the real browser painting the real
`index.html` after the atlas loads asynchronously — unguarded, and it is exactly
the link most likely to break silently later.

## What Changes

- Add Playwright as a dev-only dependency and a `test:e2e` script.
- Add a browser test that opens `index.html` over `file://`, waits for the atlas
  to decode and a frame to paint, and compares the canvas against a committed
  baseline image.
- Add a `?freeze=1` query flag that holds hazards at their spawn positions, so
  the visual baseline stays stable once P4 introduces motion.
- Keep the visual test out of the pre-commit gate: `npm test` stays fast and
  dependency-free, `npm run test:e2e` runs the browser check.

## Capabilities

### New Capabilities

- `testing`: the browser-level visual regression gate and its separation from
  the unit test gate.

### Modified Capabilities

None. This change adds a test and one runtime flag; it does not alter any
specified game behavior.

## Impact

- New dev dependency `@playwright/test`. The shipped game stays dependency-free;
  `index.html`, `style.css`, and `game.js` gain no runtime imports.
- `game.js` gains a freeze flag read from the query string.
- New files: `tests/e2e/board.spec.mjs`, `playwright.config.mjs`, and a committed
  baseline PNG.
