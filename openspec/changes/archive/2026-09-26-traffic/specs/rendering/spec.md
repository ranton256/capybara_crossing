## ADDED Requirements

### Requirement: Hazards are drawn in their lanes above the board and below the player

Hazards SHALL be drawn after all board tiles and before the player sprite. Each
SHALL be drawn at its lane row, at its own width, from its atlas rectangle.

#### Scenario: Layer position

- **WHEN** a frame is rendered
- **THEN** every hazard is drawn after the last board tile
- **AND** before the player sprite

#### Scenario: Each hazard is drawn once per frame

- **WHEN** a frame is rendered
- **THEN** each hazard in the lanes is drawn exactly once

#### Scenario: A hazard is drawn at its own width

- **WHEN** a 2-tile-wide hazard is drawn
- **THEN** its drawn width is two tiles
- **AND** its source rectangle is that sprite's full recorded width

### Requirement: Right-moving hazards are drawn mirrored

All vehicle art in the atlas faces left. A hazard whose speed is rightward SHALL
be drawn horizontally mirrored so that it faces its direction of travel. A
leftward hazard SHALL be drawn unmirrored.

#### Scenario: A rightward hazard is mirrored

- **WHEN** a hazard travelling rightward is drawn
- **THEN** it is drawn horizontally flipped
- **AND** it occupies the same board position it would have occupied unflipped

#### Scenario: A leftward hazard is not mirrored

- **WHEN** a hazard travelling leftward is drawn
- **THEN** it is drawn without horizontal flipping

#### Scenario: Mirroring does not leak into later drawing

- **WHEN** a mirrored hazard has been drawn and the player is drawn afterwards
- **THEN** the player is not mirrored

### Requirement: Hazards are snapped to whole pixels when drawn

A hazard's continuous position SHALL be snapped to a whole device pixel at draw
time. The snapping SHALL NOT alter the position held in game state.

#### Scenario: A fractional position is snapped

- **WHEN** a hazard at a fractional tile position is drawn
- **THEN** its destination lands on a whole device pixel

#### Scenario: Drawing does not alter game state

- **WHEN** a frame containing hazards is rendered
- **THEN** every hazard's stored position is unchanged by drawing

#### Scenario: Snapping keeps motion monotonic

- **GIVEN** a hazard advancing in one direction across several frames
- **WHEN** each frame is drawn
- **THEN** the snapped destination never moves against the direction of travel
