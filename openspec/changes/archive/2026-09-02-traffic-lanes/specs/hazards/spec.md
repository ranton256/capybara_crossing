## Purpose

Keeps jungle vehicles moving across the two road rows so the crossing has
continuous traffic to time a run against.

## ADDED Requirements

### Requirement: Two lanes of traffic

The system SHALL place moving hazards on both road rows. Row 1 SHALL carry
trucks travelling right; row 3 SHALL carry ATVs travelling left. At least one
truck and at least one ATV SHALL exist when a session starts. A truck SHALL
occupy two tile widths and an ATV SHALL occupy one.

#### Scenario: Both road rows carry traffic

- **WHEN** a play session starts
- **THEN** at least one truck SHALL occupy row 1
- **AND** at least one ATV SHALL occupy row 3

#### Scenario: Vehicle widths

- **WHEN** hazards are spawned
- **THEN** each truck SHALL be two tile units wide
- **AND** each ATV SHALL be one tile unit wide

#### Scenario: Lanes travel in opposite directions

- **WHEN** hazards are spawned
- **THEN** row 1 hazards SHALL travel right
- **AND** row 3 hazards SHALL travel left

### Requirement: Constant speed scaled by elapsed time

The system SHALL advance each hazard horizontally by its velocity multiplied by
the elapsed time of the update, expressed in tiles per second, so that distance
travelled per second does not depend on the frame rate. ATVs SHALL travel faster
than trucks.

#### Scenario: Hazards advance over time

- **WHEN** an update runs with a positive elapsed time and freeze is off
- **THEN** each hazard's horizontal position SHALL change in its direction of
  travel

#### Scenario: Frame rate does not change speed

- **WHEN** one update of 32 milliseconds and two updates of 16 milliseconds are
  each applied to an identical hazard
- **THEN** both hazards SHALL end at the same horizontal position

#### Scenario: ATVs outpace trucks

- **WHEN** the same elapsed time is applied to an ATV and a truck
- **THEN** the ATV SHALL cover more distance than the truck

### Requirement: Wrapping keeps traffic continuous

The system SHALL move a hazard to the opposite edge once it has travelled fully
past the edge it was heading for, so each lane always has traffic.

#### Scenario: Right-moving hazard wraps

- **WHEN** a right-moving hazard's trailing edge passes the right board edge
- **THEN** it SHALL reappear beyond the left edge and continue travelling right

#### Scenario: Left-moving hazard wraps

- **WHEN** a left-moving hazard's trailing edge passes the left board edge
- **THEN** it SHALL reappear beyond the right edge and continue travelling left

#### Scenario: Wrapping preserves spacing

- **WHEN** a hazard wraps
- **THEN** its position SHALL shift by the full wrap period rather than being
  reset to a fixed edge coordinate, so lane spacing is preserved

### Requirement: Freeze holds traffic still

The system SHALL leave hazard positions unchanged during an update when the
freeze flag is set.

#### Scenario: Frozen hazards do not move

- **WHEN** an update runs with a positive elapsed time and freeze is set
- **THEN** every hazard SHALL remain at its previous position
