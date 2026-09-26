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
| 7 | No sink art for the 400ms beat | Art gap | Descend into the tile | M2 |
| 8 | HUD appearance | Silence | Pixel text, score left, lives right | M2 |
| 9 | Fractional hazard positions vs crisp art | Conflict | Snap to whole pixels at draw time | M3 |
| 10 | 3 ATVs do not divide a 13-tile wrap | Arithmetic | Even spacing, fractional starts | M3 |
| 11 | Two ATV sprites, three ATVs | Silence | Alternate red and blue | M3 |
| 12 | Does traffic move while not playing | Silence | Yes, motion is phase-independent | M3 |
| 13 | Where M4 stops at zero lives | Scope | M4 adds the GAME_OVER state; M5 adds its screen | M4 |
| 14 | What the 100ms blink looks like | Silence | Fast strobe, four 25ms toggles | M4 |
| 15 | Which frame a halted game draws | Silence | The defeat pose is held | M4 |
| 16 | Does a fatal step still score | Silence | Yes, the row was reached | M4 |

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

### 7. The spa sink has no art

**What the spec says.** Fixed Parameters give `spa sink 400ms`, and the goal
scenario says the capybara "happily sinks into the mud". The atlas ships eight
walk frames and `capy_defeat`; there is no sink frame and no partial-submersion
frame.

**Why it matters.** The beat is 400ms of visible screen time with nothing drawn
for it. Either it is animated procedurally or it is a pause pretending to be an
animation.

**Decision.** Descend into the tile. Over the 400ms the sprite's top edge travels
downward toward a fixed mud line while its lower part is clipped away, so it
reads as going under the surface.

```
t=0.0        t=0.4         t=0.8        t=1.0
+------+    +------+     +------+    +------+
| .--. |    |      |     |      |    |      |
|(o  o)|    | .--. |     |      |    |      |
| capy |    |(o  o)|     | .--. |    |      |
|______|    |______|     |(____)|    |______|
 mud line    mud line     mud line    mud line
```

Concretely: source `y` stays fixed, source height shrinks, destination `y` grows
by the same amount. No new art, no new atlas rectangle.

**Rationale.** It is the literal reading of the spec and the only option that
represents "sinks" rather than "vanishes". Shrinking toward the tile centre was
considered and reads as disappearing, not submerging. Holding the pose for 400ms
was rejected because it makes a Fixed Parameter into dead time.

---

### 8. The HUD's appearance is unspecified

**What the spec says.** The render pipeline requires HUD text "rendered on top of
all game elements". Nothing describes what it contains or how it looks. Gap 4
placed it over row 0; this settles what is drawn there.

**Decision.** Monospace pixel text in the palette's cream, score at the left and
lives at the right.

```
+------------------------------------------+
| SCORE 120                     LIVES 3    |  row 0, over spa
+------------------------------------------+
```

**Rationale.** `ctx.fillText` needs no new sprites and no atlas changes. Drawing
lives as small capybara heads was considered and rejected: it would scale a 16x16
walk frame down to a size it was not drawn for, which muddies at this palette's
contrast.

**Note for M2.** Lives cannot change until M4 introduces death, so M2 draws a
static `3`. That is intentional, not a stub — the counter is real state read from
the game, it simply has nothing to decrement it yet.

---

### 9. Continuous hazard positions collide with crisp pixel art

**What the spec says.** Hazard speeds are in tiles per second and scale by
elapsed time. Separately, the rendering requirements demand integer scaling and
disabled smoothing so the 16x16 art stays hard-edged. Nothing reconciles the two:
a hazard at 1.5 tiles/sec is at a fractional tile position on almost every frame.

**Why it matters.** It is the difference between a retro game and a modern game
wearing retro art, and it applies to every hazard on every frame rather than to
one sprite in one state.

**Decision.** Position stays continuous in state; the draw call floors it to a
whole device pixel.

```
state x = 4.3719...          exact, used for wrap and (in M4) collision
draw  x = floor(x * 16) / 16 snapped

   frame 1  |[TT]      |   snapped
   frame 2  |[TT]      |   same pixel
   frame 3  | [TT]     |   moves one pixel
```

**Rationale.** Simulation accuracy and display accuracy are different concerns,
and conflating them loses one of them. Keeping state continuous means M4's
collision maths is exact; snapping at the boundary means the art never shimmers.
Motion is visibly stepped at close range, which is what the genre looks like.

**Note.** This is the inverse of the M2 sink (gap 7), which draws at fractional
offsets deliberately because 400ms of stepped descent would read as broken. Both
are recorded so the difference is visible as a choice rather than an oversight.

---

### 10. Three ATVs do not divide a thirteen-tile wrap

**What the spec says.** Nothing. Gap 3 chose 3 ATVs with 3-tile gaps, which was
decided before the wrap arithmetic was worked out.

**Why it matters.** A lane's wrap distance is `12 + hazard width`, so row 3 is 13
tiles, and 13 does not divide by 3. Every hazard in a lane shares a speed and a
wrap distance, so whatever spacing is set at initialisation is preserved exactly
and forever. This is permanent.

**Decision.** Even spacing with fractional start positions: period `13/3 = 4.333`
tiles, so the gaps are a uniform 3.333.

```
wrap span = 12 + 1 = 13 tiles
starts    = 0, 4.333, 8.667

  <--[A]...[A]...[A]...
gaps: 3.33, 3.33, 3.33    uniform forever
```

**Rationale.** Integer starts of 0, 4, 8 would give gaps of 3, 3 and 5 — stable
but visibly irregular, with one lane opening noticeably easier than the others.
Fractional starts cost nothing, since positions are continuous floats anyway and
only the draw call cares about whole pixels (gap 9).

**Refines gap 3**, which said "3-tile gaps". Read that as the intent; 3.333 is
the arithmetic that delivers it. Row 1 needs no such correction: 2 trucks over a
14-tile wrap is exactly 7 apart, giving the 5-tile gaps gap 3 specified.

---

### 11. Two ATV sprites, three ATVs

**What the spec says.** The atlas ships `atv_red` and `atv_blue`. Row 3 carries
three ATVs. Nothing says which to use.

**Decision.** Alternate the two across the lane, so consecutive ATVs differ.

**Rationale.** It makes an individual vehicle easy to follow as it wraps, which
matters when judging a gap, and it uses art that was drawn and shipped. Using
only red would leave `atv_blue` idle with no plan to reach it.

---

### 12. Whether traffic moves while the game is not playing

**What the spec says.** Nothing. The question only arises once the state machine
exists, which is why it could not have been asked before M2.

**Decision.** Hazard motion is independent of the phase. Traffic keeps flowing
during the spa sink, and will keep flowing during M4's death beat.

**Rationale.** Not user-chosen — recorded here so it is not mistaken for
something the spec asked for. The lanes are a world rather than a turn, and
freezing them would make the beat read as a pause in the game rather than a beat
within it. It also means hazard motion has exactly one rule instead of one rule
plus an exception, which matters in M4 where a frozen lane during the death beat
would let the player respawn into a hazard that never moved.

---

### 13. Where M4 stops at zero lives

**What the spec says.** The zero-life scenario runs together three things: the
count decreasing to 0, the state transitioning "from active gameplay to a Game
Over screen", and the final score being displayed with Enter or Space starting a
new run. The milestone plan puts the screen and the restart in M5.

**Why it matters.** Splitting a single written scenario across two milestones
needs a stated seam, or M4 ships something that looks broken and M5 spends its
time undoing it.

**Decision.** M4 introduces `GAME_OVER` as a state. The last death enters it, it
halts play and ignores input, and lives never go below 0. M5 adds only
presentation: the screen, the final score, and Enter or Space to start a new run.

```
  PLAYING --collision--> DYING (550ms)
                          |
            lives>0  <----+----> lives==0
               |                    |
            respawn              GAME_OVER
               |                 halts, ignores input
            PLAYING
```

**Rationale.** The state machine gains its third and final member in the
milestone that has the reason for it, and M5 becomes purely presentational rather
than structural. Freezing on the death pose instead was rejected because a frozen
screen reads as a hang, and because M5 would then have to undo M4's behaviour
rather than build on it. Respawning forever was rejected because it ships a lives
counter that visibly stops meaning anything at 0.

---

### 14. What the hundred-millisecond blink looks like

**What the spec says.** Fixed Parameters give `hit flash 100ms`. Gap 2 decided
the capybara blinks rather than the screen flashing. Neither says what the blink
is.

**Decision.** A fast strobe: alternate drawn and not-drawn every 25ms across the
first 100ms of the 550ms death beat, then hold the defeat pose for the remaining
450ms.

```
0ms        100ms                    550ms
|-----------|------------------------|
 on off on off   defeat pose held
 |  |  |  |
 25ms each
```

**Rationale.** The impact wants to be unmistakable, and 100ms is short enough
that a strobe registers as one event rather than as flicker. A single 100ms hide
was considered and is calmer, but easy to miss entirely at a glance, which
defeats the purpose of having a flash parameter at all.

**Note.** Both the 25ms toggle period and the 100ms window are measured from the
same accumulated phase clock the sink beat uses, so the flash is refresh-rate
independent for the same reason the beat is.

---

### 15. Which frame a halted game draws

**What the spec says.** Nothing. The question only exists because gap 13 put
`GAME_OVER` in M4 and its screen in M5, so there is a milestone in which the game
is over and nothing is written over the board.

**Why it matters.** The first implementation drew the defeat pose only while
dying, so `GAME_OVER` fell through to a walk frame: the capybara stood up looking
unharmed, indefinitely, at the tile where it had just been run over. It read as a
freeze rather than as a defeat.

**Decision.** The defeat pose is held once the game is over, at the tile where
the final collision occurred.

**Rationale.** It reads as "you died" with no text at all, which means M5's
game-over screen lands on a coherent scene rather than having to explain one.
Drawing no capybara was considered and rejected: the player vanishing without
explanation is a different kind of confusing.

---

### 16. Whether a step that kills still scores

**What the spec says.** The advance award is described as 10 points for a row
farther north than any reached during the current life. Nothing says whether the
row has to be survived.

**Why it matters.** Stepping into a truck awards the 10 points and then kills, so
the score ticks up as the player dies. It is visible, and it was accidental
rather than chosen — nothing recorded it and no test would have noticed it
flipping.

**Decision.** The award stands. The row was reached; surviving it is not a
condition.

**Rationale.** It is the scoring requirement read literally, and it keeps the
watermark rule free of any knowledge of collision — the same separation that
keeps the goal bonus composing rather than special-cased (see the M2 design).
Suppressing the award would put a collision test inside the scoring path for a
10-point edge case.

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
