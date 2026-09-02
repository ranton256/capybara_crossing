## Context

See `proposal.md` — Why. P1 gave the loop an update phase that runs before
render; P2 gave it a board and an atlas. The player is the first thing that both
reacts to input and needs drawing, so it exercises both halves of the frame.

The scoring rule here is the one the spec was amended to fix. Without the
watermark, "pressing Up awards 10 points" lets a player farm score by hopping up
and down on the spot.

## Goals / Non-Goals

**Goals:**

- Movement that lands exactly on cells, with no fractional player position ever
  existing in state.
- A scoring rule that pays for progress, not for keypresses.
- Player and HUD layers that slot into the existing painter's order without
  reworking `render`.

**Non-Goals:**

- Animating the hop itself. The spec calls for an instant grid snap; tweening
  between cells would contradict it and would reintroduce the fractional
  positions the spec exists to avoid.
- Key repeat handling or input buffering beyond one pending direction.
- Lives in the HUD. There are no lives until P5.

## Decisions

**One pending direction, consumed in update.** `keydown` records a direction on
state; the update phase applies and clears it. Moving the player directly from
the event handler would mutate state between the update and render phases, which
breaks the loop contract P1 established and makes frame behavior depend on when
the OS delivered the event.

**Player position is integer column and row, never pixels.** Pixel coordinates
are derived at draw time by multiplying by the destination size. Storing pixels
would make "no floating-point drifting" a matter of discipline rather than a
property of the data.

**The watermark lives on state as `bestRowThisLife`, seeded to the spawn row.**
Scoring compares the destination row against it. The alternative — scoring on
`newRow < previousRow` — is what produces the up/down farming exploit, since
every Up from a lower row would pay again.

**Walk frames alternate per accepted hop, not per elapsed time.** A hop is a
discrete event, so tying the frame to hop count keeps the waddle in step with
movement and keeps rendering a pure function of state. A time-based cycle would
animate the capybara while it stands still.

**Facing updates only on accepted hops.** A rejected hop at the boundary leaves
both position and facing alone, so bumping into the edge does not spin the
sprite.

**HUD is canvas text, not DOM.** Keeping it on the canvas preserves the
painter's-algorithm ordering the spec describes and keeps the shipped page to one
visual surface.

## Risks / Trade-offs

- **A single pending direction drops presses made within one frame** → at 60Hz
  the window is 16ms; deliberately queueing every press would let a held key
  bank hops and fire them as a burst, which feels worse than dropping one.
- **The watermark resets need hooks that do not exist yet** → P5 resets it on
  death and P6 resets it after a spa clear. Until then it only ever moves north,
  which is correct for a session with no deaths and no goal.
- **Regenerating the P2 visual baseline hides board regressions in the diff** →
  the unit test asserting tile rects against `manifest.json` still guards the
  board independently of the baseline image.
