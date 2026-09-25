## 1. Phase state

- [x] 1.1 Add `PHASES` (`playing`, `sinking`) and `SINK_SECONDS` (0.4) to the
  constants section, deriving the duration from the spec's 400ms rather than
  restating a magic number. Verify a unit test asserts `SINK_SECONDS * 1000 === 400`.
- [x] 1.2 Extend `createState()` with `phase: 'playing'`, `phaseElapsed: 0`,
  `score: 0`, `lives: 3`, and `northmost` set to the spawn row. Verify a unit test
  asserts every field's initial value.
- [x] 1.3 Implement `enterPhase(state, phase)` returning new state with the phase set
  and `phaseElapsed` reset to 0. Verify a unit test asserts the accumulator resets on
  every transition, including a transition to the phase already current.
- [x] 1.4 Add a unit test asserting the phase is always one of the declared `PHASES`
  across a scripted sequence of moves, sinks, and respawns.

## 2. Scoring

- [x] 2.1 Implement `scoreMove(northmost, row)` returning the points awarded and the
  new watermark, knowing nothing about the goal. Verify unit tests cover a first step
  north, a return to an already-reached row, a sideways move, and a blocked move.
- [x] 2.2 Award the 50-point goal bonus on entering row 0, composed with the
  watermark award rather than special-cased. Verify a unit test asserts the final
  step from row 1 to row 0 scores exactly 60 when row 1 was the watermark.
- [x] 2.3 Reset `northmost` to the spawn row on respawn while leaving `score`
  untouched. Verify a unit test scores a row, clears the spa, and asserts the same
  row scores again in the next round while the total keeps accumulating.
- [x] 2.4 Verify the bonus is awarded exactly once per arrival with a test that runs
  the whole beat frame by frame and asserts the score changes only on the entering
  frame.

## 3. Lifecycle transitions

- [x] 3.1 Advance `phaseElapsed` by the clamped delta at the top of `update`, before
  anything else. Verify a unit test asserts the accumulator tracks applied time.
- [x] 3.2 Resolve an expired `sinking` phase before input is consumed: return the
  player to the spawn cell facing up, reset `northmost`, and re-enter `playing`.
  Verify a unit test asserts a press arriving on the expiry frame is applied to the
  respawned player rather than discarded by the ending phase.
- [x] 3.3 Gate input consumption on the phase, leaving the buffer undrained in
  `sinking`. Verify unit tests assert the player does not move during the beat and
  that a press made mid-beat does not fire on respawn.
- [x] 3.4 Transition to `sinking` when a move lands on row 0, from any column.
  Verify unit tests cover entry from several columns and assert the player is placed
  on row 0 before the phase changes.
- [x] 3.5 Hold `sinking` until 400ms of elapsed time has accumulated. Verify unit
  tests assert the phase survives 399ms and ends at exactly 400ms.
- [x] 3.6 Verify the beat is refresh-rate independent with a test applying 400ms as
  24 steps of 1/60s and as 48 steps of 1/120s, asserting the same resulting phase and
  player position.
- [x] 3.7 Verify a single clamped frame cannot skip a transition, by applying the
  0.1s maximum repeatedly across a beat and asserting the phase sequence contains no
  gap.
- [x] 3.8 Confirm `lives` is 3 at start and unchanged by a completed round. Verify a
  unit test asserts nothing in this change decrements it.

## 4. Rendering

- [x] 4.1 Implement `sinkProgress(state)` returning 0 to 1 across the beat, clamped
  at both ends. Verify unit tests cover the start, midpoint, end, and an overshoot
  beyond the duration.
- [x] 4.2 Draw the player with source height `TILE * (1 - p)` and destination offset
  `TILE * p` while sinking, leaving the source `y` unchanged. Verify unit tests
  assert the destination offset plus drawn height is constant across the beat and
  that nothing is drawn at completion.
- [x] 4.3 Keep the resting player drawn at full tile height with no offset while
  playing. Verify a unit test asserts M1's drawing behaviour is unchanged outside the
  sinking phase.
- [x] 4.4 Implement `drawHud(ctx, state)` writing the score at the left and lives at
  the right of row 0 in monospace, reading both from state. Verify a unit test with a
  stub context asserts both values appear and follow a change in state.
- [x] 4.5 Call the HUD last in `render`, after every tile and sprite. Verify a unit
  test asserts no `drawImage` occurs after the first `fillText`.
- [x] 4.6 Verify `render` still mutates nothing, extending M1's test to cover the new
  score, lives, phase, and watermark fields.

## 5. Reconciling M1

- [x] 5.1 Update `grid-movement.test.js` where row 0 is no longer occupiable while
  playing, matching the MODIFIED delta rather than weakening the assertion. Verify
  the replaced test fails against the old behaviour and passes against the new.
- [x] 5.2 Add a retained test for the new `grid-movement` scenario "Movement does not
  apply while the game is not accepting input".
- [x] 5.3 Extend `boot.test.js` so a full round can be driven through the stub DOM:
  walk to row 0, run the beat frame by frame, and assert respawn and score through
  the real loop rather than only through `update`.

## 6. Verification

- [x] 6.1 Run `node --test` and confirm the whole suite passes with nothing installed
  and no `package.json`.
- [x] 6.2 Re-run the zero-dependency scan over the three shipped files and confirm no
  blocked transport was introduced.
- [x] 6.3 Play a full round from `file://`: walk north scoring each new row, enter the
  spa, watch the sink, and confirm the respawn, the persisted score, and a second
  scoring run over the same rows.
- [x] 6.4 Confirm by mutation that the new tests can fail — at minimum, break the beat
  duration, the input gate during sinking, the watermark reset, and the HUD draw
  order, and confirm each turns a named test red.
- [x] 6.5 Run the `project-critic` skill against the working tree and resolve anything
  it rejects before the change is considered complete.
