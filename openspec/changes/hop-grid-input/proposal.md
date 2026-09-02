## Why

The board is drawn but nothing is on it. P3 puts the capybara on the grid and
makes the arrow keys move it, which is the spec's Discrete Grid Input Management
feature and the first half of "Advancing toward the spa". It also settles the
scoring rule the spec was amended to fix: points come from new forward progress,
not from pressing Up repeatedly.

## What Changes

- Spawn the player at column 6, row 6, facing up, with score 0.
- Translate ArrowUp, ArrowDown, ArrowLeft, and ArrowRight into exactly one grid
  cell of movement, applied during the update phase.
- Reject any hop that would leave the 12×7 board; the player stays put and no
  wrap occurs.
- Award 10 points only when an Up hop reaches a row farther north than any row
  reached during the current life, then move that watermark.
- Draw the player from the atlas at its grid cell, using the walk frame pair for
  its facing direction and alternating between them on each successful hop.
- Draw a HUD showing the score, after every other layer.

Out of scope: hazards, collision, lives, and the spa goal. The watermark reset
points that depend on death and spa clears arrive with P5 and P6.

## Capabilities

### New Capabilities

- `input`: discrete one-tile arrow movement and board boundary clamping.
- `gameplay`: player spawn, facing, and the forward-progress scoring rule.

### Modified Capabilities

None. `rendering` gains new layers, which is additive: the existing background
ordering requirement still holds unchanged.

## Impact

- `game.js` gains player state, key handling, hop resolution, scoring, player
  sprite rendering, and HUD rendering.
- New tests in `tests/input.test.mjs` and `tests/gameplay.test.mjs`; rendering
  tests extend for the new layers.
- The P2 visual baseline changes: the board now has a capybara on it. The
  baseline is regenerated as part of this change.
