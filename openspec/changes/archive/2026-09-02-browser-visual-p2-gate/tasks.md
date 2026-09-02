## 1. Freeze flag

- [x] 1.1 Add `shouldFreeze(options)` reading `freeze=1` from the query string
      with an injectable location; verify tests cover the flag present, absent,
      and no location available
- [x] 1.2 Store the resulting flag on game state at boot; verify a test asserts
      `state.freeze` is true when booted with `freeze=1`

## 2. Playwright harness

- [x] 2.1 Add `@playwright/test` to devDependencies and `test:e2e` plus
      `test:e2e:update` scripts; verify `npx playwright --version` runs
- [x] 2.2 Add `playwright.config.mjs` targeting Chromium with a pixel tolerance;
      verify the config loads without error
- [x] 2.3 Confirm `npm test` still runs with no browser involved; verify the
      unit suite passes unchanged

## 3. Visual test

- [x] 3.1 Add `tests/e2e/board.spec.mjs` opening `index.html` over `file://` with
      `?freeze=1`, waiting until the canvas has drawn more than one colour;
      verify the wait resolves rather than timing out
- [x] 3.2 Capture the canvas element against a committed baseline; verify
      `npm run test:e2e` passes on a second run using that baseline
- [x] 3.3 Confirm the gate catches a regression; verify by temporarily breaking a
      tile rect and seeing the test fail, then restoring it

## 4. Verification

- [x] 4.1 Run `npm test` and `npm run test:e2e` and verify both pass
- [x] 4.2 Run `openspec validate browser-visual-p2-gate --strict` and confirm it
      passes
