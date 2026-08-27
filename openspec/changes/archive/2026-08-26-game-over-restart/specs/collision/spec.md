## MODIFIED Requirements

### Requirement: Hit costs a life and respawns
When a collision is registered, the system SHALL decrease lives by 1. If lives remain above 0, the system SHALL reset the player to column 6 row 6, leave the score unchanged, and present the defeat/Zzz sprite without locking input. If lives reach 0, the system SHALL enter Game Over instead of continuing play.

#### Scenario: Hit subtracts a life and resets position
- **WHEN** a collision is registered with lives greater than 1 and a non-zero score
- **THEN** lives SHALL decrease by 1
- **AND** the player SHALL be at column 6 and row 6
- **AND** the score SHALL remain unchanged

#### Scenario: Safe pass leaves lives and position
- **WHEN** collision is evaluated and boxes do not overlap
- **THEN** lives and player position SHALL remain unchanged

#### Scenario: Last life enters Game Over
- **WHEN** a collision is registered with exactly 1 life remaining
- **THEN** lives SHALL be 0
- **AND** the session SHALL be in Game Over
