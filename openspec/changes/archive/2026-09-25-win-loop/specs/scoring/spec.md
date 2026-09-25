## Purpose

Defines how a player's score accumulates: the reward for advancing to a row not
previously reached during the current life, the bonus for reaching the mud spa, and
which of those values survive a round boundary.

## ADDED Requirements

### Requirement: Advancing to a new northmost row scores ten points

The game SHALL track the northmost row the player has reached during the current
life. Moving onto a row farther north than that watermark SHALL award 10 points and
SHALL move the watermark to that row. Moving to a row at or south of the watermark
SHALL award nothing.

#### Scenario: A first step north scores

- **GIVEN** a new game, with the player at row 6 and a score of 0
- **WHEN** the player moves to row 5
- **THEN** the score is 10
- **AND** the watermark is row 5

#### Scenario: Returning to a row already reached scores nothing

- **GIVEN** the player has reached row 4 and scored for it
- **WHEN** the player moves south to row 5 and north again to row 4
- **THEN** no further points are awarded for either move
- **AND** the score is unchanged

#### Scenario: Only northward progress past the watermark scores

- **WHEN** the player moves left or right along a row
- **THEN** no points are awarded

#### Scenario: A blocked move scores nothing

- **GIVEN** the player is at column 0
- **WHEN** `ArrowLeft` is pressed and the position is unchanged
- **THEN** no points are awarded

### Requirement: Reaching the mud spa awards fifty points

Entering row 0 SHALL award 50 points. This bonus SHALL be in addition to any
watermark award earned by that same move.

#### Scenario: The goal awards its bonus

- **GIVEN** the player is at row 1 with a score of 50
- **WHEN** the player moves onto row 0
- **THEN** the score includes the 50-point bonus

#### Scenario: The final step scores both awards

- **GIVEN** the player is at row 1 and row 1 is the current watermark
- **WHEN** the player moves onto row 0, a row farther north than the watermark
- **THEN** 10 points are awarded for the advance
- **AND** 50 points are awarded for the goal
- **AND** the score increases by 60 in total

#### Scenario: The bonus is awarded once per arrival

- **WHEN** the player enters row 0 and the sink beat runs to completion
- **THEN** the 50-point bonus is awarded exactly once
- **AND** no further points accrue while the beat is running

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
