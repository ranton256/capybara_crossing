# input Specification

## Purpose

Handles discrete arrow-key translation of the player onto adjacent grid cells and keeps the capybara inside the board.

## Requirements

### Requirement: Discrete one-tile arrow moves
The system SHALL translate the player by exactly one grid cell when the player presses ArrowUp, ArrowDown, ArrowLeft, or ArrowRight. Movement SHALL snap instantly to the adjacent cell; the system SHALL NOT apply continuous velocity or fractional positions from held keys in this milestone.

#### Scenario: Interior hop updates position by one cell
- **WHEN** the player occupies an interior cell and presses a directional arrow key
- **THEN** the player grid coordinates SHALL change by exactly one cell in that direction
- **AND** the change SHALL apply as an instant grid snap

#### Scenario: Repeated presses queue discrete hops
- **WHEN** the player presses an arrow key multiple times while on the board
- **THEN** each accepted press SHALL move the player by one additional cell (subject to bounds)
- **AND** holding a key SHALL NOT produce continuous sliding between cells beyond discrete accepted hops

### Requirement: Board boundary clamping
The system SHALL reject any hop that would place the player outside columns 0–11 or rows 0–6. When a hop is rejected, the player position SHALL remain unchanged.

#### Scenario: Outward hop at edge is ignored
- **WHEN** the player is on an outer board edge and presses an arrow key directed off the board
- **THEN** the player grid coordinates SHALL stay at the edge cell
- **AND** the system SHALL NOT wrap to the opposite side

#### Scenario: Inward hop from edge succeeds
- **WHEN** the player is on an outer edge and presses an arrow key toward the interior
- **THEN** the player SHALL move one cell inward
