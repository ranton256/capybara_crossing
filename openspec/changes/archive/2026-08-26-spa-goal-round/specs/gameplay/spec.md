## ADDED Requirements

### Requirement: Spa entry awards fifty bonus points
When the player occupies row 0 after a hop, the system SHALL add 50 to the score. The Up-hop award of 10 SHALL still apply to the hop that entered the spa.

#### Scenario: Entering the spa from row 1
- **WHEN** the player hops Up from row 1 onto row 0 with score 0
- **THEN** the score SHALL become 60

### Requirement: Sink beat then next round at start
After awarding the spa bonus, the system SHALL keep the player on the spa for a short sink beat, ignore movement input during that beat, then reset the player to column 6 row 6. Lives and score SHALL persist. Hazards SHALL continue moving.

#### Scenario: After the sink beat the player is at start
- **WHEN** the sink beat completes
- **THEN** the player SHALL be at column 6 and row 6
- **AND** the score SHALL still include the spa bonus
- **AND** lives SHALL be unchanged
