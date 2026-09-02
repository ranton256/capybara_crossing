## Context

See `proposal.md` — Why. P4 deliberately put hazard `x` in tile units so the AABB
check here needs no unit conversion: the player occupies `[col, col+1) × [row,
row+1)` and a hazard `[x, x+width) × [row, row+1)`.

P4 also left one item explicitly for this change: a long frame can advance a
hazard more than a full tile, so a hit could pass through between two checks.

The supplied art has exactly one defeat frame, so the "defeat animation" the spec
describes is a held pose rather than a cycle. The spec was amended to say so.

## Goals / Non-Goals

**Goals:**

- Collision that reads directly off the two coordinate spaces already in state.
- A hit that is legible: the player can see what killed them and where.
- Exactly one life lost per impact.

**Non-Goals:**

- Shrinking the hit box. The spec says one tile, and the supplied capybara art is
  only 9 of 16 pixels wide, so a tile-sized box is generous to the hazard. It is
  a known feel issue, not a spec deviation, and changing it would need the spec
  changed first.
- The game-over overlay and restart. P5 only sets the state; P7 renders it.
- Invulnerability after respawn. The spawn row carries no traffic, so there is no
  spawn-kill to protect against.

## Decisions

**Beats are deadlines on the game clock, not frame counters.** `hurtUntil` and
`flashUntil` hold `state.lastTime + duration`, and the code compares against
`state.lastTime`. Counting frames would make the beat shorter on a fast display.
Both are absolute times, so a single comparison answers "is the beat over".

**The death beat is one flag derived from the clock, not a separate mode enum.**
`isDying(state)` returns whether the beat is running and not already game over.
Input suppression, defeat-pose rendering, and collision suppression all read that
one predicate, so they cannot disagree about whether a death is in progress.

**Update order is input, hazard motion, beat completion, then collision.**
Collision must follow motion, or a frame could move a hazard onto the player and
paint it there before noticing. It must also follow beat completion: the dying
player is pinned on the hazard that killed them, so checking collision first
would register a second hit against the same vehicle and drain another life for
one impact. Respawning first puts them on the riverbank, which carries no
traffic, before anything is checked.

**Delta clamped to 100ms.** At the fastest hazard speed, 2.5 tiles/sec, 100ms is
a quarter tile, comfortably inside the one-tile overlap window, so no hit can
tunnel. The clamp lives in `tick`, where the raw timestamp is turned into a
delta, so every consumer inherits it. Clamping inside `moveHazards` instead would
leave any future time-based system to rediscover the problem.

**Zero lives sets `gameOver` and leaves the player on the impact cell.** Moving
them home first would erase the evidence of what happened, and P7's overlay reads
better over the scene that ended the run.

**Flash drawn after the world and before the HUD.** A flash over the HUD would
hide the life count at the exact moment the player wants to read it.

## Risks / Trade-offs

- **A tile-sized hit box feels harsh given the capybara art is 9px wide** →
  documented above and left alone deliberately; the spec pins one tile, and this
  is the kind of tuning that should change in the spec first.
- **Clamping the delta means a stalled tab resumes in slow motion rather than
  skipping ahead** → correct for this game: skipping ahead would kill the player
  for something they never saw.
- **Beat deadlines depend on `state.lastTime` being advanced by the loop** →
  tests drive `tick` rather than calling `update` directly where timing matters,
  so the clock is exercised the way the game uses it.
