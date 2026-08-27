## Purpose

Ends a run at zero lives and lets the player start a fresh session without a page reload.

## ADDED Requirements

### Requirement: Zero lives enter Game Over
When lives decrease to 0 from a collision, the system SHALL enter Game Over. Hops and hazard motion SHALL stop. The player SHALL not continue a playable round.

#### Scenario: Last hit ends the run
- **WHEN** a collision is registered with exactly 1 life remaining
- **THEN** lives SHALL be 0
- **AND** the session SHALL be in Game Over

### Requirement: Restart restores a fresh session
While Game Over is active, pressing Enter or Space SHALL reset lives to 3, score to 0, player to column 6 row 6, and hazards to their initial layout, and SHALL clear Game Over.

#### Scenario: Enter restarts
- **WHEN** Game Over is active and Enter is pressed
- **THEN** lives SHALL be 3
- **AND** score SHALL be 0
- **AND** the player SHALL be at the start cell
- **AND** Game Over SHALL be cleared
