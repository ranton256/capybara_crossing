## Purpose

Defines the traffic occupying the two road lanes: what a hazard is, how fast and
in which direction each lane moves, how a hazard leaves one edge and returns at
the other, and why the gaps between vehicles never drift.

## ADDED Requirements

### Requirement: Hazards have continuous position and tile-measured geometry

A hazard SHALL carry a horizontal position measured in tiles as a continuous
value, a width in whole tiles, a lane row, and a signed speed in tiles per second
whose sign gives its direction. Position SHALL NOT be rounded or quantised in
game state; whole-pixel presentation is a rendering concern.

#### Scenario: A hazard exposes its geometry

- **WHEN** a hazard is read from game state
- **THEN** it has a numeric horizontal position in tiles
- **AND** a width of one or more whole tiles
- **AND** a lane row within the board
- **AND** a non-zero speed in tiles per second

#### Scenario: Position is not quantised

- **WHEN** a hazard has advanced by a fraction of a tile
- **THEN** its stored position retains that fraction

### Requirement: The lanes carry the specified traffic

Row 1 SHALL carry 2 trucks, each 2 tiles wide, travelling right at 1.5 tiles per
second. Row 3 SHALL carry 3 ATVs, each 1 tile wide, travelling left at 2.5 tiles
per second. No other row SHALL carry a hazard.

#### Scenario: Row 1 traffic

- **WHEN** the lanes are initialised
- **THEN** row 1 holds exactly 2 hazards
- **AND** each is 2 tiles wide
- **AND** each moves rightward at 1.5 tiles per second

#### Scenario: Row 3 traffic

- **WHEN** the lanes are initialised
- **THEN** row 3 holds exactly 3 hazards
- **AND** each is 1 tile wide
- **AND** each moves leftward at 2.5 tiles per second

#### Scenario: No other row carries traffic

- **WHEN** the lanes are initialised
- **THEN** no hazard occupies the spa row, the median, or any riverbank row

### Requirement: Hazards advance by speed times elapsed time

Each update SHALL advance every hazard by its speed multiplied by the elapsed
seconds supplied to that update, so that distance travelled over a given interval
is identical at any refresh rate.

#### Scenario: Distance follows elapsed time

- **WHEN** one second of elapsed time is applied
- **THEN** a hazard travelling at 1.5 tiles per second has advanced 1.5 tiles
- **AND** a hazard travelling at 2.5 tiles per second has advanced 2.5 tiles

#### Scenario: Identical travel at 60Hz and 120Hz

- **WHEN** one second is applied as 60 steps and separately as 120 steps
- **THEN** every hazard has reached an equivalent position in both cases, within
  floating-point tolerance

#### Scenario: Direction follows the sign of the speed

- **WHEN** elapsed time is applied
- **THEN** a rightward hazard's position increases
- **AND** a leftward hazard's position decreases

### Requirement: A hazard wraps when its trailing edge leaves the board

When a hazard's trailing edge passes the board boundary it SHALL reappear at the
opposite edge and continue at the same speed. A rightward hazard's trailing edge
is its left edge; a leftward hazard's trailing edge is its right edge. The
distance a hazard travels between successive wraps SHALL be the board width plus
the hazard's own width.

#### Scenario: A rightward hazard wraps

- **GIVEN** a rightward hazard whose left edge has passed the right boundary
- **WHEN** the wrap is applied
- **THEN** it reappears with its right edge at the left boundary
- **AND** its speed is unchanged

#### Scenario: A leftward hazard wraps

- **GIVEN** a leftward hazard whose right edge has passed the left boundary
- **WHEN** the wrap is applied
- **THEN** it reappears with its left edge at the right boundary
- **AND** its speed is unchanged

#### Scenario: Wrap distance is the board width plus the hazard width

- **WHEN** a hazard completes one full circuit
- **THEN** it has travelled the board width plus its own width

#### Scenario: A hazard is never lost off the board

- **WHEN** any amount of elapsed time is applied
- **THEN** every hazard's position remains within one wrap distance of the board

### Requirement: Gaps between hazards in a lane never drift

Every hazard in a lane SHALL share a speed and a wrap distance, so the spacing
established at initialisation SHALL be preserved for the life of the session. The
lanes SHALL be initialised with their hazards evenly spaced across the wrap
distance.

#### Scenario: Even initial spacing

- **WHEN** the lanes are initialised
- **THEN** the hazards in each lane are evenly spaced across that lane's wrap
  distance

#### Scenario: Spacing survives many wraps

- **WHEN** enough elapsed time is applied for every hazard to wrap several times
- **THEN** the gaps between consecutive hazards in each lane are unchanged from
  their initial values, within floating-point tolerance

### Requirement: Hazard motion is independent of the game phase

Hazards SHALL advance on every update regardless of the current phase, so traffic
continues to flow while the game is not accepting player input.

#### Scenario: Traffic flows during the sink beat

- **GIVEN** the game is in its sinking phase
- **WHEN** elapsed time is applied
- **THEN** every hazard has advanced by its speed times that elapsed time

#### Scenario: A clamped frame cannot carry a hazard past the player's tile

- **WHEN** a single frame of the maximum permitted elapsed time is applied
- **THEN** no hazard advances by as much as one tile
- **AND** no hazard can therefore cross a whole tile within one frame
