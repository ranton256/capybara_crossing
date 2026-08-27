# gameplay Specification

## Purpose

Tracks the capybara’s grid position and session score for hop-based play before hazards and goals exist.

## Requirements

### Requirement: Starting spawn at bottom center
The system SHALL place the player at column 6, row 6 when a play session begins. The initial facing direction SHALL be up. The initial score SHALL be 0.

#### Scenario: Fresh session spawn
- **WHEN** the game boots into an active play session
- **THEN** the player grid position SHALL be column 6 and row 6
- **AND** the score SHALL be 0

### Requirement: Successful Up hop awards ten points
The system SHALL increase the score by 10 when an Up hop moves the player to a new cell. Left, Right, and Down hops that change position SHALL NOT change the score. Rejected out-of-bounds hops SHALL NOT change the score.

#### Scenario: Up hop from start awards ten
- **WHEN** the player is at the starting cell with score 0 and a successful Up hop occurs
- **THEN** the player row SHALL decrease by one
- **AND** the score SHALL become 10

#### Scenario: Lateral hop does not score
- **WHEN** the player performs a successful Left or Right hop
- **THEN** the player column SHALL change by one
- **AND** the score SHALL remain unchanged

#### Scenario: Blocked Up hop does not score
- **WHEN** the player is already on row 0 and presses Up
- **THEN** the player position SHALL remain on row 0
- **AND** the score SHALL remain unchanged
