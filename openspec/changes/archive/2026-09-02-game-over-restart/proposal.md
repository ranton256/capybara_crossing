## Why

P5 already enters a game-over state at zero lives, but nothing shows it and there
is no way out except reloading the page. The spec's "Zero-life game over trigger"
scenario, as amended, requires the final score displayed and Enter or Space to
start a new run. This is the last required behavior; it closes the loop the spec
describes of "victories and defeats without page reloads".

## What Changes

- Draw a game-over overlay after every other layer, showing that the run ended,
  the final score, and a hint naming Enter and Space.
- Accept Enter or Space while game over to start a fresh run: score 0, 3 lives,
  the capybara at the spawn cell, hazards back at their starting positions, and
  every beat cleared.
- Ignore arrow keys while game over, so a queued hop cannot leak into the new run.
- Freeze hazard motion while game over, so the ending scene holds still under the
  overlay.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `input`: the arrow-key requirement gains the game-over case, and restart keys
  are new behavior for the same capability.
- `session`: the round lifecycle gains the run-level restart, which differs from
  the round reset by clearing score and lives.
- `rendering`: gains the overlay layer.

## Impact

- `game.js` gains restart key handling, `restartSession`, and the overlay.
- New tests extend `tests/session.test.mjs` and `tests/input.test.mjs`.
- No change to the visual baseline: a fresh session is not game over.
