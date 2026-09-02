## ADDED Requirements

### Requirement: Sinking capybara stays visible on the spa

While the sink beat is active, the system SHALL keep drawing the capybara on row
0 using an existing atlas frame, with a small downward draw offset so it reads as
settling into the mud. No dedicated sink frames are required.

#### Scenario: The sinking capybara is drawn on the spa row

- **WHEN** the sink beat is active and the render phase runs
- **THEN** the player sprite SHALL be drawn on row 0
- **AND** its destination y SHALL be offset downward from the plain row 0
  position

#### Scenario: The offset ends with the beat

- **WHEN** the sink beat has completed
- **THEN** the player SHALL be drawn with no sink offset
