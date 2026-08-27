## Why

P5 can drive lives to 0 with no end state. ROADMAP P7 is the last required slice: Game Over overlay with final score and a restart that does not use `localStorage`.

## What Changes

- When a hit reduces lives to 0, set Game Over: stop hops and hazard motion, show overlay with final score and restart hint.
- Enter or Space restarts: lives 3, score 0, player at start, hazards reset, overlay gone.
- HUD (score + lives) stays on top of world pixels; Game Over text is the top overlay.
- No persistent high score.

## Capabilities

### New Capabilities

- `session`: Game Over state and in-place restart.

### Modified Capabilities

- `collision`: Last life triggers Game Over instead of a playable respawn.
- `engine`: Update skips play when Game Over; restart from key.
- `rendering`: Game Over overlay after HUD world text.
- `input`: Enter/Space restart while Game Over; arrows ignored.

## Impact

- `game.js`: `gameOver` flag, `restartSession`, overlay draw, input.
- `tests/`: game-over and restart unit tests.
- Out of scope: localStorage, timer, audio, speed ramp.
