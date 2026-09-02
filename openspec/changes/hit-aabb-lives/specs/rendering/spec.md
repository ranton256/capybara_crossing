## ADDED Requirements

### Requirement: Defeat pose during the death beat

While the death beat is active, the system SHALL draw the defeat atlas frame at
the impact cell instead of the facing walk frame.

#### Scenario: Defeat frame replaces the walk frame

- **WHEN** the death beat is active and the render phase runs
- **THEN** the defeat frame SHALL be drawn at the impact cell
- **AND** no walk frame SHALL be drawn for the player that frame

### Requirement: Screen flash on a hit

When a collision costs a life, the system SHALL draw a brief full-canvas flash
after the world layers and before the HUD, so the score and lives stay readable
through it.

#### Scenario: Flash covers the playfield under the HUD

- **WHEN** a collision has just been registered and the flash window is active
- **THEN** a flash overlay SHALL be drawn over the playfield
- **AND** the HUD SHALL be drawn after that overlay

#### Scenario: The flash ends

- **WHEN** the flash window has elapsed
- **THEN** no flash overlay SHALL be drawn

### Requirement: Lives shown in the HUD

The system SHALL show the remaining life count in the HUD alongside the score.

#### Scenario: HUD reports lives

- **WHEN** the render phase runs
- **THEN** the HUD SHALL include the remaining life count
