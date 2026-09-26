## 1. Collision geometry

- [x] 1.1 Declare the `capy_defeat` atlas rectangle, which is in the manifest but
  not yet in `game.js`. Verify the existing manifest cross-check covers it.
- [x] 1.2 Add `DEATH_MS` (550), `DEATH_SECONDS`, `FLASH_MS` (100) and
  `FLASH_TOGGLE_MS` (25) as constants derived from the spec's millisecond
  figures. Verify a unit test asserts each against Fixed Parameters and
  `DECISIONS.md` gap 14.
- [x] 1.3 Implement `overlaps(aStart, aEnd, bStart, bEnd)` over half-open
  intervals. Verify unit tests cover touching-at-the-start, touching-at-the-end,
  partial overlap, full containment and disjoint spans.
- [x] 1.4 Implement `playerBox(player)` and `hazardBox(hazard)` returning span and
  row. Verify unit tests assert a player at column 6 spans 6 to 7, and a 2-tile
  hazard at 3.5 spans 3.5 to 5.5.
- [x] 1.5 Implement `hits(player, hazard)` requiring the same row and overlapping
  spans. Verify unit tests assert a hazard on an adjacent row never hits, and that
  an exactly-touching hazard never hits.
- [x] 1.6 Implement `hitBy(state)` returning whether any hazard strikes the
  player. Verify a unit test asserts two simultaneous overlaps yield one event.

## 2. The death beat

- [x] 2.1 Add `DYING` and `GAME_OVER` to `PHASES`. Verify the existing
  always-a-known-phase test covers a scripted run that includes a death.
- [x] 2.2 Evaluate collision at the end of the playing branch of `update`, after
  hazards have advanced and after any move has been applied. Verify unit tests
  assert both that moving into a hazard kills and that a hazard moving onto a
  stationary player kills.
- [x] 2.3 On collision, decrement lives by 1 and enter `DYING` in the same
  transition, leaving the player where it was struck. Verify unit tests assert the
  position is held and the counter drops immediately rather than at expiry.
- [x] 2.4 Confirm a death costs exactly one life however long the overlap lasts,
  by a test running many frames of continuous overlap and asserting the counter
  fell by one. This should hold structurally, because the phase is no longer
  `PLAYING` after the first frame.
- [x] 2.5 Hold `DYING` for 550ms of accumulated elapsed time, using the same
  epsilon comparison the sink beat uses. Verify unit tests assert the beat
  survives 549ms and ends at 550ms, and that it is identical at 60Hz and 120Hz.
- [x] 2.6 Route the expiry on remaining lives: respawn and resume playing if any
  remain, enter `GAME_OVER` if none do. Verify unit tests cover both branches and
  assert the score carries across either way.
- [x] 2.7 Extend input suppression to `DYING` and `GAME_OVER`. Verify unit tests
  assert no movement during either, and that a press made during the death beat
  does not fire on respawn.
- [x] 2.8 Make `GAME_OVER` halt play: no movement, no scoring, no collisions, and
  elapsed time still accepted without error. Verify a unit test applies many
  frames and asserts nothing changes.
- [x] 2.9 Floor the lives counter at 0. Verify a unit test asserts it cannot go
  negative.

## 3. Rendering

- [x] 3.1 Draw the player from `capy_defeat` while dying, at the tile where it was
  struck. Verify unit tests assert the source rectangle and the position, and that
  walk frames resume after respawn.
- [x] 3.2 Implement the hit flash: alternate drawn and not-drawn every 25ms across
  the first 100ms of the beat, derived from the phase clock rather than a frame
  counter. Verify unit tests assert alternation within the window, continuous
  drawing after it, and identical results at 60Hz and 120Hz.
- [x] 3.3 Confirm the flash affects only the player: a unit test asserts every
  board tile and every hazard is still drawn in a not-drawn moment.
- [x] 3.4 Keep drawing the board, traffic and HUD while the game is over. Verify a
  unit test asserts all three and a lives readout of 0.

## 4. Reconciling M3

- [x] 4.1 Update the walks in `hazards.test.js` and `boot.test.js` that assume
  traffic is harmless, moving them to columns or timings clear of the lanes.
  Verify each still tests what it was written to test rather than being weakened.
- [x] 4.2 Add an assertion in the collision tests tying the once-per-frame check to
  M3's clamp margin, so the dependency is discoverable from the collision tests
  and not only from the lane tests.

## 5. Verification

- [x] 5.1 Run `node --test` and confirm the whole suite passes with nothing
  installed and no `package.json`.
- [x] 5.2 Re-run the zero-dependency scan over the three shipped files.
- [x] 5.3 Play from `file://`: be struck by a truck and by an ATV, watch the
  strobe and the defeat pose, confirm the HUD drops a life at the moment of
  impact, confirm respawn, and confirm the third death halts the game with traffic
  still flowing.
- [x] 5.4 Confirm by mutation that the new tests can fail — at minimum, make the
  overlap test inclusive at the boundary, evaluate collision before the move
  instead of after, decrement lives at expiry instead of impact, drive the flash
  from a frame counter, and let `GAME_OVER` respawn; confirm each turns a named
  test red rather than hanging.
- [x] 5.5 Run the `project-critic` skill against the working tree and resolve
  anything it rejects before the change is considered complete.
