# input Specification

## Purpose
Turns directional key presses into discrete single-cell movement and keeps the
capybara inside the board, so navigation is precise and never drifts between
cells.

## Requirements

### Requirement: Discrete one-tile arrow movement

The system SHALL move the player by exactly one grid cell when the player
presses ArrowUp, ArrowDown, ArrowLeft, or ArrowRight. The move SHALL snap
directly to the adjacent cell. Holding a key SHALL NOT produce continuous or
fractional movement between cells.

#### Scenario: Interior hop moves one cell

- **WHEN** the player is on an interior cell and presses a directional arrow key
- **THEN** the player's grid coordinates SHALL change by exactly one cell in
  that direction

#### Scenario: Each accepted press moves one more cell

- **WHEN** the player presses an arrow key several times
- **THEN** each accepted press SHALL move the player one further cell, subject
  to the board bounds

#### Scenario: Non-directional keys are ignored

- **WHEN** a key other than the four arrow keys is pressed
- **THEN** the player position SHALL NOT change

### Requirement: Board boundary clamping

The system SHALL reject any hop that would place the player outside columns 0
through 11 or rows 0 through 6. A rejected hop SHALL leave the player position
unchanged and SHALL NOT wrap the player to the opposite edge.

#### Scenario: Outward hop at an edge is ignored

- **WHEN** the player is on an outer edge and presses an arrow key pointing off
  the board
- **THEN** the player position SHALL remain on that edge cell
- **AND** the player SHALL NOT appear on the opposite side

#### Scenario: Inward hop from an edge succeeds

- **WHEN** the player is on an outer edge and presses an arrow key pointing
  toward the interior
- **THEN** the player SHALL move one cell inward

### Requirement: Input applied during the update phase

The system SHALL apply a pending directional press during the update phase of
the frame that follows it, before that frame is rendered.

#### Scenario: Press is applied before the next paint

- **WHEN** a directional key has been pressed since the previous frame
- **THEN** the update phase SHALL apply the hop before the render phase draws
  the player
