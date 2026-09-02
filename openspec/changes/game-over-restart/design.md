## Context

See `proposal.md` — Why. P5 set `gameOver` and left the capybara on the cell that
killed it, deliberately, so this change has a scene to draw over. P6 established
`finishSink` as a round-level reset that keeps score and lives; the run-level
restart here is the counterpart that clears them.

## Goals / Non-Goals

**Goals:**

- A run that ends visibly and restarts from the keyboard, with no page reload.
- A restart that leaves no residue: no banked keypress, no half-elapsed beat, no
  hazard mid-lane from the previous run.

**Non-Goals:**

- Persisting a high score. The spec keeps localStorage optional.
- An animated or interactive overlay. Canvas text keeps the whole game on one
  surface, as the rendering pipeline requires.
- A pause or menu state. The spec describes exactly two states, running and game
  over.

## Decisions

**Restart is requested, not applied, from the key handler.** `handleKeydown` sets
`pendingRestart`; `update` applies it. This is the same discipline as
`pendingDirection`: the event handler records intent and the update phase is the
only thing that mutates the world, so a keypress arriving mid-render cannot tear
the frame.

**`restartSession` rebuilds from the same constructors `boot` uses.** It calls
`createInitialPlayer` and `createInitialHazards` rather than restoring saved
copies. A saved snapshot would be a second definition of "the starting state"
that could drift; reusing the constructors means a restart is the same thing as a
fresh boot by construction.

Mutating the existing state object rather than replacing it matters: `boot`
handed this object to the loop closure and to the key listener, so replacing it
would leave both pointing at a corpse.

**Restart is applied before anything else in the update.** A restart and a hop
cannot both be pending, but ordering it first means the rest of the update runs
against the fresh state in the same frame rather than one frame later.

**Hazards freeze while game over rather than the whole update stopping.** The
update still runs so it can notice the restart. Reusing the existing freeze check
in `moveHazards` keeps that to one condition rather than a second stop switch.

**The overlay draws its own scrim.** It dims the world beneath so the text stays
legible over whatever the scene happened to be, then draws over the HUD, since at
that point the final score in the overlay is the number that matters.

## Risks / Trade-offs

- **Space scrolls the page in a browser** → the key handler calls `preventDefault`
  when it recognises a key it acts on, guarded so the tests' plain object events
  still work.
- **The overlay hides the death scene it is drawn over** → the scrim is partial,
  so the capybara's defeat pose stays visible underneath, which is the point of
  P5 leaving it on the impact cell.
- **A restart during a death beat is not possible today** → game over and the
  death beat are mutually exclusive by construction in P5, and `restartSession`
  clears every beat anyway, so the invariant does not need defending twice.
