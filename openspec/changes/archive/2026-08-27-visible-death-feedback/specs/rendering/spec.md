## MODIFIED Requirements

### Requirement: Defeat pose after a hit
While the post-hit Zzz pose is active, the system SHALL draw the existing defeat atlas frame for the player instead of the facing walk frame, except on flicker-off frames during the death beat when the player sprite SHALL be omitted. During a mid-run death beat and while Game Over was entered from a hit, that pose SHALL be drawn at the impact cell (not at the start cell) until the death beat ends or the session restarts.

#### Scenario: Defeat frame while posed
- **WHEN** the player is in the Zzz/defeat pose on the impact cell on a flicker-on frame and the render phase runs
- **THEN** the defeat frame SHALL be drawn at that impact cell

#### Scenario: Defeat sprite omitted on flicker-off
- **WHEN** the death beat is active on a flicker-off frame and the render phase runs
- **THEN** the player sprite SHALL NOT be drawn for that frame

## ADDED Requirements

### Requirement: Screen flash on hit
When a collision costs a life, the system SHALL draw a brief full-canvas flash overlay after world layers (tiles, hazards, player) and before the HUD, so Score, Lives, and Best remain readable. The flash SHALL end within a short window after the hit (on the order of ~100ms).

#### Scenario: Flash visible under HUD after a hit
- **WHEN** a collision has just been registered and the flash window is still active
- **THEN** the canvas SHALL show a flash overlay covering the playfield
- **AND** the HUD text SHALL still be drawn after that overlay
