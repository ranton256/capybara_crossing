## 1. Player state

- [x] 1.1 Add `PLAYER_FRAMES` source rects for the four facings, transcribed from
      `manifest.json`; verify a test asserts each pair matches the manifest
- [x] 1.2 Add `createInitialPlayer()` returning column 6, row 6, facing up, and
      seed `bestRowThisLife` to the spawn row; verify a test asserts the spawn
      cell, facing, and a score of 0

## 2. Input

- [x] 2.1 Add `directionFromKey(key)` mapping the four arrow keys and returning
      undefined otherwise; verify a test covers all four plus a rejected key
- [x] 2.2 Add `handleKeydown(state, event)` recording one pending direction;
      verify a test asserts a non-arrow key leaves the pending direction unset
- [x] 2.3 Implement `hop(state, direction)` applying a one-cell move with bounds
      rejection; verify tests cover an interior hop, all four edges rejecting an
      outward hop, and an inward hop from an edge succeeding
- [x] 2.4 Apply the pending direction from `update` and clear it; verify a test
      asserts one update consumes one pending press

## 3. Scoring and facing

- [x] 3.1 Award 10 points only when the destination row beats `bestRowThisLife`,
      then advance the watermark; verify tests cover first Up, re-climbing the
      same row, a lateral hop, and a blocked hop at row 0
- [x] 3.2 Set facing on accepted hops only; verify a test asserts facing survives
      a rejected hop

## 4. Rendering

- [x] 4.1 Implement `renderPlayer(state, ctx)` drawing the facing's walk frame at
      the player cell; verify a test asserts the destination rect and that the
      frame matches facing
- [x] 4.2 Alternate the walk frame on each accepted hop; verify a test asserts
      the frame differs after a second hop
- [x] 4.3 Implement `renderHud(state, ctx)` drawing the score; verify a test
      asserts the score text is drawn
- [x] 4.4 Call both from `render` after the board; verify a test asserts the
      order is tiles, then player, then HUD

## 5. Verification

- [x] 5.1 Run `npm test` and verify the suite passes with coverage at or above
      80% for lines, functions, and branches
- [x] 5.2 Regenerate the visual baseline and run `npm run test:e2e`; verify the
      capybara appears at the spawn cell
- [x] 5.3 Run `openspec validate hop-grid-input --strict` and confirm it passes
