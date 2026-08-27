## ADDED Requirements

### Requirement: Player drawn on spa during sink
While the sink beat is active, the system SHALL keep drawing the player sprite on the spa row using an existing capybara frame (no dedicated sink frames).

#### Scenario: Sinking player remains visible
- **WHEN** the sink beat is active and the render phase runs
- **THEN** the player sprite SHALL be drawn on row 0
