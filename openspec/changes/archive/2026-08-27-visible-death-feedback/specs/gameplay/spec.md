## MODIFIED Requirements

### Requirement: Death resets north watermark
When a collision costs a life and the player respawns at start after the death beat while lives remain above 0, the system SHALL reset `bestRowThisLife` to 6 so progress scoring can award Up points again on the next climb.

#### Scenario: After a non-final hit watermark resets
- **WHEN** a collision reduces lives from 3 to 2 and the death beat completes with a respawn
- **THEN** `bestRowThisLife` SHALL be 6

## ADDED Requirements

### Requirement: Death beat ignores hop input
While a mid-run death beat is active, the system SHALL ignore movement input the same way the spa sink beat does. Hazards SHALL continue moving. Completing the death beat SHALL respawn the player at column 6 row 6 without changing score.

#### Scenario: Hops ignored during death beat
- **WHEN** the death beat is active and an arrow hop is pending
- **THEN** the player position SHALL remain on the impact cell until the beat ends
