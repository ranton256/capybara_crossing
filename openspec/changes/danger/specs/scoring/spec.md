## MODIFIED Requirements

### Requirement: The watermark resets each round but the score does not

The watermark SHALL return to the spawn row when a round ends. The score SHALL
persist across round boundaries for the whole session.

#### Scenario: The watermark resets after a spa clear

- **GIVEN** the player reached row 0 and the sink beat has expired
- **WHEN** the player moves north from the spawn cell to row 5
- **THEN** 10 points are awarded again for that row

#### Scenario: Score accumulates across rounds

- **GIVEN** the player finished a round with a score of 110
- **WHEN** the next round begins
- **THEN** the score is still 110
- **AND** further awards add to it

#### Scenario: Score starts at zero

- **WHEN** a new game begins
- **THEN** the score is 0
- **AND** the watermark is the spawn row

#### Scenario: The watermark resets after a death

- **GIVEN** the player reached row 3 and was then struck by a hazard
- **WHEN** the death beat expires and the player respawns
- **AND** the player moves north from the spawn cell to row 5
- **THEN** 10 points are awarded again for that row

#### Scenario: A death does not cost points already scored

- **GIVEN** the player has scored 40 points
- **WHEN** the player is struck and respawns
- **THEN** the score is still 40
