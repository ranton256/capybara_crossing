## Why

A project review found several behaviors that exist in `game.js` and the main specs but lack direct unit assertions (truck AABB width, Space restart, hazard reset on restart, Game Over freezing motion, out-of-bounds Up scoring, and a full `update` integration path). Closing those gaps reduces regression risk without changing shipped gameplay.

## What Changes

- Add Node unit tests (and tighten existing ones) for the review’s test gaps listed below.
- Extend the `testing` capability so those cases are required automated checks under `npm test`.
- **No** changes to `game.js` gameplay behavior, HUD, or assets.
- **No** new Playwright gameplay flows; the existing frozen-spawn visual gate stays as-is.
- Out of scope: product fixes from the same review (walk-cycle animation, “energetic” round, score-farming policy, Game Over “submission,” spa sink presentation).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `testing`: Require Node unit coverage for truck-width collision, Space restart, hazard layout reset on restart, Game Over freezing hazards, rejected Out-of-bounds Up hop (no score), and one `update` integration path (hop → move → collide and/or goal).

## Impact

- `tests/*.test.mjs` (primarily `collision`, `session`, `gameplay`, `hazards` / engine-adjacent).
- `openspec/specs/testing/spec.md` after archive sync.
- Pre-commit still runs `npm test` only; coverage gate unchanged (≥80%).
- No runtime npm dependencies; no e2e script changes.
