## ADDED Requirements

### Requirement: Unit tests cover truck-width AABB hits
The project's Node unit suite SHALL include a case where `resolveCollisions` (or equivalent collision resolution invoked from tests) registers a hit when the player box overlaps a hazard whose stored width is two tiles, decrementing lives and respawning the player.

#### Scenario: Truck overlap counts as a hit
- **WHEN** the unit suite runs a collision case with a two-tile-wide hazard overlapping the player
- **THEN** the test SHALL assert a hit was registered
- **AND** lives SHALL decrease by 1
- **AND** the player SHALL be at the start cell

### Requirement: Unit tests cover Space restart and hazard reset
The Node unit suite SHALL assert that while Game Over is active, Space requests a restart that restores lives, score, start position, and the initial hazard layout. Enter restart coverage MAY already exist; Space SHALL be covered explicitly.

#### Scenario: Space restarts and resets hazards
- **WHEN** Game Over is active and Space is pressed, then the next update runs
- **THEN** the test SHALL assert lives are 3, score is 0, the player is at the start cell
- **AND** hazards SHALL match the initial spawn layout (positions and velocities)

### Requirement: Unit tests cover Game Over freezing hazards
The Node unit suite SHALL assert that while Game Over is active, an update with positive elapsed time leaves hazard positions unchanged.

#### Scenario: Hazards do not move during Game Over
- **WHEN** Game Over is active, hazards have non-zero velocity, and update runs with a positive delta
- **THEN** each hazard's horizontal position SHALL remain unchanged

### Requirement: Unit tests cover rejected Up hop scoring
The Node unit suite SHALL assert that an outward Up hop at the top edge leaves score and position unchanged.

#### Scenario: Out-of-bounds Up does not award points
- **WHEN** the player is on row 0 and Up is applied through hop (or update with pending Up)
- **THEN** the player SHALL remain on row 0
- **AND** the score SHALL not increase

### Requirement: Unit tests cover update-phase integration
The Node unit suite SHALL include at least one test that drives `update` through hop application, hazard motion, and either collision response or spa goal resolution in a single call (or sequenced calls on one state object), asserting the combined outcome—not only isolated helpers.

#### Scenario: Update applies hop then collision or goal
- **WHEN** a unit test configures pending input and overlapping traffic or a spa entry, then calls update
- **THEN** the test SHALL assert the post-update player, score, and/or lives reflect the integrated path
