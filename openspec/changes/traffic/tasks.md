## 1. Lane configuration

- [x] 1.1 Add `LANES` describing row 1 (2 trucks, width 2, speed +1.5, sprite
  `truck`) and row 3 (3 ATVs, width 1, speed -2.5, sprites `atv_red` and
  `atv_blue`), with the sign of the speed carrying direction. Verify a unit test
  asserts each lane's row, count, width and speed against the Fixed Parameters.
- [x] 1.2 Declare the hazard atlas rectangles for `truck`, `atv_red` and
  `atv_blue`. Verify the existing manifest cross-check covers the new entries and
  that `log`, `monkey` and `parrot` remain undeclared, since they belong to the
  optional river section.
- [x] 1.3 Implement `wrapDistance(lane)` returning `COLS + lane.width`. Verify a
  unit test asserts 14 for row 1 and 13 for row 3.
- [x] 1.4 Implement `createHazards()` spreading each lane's count evenly across
  its wrap distance and cycling its sprites. Verify unit tests assert 5 hazards
  total, the trucks 7 tiles apart, the ATVs 13/3 apart, and the ATV sprites
  alternating.

## 2. Motion

- [x] 2.1 Add hazards to `createState()`. Verify a unit test asserts a new game
  starts with the configured lanes populated and no hazard on any other row.
- [x] 2.2 Implement `advanceHazard(hazard, deltaSeconds)` returning a new hazard
  moved by `speed * deltaSeconds`. Verify unit tests assert 1.5 tiles travelled
  per second rightward and 2.5 leftward.
- [x] 2.3 Implement wrapping as a translation by `± wrapDistance`, preserving the
  overshoot rather than assigning a fixed re-entry position. Verify a unit test
  asserts a hazard that passes the boundary by a fraction re-enters by that same
  fraction.
- [x] 2.4 Apply wrapping repeatedly rather than once, so an unclamped delta
  supplied directly in a test cannot leave a hazard outside the board. Verify a
  unit test applies a 10-second step and asserts the hazard is still within one
  wrap distance of the board.
- [x] 2.5 Advance all hazards in `update` before the phase gate. Verify a unit
  test asserts hazards move while the phase is `sinking`.
- [x] 2.6 Verify motion is refresh-rate independent with a test applying one
  second as 60 steps and as 120 steps and asserting equivalent hazard positions.
- [x] 2.7 Verify the spacing invariant with a test applying enough time for every
  hazard to wrap several times, then asserting the gaps in each lane are
  unchanged from their initial values.
- [x] 2.8 Verify the clamp margin: assert that a single frame of
  `MAX_DELTA_SECONDS` advances the fastest hazard by less than one tile, since
  M4's collision correctness depends on it.

## 3. Rendering

- [x] 3.1 Implement `snapTile(position)` flooring a continuous tile position to a
  whole device pixel. Verify unit tests assert whole-pixel output and that the
  result never moves against the direction of travel across successive frames.
- [x] 3.2 Implement `drawHazard(ctx, atlas, hazard)` drawing at the lane row and
  the hazard's own width, snapped. Verify a unit test asserts a 2-tile truck
  draws two tiles wide from the full source rectangle.
- [x] 3.3 Mirror rightward hazards with a negative horizontal scale about the
  sprite's midpoint, restoring the transform afterwards. Verify unit tests assert
  a rightward hazard is flipped, a leftward one is not, and the board position is
  the same either way.
- [x] 3.4 Verify no transform leaks: a unit test draws a mirrored hazard then the
  player, and asserts the player is drawn unmirrored.
- [x] 3.5 Draw hazards between the board and the player in `render`. Verify a unit
  test asserts every hazard is drawn after the last tile and before the player.
- [x] 3.6 Verify drawing does not alter state, extending the existing test to
  cover hazard positions.

## 4. Verification

- [x] 4.1 Run `node --test` and confirm the whole suite passes with nothing
  installed and no `package.json`.
- [x] 4.2 Re-run the zero-dependency scan over the three shipped files.
- [x] 4.3 Watch the lanes from `file://`: confirm trucks travel right and face
  right, ATVs travel left and face left, ATV colours alternate, gaps stay even
  across several wraps, and the capybara passes through traffic unharmed.
- [x] 4.4 Confirm by mutation that the new tests can fail — at minimum, break the
  wrap translation into an assignment, remove the mirroring, drop the snapping,
  freeze hazards during the sink beat, and reverse a lane's direction; confirm
  each turns a named test red rather than hanging.
- [x] 4.5 Run the `project-critic` skill against the working tree and resolve
  anything it rejects before the change is considered complete.
