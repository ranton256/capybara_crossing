## 1. Collision and hop gaps

- [x] 1.1 Add collision unit test: truck `width: 2` overlapping player → hit, lives −1, start respawn (`tests/collision.test.mjs`).
- [x] 1.2 Add gameplay/input unit test: Up from row 0 rejected → score and position unchanged.

## 2. Session and Game Over gaps

- [x] 2.1 Add session test: Space during Game Over → `pendingRestart` → `update` restores lives 3, score 0, start cell, and `hazards` deepEqual to `createInitialHazards()`.
- [x] 2.2 Add session/hazards test: `gameOver: true`, non-zero `vx`, `update` with positive `dt` → hazard `x` unchanged.
- [x] 2.3 Optionally strengthen Enter restart test to also assert hazard reset if Space test already covers it once (avoid duplicate if redundant).

## 3. Update integration

- [x] 3.1 Add `update` integration test: pending hop into overlapping hazard → lives down and player at start (and/or pending Up into spa → score 60 + `sinkingUntil`).
- [x] 3.2 Run `npm test` (coverage ≥80%) and `npm run test:e2e` (unchanged freeze snapshot still passes).
