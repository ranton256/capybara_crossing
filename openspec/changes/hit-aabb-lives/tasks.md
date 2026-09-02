## 1. Lives and the clock

- [x] 1.1 Add `STARTING_LIVES` 3, `DEATH_MS` 550, `FLASH_MS` 100, and
      `MAX_DELTA_MS` 100; verify a test asserts a fresh session has 3 lives
- [x] 1.2 Clamp the delta in `tick` to `MAX_DELTA_MS`; verify tests assert a
      2000ms frame is clamped and a 16ms frame is not
- [x] 1.3 Add `isDying(state)` derived from `hurtUntil` and the game-over flag;
      verify tests cover active, expired, and game-over cases

## 2. Collision

- [x] 2.1 Implement `aabbOverlap(a, b)` with strict inequalities; verify tests
      cover overlap, separation, and exactly touching edges
- [x] 2.2 Implement `resolveCollisions(state)` building the player and hazard
      boxes and registering the first overlap; verify tests cover a direct hit,
      a two-tile truck hit, and a safe adjacent row
- [x] 2.3 On a hit, decrement lives, pin the player, set `hurtUntil` and
      `flashUntil`, and clear any pending direction; verify a test asserts the
      score is unchanged and the player stays on the impact cell
- [x] 2.4 Suppress collisions while dying; verify a test asserts a second
      overlapping frame does not take another life
- [x] 2.5 Enter `gameOver` at zero lives without respawning; verify a test
      asserts the player stays on the impact cell

## 3. Death beat lifecycle

- [x] 3.1 Ignore movement input while dying; verify a test asserts a pending
      direction does not move the player during the beat
- [x] 3.2 Implement `finishDeath(state)` respawning at the spawn cell and
      resetting the watermark; verify a test asserts a later Up hop scores 10
- [x] 3.3 Call the lifecycle from `update` in the order input, hazards, beat
      completion, collision, so a respawn happens before the next check; verify a
      test asserts the beat ends in a respawn and costs only the one life

## 4. Rendering

- [x] 4.1 Add `DEFEAT_FRAME` transcribed from `manifest.json`; verify a test
      asserts it matches
- [x] 4.2 Draw the defeat frame at the impact cell while dying; verify a test
      asserts the walk frame is not used
- [x] 4.3 Implement `renderFlash` drawing a full-canvas overlay during the flash
      window, after the world and before the HUD; verify tests assert it appears
      during the window, disappears after, and precedes the HUD
- [x] 4.4 Show lives in the HUD; verify a test asserts the life count is drawn

## 5. Verification

- [x] 5.1 Run `npm test` and verify the suite passes with coverage at or above
      80% for lines, functions, and branches
- [x] 5.2 Regenerate the visual baseline and run `npm run test:e2e`
- [x] 5.3 Run `openspec validate hit-aabb-lives --strict` and confirm it passes
