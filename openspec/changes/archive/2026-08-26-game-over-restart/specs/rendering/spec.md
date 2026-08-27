## ADDED Requirements

### Requirement: Game Over overlay
While Game Over is active, the system SHALL draw overlay text including Game Over and the final score after world and HUD layers.

#### Scenario: Overlay shows final score
- **WHEN** Game Over is active and the render phase runs
- **THEN** the canvas SHALL show Game Over text
- **AND** the canvas SHALL show the final score
