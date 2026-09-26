## Why

The game is winnable and cannot be lost. Row 1 and row 3 are drawn as roads with
nothing on them, and the median at row 2 protects the player from nothing. A
round is six presses with no decision in it.

M3 puts vehicles on those roads. It deliberately stops short of collision: the
capybara walks straight through a truck and nothing happens. That is the whole
point of the slice. The spec requires motion to be identical at 60Hz and 120Hz,
and proving that is a job on its own — debugging *is the truck moving at the
right speed* at the same time as *did the truck hit me* is two unknowns at once.
M4 adds the second one to a lane whose motion is already known-good.

This is also the milestone where M1's delta-time clamp stops being defensive and
starts being load-bearing.

## What Changes

- Add hazard entities with a continuous horizontal position measured in tiles, a
  width in tiles, a signed speed in tiles per second, and a lane row.
- Populate row 1 with 2 trucks, 2 tiles wide, moving right at 1.5 tiles/sec with
  5-tile gaps; and row 3 with 3 ATVs, 1 tile wide, moving left at 2.5 tiles/sec
  with even 3.333-tile gaps. Counts and gaps come from `DECISIONS.md` gaps 3 and
  10; speeds and widths are Fixed Parameters.
- Advance every hazard by `speed × elapsed seconds` each update, using the same
  clamped delta the sink beat uses.
- Wrap a hazard when its trailing edge passes the canvas boundary: it reappears
  at the opposite edge and continues at the same speed. Wrap distance is
  `12 + width`, identical for every hazard in a lane, so the gaps set at
  initialisation are preserved exactly and forever.
- Draw hazards between the board and the player, snapping each to a whole device
  pixel at draw time while leaving the underlying position continuous
  (`DECISIONS.md` gap 9). All vehicle art faces left, so row 1 is drawn mirrored.
- Alternate `atv_red` and `atv_blue` along row 3 (`DECISIONS.md` gap 11).
- Hazard motion is independent of the game phase: traffic keeps flowing during
  the spa sink (`DECISIONS.md` gap 12).

Non-goals, stated so they are not smuggled in: collision detection, losing a
life, the death beat, the hit flash, the game-over screen, the optional river
section, and the `log`, `monkey` and `parrot` sprites that belong to it. In this
milestone a hazard cannot harm the player.

## Capabilities

### New Capabilities

- `hazards`: Lane traffic. Hazard geometry and lane configuration, motion in
  tiles per second scaled by elapsed time, edge wraparound and the spacing
  invariant it preserves, and the independence of hazard motion from the game
  phase.

### Modified Capabilities

- `rendering`: Gains a requirement for drawing hazards — their position in the
  layer order, the horizontal mirroring that right-moving lanes need because all
  vehicle art faces left, and the whole-pixel snapping that keeps the art crisp
  while positions stay continuous.

## Impact

**Modified files.** `game.js` gains the lane configuration, hazard advancement
and wrapping, and hazard drawing. `index.html` and `style.css` are unchanged.

**New files.** A test file for the `hazards` capability, following the
established one-file-per-capability convention.

**Existing behaviour.** Nothing already specified changes. The player, scoring,
the sink beat and the HUD are untouched; hazards are added alongside them. This
is the first milestone since M1 that modifies no existing requirement.

**Dependencies.** None added. Tests still run on `node --test` with no
`package.json`.

**Carried forward.** M1's delta clamp of 0.1s bounds a hazard's worst-case step
to 0.25 tiles at the fastest lane speed, which is a quarter of the narrowest
hazard. That margin is what will keep M4's collision from being skipped over by a
long frame, so this change is where it gets asserted rather than assumed.
