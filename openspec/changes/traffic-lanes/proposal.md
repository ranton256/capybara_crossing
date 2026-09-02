## Why

The board has two road rows and nothing on them. The spec's Fixed Parameters
table pins exactly what traffic those rows carry, and the "Continuous traffic
flow" scenario requires hazards that wrap rather than disappear. P4 makes the
roads dangerous-looking; P5 makes them actually dangerous.

This is also the first thing on the board that moves, so it is where the elapsed
time P1 threaded into `update` finally gets used.

## What Changes

- Add hazards to both road rows: row 1 carries trucks travelling right at 1.5
  tiles per second, two tiles wide; row 3 carries ATVs travelling left at 2.5
  tiles per second, one tile wide. At least one of each is present at spawn.
- Advance each hazard by velocity × elapsed seconds, so speed is identical at
  60Hz and 120Hz.
- Wrap a hazard to the opposite edge once it is fully past the edge it is
  heading for, keeping traffic continuous.
- Draw hazards from the atlas between the tiles and the player, flipping
  right-moving sprites horizontally since all vehicle art faces left.
- Honour the existing freeze flag: with `?freeze=1`, hazards hold their spawn
  positions so the visual baseline stays stable.

Out of scope: collision and lives. Hazards pass straight through the capybara
until P5.

## Capabilities

### New Capabilities

- `hazards`: lane occupancy, constant-speed horizontal motion, and edge wrapping.

### Modified Capabilities

None. `rendering` gains a hazard layer, which is additive; the existing ordering
requirements still hold.

## Impact

- `game.js` gains hazard constants, spawn, motion, and rendering.
- New tests in `tests/hazards.test.mjs`.
- The visual baseline changes: vehicles now sit on both road rows. It is
  regenerated as part of this change, captured under `?freeze=1`.
