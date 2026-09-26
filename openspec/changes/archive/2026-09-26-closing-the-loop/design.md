## Context

See `proposal.md` — Why. `DECISIONS.md` gaps 17 and 18 settle what the screen
looks like and what a new run resets.

M4 did the structural work this change depends on:

- **`GAME_OVER` already exists and already halts play.** Restart is a transition
  out of a state that is known to be stable, rather than a scramble to stop
  things that are still running.
- **The scene already reads as a defeat** (gap 15): the capybara is down in its
  defeat pose with traffic flowing past. The screen explains a picture rather
  than having to establish one.
- **The input buffer holds one pending direction**, drained by whichever phase
  accepts it. Restart keys are a second kind of input and need a decision about
  where they live; see below.

Constraints unchanged: three shipped files, `file://` with no build step,
`node --test` with no `package.json`, logic callable with no DOM. This change
adds no fourth file, so the project ends with the three it started with.

## Goals / Non-Goals

**Goals:**

- Make the restart a state transition expressible in one line, so the update path
  gains no new branching structure in the last milestone.
- Make a new run genuinely identical to the first, so "start again" means the
  same problem rather than a similar one.

**Non-Goals:**

- Any persistence. Nothing survives a page reload; that is the optional
  high-score feature, explicitly out of scope.
- Generalising "reset" into a lifecycle framework. There are two resets in the
  game — respawn and new run — and they differ in exactly which fields they
  touch. That is a two-line difference, not an abstraction.

## Decisions

### A new run is `createState()`, not a field-by-field reset

```js
if (state.phase === PHASES.GAME_OVER && input.restart) return createState();
```

*Why:* gap 18 says a new run restores the player, score, lives, watermark and
hazards to their starting values — which is the entire contents of the initial
state. Rebuilding it is therefore both shorter and safer than resetting five
fields: a field added to state in future is reset automatically rather than being
forgotten by an enumerating reset. `respawn()` stays as it is, because it
deliberately preserves score and lives; the two resets differ precisely because
one is mid-run and one is not.

*Alternative considered — extend `respawn()` with a flag.* Rejected: a boolean
that switches which fields survive is the least readable form of two functions.

### Restart keys live in the input buffer beside the pending direction

```js
input = { pending: null, restart: false }
```

The `keydown` handler sets `restart` for `Enter` and `Space`; `update` consumes
and clears it only in `GAME_OVER`.

*Why a separate slot rather than routing them through `pending`:* `pending`
holds a *direction*, and every consumer of it assumes that. Putting `Enter` in it
would mean every phase that drains the buffer has to recognise a value that is
not a direction. A second slot keeps each consumer's contract intact.

*Why it is cleared only in `GAME_OVER`:* the spec requires the keys do nothing in
any other state. If a stray `Enter` pressed mid-run stayed latched, it would fire
at the moment the player later died, restarting the game out from under them. The
slot is therefore cleared unconditionally on every update, and *acted on* only in
`GAME_OVER` — the same distinction M2 drew between declining to drain a buffer
and actively discarding it, which was a defect then and is avoided here.

### The screen is drawn as a wash plus text, after everything else

`render` gains a final branch: if the game is over, fill the board area with a
translucent black, then draw three centred lines.

*Why after the heads-up display too:* the HUD sits over row 0 and would otherwise
read at full brightness through the wash, making the board look half-dimmed. The
rendering spec asserts the ordering explicitly for that reason.

*Why a wash rather than a panel:* gap 17. The defeat scene beneath is worth
keeping visible, and translucency is one `globalAlpha` or one `rgba` fill.

*Trade-off:* the wash is the first thing in the project drawn with alpha. It is
one `fillStyle` with an alpha component, needing no new context state, so the
cost is a single call rather than a new drawing concept.

## Risks / Trade-offs

**M4's terminal-state test must be replaced** → `game-lifecycle.test.js` asserts
no input leaves `GAME_OVER`. That is now false by design. The delta spec records
the retirement with a Reason and a Migration rather than quietly dropping it —
OpenSpec refused a MODIFIED block that renamed the scenario away, which is the
protection working as intended.

**Restarting resets hazards, so the lanes visibly jump** → Accepted per gap 18.
The whole board is changing in that frame and the screen is being dismissed, so
the jump is not separable from the transition it belongs to.

**`createState()` as restart couples the two** → If a future change makes the
initial state depend on something run-specific — a difficulty level, say, which
is an optional feature — then restart would inherit it silently. That is the
correct behaviour for a difficulty that should reset, and the wrong one for a
level that should carry over. Noted because the optional features list contains
exactly such an item.

**Nothing verifies the wash is actually translucent in a browser** → The unit
test can assert the fill style carries an alpha below 1, which is what the spec
requires, but whether it reads well over the art is a judgement made by looking.
The verification tasks include doing so.

## Open Questions

None. This is the last milestone; anything still open belongs to the optional
features, which remain explicitly unbuilt.
