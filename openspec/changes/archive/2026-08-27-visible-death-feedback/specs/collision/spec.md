## MODIFIED Requirements

### Requirement: Hit costs a life and respawns
When a collision is registered, the system SHALL decrease lives by 1. If lives remain above 0, the system SHALL keep the player on the impact cell for a short death beat, present the defeat/Zzz sprite there with visible flicker, ignore hop input during that beat, then reset the player to column 6 row 6 when the beat ends, leaving the score unchanged. The hit SHALL also trigger a brief screen flash. During the death beat the system SHALL NOT register further collisions against the player. If lives reach 0, the system SHALL enter Game Over instead of a playable respawn, SHALL keep the player on the impact cell, and SHALL present the defeat sprite there while Game Over is shown.

#### Scenario: Hit subtracts a life and resets position
- **WHEN** a collision is registered with lives greater than 1 and a non-zero score
- **THEN** lives SHALL decrease by 1
- **AND** the player SHALL remain on the impact cell for the death beat
- **AND** after the death beat completes the player SHALL be at column 6 and row 6
- **AND** the score SHALL remain unchanged

#### Scenario: Safe pass leaves lives and position
- **WHEN** collision is evaluated and boxes do not overlap
- **THEN** lives and player position SHALL remain unchanged

#### Scenario: Last life enters Game Over
- **WHEN** a collision is registered with exactly 1 life remaining
- **THEN** lives SHALL be 0
- **AND** the session SHALL be in Game Over
- **AND** the player SHALL remain on the impact cell
