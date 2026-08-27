## Why

P3 lets the capybara hop a static board. ROADMAP P4 is the first moving world: ATVs and a two-cell truck on both road lanes, drawn in painter’s order, so P5 has real hazards to collide with.

## What Changes

- Spawn moving hazards on the two existing road rows (1 and 3): trucks on row 1 traveling right, ATVs on row 3 traveling left.
- Advance hazards each update using hardcoded speeds (ATV faster than truck). The truck occupies two tile widths (32×16 atlas frame).
- Wrap a hazard that fully leaves one canvas edge so it reappears on the opposite edge (classic continuous flow, not per-lane speed curves).
- Draw hazards after tiles and before the player; keep score HUD on top. No AABB, lives, or goal in this milestone.
- Cover motion, wrap, and draw order with Node tests. Freeze hazard motion in the Playwright screenshot (`?freeze=1`) so the visual baseline stays deterministic.

## Capabilities

### New Capabilities

- `hazards`: Moving ATV and truck entities, two-lane layout, wrap, and width.

### Modified Capabilities

- `engine`: Update phase moves hazards; render phase may draw hazard sprites.
- `rendering`: Painter’s pipeline inserts the hazard layer between tiles and the player.
- `testing`: Visual regression loads a frozen-traffic URL so moving sprites do not flake the baseline.

## Impact

- `game.js`: hazard spawn, `moveHazards`, wrap, `renderHazards`, update/render wiring, optional freeze from query string.
- `tests/`: new hazard unit tests; rendering order tests; e2e uses `?freeze=1` and a refreshed snapshot.
- Out of scope: AABB/lives (P5), goal (P6), Game Over (P7), logs/monkey/parrot, variable speed curves, audio.
