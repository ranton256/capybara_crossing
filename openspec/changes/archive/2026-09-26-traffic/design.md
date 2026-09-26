## Context

See `proposal.md` — Why. `DECISIONS.md` gaps 3, 9, 10, 11 and 12 settle the lane
contents, pixel snapping, ATV spacing, ATV colours, and whether traffic flows
while the game is not playing.

What M1 and M2 leave in place for this change:

- **The delta-time contract.** Seconds, clamped to 0.1s. M2's sink beat was its
  first consumer; hazard motion is the first *continuous* one, and the first
  where the clamp bounds something that could otherwise skip past the player.
- **`update(state, dt, input) -> state`.** Hazards advance inside it, and because
  they must move regardless of phase, they advance before the phase gate rather
  than inside the playing branch.
- **Painter's order in `render`.** Board, player, HUD. Hazards slot between board
  and player.

The constraints are unchanged: three shipped files, `file://` with no build step,
`node --test` with no `package.json`, logic callable with no DOM.

## Goals / Non-Goals

**Goals:**

- Make lane motion exactly reproducible, so M4 can add collision to a lane whose
  position at any elapsed time is already known and tested.
- Keep the spacing invariant structural rather than maintained: gaps should be
  impossible to drift, not merely observed not to.
- Establish the clamp margin as an asserted property rather than a comment, since
  M4's collision correctness rests on it.

**Non-Goals:**

- Collision, in any form. Not even a helper that computes overlap.
- Per-hazard behaviour. Every hazard in a lane is identical apart from its
  position and its sprite.
- A general entity system. There is one kind of moving thing.

## Decisions

### Lanes are configuration; hazards are generated from them

```js
LANES = [
  { row: 1, count: 2, width: 2, speed:  1.5, sprites: ['truck'] },
  { row: 3, count: 3, width: 1, speed: -2.5, sprites: ['atv_red', 'atv_blue'] },
]
```

Hazards are produced by spreading `count` evenly across that lane's wrap distance
`COLS + width`, cycling `sprites` for each.

*Why generate rather than list:* even spacing is then a property of the
constructor rather than of a hand-written table that a later edit can quietly
break. Gap 10's 4.333-tile period is arithmetic nobody should have to maintain by
hand, and the trucks' 7-tile period falls out of the same expression.

*Why the sign of `speed` carries direction:* one field instead of two, and the
wrap condition and the mirroring decision both read it directly. A separate
`direction` field would be a second source of truth for the same fact.

### Hazards advance before the phase gate

```
    update(state, dt, input)
      |
      +-- 1. advance elapsed and phaseElapsed
      +-- 2. advance every hazard by speed * dt, then wrap   <-- new, phase-independent
      +-- 3. resolve an expired phase
      +-- 4. if the phase accepts input, drain and apply
```

*Why before, not inside the playing branch:* `DECISIONS.md` gap 12. Traffic is a
world, not a turn. Placing it above the gate means hazard motion has exactly one
rule with no exception, which matters in M4 where a lane frozen during the death
beat would let the player respawn into a hazard that never moved.

### Wrapping is a translation by exactly the wrap distance

A hazard that has left the board is moved by `± (COLS + width)` rather than being
assigned a fixed re-entry position.

*Why:* assignment discards the overshoot. A hazard that passed the boundary by
0.3 tiles should re-enter 0.3 tiles in, not at exactly the edge — otherwise every
wrap loses a sliver of travel, gaps drift apart over a session, and the spacing
invariant the spec requires is quietly false. Translation preserves the remainder
exactly, which is why "gaps survive many wraps" is a scenario rather than an
assumption.

*Trade-off:* a single translation only suffices if one frame cannot carry a
hazard further than one wrap distance. At the clamp of 0.1s and 2.5 tiles/sec
that is 0.25 tiles against a 13-tile wrap, so the margin is a factor of 52. The
implementation still loops rather than translating once, because an unclamped
`dt` reaching it directly in a test should not silently corrupt the lane.

### Mirroring is a transform around the hazard's own centre

Right-moving lanes draw with a negative horizontal scale about the sprite's
midpoint, restoring the transform afterwards.

*Why restore rather than draw everything mirrored and flip back once:* the player
and the HUD are drawn after hazards, and a leaked transform would mirror them.
The rendering spec has a scenario for exactly that, because it is the failure
this decision exists to prevent.

### Snapping happens at the draw call, not in state

`Math.floor(position * TILE) / TILE` at the point of drawing (gap 9).

*Why floor rather than round:* round makes the snapped position jump backwards
when a hazard crosses a half-pixel while its true position is still advancing,
which reads as a stutter. Floor is monotonic for rightward motion and for
leftward motion alike, which is why the spec asserts monotonicity rather than
just whole-pixel alignment.

*Note the asymmetry with M2:* the sink deliberately draws at fractional offsets
(gap 7), because 400ms of stepped descent reads as broken, while stepped
horizontal motion reads as the genre. Both are recorded so the difference is a
choice rather than an inconsistency.

## Risks / Trade-offs

**A hazard is scenery this milestone, so "does it look right" is the only real
check** → The unit tests can prove position, wrapping and spacing exactly, but
not that a truck faces the way it travels. Mirroring and layer order are asserted
through a stub context and confirmed by eye in a browser, because a transform
that is right in the call log and wrong on screen is a real possibility.

**Floating-point drift across a long session** → Positions accumulate `speed *
dt` indefinitely. Wrapping by translation keeps values bounded to roughly one
wrap distance rather than growing without limit, so precision does not degrade
over a session the way an ever-increasing `elapsed * speed` would.

**The clamp margin is load-bearing for M4, not for M3** → Nothing in this change
breaks if the margin is wrong, which is exactly why it is easy to leave
unasserted until it matters. It is asserted here.

**Even spacing makes traffic rhythmic and therefore learnable** → A deliberate
consequence of gaps 3 and 10. A player can time a crossing once and repeat it.
For a tutorial game whose stated goal is laid-back vibes, predictable is the
point; irregular traffic would need a spacing model the spec does not ask for.

## Open Questions

None blocking. Whether the two lanes should ever differ in anything but their
configuration row is a question for M4, when collision may or may not want to
treat a 2-tile truck differently from a 1-tile ATV.
