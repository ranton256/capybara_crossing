## MODIFIED Requirements

### Requirement: Successful Up hop awards ten points
The system SHALL increase the score by 10 only when a successful Up hop moves the player to a row strictly less than the life’s farthest-north watermark (`bestRowThisLife`). After such a hop, the watermark SHALL become the new row. Left, Right, and Down hops SHALL NOT change the score. An Up hop onto a row that is not farther north than the watermark SHALL NOT change the score. Rejected out-of-bounds hops SHALL NOT change the score. On boot and on session restart, `bestRowThisLife` SHALL start at the spawn row (6). On a mid-run life loss respawn, `bestRowThisLife` SHALL reset to the spawn row (6).

#### Scenario: Up hop from start awards ten
- **WHEN** the player is at the starting cell with score 0 and a successful Up hop occurs
- **THEN** the player row SHALL decrease by one
- **AND** the score SHALL become 10
- **AND** the farthest-north watermark SHALL be the new row

#### Scenario: Re-upping the same progress does not score
- **WHEN** the player has already scored for reaching row 5, then hops Down and Up back to row 5
- **THEN** the second Up onto row 5 SHALL NOT increase the score

#### Scenario: Lateral hop does not score
- **WHEN** the player performs a successful Left or Right hop
- **THEN** the player column SHALL change by one
- **AND** the score SHALL remain unchanged

#### Scenario: Blocked Up hop does not score
- **WHEN** the player is already on row 0 and presses Up
- **THEN** the player position SHALL remain on row 0
- **AND** the score SHALL remain unchanged

### Requirement: Sink beat then next round at start
After awarding the spa bonus, the system SHALL keep the player on the spa for a short sink beat, ignore movement input during that beat, then reset the player to column 6 row 6. Lives and score SHALL persist. Hazards SHALL continue moving. Completing the sink beat SHALL multiply the session hazard speed factor by 1.10 (compounding) and SHALL reset `bestRowThisLife` to the spawn row (6) for the next approach.

#### Scenario: After the sink beat the player is at start
- **WHEN** the sink beat completes
- **THEN** the player SHALL be at column 6 and row 6
- **AND** the score SHALL still include the spa bonus
- **AND** lives SHALL be unchanged

#### Scenario: Next round is faster
- **WHEN** the sink beat completes after a spa clear
- **THEN** the session hazard speed factor SHALL be 1.10 times its previous value
- **AND** `bestRowThisLife` SHALL be 6

## ADDED Requirements

### Requirement: Death resets north watermark
When a collision costs a life and the player respawns at start while lives remain above 0, the system SHALL reset `bestRowThisLife` to 6 so progress scoring can award Up points again on the next climb.

#### Scenario: After a non-final hit watermark resets
- **WHEN** a collision reduces lives from 3 to 2 and respawns the player
- **THEN** `bestRowThisLife` SHALL be 6
