## Why

Losing a life is easy to miss: the player teleports to the start immediately, and the short defeat/Zzz pose plays at spawn instead of at the impact cell. Players often only notice the lives counter change and feel confused about what happened.

## What Changes

- On a mid-run hit (lives remaining after the penalty), hold the player at the impact cell in the defeat pose for a short death beat before respawning at start.
- During that beat, **flicker** the defeat sprite (alternate visible/hidden) so the hit reads clearly even under traffic.
- On the hit frame, play a brief full-canvas **screen flash** (under the HUD so Score/Lives/Best stay readable).
- During the death beat, ignore hop input (same pattern as the spa sink beat) so the death feedback is not skipped by another hop.
- On the last life, enter Game Over immediately, keep the player on the impact cell with the defeat pose (flicker may continue under the overlay), and do not playable-respawn.
- Lives still decrement on the hit frame; score and Best rules stay unchanged.

## Capabilities

### New Capabilities

<!-- none — behavior lands in existing collision / rendering / gameplay specs -->

### Modified Capabilities

- `collision`: Mid-run hits delay respawn until a death beat ends; defeat feedback is tied to the impact cell.
- `rendering`: Defeat pose at impact for the full death beat, with sprite flicker; brief screen flash on hit drawn under the HUD.
- `gameplay`: Hop input ignored while the death beat is active (parallel to sink).

## Impact

- `game.js`: `resolveCollisions`, update/hop gating, `finishDeath` / `hurtUntil` timing, render flicker + flash overlay; tests under `tests/` for collision, gameplay, and rendering.
- No new atlas frames (reuse `capy_defeat`); no `localStorage` or audio changes.
