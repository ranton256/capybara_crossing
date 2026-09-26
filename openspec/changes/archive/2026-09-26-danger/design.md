## Context

See `proposal.md` — Why. `DECISIONS.md` gaps 1, 2, 12, 13 and 14 settle the death
beat's semantics, what flashes, whether traffic keeps moving, where M4 stops at
zero lives, and what the blink looks like.

What the previous milestones leave in place, and which this change consumes
rather than re-derives:

- **The phase pattern.** `phase` plus `phaseElapsed`, reset on every transition,
  with expiry resolved before input. M2 built it for one timed state and said the
  right shape would only be visible once there were two. `DYING` is the second.
- **The clamp margin.** A worst-case 0.1s frame advances the fastest hazard 0.25
  tiles — under the narrowest hazard's width. That is what makes a once-per-frame
  collision check sufficient rather than requiring swept-volume tests.
- **Geometry agreement.** M3's critic finding established that a hazard's logical
  width equals its drawn width, so the box tested here is the box on screen.
- **Phase-independent traffic.** Hazards advance above the phase gate, so the
  lanes keep moving through the death beat.

Constraints unchanged: three shipped files, `file://` with no build step,
`node --test` with no `package.json`, logic callable with no DOM.

## Goals / Non-Goals

**Goals:**

- Make the collision test a pure predicate over two boxes, so it can be argued
  about and tested without constructing a game state.
- Close the state set. After this change M5 adds presentation only.
- Keep "one death costs one life" structural rather than maintained by a flag
  that something else could clear.

**Non-Goals:**

- Swept or continuous collision. The clamp margin makes it unnecessary, and
  adding it would be solving a problem this game does not have.
- Any generalisation of the two timed phases beyond what having two actually
  shows. See the decision below.
- Post-respawn invulnerability. The spawn cell is on the riverbank where no lane
  runs, so there is nothing to be invulnerable to.

## Decisions

### Collision is a pure predicate on spans, not a method on state

```js
overlaps(aStart, aEnd, bStart, bEnd)   // half-open [start, end)
hits(player, hazard)                   // same row AND spans overlap
```

*Why half-open intervals:* a player at column 6 spans `[6, 7)` and a hazard whose
box ends exactly at 6 does not touch it. Closed intervals would make an adjacent,
non-overlapping vehicle lethal, and the spec has a scenario for exactly that
because it is the classic off-by-one in tile collision.

*Why a predicate rather than a state method:* every interesting case is a pair of
numbers, so the tests can enumerate boundaries — touching, partial overlap,
containment, adjacent row — without building a world. The state-level function
then only has to answer "does any hazard hit" and is trivial by comparison.

### Collision is evaluated once, after all motion, inside the playing branch

```
    update(state, dt, input)
      |
      +-- 1. advance elapsed, phaseElapsed, and every hazard
      +-- 2. resolve an expired phase
      +-- 3. if the phase does not accept input: drain, discard, return
      +-- 4. apply a buffered direction
      +-- 5. evaluate collision                        <-- new
```

*Why after movement rather than before:* a player stepping into a truck and a
truck driving into a player must be the same event. Checking before the move
would miss the first; checking twice would risk charging two lives for one frame.
One check after all motion makes them one case by construction.

*Why inside the playing branch:* steps 1 and 2 run in every phase, so traffic
keeps flowing during the beat, but only a playing player can be struck. Placing
the check after the early return means `DYING`, `SINKING` and `GAME_OVER` are
immune without any of them naming collision.

*Consequence:* a hazard that overlaps the player for twenty frames costs one
life, because after the first frame the phase is no longer `PLAYING`. "Once per
death" is therefore structural, not a flag.

### `DYING` and `SINKING` stay separate rather than being generalised

M2 deferred the question of a shared timed-phase helper until a second instance
existed. With both in hand the differences are: duration, whether the player is
drawn from a walk frame or the defeat frame, whether a bonus is awarded, whether
lives are spent, and where the beat routes on expiry. What they share is
"accumulate, compare, transition" — three lines.

*Decision:* keep them as two branches in `resolvePhase`, sharing the accumulator
and the epsilon comparison but nothing else.

*Why:* a helper abstracting three shared lines while parameterising five
differences is longer than the code it replaces and harder to read. The
generalisation was worth waiting for precisely so it could be declined on
evidence.

### Life spending happens at the moment of collision, not at beat expiry

The decrement is applied in the same transition that enters `DYING`.

*Why:* the HUD then shows the cost immediately, at the same instant as the flash,
rather than 550ms later when the player has stopped looking. It also means the
routing decision at expiry is a simple read of the counter rather than a
subtract-then-test, so "did this death end the game" has one obvious answer.

### The flash is computed from the phase clock, not from a frame counter

Drawn or not is `floor(phaseElapsed / 0.025)` being even, for the first 100ms.

*Why:* a frame counter would strobe twice as fast at 120Hz. Deriving it from
accumulated seconds makes the flash refresh-rate independent for the same reason
the beat is, and the spec has a scenario asserting it.

*Boundary handling:* at exactly 25ms boundaries floating-point accumulation lands
either side depending on step size — three frames of 1/60 reach
0.050000000000000003 while six of 1/120 reach 0.049999999999999996, putting them
in different toggle bands at the same instant. An earlier draft of this document
called that cosmetic and exempted it from the tolerance the phase clock uses.
That was wrong: the rendering spec requires the flash be identical at any refresh
rate, and it would not have been. The flash therefore uses the same
`TIME_EPSILON` as a phase transition, at both the toggle boundary and the end of
the 100ms window. One float-boundary policy for the whole file is also simply
easier to reason about than two.

## Risks / Trade-offs

**M3's tests assume traffic is harmless** → `hazards.test.js` and `boot.test.js`
walk the player up the board without regard for lanes, and those walks now die
partway. They move to columns or timings clear of traffic. A test changed to
match new behaviour is legitimate only because the delta spec in this change is
the record that the behaviour changed first.

**A once-per-frame check is only sound while the clamp margin holds** → It rests
on M3's asserted 0.25-tile worst case. If a later change raises a lane speed past
10 tiles/sec, or the clamp is loosened, a hazard could cross the player's tile
between two checks. The margin is asserted in `hazards.test.js`; this change adds
an assertion tying it explicitly to collision so the dependency is discoverable
from the collision tests rather than only from the lane tests.

**Row 1 is two tiles wide and the player is one** → A truck covers the player's
column for two thirds of a tile-width longer than an ATV does. That is intended
difficulty, not a bug, and it falls out of the box widths rather than any rule.

**`GAME_OVER` is terminal and unreachable-from in this milestone** → Deliberate
per gap 13. The state exists and halts play, but nothing leaves it until M5 adds
the restart. A test asserts it is terminal, so M5 changing that is a visible spec
change rather than a silent one.

## Open Questions

None blocking. Whether the death beat should briefly pause the traffic for
emphasis is a presentation question that gap 12 already answered no to; if M5's
game-over screen wants a different treatment, that is M5's to raise.
