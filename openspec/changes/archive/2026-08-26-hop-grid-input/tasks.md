## 1. Failing hop / score tests

- [x] 1.1 Add `tests/gameplay.test.mjs` (and `tests/input.test.mjs` if split) importing hop helpers from `game.js` (fails until they exist).
- [x] 1.2 Test default spawn: player at col 6, row 6, facing up, score 0.
- [x] 1.3 Test interior hops for Up/Down/Left/Right move exactly one cell and update facing.
- [x] 1.4 Test edge clamps: outward hops leave position unchanged; blocked Up does not change score.
- [x] 1.5 Test successful Up awards +10; Left/Right/Down do not change score.

## 2. Player state and hop logic in `game.js`

- [x] 2.1 Add `createInitialPlayer` / session defaults and `hop(state, direction)` with bounds and Up scoring.
- [x] 2.2 Wire `update(state)` to consume `pendingDirection` via `hop`, then clear the pending input.
- [x] 2.3 Export new helpers for Node tests via the existing CJS footer.

## 3. Rendering player and score HUD

- [x] 3.1 Extend rendering tests: player `drawImage` at scaled cell; HUD draws after player; tiles still before both.
- [x] 3.2 Add hardcoded `PLAYER_FRAMES` (capy_*_1 rects) and implement `renderPlayer`.
- [x] 3.3 Implement `renderHud` for current score text; update `render` to clear → board → player → HUD.
- [x] 3.4 Update engine tests if update/render contracts changed.

## 4. Browser input wiring

- [x] 4.1 On boot, initialize player + score on `state` and attach arrow-key `keydown` that sets `pendingDirection` (with `preventDefault`).
- [x] 4.2 Confirm update runs before render so the new cell is painted on the same frame the hop applies.

## 5. Verify coverage and visuals

- [x] 5.1 Run `npm test` and keep `game.js` at ≥80% line, function, and branch coverage.
- [x] 5.2 Manually verify via `npm run serve`: spawn at bottom-center, arrow hops, bounds hold, Up increases score HUD.
- [x] 5.3 Update Playwright baseline with `npm run test:e2e:update` and confirm `npm run test:e2e` passes.
