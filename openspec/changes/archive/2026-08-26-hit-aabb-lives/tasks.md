## 1. Failing collision tests

- [x] 1.1 Add `tests/collision.test.mjs` for `aabbOverlap` and `resolveCollisions`.
- [x] 1.2 Test overlap true for intersecting truck/player; false for median vs adjacent road.
- [x] 1.3 Test hit: lives 3→2, player back to (6,6), score unchanged; miss leaves state.

## 2. Collision and lives in `game.js`

- [x] 2.1 Add `STARTING_LIVES = 3`, `aabbOverlap`, `resolveCollisions`, `DEFEAT_FRAME`.
- [x] 2.2 Boot `lives: 3`; `update` calls resolve after `moveHazards`; export helpers.
- [x] 2.3 `renderPlayer` uses defeat frame while `hurtUntil` is in the future; HUD includes lives.

## 3. Rendering / engine tests

- [x] 3.1 Extend HUD tests to expect lives text; engine boot expects 3 lives.
- [x] 3.2 Run `npm test` at ≥80% coverage.

## 4. Verify

- [x] 4.1 Confirm overlap on a road costs a life and respawns; median is safe; score persists.
- [x] 4.2 Refresh Playwright freeze snapshot if HUD/lives change the baseline; `npm run test:e2e` passes.
