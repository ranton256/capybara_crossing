# hazards Specification

## Purpose

Moves jungle vehicles across the two road lanes so the board has continuous traffic before collision exists.

## Requirements

### Requirement: Two-lane ATV and truck traffic
The system SHALL place moving hazards on both road rows of the existing board. Row 1 SHALL carry truck hazards traveling right. Row 3 SHALL carry ATV hazards traveling left. At least one truck and at least one ATV SHALL be present at session start. Truck hazards SHALL occupy two tile widths; ATV hazards SHALL occupy one tile width.

#### Scenario: Both road rows have traffic
- **WHEN** a play session starts
- **THEN** at least one truck SHALL occupy row 1
- **AND** at least one ATV SHALL occupy row 3

#### Scenario: Truck is two tiles wide
- **WHEN** a truck hazard is spawned
- **THEN** its width SHALL be two tile units

### Requirement: Constant-speed motion and wrap
The system SHALL advance each hazard horizontally each update by a hardcoded velocity (ATV faster than truck). When a hazard is fully past the destination edge, the system SHALL wrap it to the opposite edge so traffic remains continuous. The system SHALL NOT apply AABB collision, lives changes, or goal checks in this milestone.

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
