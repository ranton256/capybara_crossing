## 1. Failing hazard tests

- [x] 1.1 Add `tests/hazards.test.mjs` importing spawn/move helpers from `game.js` (fails until they exist).
- [x] 1.2 Test spawn: trucks on row 1 width 2, ATVs on row 3 width 1, opposite `vx` signs.
- [x] 1.3 Test `moveHazards` changes `x` by `vx * dt/1000` when freeze is off.
- [x] 1.4 Test wrap at both edges; freeze leaves positions unchanged.

## 2. Hazard logic in `game.js`

- [x] 2.1 Add `HAZARD_FRAMES`, `createInitialHazards()`, and `moveHazards(state, dt)`.
- [x] 2.2 Wire `update` to move hazards after consuming hop input (skip when `freezeHazards`).
- [x] 2.3 Export new helpers via the CJS footer.

## 3. Rendering and freeze

- [x] 3.1 Extend rendering tests: hazards after tiles, player after hazards, HUD last.
- [x] 3.2 Implement `renderHazards` (flip when `vx > 0`) and insert it in `render`.
- [x] 3.3 Boot initializes hazards; set `freezeHazards` from options or `?freeze=1`.
- [x] 3.4 Update engine tests if update/render contracts changed.

## 4. Verify

- [x] 4.1 Run `npm test` at ≥80% coverage on `game.js`.
- [x] 4.2 Manually confirm live traffic wraps on both roads; hops still work; no collision yet.
- [x] 4.3 Point Playwright at `?freeze=1`, update the snapshot, and confirm `npm run test:e2e` passes.
