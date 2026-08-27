## ADDED Requirements

### Requirement: Restart keys while Game Over
While Game Over is active, Arrow keys SHALL NOT hop. Enter or Space SHALL request a restart.

#### Scenario: Arrow ignored during Game Over
- **WHEN** Game Over is active and an arrow key is pressed
- **THEN** the player position SHALL not change from a hop

#### Scenario: Enter queues restart
- **WHEN** Game Over is active and Enter is pressed
- **THEN** the session SHALL restart on the next update
