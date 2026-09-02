# rendering Specification

## Purpose
Draws the static environment tile grid from the sprite atlas as the first visible
layer of the render pipeline, establishing the board layout and the
painter's-algorithm ordering that later entity and HUD layers build on.

## Requirements

### Requirement: Fixed board layout

The system SHALL define a board of 12 columns by 7 rows. Row 0 SHALL be spa
tiles, rows 1 and 3 SHALL be road tiles, row 2 SHALL be median tiles, and rows 4
through 6 SHALL be riverbank tiles, each across all 12 columns. The layout SHALL
be identical on every frame.

#### Scenario: Spa row at the top

- **WHEN** the board layout is queried for row 0
- **THEN** every column in that row SHALL be the spa tile

#### Scenario: Two road rows separated by a median

- **WHEN** the board layout is queried for rows 1 through 3
- **THEN** row 1 SHALL be road tiles, row 2 SHALL be median tiles, and row 3
  SHALL be road tiles, across all columns

#### Scenario: Riverbank at the bottom

- **WHEN** the board layout is queried for rows 4 through 6
- **THEN** every column in each of those rows SHALL be the riverbank tile

### Requirement: Tiles drawn from the sprite atlas

The system SHALL draw each of the 84 board cells from the 128×128 sprite atlas,
using only the four environment tile frames, each at its grid position scaled by
the integer scale factor. The system SHALL obtain the atlas through an image
element and SHALL NOT request `manifest.json` at runtime; tile source rectangles
SHALL be available without any network request.

#### Scenario: Every cell blitted once the atlas is ready

- **WHEN** the atlas image has decoded and a render cycle runs
- **THEN** all 84 board cells SHALL be drawn from the atlas
- **AND** no runtime request SHALL be made for `manifest.json`

#### Scenario: Tiles land on the grid at scale

- **WHEN** a cell at column C row R is drawn
- **THEN** its destination rectangle SHALL be 48 by 48 pixels at x = C × 48 and
  y = R × 48

#### Scenario: Rendering is safe before the atlas decodes

- **WHEN** a render cycle runs before the atlas image has decoded
- **THEN** the canvas SHALL still be cleared for that frame
- **AND** tile drawing SHALL be skipped without raising an error

### Requirement: Background drawn before all other layers

The system SHALL draw environment tiles immediately after clearing the canvas and
before any other visible layer, so later entity and HUD layers paint over the
background rather than under it.

#### Scenario: Clear precedes tiles

- **WHEN** the render phase executes with a decoded atlas
- **THEN** the drawing surface SHALL be cleared first
- **AND** the environment tiles SHALL be drawn after that clear, before any
  other game layer

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
