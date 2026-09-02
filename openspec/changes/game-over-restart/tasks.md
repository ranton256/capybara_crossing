## 1. Restart request

- [x] 1.1 Add `RESTART_KEYS` for Enter and Space; verify a test asserts both are
      recognised and other keys are not
- [x] 1.2 Record `pendingRestart` from `handleKeydown` only while game over;
      verify tests assert it is set when game over and ignored during play
- [x] 1.3 Ignore arrow keys while game over; verify a test asserts no pending
      direction is recorded and the player does not move
- [x] 1.4 Call `preventDefault` when a key is acted on, guarded so plain object
      events still work; verify a test asserts it is called for Space

## 2. Restart application

- [x] 2.1 Implement `restartSession(state)` mutating state in place, resetting
      score, lives, player, watermark, hazards, and clearing every beat and the
      game-over flag; verify tests assert each
- [x] 2.2 Apply a pending restart first in `update`; verify a test asserts the
      run resumes in the same frame
- [x] 2.3 Hold hazards still while game over; verify a test asserts positions are
      unchanged across an update

## 3. Overlay

- [x] 3.1 Implement `renderOverlay(state, ctx)` drawing a scrim, the ended-run
      text, the final score, and a hint naming Enter and Space; verify tests
      assert all three strings appear
- [x] 3.2 Draw it last in `render`, only while game over; verify tests assert it
      comes after the HUD and is absent during normal play

## 4. Verification

- [x] 4.1 Run `npm test` and verify the suite passes with coverage at or above
      80% for lines, functions, and branches
- [x] 4.2 Run `npm run test:e2e` and verify the baseline still passes
- [x] 4.3 Play a full loop in a browser: lose three lives, see the overlay,
      press Enter, and confirm a fresh run begins
- [x] 4.4 Run `openspec validate game-over-restart --strict` and confirm it passes
