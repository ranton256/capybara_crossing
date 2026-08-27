# collision Specification

## Purpose

Detects player–hazard overlap and applies the hit penalty before a Game Over screen exists.

## Requirements

### Requirement: AABB overlap uses sprite width
The system SHALL treat the player as a one-tile-wide axis-aligned box at the player's grid column and row. Each hazard SHALL use a box at its floating `x`, lane row, and stored width (one tile for ATV, two for truck). Overlap SHALL be registered when the boxes intersect.

#### Scenario: Overlapping boxes register a hit
- **WHEN** the player box intersects a hazard box
- **THEN** a collision SHALL be registered

#### Scenario: Adjacent row is safe
- **WHEN** the player occupies the median row and a hazard occupies an adjacent road row without intersecting the player box
- **THEN** no collision SHALL be registered

### Requirement: Hit costs a life and respawns
When a collision is registered, the system SHALL decrease lives by 1, reset the player to column 6 row 6, leave the score unchanged, and present the defeat/Zzz sprite. The system SHALL NOT lock input. Reaching 0 lives SHALL NOT show Game Over in this milestone.

#### Scenario: Hit subtracts a life and resets position
- **WHEN** a collision is registered with lives greater than 0 and a non-zero score
- **THEN** lives SHALL decrease by 1
- **AND** the player SHALL be at column 6 and row 6
- **AND** the score SHALL remain unchanged

#### Scenario: Safe pass leaves lives and position
- **WHEN** collision is evaluated and boxes do not overlap
- **THEN** lives and player position SHALL remain unchanged
