## Purpose

Defines the board's coordinate model and how directional input translates into player
position, so that navigation is exact and tile-addressed rather than subject to
floating-point drift.

## ADDED Requirements

### Requirement: Board coordinate model

The board SHALL be 12 columns by 7 rows of 16x16 tiles, presented on a 576x336 canvas
at an integer scale factor of 3. Rows SHALL carry fixed roles from top to bottom: row
0 is the mud spa, row 1 is a road lane, row 2 is the median, row 3 is a road lane, and
rows 4 through 6 are riverbank. The player SHALL begin at column 6, row 6, facing up.

#### Scenario: Initial state

- **WHEN** a new game begins
- **THEN** the player occupies column 6, row 6
- **AND** the player's facing direction is up

#### Scenario: Positions are whole tiles

- **WHEN** the player's position is read at any point during play
- **THEN** its column is an integer in the range 0 through 11
- **AND** its row is an integer in the range 0 through 6

### Requirement: Discrete movement on directional input

A press of `ArrowUp`, `ArrowDown`, `ArrowLeft`, or `ArrowRight` SHALL move the player
exactly one tile in that direction and SHALL set the player's facing to that direction.
Movement SHALL be instantaneous, with no intermediate or fractional position.

#### Scenario: Moving to an adjacent tile

- **WHEN** the player is at column 6, row 6 and `ArrowUp` is pressed
- **THEN** the player occupies column 6, row 5
- **AND** the player's facing is up

#### Scenario: Each press moves exactly one tile

- **WHEN** `ArrowLeft` is pressed three times from column 6
- **THEN** the player occupies column 3
- **AND** no position between presses was fractional

#### Scenario: Facing updates even when blocked

- **WHEN** the player presses a direction that cannot be moved into
- **THEN** the player's facing is set to that direction
- **AND** the player's column and row are unchanged

#### Scenario: Arrow keys do not scroll the page

- **WHEN** a directional key is pressed while the game has focus
- **THEN** the browser's default action for that key is suppressed

### Requirement: Movement is clamped at the board edges

A directional input that would carry the player outside the 12x7 grid SHALL leave the
player's position unchanged. The player SHALL never occupy a coordinate outside the
board.

#### Scenario: Pressing outward at the bottom edge

- **WHEN** the player is at row 6 and `ArrowDown` is pressed
- **THEN** the player remains at row 6

#### Scenario: Pressing outward at the left edge

- **WHEN** the player is at column 0 and `ArrowLeft` is pressed
- **THEN** the player remains at column 0

#### Scenario: Pressing outward at the top edge

- **WHEN** the player is at row 0 and `ArrowUp` is pressed
- **THEN** the player remains at row 0

#### Scenario: Non-directional keys are ignored

- **WHEN** a key other than the four arrow keys is pressed
- **THEN** the player's position and facing are unchanged
