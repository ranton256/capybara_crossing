## Why

P2 draws a static jungle board with no player. ROADMAP P3 is the first playable slice: arrow-key hops on the grid, hard bounds, and +10 score on every Up move—the first full Given/When/Then demo before hazards exist.

## What Changes

- Add discrete arrow-key input that moves the capybara exactly one tile per keypress (instant grid snap, no continuous hold motion).
- Clamp moves so the player cannot leave the 12×7 board.
- Spawn the player at bottom-center (row 6, column 6) facing up.
- Award **10** points only when an Up hop succeeds; Left/Right/Down move without scoring.
- Draw the capybara sprite from the existing atlas after tiles, and draw a simple score HUD on top.
- Extend the update phase so queued input is applied before render; keep hazards, collision, lives, and goal out of scope.
- Cover hop/score/bounds with Node unit tests; refresh the Playwright board snapshot so the player sprite is the new baseline.

## Capabilities

### New Capabilities

- `input`: Discrete arrow-key grid movement and board-edge clamping.
- `gameplay`: Player grid position, starting spawn, and +10 score on successful Up hops.

### Modified Capabilities

- `engine`: Update phase applies player input; render phase may draw the player entity and score HUD (replacing P2 “no player / no HUD” constraints).
- `rendering`: Painter’s pipeline gains entity (player) and HUD (score) layers after the tile background.

## Impact

- `game.js`: player state, hop/score helpers, key listeners, entity + HUD draw, `update` wiring.
- `tests/`: new input/gameplay unit tests; rendering tests extended for player/HUD draw order.
- `tests/e2e/`: update Chromium snapshot after the player appears on the board.
- `assets/sprites/capybara_crossing.png`: reuse existing capybara frames (hardcoded rects, no manifest fetch).
- Out of scope: hazards, AABB, lives, goal/+50, walk-cycle animation, optional features (timer, audio, localStorage).
