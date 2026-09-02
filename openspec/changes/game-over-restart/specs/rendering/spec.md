## ADDED Requirements

### Requirement: Game over overlay

While the session is game over, the system SHALL draw an overlay after every
other layer, showing that the run has ended, the final score, and a restart hint
naming both Enter and Space.

#### Scenario: Overlay reports the outcome and the way out

- **WHEN** the session is game over and the render phase runs
- **THEN** the overlay SHALL show that the run has ended
- **AND** it SHALL show the final score
- **AND** it SHALL show a hint naming Enter and Space

#### Scenario: Overlay is drawn last

- **WHEN** the session is game over and the render phase runs
- **THEN** the overlay SHALL be drawn after the tiles, hazards, player, and HUD

#### Scenario: No overlay during normal play

- **WHEN** the session is not game over
- **THEN** no game-over overlay SHALL be drawn
