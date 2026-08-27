## MODIFIED Requirements

### Requirement: Constant-speed motion and wrap
The system SHALL advance each hazard horizontally each update by a hardcoded velocity (ATV faster than truck). When a hazard is fully past the destination edge, the system SHALL wrap it to the opposite edge so traffic remains continuous.

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
