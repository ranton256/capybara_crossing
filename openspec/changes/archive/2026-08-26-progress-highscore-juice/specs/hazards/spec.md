## MODIFIED Requirements

### Requirement: Constant-speed motion and wrap
The system SHALL advance each hazard horizontally each update by its base velocity multiplied by the session hazard speed factor (initially 1.0). Base ATV speed remains faster than base truck speed. When a hazard is fully past the destination edge, the system SHALL wrap it to the opposite edge so traffic remains continuous.

#### Scenario: Hazard advances over time
- **WHEN** an update runs with a positive elapsed time and freeze is off
- **THEN** each hazard's horizontal position SHALL change in its travel direction

#### Scenario: Wrap at the far edge
- **WHEN** a right-moving hazard's left edge is past the right board edge
- **THEN** the hazard SHALL reappear on the left side
- **AND** a left-moving hazard whose right edge is past the left board edge SHALL reappear on the right side

#### Scenario: Frozen motion for visual tests
- **WHEN** the game is booted with freeze requested
- **THEN** hazard positions SHALL remain at their spawn coordinates across updates

#### Scenario: Speed factor scales motion
- **WHEN** the session hazard speed factor is 1.10 and an update runs with freeze off
- **THEN** hazards SHALL advance 1.10 times as far as they would at factor 1.0 for the same elapsed time

## ADDED Requirements

### Requirement: Session restart resets speed factor
When a Game Over restart begins a fresh session, the hazard speed factor SHALL return to 1.0 and hazards SHALL use their initial base velocities at that factor.

#### Scenario: Restart restores base speed
- **WHEN** Enter or Space restarts after Game Over
- **THEN** the session hazard speed factor SHALL be 1.0
