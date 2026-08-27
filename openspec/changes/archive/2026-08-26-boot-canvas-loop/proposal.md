## Why

The game has art and a test harness but nothing that runs in a browser. ROADMAP P1 is the first playable slice: a zero-dependency page that draws a crisp canvas and ticks a `requestAnimationFrame` loop so later milestones can plug in world, input, and entities.

## What Changes

- Add `index.html`, `style.css`, and `game.js` as the only runtime files needed to open the game from disk (no bundler, no `type="module"`).
- Show a canvas viewport with integer scale and anti-aliasing disabled so 16×16 pixel art stays blocky.
- Start a deterministic game loop: each animation frame runs update, then clear-and-render (update and draw stay empty besides a full canvas clear).
- Cover boot helpers with Node tests so the existing 80% coverage gate still passes when `game.js` exists.

## Capabilities

### New Capabilities

- `engine`: Zero-dependency browser boot, crisp canvas, and `requestAnimationFrame` update-then-render loop.

### Modified Capabilities

- (none)

## Impact

- New files: `index.html`, `style.css`, `game.js`.
- New tests under `tests/` for extractable boot/loop helpers.
- No npm runtime dependencies. Dev-only `npm test` already exists.
- Out of scope: tiles, sprites, input, hazards, score, lives, Game Over, optional features.
