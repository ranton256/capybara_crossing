# collision Specification

## Purpose
Detects overlap between the capybara and moving traffic and applies the penalty,
so the crossing carries real risk.

## Requirements

### Requirement: Axis-aligned overlap using hazard width

The system SHALL treat the player as a one-tile-wide, one-tile-high box at its
grid column and row, and each hazard as a box at its horizontal position, lane
row, and stored tile width. A collision SHALL be registered when those boxes
intersect. Boxes that merely touch at an edge SHALL NOT count as intersecting.

#### Scenario: Overlapping boxes register a hit

- **WHEN** the player box intersects a hazard box
- **THEN** a collision SHALL be registered

#### Scenario: A truck is two tiles wide

- **WHEN** the player is one tile to the right of a truck's left edge and no
  other hazard overlaps
- **THEN** a collision SHALL be registered, because the truck spans two tiles

#### Scenario: An adjacent row is safe

- **WHEN** the player occupies the median row and a hazard passes along an
  adjacent road row without overlapping the player box
- **THEN** no collision SHALL be registered
- **AND** the life count and the player position SHALL remain unchanged

#### Scenario: Touching edges do not collide

- **WHEN** a hazard's right edge exactly meets the player's left edge
- **THEN** no collision SHALL be registered

### Requirement: A hit costs a life and holds a death beat

When a collision is registered, the system SHALL decrease the life count by 1,
keep the player on the impact cell for a death beat, present the defeat pose
there, ignore movement input for the duration of the beat, and trigger a brief
screen flash. The score SHALL NOT change. While the death beat is active the
system SHALL NOT register further collisions, so a single impact costs exactly
one life.

#### Scenario: A hit subtracts one life and pins the player

- **WHEN** a collision is registered with more than one life remaining
- **THEN** the life count SHALL decrease by exactly 1
- **AND** the player SHALL remain on the impact cell until the beat ends
- **AND** the score SHALL be unchanged

#### Scenario: One impact costs only one life

- **WHEN** the player still overlaps a hazard on the frame after a registered hit
- **THEN** no further collision SHALL be registered while the death beat is active

#### Scenario: Movement is ignored during the beat

- **WHEN** the death beat is active and a directional key is pressed
- **THEN** the player position SHALL NOT change

### Requirement: Respawn after the beat restores scoring ground

When the death beat ends and at least one life remains, the system SHALL return
the player to the spawn cell facing up and SHALL reset the farthest-north
watermark to the spawn row, so the next climb can score again. The score SHALL
carry over unchanged.

#### Scenario: Player returns to the start

- **WHEN** the death beat completes with lives remaining
- **THEN** the player SHALL be at column 6 and row 6
- **AND** the score SHALL be unchanged

#### Scenario: The watermark resets so progress can score again

- **WHEN** the death beat completes with lives remaining
- **THEN** the farthest-north watermark SHALL be the spawn row
- **AND** a subsequent Up hop SHALL award 10 points

### Requirement: The last life ends the run

When a collision leaves 0 lives, the system SHALL NOT respawn the player. It
SHALL enter a game-over state and keep the capybara on the impact cell.

#### Scenario: Zero lives enters game over

- **WHEN** a collision is registered with exactly 1 life remaining
- **THEN** the life count SHALL be 0
- **AND** the session SHALL be in a game-over state
- **AND** the player SHALL remain on the impact cell
