# Decisions

A written specification is never complete. This file records every place where
`Capybara Crossing.md` was silent, self-contradictory, or in tension with the
supplied art — what the options were, which one was taken, and why.

It exists because noticing these gaps is most of the skill. The spec document is
deliberately left unedited: read it cold, find the gaps yourself, then read this
to compare your resolutions against one set of defensible ones. Yours may be
better. What matters is that you found the gap and decided on purpose rather
than discovering it halfway through an implementation.

Decisions here are binding for this build. Where a decision belongs to a
milestone that has not started yet, it is still recorded now, because an
ambiguity resolved late is an ambiguity that has already leaked into code.

---

## Milestone plan

The spec is delivered as six features. It is *built* as five changes, sliced
vertically: each one ends with something you can open in a browser and play end
to end, not a layer that only makes sense once the next layer lands.

```
M1 Walkable Board
     |   index.html / style.css / game.js  .  atlas via <img>  .  rAF + dt
     |   grid model  .  arrow input  .  boundary clamping
     |   painter's-order render  .  guarded module.exports  .  test harness
     v
M2 Win Loop                    <-- introduces the state machine
     |   reach row 0 -> SINKING 400ms -> +50 -> respawn
     |   north-watermark +10  .  HUD
     |   ... a complete, trivial, winnable game exists from here on
     v
M3 Traffic                     <-- hazards are scenery; no collision yet
     |   lane config  .  tiles/sec scaled by dt  .  edge wraparound
     |   truck is 2 tiles wide and drawn mirrored
     v
M4 Danger
     |   AABB: discrete player box vs continuous hazard box
     |   DYING 550ms  .  hit flash  .  -1 life  .  respawn
     v
M5 Closing the Loop
         GAME_OVER screen  .  final score  .  Enter/Space restarts
```

**Why the goal comes before traffic.** Reaching the spa and scoring depend only
on movement, so they are reachable in M2. Putting them there closes a full win
loop before any hazard exists, and it forces the state machine into being early
(see below) instead of leaving it to be retrofitted under pressure in M4.

**Why traffic comes before collision.** The spec demands motion be identical at
60Hz and 120Hz. Proving that is a job on its own. Debugging *is the truck moving
at the right speed* at the same time as *did the truck hit me* is two unknowns
at once. Walking harmlessly through traffic for one milestone is worth the
apparent detour.

**Why the state machine is a milestone concern at all.** Three of the Fixed
Parameters are durations, not values: death 550ms, spa sink 400ms, hit flash
100ms. Each is a window in which input is ignored and the world is mid-
transition. That is a state machine whether or not you call it one. Writing
movement-and-death as straight-line code first, then discovering this, is the
most expensive available mistake on this project.

```
                    +------------------+
       start  ----> |     PLAYING      | <---------+
                    +------------------+           |
                      |              |             |
           collision  |              | reach row 0 |
                      v              v             |
              +--------------+  +-------------+    |
              |    DYING     |  |   SINKING   |    |
              |    550ms     |  |    400ms    |    |
              | (flash 100ms)|  |   +50 pts   |    |
              +--------------+  +-------------+    |
                      |              |             |
             lives>0  +--------------+-------------+
                      |
             lives==0 v
              +--------------+
              |  GAME_OVER   |--- Enter/Space -----> PLAYING
              +--------------+
```

---

## Gap resolutions

| # | Gap | Kind | Decision | Milestone |
|---|-----|------|----------|-----------|
| 1 | Death beat vs. instant reset | Contradiction | Hold in place 550ms, then respawn | M4 |
| 2 | What "hit flash" flashes | Silence | The capybara blinks | M4 |
| 3 | Hazard count and spacing | Silence | 2 trucks, 3 ATVs; forgiving gaps | M3 |
| 4 | Where the HUD goes | Silence | Overlay row 0, the spa row | M2 |
| 5 | Riverbank grass band repeats | Art conflict | Accept the repeat | M1 |
| 6 | Unbounded delta time | Silence | Clamp to 0.1s | M1 |

---

### 1. The death beat contradicts the reset

**What the spec says.** Two scenarios describe the same event differently. Under
*Dodging jungle hazards*: the capybara "holds its defeat pose, with movement
input ignored for the duration of the death beat". Under *Overlapping bounding
boxes triggers a hazard collision*: "the capybara position instantly resets to
the initial starting coordinates".

**Why it matters.** Both cannot be literally true. If position resets instantly,
the defeat pose plays at the spawn tile, and the player never sees where they
died. The 550ms beat and the `capy_defeat` sprite both become close to pointless.

**Decision.** Hold in place. On collision the capybara stays at the tile where it
was hit, showing `capy_defeat`, with input ignored for 550ms. Only when that beat
expires does it reappear at the spawn cell with a reset north-watermark.

**Rationale.** It is the only reading in which the supplied defeat art is
visible and the 550ms parameter does any work. Read the second scenario as a
loose statement of the lifecycle outcome rather than of its timing — it is
describing *that* a reset happens, in a feature about collision detection, not
*when*.

---

### 2. "Hit flash 100ms" never says what flashes

**What the spec says.** Fixed Parameters list `hit flash 100ms` alongside the
death and sink beats. Nothing else in the document mentions a flash.

**Decision.** The capybara sprite alternates drawn / not-drawn for the first
100ms of the 550ms death beat.

**Rationale.** It is the cheapest to implement, it stays local to one entity
rather than touching the render pipeline globally, and it puts the feedback
where the player is already looking. A full-screen white flash was considered
and rejected: it fights the laid-back tone the spec repeatedly insists on. A
pulsing lives counter was rejected because it sits in a corner the player is not
watching at the moment of impact.

---

### 3. Hazard count and spacing are unspecified

**What the spec says.** Fixed Parameters give lane speeds and vehicle widths.
Nothing gives the number of vehicles per lane or the gaps between them.

**Why it matters.** This *is* the difficulty curve; the spec hands over its most
consequential tuning knob by omitting it. It is also permanent: every hazard in
a lane shares a speed and a wrap distance, so gaps set at initialisation are
preserved exactly and forever. There is no drift to correct later.

**Decision.** Forgiving.

```
row 1   2 trucks, 2 tiles wide, 5-tile gaps, moving right at 1.5 tiles/sec
        [TT].....[TT].....           ~3.3s between trucks

row 3   3 ATVs, 1 tile wide, 3-tile gaps, moving left at 2.5 tiles/sec
        [A]...[A]...[A]...           ~1.6s between ATVs
```

**Rationale.** This is a tutorial game whose stated goal is "maximum laid-back
vibes". A player should usually be able to walk straight across without camping
on the median. Tighter spacing produces a better arcade game and a worse first
project — frustration during a learning exercise costs more than it buys.

---

### 4. The HUD has nowhere to live

**What the spec says.** Canvas is 576x336 at integer scale x3, which is exactly
12x7 tiles. The board consumes all of it. The render pipeline requires HUD text
"rendered on top of all game elements", but no space is allocated for it.

**Decision.** Overlay row 0, the spa row. Score at the left, lives at the right.

```
row 0  +------------------------------------+
       | SCORE 120              LIVES @ @ @ |  <- over spa
       +------------------------------------+
row 1  |  [TT]-->        [TT]-->            |
row 2  |  . . . . . median . . . . . . . .  |
row 3  |     <--[A]      <--[A]     <--[A]  |
row 4  |  riverbank                         |
row 5  |  riverbank                         |
row 6  |  riverbank        * capy           |
       +------------------------------------+
```

**Rationale.** Conventional arcade placement, and the top row is where the eye
starts. Growing the canvas to 576x384 for a dedicated HUD band was considered
and rejected: canvas size is a Fixed Parameter, and Fixed Parameters are given,
not negotiated. Overlaying the goal row costs some of the spa art; that is a
smaller price than overriding a stated constraint.

---

### 5. The riverbank grass band repeats

**What the spec says.** Two things that conflict. Fixed Parameters assign rows
4-6 to riverbank. The art constraints note that `tile_start` "carries its grass
band in the top row only" and warns that "stacked riverbank rows will repeat the
grass band".

**Decision.** Accept the repeat. Draw `tile_start` unmodified on all three rows.

```
row 3  |  road                              |
       +====================================+
row 4  | ^^^ grass band ^^^                 |
       | dirt dirt dirt dirt                |
row 5  | ^^^ grass band ^^^                 |
       | dirt dirt dirt dirt                |
row 6  | ^^^ grass band ^^^     * capy      |
       | dirt dirt dirt dirt                |
       +------------------------------------+
```

**Rationale.** The repeat reads as banded riverbank texture rather than as a
mistake. The alternative — drawing row 4 whole and sourcing rows 5-6 from a
shifted slice of the same tile — means the render path carries a special case
for one specific row for purely cosmetic reasons. Note that the spec's own
warning is advice about a hazard, not a prohibition; the Fixed Parameter
mandating three riverbank rows wins.

---

### 6. Delta time is unbounded

**What the spec says.** Hazard speeds "are expressed in tiles per second and
scale by elapsed time, so motion is identical at 60Hz and 120Hz". Nothing bounds
the elapsed time.

**Why it matters.** Frame-rate independence cuts both ways. A backgrounded tab
stops receiving `requestAnimationFrame` callbacks; when it returns, the first
delta can be several seconds, and every hazard teleports across the board in one
step. On this project that is cosmetic, because collision is only evaluated
against the player's current tile — but it looks broken, and on a build with
continuous collision it would tunnel straight through the player.

**Decision.** Clamp delta time to 0.1 seconds in the loop before it reaches any
update function.

**Rationale.** Not user-chosen — a routine engineering judgment recorded here so
it is not mistaken for something the spec asked for. 0.1s is roughly six frames
at 60Hz: long enough never to affect normal play, short enough to bound the
worst case.

---

## Conventions

These hold across all five milestones.

**Zero dependencies at runtime, and that rule is absolute.** The game must run
from `file://` with no server and no build step. No `fetch`, no
`XMLHttpRequest`, no `<script type="module">` — browsers block all three over
`file://`. The atlas loads through an `<img>` element. Sprite rectangles are
copied from `assets/sprites/manifest.json` into `game.js` as constants at
authoring time; `manifest.json` is never read at runtime.

**Three files.** `index.html`, `style.css`, `game.js`. Nothing else ships.

**Tests run on Node's built-in runner.** `node --test` discovers `*.test.js`
with nothing installed and no `package.json`, which keeps the repository as
clean as the zero-dependency rule implies. Game logic is exercised through the
guarded `module.exports` block the spec requires — state transitions must be
plain functions callable with no canvas and no DOM. If a behaviour cannot be
tested without a browser, that is a signal the logic and the drawing have grown
together and should be separated.

**Optional features stay unbuilt.** The countdown timer, difficulty scaling,
audio, and high scores are out of scope until explicitly requested.
