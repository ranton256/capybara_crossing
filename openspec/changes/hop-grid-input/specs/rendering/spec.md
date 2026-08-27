## MODIFIED Requirements

### Requirement: Background layer draw order
The system SHALL draw static environment tiles immediately after clearing the canvas and before any player sprites, hazard entities, or HUD text.

#### Scenario: Tiles drawn after clear
- **WHEN** the render phase executes with a loaded atlas
- **THEN** the canvas SHALL be cleared first
- **AND** environment tiles SHALL be drawn before any other visible game layers

#### Scenario: No player or HUD in this milestone
- **WHEN** the render phase executes in this milestone
- **THEN** the canvas SHALL show the player sprite and score HUD after tiles
- **AND** the canvas SHALL NOT show moving hazards or a lives counter

#### Scenario: Player and score after tiles
- **WHEN** the render phase executes with a loaded atlas and an active player
- **THEN** the player sprite SHALL be drawn after environment tiles
- **AND** the score HUD SHALL be drawn after the player sprite
- **AND** hazard entities and a lives counter SHALL NOT be drawn in this milestone

## ADDED Requirements

### Requirement: Player sprite drawn from atlas
The system SHALL draw the player as a single 16×16 atlas frame at the player's current grid cell, scaled by the existing integer scale factor (three). Source rectangles for player frames SHALL be hardcoded (no runtime `manifest.json` fetch). The drawn frame SHALL match the player's facing direction using an existing capybara frame for that direction.

#### Scenario: Player blit at grid cell
- **WHEN** the atlas is loaded and the render phase runs with the player at a grid cell
- **THEN** a capybara frame SHALL be drawn at that cell's scaled destination rectangle
- **AND** no runtime request SHALL be made for `manifest.json`

### Requirement: Score HUD on top
The system SHALL render the current score as text on the canvas after tiles and the player sprite so it remains readable above gameplay pixels.

#### Scenario: Score text visible after hops
- **WHEN** the score is greater than zero and the render phase runs
- **THEN** the canvas SHALL show the current score value in the HUD layer
- **AND** that text SHALL be drawn after the player sprite
