## Purpose

Tracks where the capybara is, which way it faces, and how far north it has
gotten this life, which is what the score is paid against.

## ADDED Requirements

### Requirement: Starting spawn at bottom centre

The system SHALL place the player at column 6, row 6, facing up, with a score of
0 when a play session begins.

#### Scenario: Fresh session spawn

- **WHEN** a play session begins
- **THEN** the player SHALL be at column 6 and row 6
- **AND** the facing direction SHALL be up
- **AND** the score SHALL be 0

### Requirement: Forward progress awards ten points

The system SHALL increase the score by 10 when, and only when, a successful Up
hop places the player on a row farther north than any row reached during the
current life. After such a hop, that row SHALL become the life's farthest-north
watermark. Down, Left, and Right hops SHALL NOT change the score. An Up hop onto
a row already reached SHALL NOT change the score. A hop rejected by the board
bounds SHALL NOT change the score. At the start of a life the watermark SHALL be
the spawn row.

#### Scenario: First Up hop scores

- **WHEN** the player hops Up from the spawn cell with a score of 0
- **THEN** the row SHALL decrease by one
- **AND** the score SHALL be 10
- **AND** the watermark SHALL be the new row

#### Scenario: Re-climbing ground already covered does not score

- **WHEN** the player has scored for reaching a row, then hops Down and Up back
  onto that same row
- **THEN** the score SHALL NOT increase for that second arrival

#### Scenario: Sideways movement does not score

- **WHEN** the player completes a successful Left or Right hop
- **THEN** the column SHALL change by one
- **AND** the score SHALL remain unchanged

#### Scenario: A blocked Up hop does not score

- **WHEN** the player is on row 0 and presses Up
- **THEN** the position SHALL remain on row 0
- **AND** the score SHALL remain unchanged

### Requirement: Facing follows the last hop

The system SHALL set the player's facing direction to the direction of the most
recent accepted hop, and SHALL leave facing unchanged when a hop is rejected.

#### Scenario: Facing changes with an accepted hop

- **WHEN** the player completes a successful Left hop
- **THEN** the facing direction SHALL be left

#### Scenario: Facing survives a rejected hop

- **WHEN** the player is at an edge and presses an arrow key pointing off the
  board
- **THEN** the facing direction SHALL remain what it was
