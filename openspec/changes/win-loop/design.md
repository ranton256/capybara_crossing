## Context

See `proposal.md` — Why. `DECISIONS.md` gaps 4, 7 and 8 settle the HUD's position,
the sink's appearance, and the HUD's contents.

M1 left three things in place that this change is the first to use:

- **The delta-time contract.** Seconds, clamped to 0.1s, threaded through
  `update(state, dt, input)`. M1 proved it against synthetic steps because nothing
  in M1 moved with time. The 400ms beat is its first real consumer.
- **The input buffer.** A single pending slot drained by `update`, built expressly
  so a modal state could ignore input by declining to drain it. `SINKING` is the
  first modal state.
- **State is a plain object; transitions return new state.** `render` receives a
  state it cannot alter.

The constraints from M1 all still hold: three shipped files, `file://` with no
build step, `node --test` with no `package.json`, logic callable with no DOM.

## Goals / Non-Goals

**Goals:**

- Shape the state machine so M4's `DYING` and M5's `GAME_OVER` are additions to an
  existing pattern, not a restructuring.
- Keep every scoring rule a pure function of a state transition, so the watermark's
  reset points are visible in one place rather than spread across the lifecycle.
- Make the 400ms beat frame-rate independent in the same way hazard motion will be
  in M3, so both inherit one mechanism.

**Non-Goals:**

- A general timer or scheduler. There is one timed state; a second arrives in M4.
  Two instances is when the shape becomes clear, not one.
- An animation system. The sink is one sprite drawn with a computed source
  rectangle.
- Generalising the HUD into a layout system. It is two strings at fixed positions.

## Decisions

### The state is a string on the state object, with its timer alongside

```js
state.phase    // 'playing' | 'sinking'
state.phaseElapsed  // seconds accumulated in the current phase
```

`update` advances `phaseElapsed` by the clamped delta, then asks whether the
current phase has expired.

*Why a string rather than a constant or a symbol:* it survives
`JSON.stringify` in test snapshots and prints readably in a failure message.
The closed set is enforced by a test, not by the type system, because there is no
type system here.

*Why a separate `phaseElapsed` rather than an absolute deadline:* a deadline
computed from `state.elapsed` would require the world clock to be monotonic across
a phase change, which couples two things that need not be coupled. Resetting a
per-phase accumulator on every transition is one line and has no such requirement.

*Alternative considered — a `sinkingUntil` timestamp.* Rejected for the coupling
above, and because it makes "how long has this phase been running" a subtraction at
every read site instead of a field.

### Phase transitions happen in one function, before input is consumed

```
    update(state, dt, input)
      |
      +-- 1. advance phaseElapsed by dt
      +-- 2. resolve any expired phase  -> may change phase, reset player
      +-- 3. if phase accepts input, drain the buffer and apply the move
      +-- 4. a move that lands on row 0 -> award, enter SINKING
```

*Why expiry is resolved before input:* the frame in which a beat ends should also
be a frame in which the player can act. Resolving expiry after input would cost one
frame of responsiveness at every transition, and would mean a press arriving on the
expiry frame is discarded by a phase that has already ended.

*Why the buffer is drained only when the phase accepts input:* this is the
mechanism M1 was built for. `SINKING` never calls `takeDirection`, so nothing
accumulates and nothing fires late. The alternative — draining always and
discarding the result — would also work, but it puts the suppression decision in
the wrong place and makes "did this state ignore input" untestable from outside.

**Consequence for the spec:** `game-lifecycle` states that a press made during a
beat is *discarded*, not deferred. That is a deliberate behaviour, not a
side-effect. A player mashing up during the sink does not rocket north on respawn.

### Scoring is computed from the move, not from the position

A single function takes the pre-move and post-move rows and returns the points
awarded and the new watermark. It does not read the phase and does not know about
the spa bonus's trigger.

*Why:* the watermark rule and the goal bonus have different lifetimes — one resets
per round, the other is a one-off per arrival — and entangling them is how the
"Advancing toward the spa" scenario and the "Reaching the ultimate goal" scenario
end up disagreeing about the final step. Keeping the watermark rule ignorant of the
goal means the last step north scores 10 for the advance *and* 50 for the goal, by
composition rather than by a special case.

### The sink is drawn from a computed source rectangle

Progress `p` runs 0 to 1 across the beat. The sprite is drawn with source height
`16 * (1 - p)`, destination offset `16 * p`, and the source `y` unchanged — so the
top edge descends toward a fixed bottom line and the sprite is clipped from below
it. At `p = 1` nothing is drawn.

```
    p=0.00        p=0.40        p=0.80        p=1.00
   +------+      +------+      +------+      +------+
   | .--. |      |      |      |      |      |      |
   |(o  o)|      | .--. |      |      |      |      |
   | capy |      |(o  o)|      | .--. |      |      |
   |______|      |______|      |(____)|      |______|
    ^ dy=0        dy=6.4        dy=12.8       nothing
      sh=16       sh=9.6        sh=3.2        drawn
```

*Why this rather than shrinking or fading:* `DECISIONS.md` gap 7. It is the only
option that reads as submerging rather than vanishing, and it needs no new art.

*Trade-off:* `dy` and `sh` are fractional mid-beat, which breaks M1's
whole-pixel-destination rule for exactly this one sprite during exactly this one
state. Rounding them to whole pixels would make the descent visibly steppy over
400ms. The rendering spec's existing "Scale stays integral" scenario is about board
tiles and the resting player, both of which are unaffected.

### The HUD draws with `fillText`, not from the atlas

Monospace, cream, score left and lives right over row 0, per `DECISIONS.md` gaps 4
and 8.

*Why not sprite-drawn digits:* the atlas has no font. Adding one is real
pixel-art work for a readout that says two numbers, and it would need a new atlas
and a new manifest — both outside this change.

*Trade-off:* the HUD will not be pixel-perfect against the rest of the art. It is
drawn inside the scaled context so it at least shares the board's coordinate space.

## Risks / Trade-offs

**Row 0 becoming unwalkable breaks M1's passing tests** → Intended, and the
proposal says so. `grid-movement.test.js`'s top-edge assertion changes with the
spec in this change. A test changed to match new behaviour is only legitimate when
the spec changed first; here the delta spec is the record that it did.

**One timed state is not enough to know the right abstraction** → Accepted
deliberately. `phase` plus `phaseElapsed` is the smallest thing that works. M4 adds
`DYING` with a different duration and a different exit action, and that is the
point at which a shared shape either falls out naturally or does not. Generalising
now would be guessing.

**Fractional destination coordinates during the sink** → Confined to one sprite in
one state, and no tile or resting sprite is affected. Called out here so it is not
mistaken for a regression against M1's integral-scale requirement.

**The lives counter is inert until M4** → It is real state read by the HUD, so the
display path is exercised from this change onward rather than being written blind
in M4. The `game-lifecycle` spec states explicitly that nothing decrements it here,
so an implementer does not go looking for the code that should.

**Verification residue carried over from M1** → M1 closed its review finding by
making `boot()` injectable and driving it against a DOM stub, which covers the
atlas gate and the input wiring. One clause of the game-loop spec's "Opening the
page straight off disk" — that a real browser reports no console error — still has
no retained automated check, and is verified by running the page. That gap is
unchanged by this milestone and is recorded here because M1's design document has
been archived.

## Open Questions

None blocking. Whether `phase`/`phaseElapsed` generalises into a shared timed-state
helper is deliberately left to M4, when there is a second instance to generalise
from.
