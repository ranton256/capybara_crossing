## Why

The capybara can climb to the top row and nothing happens. P6 implements the
spec's "Reaching the ultimate goal (The Hot Mud Spa)" scenario and the Game State
and Level Lifecycle Management feature: reaching the spa pays a bonus, the
capybara sinks in, and a fresh one starts the next round with score and lives
carried over.

This supplies the second of the two watermark resets the P3 scoring rule needs.
With P5's death reset and this one, the rule is complete.

## What Changes

- Award 50 bonus points when the player enters row 0. The 10-point forward-hop
  award for the hop that got there still applies, so the entering hop pays 60.
- Hold the capybara on the spa for a 400ms sink beat with a small downward draw
  offset, ignoring movement input for the duration, exactly as the death beat
  does.
- When the beat ends, return the capybara to column 6 row 6 and reset the
  farthest-north watermark so the next approach can score again. Score and lives
  carry over unchanged.
- Keep traffic moving during the sink beat.
- Treat the whole of row 0 as the goal: no bays, no occupancy state, as the spec
  was amended to say.

Out of scope: difficulty scaling between rounds, which the spec keeps optional.

## Capabilities

### New Capabilities

- `session`: the round lifecycle — goal detection, the sink beat, and the reset
  that carries score and lives into the next round.

### Modified Capabilities

None. `gameplay` and `rendering` gain additive requirements.

## Impact

- `game.js` gains goal detection, the sink beat clock, and the sink draw offset.
- New tests in `tests/session.test.mjs`.
- No new dependencies, no change to the visual baseline: a fresh session still
  starts at the spawn cell.
