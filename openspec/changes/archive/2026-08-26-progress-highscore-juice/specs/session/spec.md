## MODIFIED Requirements

### Requirement: Restart restores a fresh session
While Game Over is active, pressing Enter or Space SHALL reset lives to 3, score to 0, player to column 6 row 6, hazards to their initial layout, hazard speed factor to 1.0, and `bestRowThisLife` to 6, and SHALL clear Game Over. Best SHALL remain the persisted high score (not cleared).

#### Scenario: Enter restarts
- **WHEN** Game Over is active and Enter is pressed
- **THEN** lives SHALL be 3
- **AND** score SHALL be 0
- **AND** the player SHALL be at the start cell
- **AND** Game Over SHALL be cleared
- **AND** the hazard speed factor SHALL be 1.0
- **AND** Best SHALL still equal the stored high score
