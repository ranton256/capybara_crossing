## Why

P1 clears the canvas to a flat colour every frame. The spec's Canvas Rendering
Pipeline requires background tiles drawn first, before entities and HUD, and the
Fixed Parameters table fixes the board those tiles form. P2 draws that board from
the supplied 128×128 atlas, which also forces the `file://` asset rule into real
code: the atlas arrives through an `<img>`, and its source rectangles are
constants, not a fetched manifest.

## What Changes

- Load `assets/sprites/capybara_crossing.png` through an `<img>` element and
  hold it in game state once it has decoded.
- Add source-rectangle constants for the four environment tiles, transcribed
  from `manifest.json` at authoring time. Nothing reads that file at runtime.
- Add the fixed 12×7 board: row 0 spa, rows 1 and 3 road, row 2 median, rows 4–6
  riverbank, every row filled across all 12 columns.
- Draw every board cell each frame, immediately after the clear and before
  anything else, at 48×48 destination size (16px source × scale 3).
- Keep rendering safe before the atlas finishes decoding: the canvas still
  clears each frame and tile drawing is skipped until the image is ready.

Out of scope: player sprite, input, hazards, HUD. Those land in P3 and P4.

## Capabilities

### New Capabilities

- `rendering`: the tile-drawing layer — board layout, atlas-backed tile blitting,
  and the painter's-algorithm ordering that later entity and HUD layers extend.

### Modified Capabilities

None. `engine` keeps its P1 requirements unchanged; the render phase gains a
layer without altering the loop contract.

## Impact

- `game.js` gains atlas loading, tile constants, board construction, and tile
  rendering.
- New tests in `tests/rendering.test.mjs`.
- No new dependencies. The atlas is a static file already in the repo.
