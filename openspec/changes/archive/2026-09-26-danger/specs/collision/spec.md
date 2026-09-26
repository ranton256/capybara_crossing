## Purpose

Defines when lane traffic strikes the player: the bounding boxes each carries,
the overlap test between a tile-aligned player and a continuously positioned
hazard, and at what point in a frame the test is applied.

## ADDED Requirements

### Requirement: The player and hazards carry axis-aligned bounding boxes

The player SHALL present a bounding box one tile wide and one tile tall at its
grid position: a player at column `c` on row `r` spans `[c, c + 1)` horizontally
and occupies row `r`. A hazard SHALL present a box its own width wide and one
tile tall: a hazard at position `x` of width `w` on row `r` spans `[x, x + w)`
and occupies row `r`.

#### Scenario: The player box is one tile

- **WHEN** the player's bounding box is taken at column 6
- **THEN** it spans from 6 up to but not including 7

#### Scenario: A hazard box is its own width

- **WHEN** a 2-tile-wide hazard's bounding box is taken at position 3.5
- **THEN** it spans from 3.5 up to but not including 5.5

### Requirement: Collision is an axis-aligned overlap on a shared row

A collision SHALL be registered when the player and a hazard occupy the same row
and their horizontal spans overlap. Touching spans that do not overlap SHALL NOT
register a collision.

#### Scenario: Overlapping spans on the same row collide

- **GIVEN** the player is at column 6 on row 1
- **AND** a hazard spans 5.5 to 7.5 on row 1
- **WHEN** collision is evaluated
- **THEN** a collision is registered

#### Scenario: A hazard on an adjacent row does not collide

- **GIVEN** the player is at column 6 on row 2
- **AND** a hazard spans 5.5 to 7.5 on row 1
- **WHEN** collision is evaluated
- **THEN** no collision is registered
- **AND** the player's position and life count are unchanged

#### Scenario: Spans that merely touch do not collide

- **GIVEN** the player is at column 6, spanning 6 to 7
- **AND** a hazard's box ends exactly at 6, or begins exactly at 7
- **WHEN** collision is evaluated
- **THEN** no collision is registered

#### Scenario: A hazard passing beside the player does not collide

- **GIVEN** the player rests on the median between the road lanes
- **WHEN** a hazard crosses an adjacent row without its span overlapping the
  player's
- **THEN** no collision is registered
- **AND** the player's life count and position remain unchanged

#### Scenario: A partial overlap still collides

- **GIVEN** the player is at column 6, spanning 6 to 7
- **AND** a hazard's span covers only 6.9 to 8.9
- **WHEN** collision is evaluated
- **THEN** a collision is registered

### Requirement: Collision is evaluated once per frame after all motion

Collision SHALL be evaluated once per update, after hazards have advanced and
after any player movement for that frame has been applied. A player moving into a
hazard and a hazard moving into the player SHALL therefore produce the same
outcome.

#### Scenario: Moving into a hazard collides

- **GIVEN** a hazard's span already covers the player's column on the row above
- **WHEN** the player moves onto that row
- **THEN** a collision is registered in that same frame

#### Scenario: A hazard moving onto the player collides

- **GIVEN** the player is standing on a road lane clear of traffic
- **WHEN** elapsed time carries a hazard's span onto the player's column
- **THEN** a collision is registered in that same frame

#### Scenario: Collision is registered at most once per frame

- **GIVEN** the player's span overlaps two hazards at once
- **WHEN** collision is evaluated
- **THEN** exactly one collision event results

### Requirement: Only a player in the playing state can be struck

Collision SHALL be evaluated only while the game is in its playing state. Traffic
overlapping the player during any other state SHALL NOT register a collision.

#### Scenario: A dying player is not struck again

- **GIVEN** the game is in its dying state with traffic overlapping the player
- **WHEN** elapsed time is applied
- **THEN** no further collision is registered
- **AND** the life count does not fall by more than the one already lost

#### Scenario: A sinking player is not struck

- **GIVEN** the game is in its sinking state
- **WHEN** elapsed time is applied
- **THEN** no collision is registered

#### Scenario: Traffic during a halted game does not strike

- **GIVEN** the game is over
- **WHEN** elapsed time is applied
- **THEN** no collision is registered
- **AND** the life count remains 0
