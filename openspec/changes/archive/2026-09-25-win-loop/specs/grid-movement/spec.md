## MODIFIED Requirements

### Requirement: Discrete movement on directional input

While the game is accepting directional input, a press of `ArrowUp`, `ArrowDown`,
`ArrowLeft`, or `ArrowRight` SHALL move the player exactly one tile in that
direction and SHALL set the player's facing to that direction. Movement SHALL be
instantaneous, with no intermediate or fractional position. Which states accept
input is defined by the `game-lifecycle` capability.

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

#### Scenario: Movement does not apply while the game is not accepting input

- **GIVEN** the game is in a state that does not consume directional input
- **WHEN** a directional key is pressed
- **THEN** the player's column, row, and facing are unchanged

### Requirement: Movement is clamped at the board edges

A directional input that would carry the player outside the 12x7 grid SHALL leave
the player's position unchanged. The player SHALL never occupy a coordinate outside
the board. The northern boundary is the exception: row 0 is inside the board and is
entered as the goal rather than clamped against, which the `game-lifecycle`
capability defines.

#### Scenario: Pressing outward at the bottom edge

- **WHEN** the player is at row 6 and `ArrowDown` is pressed
- **THEN** the player remains at row 6

#### Scenario: Pressing outward at the left edge

- **WHEN** the player is at column 0 and `ArrowLeft` is pressed
- **THEN** the player remains at column 0

#### Scenario: Pressing outward at the right edge

- **WHEN** the player is at column 11 and `ArrowRight` is pressed
- **THEN** the player remains at column 11

#### Scenario: Pressing outward at the top edge

- **GIVEN** the player is at row 0, which cannot occur while playing because
  entering row 0 begins the sink
- **WHEN** `ArrowUp` is pressed
- **THEN** the player remains at row 0
- **AND** the clamp still holds as a guard, so no position leaves the board even if
  a later change makes row 0 occupiable again

#### Scenario: Moving up from row 1 is not clamped

- **WHEN** the player is at row 1 and `ArrowUp` is pressed
- **THEN** the player occupies row 0
- **AND** the position is not clamped back to row 1

#### Scenario: The player never occupies a coordinate outside the board

- **WHEN** any sequence of directional presses is applied
- **THEN** the player's column is within 0 through 11
- **AND** the player's row is within 0 through 6

#### Scenario: Non-directional keys are ignored

- **WHEN** a key other than the four arrow keys is pressed
- **THEN** the player's position and facing are unchanged
