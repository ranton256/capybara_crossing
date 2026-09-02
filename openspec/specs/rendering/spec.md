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

### Requirement: Hazard sprites drawn between board and player

The system SHALL draw each hazard from the atlas at its current horizontal
position and lane row, scaled by the integer scale factor, after the environment
tiles and before the player sprite. Truck frames SHALL use a 32×16 source
rectangle and ATV frames a 16×16 one. Source rectangles SHALL be constants.

#### Scenario: Hazards drawn after tiles and before the player

- **WHEN** the render phase runs with a decoded atlas and hazards present
- **THEN** environment tiles SHALL be drawn first
- **AND** hazards SHALL be drawn after them
- **AND** the player sprite SHALL be drawn after the hazards

#### Scenario: Hazard drawn at its lane row and horizontal position

- **WHEN** a hazard at horizontal position X on row R is drawn
- **THEN** its destination rectangle SHALL start at x = X × 48 and y = R × 48
- **AND** its destination width SHALL be its tile width × 48

### Requirement: Right-moving vehicles are mirrored

All supplied vehicle art faces left. The system SHALL draw a right-moving hazard
mirrored horizontally so it faces its direction of travel, and SHALL restore the
drawing state afterwards so later layers are unaffected.

#### Scenario: Right-moving hazard is flipped

- **WHEN** a hazard travelling right is drawn
- **THEN** the sprite SHALL be mirrored horizontally

#### Scenario: Left-moving hazard is not flipped

- **WHEN** a hazard travelling left is drawn
- **THEN** the sprite SHALL be drawn unmirrored

#### Scenario: Drawing state is restored

- **WHEN** a mirrored hazard has been drawn
- **THEN** the canvas transform SHALL be restored before the player is drawn

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

### Requirement: Sinking capybara stays visible on the spa

While the sink beat is active, the system SHALL keep drawing the capybara on row
0 using an existing atlas frame, with a small downward draw offset so it reads as
settling into the mud. No dedicated sink frames are required.

#### Scenario: The sinking capybara is drawn on the spa row

- **WHEN** the sink beat is active and the render phase runs
- **THEN** the player sprite SHALL be drawn on row 0
- **AND** its destination y SHALL be offset downward from the plain row 0
  position

#### Scenario: The offset ends with the beat

- **WHEN** the sink beat has completed
- **THEN** the player SHALL be drawn with no sink offset

### Requirement: Game over overlay

While the session is game over, the system SHALL draw an overlay after every
other layer, showing that the run has ended, the final score, and a restart hint
naming both Enter and Space.

#### Scenario: Overlay reports the outcome and the way out

- **WHEN** the session is game over and the render phase runs
- **THEN** the overlay SHALL show that the run has ended
- **AND** it SHALL show the final score
- **AND** it SHALL show a hint naming Enter and Space

#### Scenario: Overlay is drawn last

- **WHEN** the session is game over and the render phase runs
- **THEN** the overlay SHALL be drawn after the tiles, hazards, player, and HUD

#### Scenario: No overlay during normal play

- **WHEN** the session is not game over
- **THEN** no game-over overlay SHALL be drawn
