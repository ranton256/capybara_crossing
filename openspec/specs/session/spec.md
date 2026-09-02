# session Specification

## Purpose
Runs the round loop: notices when the capybara reaches the mud spa, plays the
sink beat, and starts the next approach without losing score or lives.

## Requirements

### Requirement: The whole top row is the goal

The system SHALL treat every cell of row 0 as the mud spa. There SHALL be no
separate goal bays and no occupancy state; arriving on row 0 in any column
SHALL count as reaching the goal.

#### Scenario: Any column of the top row scores the goal

- **WHEN** the player arrives on row 0 in any column
- **THEN** the goal SHALL be reached

### Requirement: Reaching the spa awards a bonus and starts a sink beat

When the player arrives on row 0, the system SHALL add 50 points to the score and
begin a sink beat. The forward-progress award for the hop that entered row 0
SHALL still apply. During the sink beat the system SHALL ignore movement input
and SHALL keep hazards moving. The goal SHALL be awarded once per arrival, not
once per frame spent on row 0.

#### Scenario: Entering the spa from row 1 pays sixty

- **WHEN** the player hops Up from row 1 onto row 0 with a score of 0
- **THEN** the score SHALL be 60, being 10 for the forward hop and 50 for the spa

#### Scenario: The bonus is not paid repeatedly

- **WHEN** further updates run while the sink beat is active
- **THEN** the score SHALL NOT increase again for the same arrival

#### Scenario: Movement is ignored while sinking

- **WHEN** the sink beat is active and a directional key is pressed
- **THEN** the player position SHALL NOT change

#### Scenario: Traffic keeps moving while sinking

- **WHEN** the sink beat is active and an update runs with freeze off
- **THEN** hazard positions SHALL continue to change

### Requirement: The next round starts at the beginning

When the sink beat ends, the system SHALL place a fresh capybara at column 6, row
6, facing up, and SHALL reset the farthest-north watermark to the spawn row. The
score and the life count SHALL carry over unchanged.

#### Scenario: A fresh capybara starts the next round

- **WHEN** the sink beat completes
- **THEN** the player SHALL be at column 6 and row 6
- **AND** the score SHALL still include the spa bonus
- **AND** the life count SHALL be unchanged

#### Scenario: The next climb can score again

- **WHEN** the sink beat completes and the player hops Up
- **THEN** the score SHALL increase by 10

### Requirement: Restart begins a completely fresh run

When a restart is requested while game over, the system SHALL reset the score to
0, the life count to the starting number, the player to the spawn cell facing up,
the farthest-north watermark to the spawn row, and every hazard to its starting
position and velocity. All beat timers and the game-over state SHALL be cleared.

#### Scenario: A restart clears score and lives

- **WHEN** a restart is applied after game over
- **THEN** the score SHALL be 0
- **AND** the life count SHALL be the starting number
- **AND** the session SHALL no longer be game over

#### Scenario: A restart returns the capybara and the traffic to their starts

- **WHEN** a restart is applied after game over
- **THEN** the player SHALL be at the spawn cell facing up
- **AND** every hazard SHALL be back at its starting position

#### Scenario: A restart clears pending beats

- **WHEN** a restart is applied after game over
- **THEN** no death, flash, or sink beat SHALL be active

### Requirement: Traffic holds still while game over

The system SHALL NOT advance hazards while the session is game over, so the
final scene stays readable beneath the overlay.

#### Scenario: Hazards do not move after the run ends

- **WHEN** an update runs while the session is game over
- **THEN** hazard positions SHALL be unchanged
