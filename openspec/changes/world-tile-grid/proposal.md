## Why

P1 boots a dark canvas with an empty render pass. ROADMAP P2 is the first slice where opening the game shows the actual jungle board—spa at the top, two road lanes with a median, and a wide riverbank start zone at the bottom—so later milestones can add movement, hazards, and the player on a stable grid.

## What Changes

- Draw a fixed 12×7 tile grid from the existing sprite atlas (four environment tiles only).
- Use a simplified row layout: spa row 0, two `tile_path` road rows separated by one `tile_median` row, and three full-width `tile_start` riverbank rows (rows 4–6) for the P3 spawn zone.
- Load the atlas PNG via a classic `Image` and hardcode the four tile source rectangles in `game.js` (no runtime `fetch` of `manifest.json`) so the game still opens from `file://`.
- Extend `render()` with a painter’s-algorithm background layer: clear canvas, draw all tiles, leave entity and HUD layers for later phases.
- Add Node tests for board layout data and tile draw helpers. No capybara sprite, input, hazards, score, lives, or HUD in this milestone.

## Capabilities

### New Capabilities

- `rendering`: Static tile grid, atlas blitting, and background draw order (layer 1 of the painter’s pipeline).

### Modified Capabilities

- `engine`: Update the render-phase requirement so the loop may draw environment tiles per the rendering spec (replacing the P1 “tiles not drawn” constraint).

## Impact

- `game.js`: board layout, tile frame constants, atlas load, `renderBoard`, updated `render` and `boot`.
- `tests/`: new rendering tests (`createDefaultBoard`, tile placement, draw calls with stub atlas).
- `assets/sprites/capybara_crossing.png`: referenced at runtime (already exists); no manifest fetch at runtime.
- Out of scope: player sprite, keyboard input, moving hazards, collision, HUD text, optional features.
