## ADDED Requirements

### Requirement: Hazard sprites drawn between board and player

The system SHALL draw each hazard from the atlas at its current horizontal
position and lane row, scaled by the integer scale factor, after the environment
tiles and before the player sprite. Truck frames SHALL use a 32×16 source
rectangle and ATV frames a 16×16 one. Source rectangles SHALL be constants.

#### Scenario: Hazards drawn after tiles and before the player

- **WHEN** the render phase runs with a decoded atlas and hazards present
- **THEN** environment tiles SHALL be drawn first
- **AND** hazards SHALL be drawn after them
- **AND** the player sprite SHALL be drawn after the hazards

#### Scenario: Hazard drawn at its lane row and horizontal position

- **WHEN** a hazard at horizontal position X on row R is drawn
- **THEN** its destination rectangle SHALL start at x = X × 48 and y = R × 48
- **AND** its destination width SHALL be its tile width × 48

### Requirement: Right-moving vehicles are mirrored

All supplied vehicle art faces left. The system SHALL draw a right-moving hazard
mirrored horizontally so it faces its direction of travel, and SHALL restore the
drawing state afterwards so later layers are unaffected.

#### Scenario: Right-moving hazard is flipped

- **WHEN** a hazard travelling right is drawn
- **THEN** the sprite SHALL be mirrored horizontally

#### Scenario: Left-moving hazard is not flipped

- **WHEN** a hazard travelling left is drawn
- **THEN** the sprite SHALL be drawn unmirrored

#### Scenario: Drawing state is restored

- **WHEN** a mirrored hazard has been drawn
- **THEN** the canvas transform SHALL be restored before the player is drawn
