## ADDED Requirements

### Requirement: Player sprite drawn from the atlas

The system SHALL draw the player as a 16×16 atlas frame at the player's grid
cell, scaled by the integer scale factor, using the walk frame pair matching the
player's facing direction. The two frames of that pair SHALL alternate on each
successful hop so movement reads as a waddle. Source rectangles SHALL be
constants; nothing SHALL be requested at runtime.

#### Scenario: Player drawn at its grid cell

- **WHEN** the atlas has decoded and the render phase runs
- **THEN** a capybara frame SHALL be drawn at the player's cell, 48 by 48 pixels

#### Scenario: Frame matches facing

- **WHEN** the player faces left and the render phase runs
- **THEN** the drawn frame SHALL be one of the two left-facing walk frames

#### Scenario: Walk frame alternates on each hop

- **WHEN** the player completes two successive accepted hops
- **THEN** the frame drawn after the second hop SHALL be the other frame of the
  pair for that facing

### Requirement: Player drawn above the background

The system SHALL draw the player after the environment tiles, so the capybara
appears on top of the board rather than beneath it.

#### Scenario: Player drawn after tiles

- **WHEN** the render phase runs with a decoded atlas and an active player
- **THEN** environment tiles SHALL be drawn first
- **AND** the player sprite SHALL be drawn after them

### Requirement: Score HUD drawn on top

The system SHALL draw the current score as text after every other layer, so it
stays readable above the game pixels.

#### Scenario: Score visible above the board

- **WHEN** the render phase runs
- **THEN** the HUD SHALL show the current score
- **AND** it SHALL be drawn after the tiles and the player sprite
