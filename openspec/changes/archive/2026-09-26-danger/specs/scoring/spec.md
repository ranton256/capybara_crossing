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

## ADDED Requirements

### Requirement: A step that proves fatal still scores its advance

Reaching a row farther north than the watermark SHALL award its points even when
a collision is registered in the same frame. The row was reached; surviving it is
not a condition of the award.

#### Scenario: Stepping into a hazard scores the row before dying

- **GIVEN** the player is on row 2 with a score of 40 and the watermark at row 2
- **AND** a hazard's span covers the player's column on row 1
- **WHEN** the player moves onto row 1 and the collision is registered
- **THEN** the score is 50
- **AND** a life has been lost

#### Scenario: The watermark still resets after a fatal advance

- **GIVEN** a fatal step advanced the watermark before the collision
- **WHEN** the death beat expires and the player respawns
- **THEN** the watermark is back at the spawn row
- **AND** the points awarded for that step are retained
