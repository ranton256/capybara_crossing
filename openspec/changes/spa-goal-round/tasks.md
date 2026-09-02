## 1. Goal detection

- [x] 1.1 Add `GOAL_BONUS` 50, `SINK_MS` 400, and `SINK_DRAW_OFFSET`; verify a
      test asserts the bonus and beat constants
- [x] 1.2 Add `isSinking(state)` mirroring `isDying`; verify tests cover active
      and expired beats
- [x] 1.3 Implement `resolveGoal(state)` awarding 50 and starting the sink beat
      on arrival at row 0, returning early if a beat is already running; verify
      tests assert 60 total for the entering hop and no repeat payment

## 2. Beat lifecycle

- [x] 2.1 Suppress movement input while sinking, alongside the dying case;
      verify a test asserts a pending direction does not move the player
- [x] 2.2 Keep hazards moving during the beat; verify a test asserts positions
      change while sinking
- [x] 2.3 Implement `finishSink(state)` respawning at the spawn cell and
      resetting the watermark, leaving score and lives alone; verify a test
      asserts all four
- [x] 2.4 Wire beat completion and the goal check into `update` in the order
      input, hazards, beat completion, collision, goal; verify a test drives
      ticks across the beat and asserts the next round starts

## 3. Rendering

- [x] 3.1 Apply `SINK_DRAW_OFFSET` to the player's destination y while sinking;
      verify tests assert the offset during the beat and its absence after

## 4. Verification

- [x] 4.1 Run `npm test` and verify the suite passes with coverage at or above
      80% for lines, functions, and branches
- [x] 4.2 Run `npm run test:e2e` and verify the baseline still passes unchanged
- [x] 4.3 Run `openspec validate spa-goal-round --strict` and confirm it passes
