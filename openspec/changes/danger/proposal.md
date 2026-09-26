## Why

Three milestones in, the game has a goal, a score and traffic — and the traffic
is decoration. A truck drives through the capybara and nothing happens. The lives
counter has been real state since M2 with nothing able to decrement it, and the
median at row 2 protects the player from a threat that does not exist.

M4 connects them. It is the milestone that makes the game losable, and therefore
the first one where the player has a decision to make: cross now or wait.

It closes the state machine too. `DYING` is the second timed phase and
`GAME_OVER` the third state, after which the set is complete — M5 adds no new
states, only what `GAME_OVER` puts on screen.

## What Changes

- Add axis-aligned bounding box collision between the player's single-tile box
  and each hazard's continuous box. The player at column `c` spans `[c, c+1)`; a
  hazard at `x` of width `w` spans `[x, x+w)`. They collide when the spans
  overlap and both occupy the same row.
- Evaluate collision once per update, after hazards have advanced and after any
  player move has been applied, so that a player stepping into a truck and a
  truck driving into a player are the same event rather than two code paths.
- Add the `DYING` phase: on collision the capybara holds its position showing the
  defeat pose for 550ms with input ignored, then respawns at column 6, row 6.
  This resolves the source spec's self-contradiction in favour of holding in
  place (`DECISIONS.md` gap 1) — the alternative reading makes both the 550ms
  parameter and the `capy_defeat` art pointless.
- Decrement the lives counter by 1 on collision, once per death rather than once
  per frame of overlap.
- Add the `GAME_OVER` phase, entered instead of respawning when the death beat
  expires with no lives left. It halts play and ignores input. Lives never go
  below 0. Its screen, final score and restart are M5 (`DECISIONS.md` gap 13).
- Draw the hit flash: the capybara strobes drawn and not-drawn every 25ms across
  the first 100ms of the death beat, then holds the defeat pose (`DECISIONS.md`
  gaps 2 and 14).
- Declare the `capy_defeat` atlas rectangle, which is in the manifest but not yet
  in the game.
- **BREAKING** (to M3's specified behaviour): a hazard can now harm the player.
  M3's verification that the capybara passes through traffic unharmed described
  that milestone only and is superseded here.

Non-goals: the game-over screen, the final score display, Enter or Space to
restart, and every item under the spec's "Optional features" heading. At 0 lives
in this milestone the game stops and stays stopped.

## Capabilities

### New Capabilities

- `collision`: Detection between the player and lane traffic. The bounding boxes,
  the axis-aligned overlap test, when in the frame it is evaluated, and which
  phases are subject to it.

### Modified Capabilities

- `game-lifecycle`: Three requirements change. The closed set of states gains
  `DYING` and `GAME_OVER`. Input suppression extends to both. Lives stop being
  inert: the counter decrements on death, floors at 0, and its exhaustion is what
  routes the death beat to `GAME_OVER` instead of a respawn.
- `rendering`: Gains requirements for the defeat pose and the hit flash strobe,
  and for what is drawn while the game is over.
- `scoring`: The watermark requirement already says it resets "when a round
  ends"; a death ends a round, but no scenario covers it. Gains that scenario, so
  the behaviour is verified rather than merely implied.

## Impact

**Modified files.** `game.js` gains the collision test, the two new phases, the
lives decrement and the flash drawing. `index.html` and `style.css` unchanged.

**New files.** A test file for the `collision` capability.

**Existing tests.** `hazards.test.js` and `boot.test.js` contain walks through
traffic that assume no collision. Those paths now die partway, so they need
positions or lanes where no hazard is present — changed because the behaviour
changed, with this change's delta specs as the record that it did.

**Dependencies.** None added. Tests still run on `node --test` with no
`package.json`.

**Carried forward from M3.** Two properties this change depends on and does not
re-derive: a worst-case clamped frame advances the fastest hazard 0.25 tiles, so
no hazard can cross the player's tile between two collision checks; and a
hazard's logical width equals its drawn width, so the truck the player sees is
the truck that hits them.
