## 1. The restart transition

- [x] 1.1 Add a `restart` slot to the input buffer alongside `pending`, and make
  `createInput()` initialise it to false. Verify a unit test asserts both slots
  exist and start empty.
- [x] 1.2 Extend `pressKey` so `Enter` and `Space` set the restart slot and leave
  `pending` untouched. Verify unit tests assert a restart key never populates the
  direction slot and a direction key never populates the restart slot.
- [x] 1.3 Clear the restart slot on every update regardless of phase, so a stray
  press made mid-run cannot latch and fire at the moment the player later dies.
  Verify a unit test presses Enter while playing, plays on, dies, and asserts the
  death beat runs to its normal conclusion.
- [x] 1.4 Act on the restart slot only in `GAME_OVER`, returning `createState()`.
  Verify unit tests cover Enter and Space separately and assert the resulting
  phase is `PLAYING`.
- [x] 1.5 Verify a new run resets everything: a unit test asserts the player is at
  the spawn cell facing up, the score is 0, lives are 3, the watermark is the
  spawn row, and every hazard is back at the position it held at first boot.
- [x] 1.6 Verify restart keys do nothing while playing, sinking or dying, with a
  unit test per phase asserting the state and the score are unchanged.

## 2. The game over screen

- [x] 2.1 Implement `drawGameOver(ctx, state)` filling the board area with a
  translucent dark wash. Verify a unit test asserts the fill covers the full board
  and that its style carries an alpha below 1.
- [x] 2.2 Draw `GAME OVER`, the final score, and a prompt naming the restart keys,
  centred over the wash. Verify a unit test asserts all three strings appear and
  that the score drawn is the one in state.
- [x] 2.3 Call it last in `render`, after the heads-up display as well as the
  board, hazards and player. Verify a unit test asserts no `fillText` from the HUD
  and no `drawImage` occurs after the wash.
- [x] 2.4 Draw it only while the game is over. Verify unit tests assert no wash and
  no game-over text in the playing, sinking and dying phases.
- [x] 2.5 Verify the screen disappears on restart, with a unit test rendering a
  frame after a new run has started and asserting no wash is drawn.

## 3. Reconciling M4

- [x] 3.1 Replace the `game over state is terminal` test with one asserting
  directional input does not leave `GAME_OVER` while a restart key does. Verify the
  replacement fails against M4's behaviour and passes against this change.
- [x] 3.2 Extend the boot tests to drive a whole loop through the real loop: lose
  three lives, see the screen, press Enter, and confirm play resumes from a reset
  board.

## 4. Verification

- [x] 4.1 Run `node --test` and confirm the whole suite passes with nothing
  installed and no `package.json`.
- [x] 4.2 Re-run the zero-dependency scan over the three shipped files, and confirm
  the project still ships exactly `index.html`, `style.css` and `game.js`.
- [x] 4.3 Play from `file://`: lose all three lives, read the screen over the
  defeat scene, press Enter, play again, then lose again and restart with Space.
  Confirm the wash reads well over the artwork and the text is legible.
- [x] 4.4 Confirm by mutation that the new tests can fail — at minimum, make the
  restart key work in any phase, leave the restart slot latched across updates,
  draw the screen before the heads-up display, make the wash opaque, and have
  restart preserve the score; confirm each turns a named test red.
- [x] 4.5 Walk the full source spec `Capybara Crossing.md` scenario by scenario and
  confirm each non-optional one is covered by a durable requirement, recording any
  that is not.
- [x] 4.6 Run the `project-critic` skill against the working tree and resolve
  anything it rejects before the change is considered complete.
