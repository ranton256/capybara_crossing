## Why

P4 moves trucks and ATVs through the player with no consequence. ROADMAP P5 is the first hit: AABB overlap costs a life, shows the Zzz/defeat pose, and respawns at start while the score stays.

## What Changes

- Detect AABB overlap between the 1×1 player box and each hazard box (truck width 2).
- On hit: subtract 1 life, reset the player to (6, 6), keep score unchanged, and show the defeat/Zzz frame briefly. Input stays unlocked (no i-frames).
- Start with 3 lives. Draw lives in the HUD. Game Over at 0 lives stays P7 — P5 may reach 0 and still respawn.
- Evaluate collision in update after hops and hazard motion. Median-safe: adjacent-row traffic does not hit.

## Capabilities

### New Capabilities

- `collision`: AABB tests, hit response (life, respawn, Zzz pose).

### Modified Capabilities

- `gameplay`: Session lives (start 3); score persists across hits.
- `engine`: Update evaluates collision after input and hazard motion.
- `rendering`: Lives in HUD; defeat frame while the Zzz pose is active.
- `hazards`: Drop the P4 “no collision” constraint (motion unchanged).

## Impact

- `game.js`: `aabbOverlap`, `resolveCollisions`, lives on state, defeat frame, HUD text.
- `tests/`: collision and lives unit tests; HUD/render updates.
- Out of scope: Game Over screen (P7), goal/+50 (P6), i-frames, optional features.
