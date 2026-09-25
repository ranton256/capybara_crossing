## Why

M1 delivered a board you can walk around on. Nothing happens when you get
anywhere. There is no goal, no score, and no reason to press a key twice.

M2 closes the loop: reach the mud spa, sink into it, score, and start again. After
this change the game is complete and winnable — trivially so, because nothing can
stop you yet, but complete. Every milestone after this adds difficulty to a game
that already works rather than adding machinery to a game that does not.

It also introduces the state machine. Three of the spec's Fixed Parameters are
durations rather than values (death 550ms, spa sink 400ms, hit flash 100ms), and
each is a window where input is ignored and the world is mid-transition. The spa
sink is the first of the three to arrive, so M2 is where the machine gets built
and where input suppression stops being hypothetical. M4 then adds a second state
to an existing pattern instead of inventing one under pressure.

## What Changes

- Introduce an explicit game state with two members: `PLAYING` and `SINKING`.
  `DYING` arrives in M4 and `GAME_OVER` in M5; the machine is shaped now so they
  are additions rather than rewrites.
- **BREAKING** (to M1's specified behaviour): row 0 stops being walkable. Moving
  up into it from row 1 enters the goal and begins the sink instead of leaving the
  player standing on the spa tile.
- Add the sink beat: entering row 0 transitions to `SINKING` for 400ms, during
  which directional input is ignored and the capybara descends into the tile. The
  beat is driven by the delta-time contract M1 established, which until now had
  nothing time-dependent to drive.
- Award 50 points on reaching the spa, and respawn a fresh capybara at column 6,
  row 6 when the beat expires.
- Add the northward score watermark: 10 points for stepping onto a row farther
  north than any row reached during the current life. The watermark resets to the
  spawn row after each spa clear, and will also reset on death when M4 adds it.
- Add a lives counter initialised to 3. Nothing decrements it in this change;
  death is M4. It is real state read by the HUD, not a placeholder.
- Draw the heads-up display over row 0: score at the left, lives at the right, in
  monospace pixel text. This makes `rendering`'s existing "The display layer is
  topmost" scenario non-vacuous for the first time.
- Score persists across rounds; the watermark and the player position do not.

Non-goals, stated so they are not smuggled in: hazards, collision, losing a life,
the death beat, the hit flash, the game-over screen, and everything under the
spec's "Optional features" heading. A round in M2 can only be won.

## Capabilities

### New Capabilities

- `game-lifecycle`: The state machine and round flow. The `PLAYING` and `SINKING`
  states, timed transitions driven by elapsed seconds, which states consume input,
  the goal transition, respawn, the lives counter, and what persists or resets
  across a round boundary.
- `scoring`: Score accumulation and its reset rules. The northward watermark and
  its 10-point award, the 50-point spa bonus, the watermark's lifetime, and the
  score's persistence across rounds.

### Modified Capabilities

- `grid-movement`: Two requirements change. *Discrete movement on directional
  input* becomes conditional on the game accepting input, since `SINKING` ignores
  it. *Movement is clamped at the board edges* changes at the top edge only: row 0
  is now a goal transition rather than a position the player can occupy while
  playing. The column and bottom clamps are unchanged.
- `rendering`: Gains a requirement for the heads-up display — what it contains,
  where it sits, and that it draws after all board and entity content. Also gains
  a requirement for drawing the sinking capybara, which is the first sprite drawn
  with a source rectangle that changes over time.

## Impact

**Modified files.** `game.js` gains the state machine, the sink timer, scoring,
and HUD drawing. `index.html` and `style.css` are unchanged.

**New files.** Test files for the two new capabilities, following M1's convention
of one test file per capability.

**Existing tests.** `grid-movement.test.js` has assertions that contradict the new
behaviour — the *"Pressing outward at the top edge"* case asserts the player
remains at row 0, which is no longer reachable while playing. Those change with
the spec, in this change.

**Dependencies.** None added. Tests still run on `node --test` with no
`package.json`.

**Carried forward from M1.** The delta-time contract, proven in M1 against
synthetic steps, now has its first real consumer in the 400ms beat. The input
buffer, built in M1 specifically so modal states could ignore input by declining
to drain it, gets its first modal state here.
