## ADDED Requirements

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
