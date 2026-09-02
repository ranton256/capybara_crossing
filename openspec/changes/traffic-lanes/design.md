## Context

See `proposal.md` — Why. P1 threads elapsed milliseconds into `update`; P2 put
`ROAD_ROWS` on state's doorstep precisely so lanes and board could not drift
apart; P3 established that the update phase mutates state and the render phase
only reads it. P4 is the first thing that actually moves.

All supplied vehicle art faces left, which the spec now records in its art notes.

## Goals / Non-Goals

**Goals:**

- Motion measured in tiles per second, not pixels per frame.
- Traffic that never leaves a gap in a lane.
- A hazard model that P5's collision can consume without reshaping.

**Non-Goals:**

- Per-lane speed variation beyond the two the Fixed Parameters table gives, or
  more than two lanes. Those are the spec's optional Dynamic Traffic Patterns.
- Spawning and despawning hazards. A fixed set that wraps forever is simpler and
  gives identical behavior.
- Difficulty scaling. That is an optional feature; the speed factor hook is
  deliberately absent until asked for.

## Decisions

**Hazard `x` is a float in tile units, not pixels.** Position multiplies by
`DEST_SIZE` only at draw time, exactly as the player's integer cell does. Working
in tile units keeps the collision maths in P5 in the same coordinate space as the
player's `col`/`row`, so the AABB check needs no unit conversion.

The player stays on integers and hazards go fractional, which is the real
asymmetry of this game: the capybara snaps between cells while traffic slides
continuously. Making both fractional would reintroduce the drift the input spec
forbids; making both integer would turn smooth traffic into stop-motion.

**Wrap by subtracting a period, not by assigning an edge coordinate.** The period
is `COLS + width`. Assigning `x = -width` on wrap would quantise every wrap to
the same instant and make evenly spaced vehicles bunch up over time; subtracting
the period preserves the sub-tile remainder and therefore the spacing.

**Velocity sign carries direction; no separate direction field.** `vx > 0` means
rightward, which is also the flip condition at draw time. A parallel `direction`
string could disagree with the velocity.

**Mirroring via `save`/`translate`/`scale`/`restore`.** Flipping the context is
the standard way to reuse one sprite for both directions. Pre-mirrored atlas
frames would be the alternative, but the atlas has none and adding them would
mean editing the supplied art. The restore is non-optional: leaving the transform
flipped would mirror the player drawn immediately after.

**Freeze checked in `moveHazards`, not in the loop.** The flag should stop
motion, not stop the whole update; the player must still be able to hop while a
visual baseline is being captured.

## Risks / Trade-offs

- **A long frame (background tab, breakpoint) advances hazards a long way in one
  step, potentially through the player** → at 2.5 tiles/sec a hazard needs a
  400ms frame to skip a whole tile. P5 evaluates collision after motion each
  frame, so a skip could miss a hit. Noted for P5 rather than solved here;
  clamping the delta belongs with the code that depends on it.
- **Fractional hazard positions make exact-equality assertions fragile** → tests
  assert against computed expectations and use tolerances where the arithmetic is
  floating point.
- **Flipping relies on the context honouring save/restore** → a test asserts the
  save and restore calls bracket the mirrored draw, so a regression that leaks
  the transform is caught rather than showing up as an upside-down capybara.
