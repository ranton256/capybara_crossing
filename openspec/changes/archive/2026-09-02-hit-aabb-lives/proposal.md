## Why

Traffic moves but passes straight through the capybara. P5 implements the spec's
Capybara Collision Detection and Hazard Mechanics feature: AABB overlap costs a
life, the capybara holds its defeat pose, and it respawns at the start. It also
supplies the first of the two watermark resets the P3 scoring rule depends on.

The P4 design flagged one thing to settle here: a long frame can advance a hazard
more than a tile, which would let a hit pass through undetected. Collision is the
code that depends on that, so the elapsed-time clamp belongs in this change.

## What Changes

- Start a session with 3 lives, shown in the HUD alongside the score.
- Register a collision when the player's one-tile box intersects a hazard's box,
  using the hazard's stored width so a truck spans two tiles.
- On a hit, subtract a life, hold the capybara on the impact cell for a 550ms
  death beat showing the defeat pose, flash the screen for 100ms, and ignore
  movement input for the duration of the beat.
- When the beat ends and lives remain, respawn at column 6 row 6 and reset the
  farthest-north watermark so the next climb can score again. The score itself is
  untouched.
- Suppress further collisions during the death beat, so one impact cannot drain
  several lives.
- When lives reach 0, stop respawning and enter a game-over state. The overlay
  and restart arrive in P7.
- Clamp the per-frame elapsed time so a stalled tab cannot teleport a hazard past
  the player between two collision checks.

## Capabilities

### New Capabilities

- `collision`: AABB overlap detection and the hit penalty.

### Modified Capabilities

None. `gameplay`, `rendering`, and `engine` each gain additive requirements;
their existing ones still hold unchanged.

## Impact

- `game.js` gains lives, the death beat clock, AABB detection, the defeat pose,
  the flash overlay, and the delta clamp.
- New tests in `tests/collision.test.mjs`.
- The visual baseline gains a lives readout in the HUD; it is regenerated here.
