## MODIFIED Requirements

### Requirement: Background layer draw order
The system SHALL draw static environment tiles immediately after clearing the canvas and before any player sprites, hazard entities, or HUD text.

#### Scenario: Tiles drawn after clear
- **WHEN** the render phase executes with a loaded atlas
- **THEN** the canvas SHALL be cleared first
- **AND** environment tiles SHALL be drawn before any other visible game layers

#### Scenario: No player or HUD in this milestone
- **WHEN** the render phase executes in this milestone
- **THEN** the canvas SHALL show hazard sprites, the player sprite, and score HUD after tiles
- **AND** the canvas SHALL NOT show a lives counter

#### Scenario: Player and score after tiles
- **WHEN** the render phase executes with a loaded atlas and an active player
- **THEN** hazard sprites SHALL be drawn after environment tiles
- **AND** the player sprite SHALL be drawn after hazards
- **AND** the score HUD SHALL be drawn after the player sprite
- **AND** a lives counter SHALL NOT be drawn in this milestone

## ADDED Requirements

### Requirement: Hazard sprites drawn from atlas
The system SHALL draw each hazard using a hardcoded atlas frame at its current horizontal position and lane row, scaled by the existing integer scale factor (three). Truck frames SHALL use a 32×16 source rectangle. Source rectangles SHALL be hardcoded (no runtime `manifest.json` fetch). Right-moving hazards MAY be drawn flipped so the sprite faces its travel direction.

#### Scenario: Hazards blit after tiles
- **WHEN** the atlas is loaded and hazards exist
- **THEN** each hazard SHALL be drawn at its lane row and current x
- **AND** no runtime request SHALL be made for `manifest.json`
