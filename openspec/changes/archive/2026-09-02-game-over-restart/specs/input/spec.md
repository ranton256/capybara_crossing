## ADDED Requirements

### Requirement: Restart keys while game over

While the session is game over, the system SHALL treat Enter or Space as a
request to start a new run, and SHALL NOT move the player in response to arrow
keys.

#### Scenario: Enter starts a new run

- **WHEN** the session is game over and Enter is pressed
- **THEN** a new run SHALL begin on the next update

#### Scenario: Space starts a new run

- **WHEN** the session is game over and Space is pressed
- **THEN** a new run SHALL begin on the next update

#### Scenario: Arrow keys do not move the player while game over

- **WHEN** the session is game over and an arrow key is pressed
- **THEN** the player position SHALL NOT change

#### Scenario: Restart keys do nothing during normal play

- **WHEN** the session is not game over and Enter or Space is pressed
- **THEN** the run SHALL continue unchanged
