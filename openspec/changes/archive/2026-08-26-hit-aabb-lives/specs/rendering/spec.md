## MODIFIED Requirements

### Requirement: Background layer draw order
The system SHALL draw static environment tiles immediately after clearing the canvas and before any player sprites, hazard entities, or HUD text.

#### Scenario: Tiles drawn after clear
- **WHEN** the render phase executes with a loaded atlas
- **THEN** the canvas SHALL be cleared first
- **AND** environment tiles SHALL be drawn before any other visible game layers

#### Scenario: No player or HUD in this milestone
- **WHEN** the render phase executes in this milestone
- **THEN** the canvas SHALL show hazard sprites, the player sprite, and HUD after tiles
- **AND** the canvas SHALL NOT show a Game Over overlay

#### Scenario: Player and score after tiles
- **WHEN** the render phase executes with a loaded atlas and an active player
- **THEN** hazard sprites SHALL be drawn after environment tiles
- **AND** the player sprite SHALL be drawn after hazards
- **AND** the HUD SHALL be drawn after the player sprite

### Requirement: Score HUD on top
The system SHALL render the current score and remaining lives as text on the canvas after tiles, hazards, and the player sprite so the HUD remains readable above gameplay pixels.

#### Scenario: Score text visible after hops
- **WHEN** the score is greater than zero and the render phase runs
- **THEN** the canvas SHALL show the current score value in the HUD layer
- **AND** that text SHALL be drawn after the player sprite

#### Scenario: Lives shown in HUD
- **WHEN** the render phase runs with a numeric lives counter
- **THEN** the HUD SHALL include the remaining life count

## ADDED Requirements

### Requirement: Defeat pose after a hit
While the post-hit Zzz pose is active, the system SHALL draw the existing defeat atlas frame for the player instead of the facing walk frame.

#### Scenario: Defeat frame while posed
- **WHEN** the player is in the Zzz/defeat pose and the render phase runs
- **THEN** the defeat frame SHALL be drawn at the player's current cell
