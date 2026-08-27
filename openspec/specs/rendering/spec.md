# rendering Specification

## Purpose

Draws the static 12×7 environment tile grid from the sprite atlas as the first layer of the canvas rendering pipeline, establishing board layout and painter’s-algorithm background order before entities and HUD.

## Requirements

### Requirement: Simplified default board layout
The system SHALL define a fixed twelve-column by seven-row board on the existing 576×336 canvas. Row 0 SHALL use spa tiles across all columns. Rows 1 and 3 SHALL use path tiles across all columns. Row 2 SHALL use median tiles across all columns. Rows 4, 5, and 6 SHALL use riverbank start tiles across all columns. The layout SHALL remain stable across frames until a later gameplay change modifies it.

#### Scenario: Spa row at top
- **WHEN** the default board layout is queried for row 0
- **THEN** every column in that row SHALL map to the spa tile type

#### Scenario: Two road lanes with one median
- **WHEN** the default board layout is queried for rows 1 through 3
- **THEN** row 1 SHALL map to path tiles, row 2 SHALL map to median tiles, and row 3 SHALL map to path tiles across all columns

#### Scenario: Extended riverbank at bottom
- **WHEN** the default board layout is queried for rows 4 through 6
- **THEN** every column in each of those rows SHALL map to the riverbank start tile type

### Requirement: Environment tiles drawn from sprite atlas
The system SHALL draw each board cell using the 128×128 sprite atlas and only the four environment tile frames: riverbank start, path, median, and spa. Each tile SHALL be drawn at its grid cell position scaled by the existing integer scale factor (three). The game SHALL NOT fetch `manifest.json` at runtime; source rectangles for the four tiles SHALL be available without network requests so opening from disk remains supported.

#### Scenario: All board cells blitted when atlas is ready
- **WHEN** the sprite atlas image has finished loading and a render cycle runs
- **THEN** the canvas SHALL show all eighty-four tile cells drawn from the atlas
- **AND** no runtime request SHALL be made for `manifest.json`

#### Scenario: Fallback until atlas loads
- **WHEN** a render cycle runs before the sprite atlas image has finished loading
- **THEN** the canvas SHALL still clear each frame
- **AND** tile drawing MAY be skipped until the atlas is ready

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
