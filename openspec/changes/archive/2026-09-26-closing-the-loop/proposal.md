## Why

The game can be won and lost, but losing is a dead end. `GAME_OVER` halts play
and says nothing: the board stops, the capybara lies where it was struck, and the
only way to play again is to reload the page. The spec's lifecycle feature asks
for "a seamless loop of victories and defeats without page reloads", and that is
the one thing still missing.

M5 finishes it. It is deliberately the smallest milestone: M4 took the structure,
so this adds no states, no phases and no new logic in the update path beyond a
single transition. What it adds is the screen and the way out of it.

After this change every scenario in `Capybara Crossing.md` outside the "Optional
features" heading is implemented.

## What Changes

- Draw the game-over screen: a translucent dark wash over the whole board, then
  `GAME OVER`, the final score, and the restart prompt, centred
  (`DECISIONS.md` gap 17). It draws over the existing scene rather than replacing
  it, so the defeat pose and the still-flowing traffic stay visible underneath.
- Accept `Enter` or `Space` while the game is over and start a new run: the
  player returns to column 6, row 6 facing up; the score returns to 0; lives
  return to 3; the watermark returns to the spawn row; and the hazards return to
  their starting layout (`DECISIONS.md` gap 18).
- **BREAKING** (to M4's specified behaviour): `GAME_OVER` stops being terminal.
  M4's scenario asserting that no input leaves it was correct for that milestone
  and is superseded here — which is the whole reason it was written as an
  explicit scenario rather than left implicit.
- Restart keys are consumed only while the game is over. During play they
  continue to do nothing.

Non-goals, stated so they are not smuggled in: every item under the spec's
"Optional features" heading — the countdown timer, difficulty scaling, audio, and
persistent high scores. In particular, nothing in this change tracks a score
across runs.

## Capabilities

### New Capabilities

None. This change adds no capability; it completes two.

### Modified Capabilities

- `game-lifecycle`: One requirement changes. *The game over state halts play* is
  no longer terminal — it gains a transition back to `PLAYING` on a restart key,
  and a statement of what a new run resets. Its "nothing advances" behaviour is
  otherwise unchanged: without a restart key the halted game still sits still.
- `rendering`: Gains a requirement for the game-over screen — what it contains,
  that it draws over the board and traffic rather than instead of them, and that
  it appears only while the game is over.

## Impact

**Modified files.** `game.js` gains the restart transition and the screen
drawing. `index.html` and `style.css` are unchanged, closing the project at the
three files it started with.

**New files.** None. The two capabilities this change touches already have test
files.

**Existing tests.** `game-lifecycle.test.js` asserts `GAME_OVER` is terminal.
That assertion is replaced, not weakened — the delta spec in this change is the
record that the behaviour changed first, the same pattern as M2's row-0 change
and M4's lives counter.

**Dependencies.** None added. Tests still run on `node --test` with no
`package.json`. The project ships with no dependencies at runtime or otherwise,
as it set out to.

**Carried forward from M4.** Two things this change relies on and does not
re-derive: `GAME_OVER` already halts play, so restart is a transition out of a
known-stable state rather than a scramble to stop things; and gap 15 leaves the
capybara in its defeat pose with traffic flowing, so the screen is drawn over a
scene that already reads as a defeat rather than having to establish one.
