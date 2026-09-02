## Context

See `proposal.md` — Why. P5 established the pattern this change reuses: a beat is
an absolute deadline on the game clock, input is suppressed while it runs, and a
completion function fires once when it elapses.

P5 also settled the ordering lesson the hard way. Running collision before the
death beat completed took a second life for one impact, because the dying
capybara was still pinned on the vehicle. The same shape of bug is available
here, so the goal check slots into the same sequence rather than a new one.

## Goals / Non-Goals

**Goals:**

- A round loop that survives indefinitely: reach the spa, sink, start again,
  keeping score and lives.
- The watermark reset that completes the P3 scoring rule.
- Reuse of the death beat's machinery rather than a parallel implementation.

**Non-Goals:**

- Difficulty scaling between rounds. The spec keeps that optional, and the P3
  proposal already removed "slightly more energetic" from the required text.
- Goal bays and occupancy. The spec was amended to make the whole top row the
  goal precisely because the atlas has no filled-spa tile.
- A dedicated sink animation. The atlas has no sink frames; a draw offset is the
  honest way to suggest it with the art that exists.

## Decisions

**Goal detection is guarded by the beat itself, not by a separate flag.**
`resolveGoal` returns early when a sink beat is already running, so the 50 points
are paid once per arrival rather than once per frame spent on row 0. A separate
`goalAwarded` boolean would be a second source of truth that could drift from the
beat.

**One beat predicate per beat, both read the same clock.** `isSinking(state)`
mirrors `isDying(state)`. Input suppression now asks "is either beat running",
which keeps the two independent: a future change to one cannot silently disable
the other.

**Goal is evaluated after collision, both after beat completion.** The full
update order is input, hazard motion, beat completion, collision, goal. Putting
the goal check last means a capybara that reached row 0 is not also processed as
a collision that frame. Row 0 carries no traffic today, so the two cannot
actually fire together, but the ordering should not depend on that.

**The sink offset is a render-time constant, not player state.** The player's
row stays 0 throughout; only the destination y moves. Storing an offset on the
player would put a non-grid quantity into the position data that the input spec
works hard to keep integral.

**Score and lives are never touched by the reset.** `finishSink` moves the player
and the watermark and nothing else. That is exactly what the spec's lifecycle
scenario asks for, and it is why the reset is a distinct function from the
session restart P7 will add, which does clear them.

## Risks / Trade-offs

- **Two beats can be pending in principle** → they cannot overlap in practice
  (row 0 has no hazards), but input suppression checks both rather than assuming
  it, so a later board change cannot quietly break movement locking.
- **A held Up key at the top of the board bumps against row 0 repeatedly** →
  those hops are rejected by boundary clamping and score nothing; the sink beat
  starts on arrival, not on a press.
- **The visual baseline does not exercise this** → a fresh session starts at the
  spawn cell, so the sink beat is only covered by unit tests. That is acceptable:
  the beat is pure state and draw offset, both directly assertable.
