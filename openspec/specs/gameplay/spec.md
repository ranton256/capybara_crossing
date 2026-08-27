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

### Requirement: Starting lives
The system SHALL start a play session with 3 lives.

#### Scenario: Fresh session lives
- **WHEN** the game boots into an active play session
- **THEN** remaining lives SHALL be 3

### Requirement: Spa entry awards fifty bonus points
When the player occupies row 0 after a hop, the system SHALL add 50 to the score. The Up-hop award of 10 SHALL still apply to the hop that entered the spa.

#### Scenario: Entering the spa from row 1
- **WHEN** the player hops Up from row 1 onto row 0 with score 0
- **THEN** the score SHALL become 60

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

### Requirement: Death resets north watermark
When a collision costs a life and the player respawns at start after the death beat while lives remain above 0, the system SHALL reset `bestRowThisLife` to 6 so progress scoring can award Up points again on the next climb.

#### Scenario: After a non-final hit watermark resets
- **WHEN** a collision reduces lives from 3 to 2 and the death beat completes with a respawn
- **THEN** `bestRowThisLife` SHALL be 6

### Requirement: Death beat ignores hop input
While a mid-run death beat is active, the system SHALL ignore movement input the same way the spa sink beat does. Hazards SHALL continue moving. Completing the death beat SHALL respawn the player at column 6 row 6 without changing score.

#### Scenario: Hops ignored during death beat
- **WHEN** the death beat is active and an arrow hop is pending
- **THEN** the player position SHALL remain on the impact cell until the beat ends
