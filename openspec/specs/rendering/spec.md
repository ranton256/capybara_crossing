## Purpose

Defines how each frame is drawn to the canvas: the pixel-art scaling that keeps the
16x16 artwork crisp, the clearing that prevents ghosting, the mapping of board rows to
tile art, and the layer order that keeps the board readable.

## Requirements

### Requirement: Crisp pixel-art presentation

The canvas SHALL present the 16x16 artwork at integer scale with image smoothing
disabled, so that pixel edges remain hard and no interpolation blurs the sprites.

#### Scenario: Smoothing is off

- **WHEN** the rendering context is prepared
- **THEN** image smoothing is disabled on the context
- **AND** the canvas element's CSS specifies pixelated image rendering

#### Scenario: Scale stays integral

- **WHEN** the board is drawn
- **THEN** each 16x16 source tile covers exactly 48x48 canvas pixels
- **AND** every sprite is drawn at a whole-pixel destination coordinate

### Requirement: Each frame clears the previous one

The render phase SHALL clear the entire canvas before drawing, so that no remnant of
the previous frame remains visible.

#### Scenario: No ghosting between frames

- **WHEN** a render cycle begins
- **THEN** the full drawing area is cleared before any sprite is drawn
- **AND** no artifact from the preceding frame is visible in the completed frame

### Requirement: Board rows are drawn from their assigned tiles

Every tile of the board SHALL be drawn from the atlas according to its row's fixed
role: row 0 from `tile_spa`, rows 1 and 3 from `tile_path`, row 2 from `tile_median`,
and rows 4 through 6 from `tile_start`.

#### Scenario: Row roles map to tile art

- **WHEN** the background is drawn
- **THEN** all 12 tiles of row 0 use the spa tile
- **AND** all 12 tiles of rows 1 and 3 use the path tile
- **AND** all 12 tiles of row 2 use the median tile
- **AND** all 12 tiles of rows 4, 5, and 6 use the riverbank tile

#### Scenario: Exactly one road row per lane

- **WHEN** the board is drawn
- **THEN** row 1 and row 3 are each a single row of road tiles
- **AND** the road shoulders baked into the top and bottom edges of the path tile meet
  the neighbouring rows without a second road row between them

#### Scenario: The riverbank grass band repeats

- **WHEN** rows 4 through 6 are drawn
- **THEN** the riverbank tile is drawn unmodified in each of the three rows
- **AND** its grass band appears once per row, producing a banded riverbank

### Requirement: Layers are drawn back to front

Drawing SHALL follow painter's order: background tiles first, then moving entities and
the player, then the heads-up display. Nothing drawn earlier SHALL obscure anything
drawn later.

#### Scenario: Player draws over the board

- **WHEN** a frame is rendered
- **THEN** the background tiles are drawn before the player sprite
- **AND** the player sprite is fully visible over the tile it occupies

#### Scenario: The display layer is topmost

- **WHEN** a frame is rendered
- **THEN** any heads-up display content is drawn after all board and entity content

### Requirement: Sprites are drawn from atlas rectangles

Sprites SHALL be drawn by copying a source rectangle from the single atlas image.
Source rectangles SHALL be declared as constants in the script and SHALL match the
rectangles recorded in `assets/sprites/manifest.json`.

#### Scenario: The player is drawn from its atlas frame

- **WHEN** the player is drawn while facing up
- **THEN** the source rectangle used is the one recorded for the corresponding
  upward-facing capybara frame
- **AND** the destination is the canvas region of the tile the player occupies

#### Scenario: Declared rectangles match the manifest

- **WHEN** the sprite rectangle constants are compared against
  `assets/sprites/manifest.json`
- **THEN** every declared rectangle matches that frame's recorded position and size

### Requirement: The heads-up display shows score and lives

The heads-up display SHALL draw the current score and the remaining lives as text
over row 0, score at the left and lives at the right. It SHALL be drawn after all
board and entity content. Its values SHALL be read from game state rather than
tracked separately by the renderer.

#### Scenario: Both readings are drawn

- **WHEN** a frame is rendered
- **THEN** the current score is drawn at the left of row 0
- **AND** the remaining lives are drawn at the right of row 0

#### Scenario: The display is drawn last

- **WHEN** a frame is rendered
- **THEN** the heads-up display is drawn after every board tile and every sprite

#### Scenario: The display follows the score

- **GIVEN** the player's score changes between two frames
- **WHEN** the second frame is rendered
- **THEN** the drawn score is the new value

#### Scenario: The display does not alter game state

- **WHEN** a frame is rendered
- **THEN** the score, lives, player position, and game state are unchanged by drawing

### Requirement: A sinking capybara is drawn descending into the goal tile

While the game is in its sinking state, the player SHALL be drawn with its upper
edge descending toward a fixed lower line across the beat, and the part of the
sprite below that line SHALL NOT be drawn. At the start of the beat the whole
sprite SHALL be visible; by the end of it none of the sprite SHALL be visible.

#### Scenario: The full sprite is visible as the beat begins

- **WHEN** the sinking beat has just begun
- **THEN** the drawn source height is the full tile height

#### Scenario: The sprite is progressively hidden as the beat runs

- **GIVEN** two moments during the beat, the second later than the first
- **WHEN** each is drawn
- **THEN** the later frame draws a smaller source height than the earlier one
- **AND** the later frame's destination is farther down the tile

#### Scenario: The bottom edge stays fixed

- **WHEN** any moment of the beat is drawn
- **THEN** the sum of the destination offset and the drawn height is unchanged
- **AND** nothing is drawn below the tile's lower line

#### Scenario: Nothing is drawn once the beat completes

- **WHEN** the beat has run its full duration
- **THEN** the player sprite is not drawn

#### Scenario: The player is drawn normally while not sinking

- **WHEN** the game is playing and a frame is rendered
- **THEN** the player is drawn at full tile height with no vertical offset

### Requirement: Hazards are drawn in their lanes above the board and below the player

Hazards SHALL be drawn after all board tiles and before the player sprite. Each
SHALL be drawn at its lane row, at its own width, from its atlas rectangle.

#### Scenario: Layer position

- **WHEN** a frame is rendered
- **THEN** every hazard is drawn after the last board tile
- **AND** before the player sprite

#### Scenario: Each hazard is drawn once per frame

- **WHEN** a frame is rendered
- **THEN** each hazard in the lanes is drawn exactly once

#### Scenario: A hazard is drawn at its own width

- **WHEN** a 2-tile-wide hazard is drawn
- **THEN** its drawn width is two tiles
- **AND** its source rectangle is that sprite's full recorded width

### Requirement: Right-moving hazards are drawn mirrored

All vehicle art in the atlas faces left. A hazard whose speed is rightward SHALL
be drawn horizontally mirrored so that it faces its direction of travel. A
leftward hazard SHALL be drawn unmirrored.

#### Scenario: A rightward hazard is mirrored

- **WHEN** a hazard travelling rightward is drawn
- **THEN** it is drawn horizontally flipped
- **AND** it occupies the same board position it would have occupied unflipped

#### Scenario: A leftward hazard is not mirrored

- **WHEN** a hazard travelling leftward is drawn
- **THEN** it is drawn without horizontal flipping

#### Scenario: Mirroring does not leak into later drawing

- **WHEN** a mirrored hazard has been drawn and the player is drawn afterwards
- **THEN** the player is not mirrored

### Requirement: Hazards are snapped to whole pixels when drawn

A hazard's continuous position SHALL be snapped to a whole device pixel at draw
time. The snapping SHALL NOT alter the position held in game state.

#### Scenario: A fractional position is snapped

- **WHEN** a hazard at a fractional tile position is drawn
- **THEN** its destination lands on a whole device pixel

#### Scenario: Drawing does not alter game state

- **WHEN** a frame containing hazards is rendered
- **THEN** every hazard's stored position is unchanged by drawing

#### Scenario: Snapping keeps motion monotonic

- **GIVEN** a hazard advancing in one direction across several frames
- **WHEN** each frame is drawn
- **THEN** the snapped destination never moves against the direction of travel

### Requirement: A struck capybara is drawn in its defeat pose

While the game is in its dying state, and once it is over, the player SHALL be
drawn from the defeat frame rather than from a directional walk frame, at the
tile where it was struck.

#### Scenario: The defeat frame is used while dying

- **WHEN** the game is dying and a frame is rendered
- **THEN** the player's source rectangle is the recorded defeat frame

#### Scenario: The pose is drawn where the player was struck

- **WHEN** the game is dying and a frame is rendered
- **THEN** the player is drawn at the column and row it occupied at the collision
- **AND** not at the spawn cell

#### Scenario: The defeat pose is held once the game is over

- **WHEN** the game is over and a frame is rendered
- **THEN** the player's source rectangle is the recorded defeat frame
- **AND** it is drawn at the tile where the final collision occurred

#### Scenario: Walk frames resume after respawn

- **WHEN** the death beat expires with lives remaining and a frame is rendered
- **THEN** the player is drawn from a directional walk frame again

### Requirement: The hit flash strobes the player for the first 100 milliseconds

Across the first 100 milliseconds of the death beat the player SHALL alternate
between drawn and not drawn every 25 milliseconds. After that window it SHALL be
drawn continuously for the remainder of the beat. The strobe SHALL be driven by
accumulated elapsed time, so it is identical at any refresh rate.

#### Scenario: The player alternates during the flash window

- **WHEN** the first 100 milliseconds of the death beat are sampled at each 25
  millisecond boundary
- **THEN** the player is drawn in some samples and not drawn in others

#### Scenario: The flash ends before the beat does

- **GIVEN** more than 100 milliseconds of the death beat have elapsed
- **WHEN** a frame is rendered
- **THEN** the player is drawn

#### Scenario: The flash is identical at any refresh rate

- **WHEN** the same point in the beat is reached by steps of 1/60 second and
  separately by steps of 1/120 second
- **THEN** the player's drawn-or-not state is the same in both cases

#### Scenario: The board and traffic are unaffected by the flash

- **WHEN** the player is in a not-drawn moment of the flash
- **THEN** every board tile and every hazard is still drawn

### Requirement: A halted game still draws the board and the traffic

While the game is over the board, the traffic and the heads-up display SHALL
continue to be drawn, so the halted state reads as a stopped game rather than a
blank or frozen canvas.

#### Scenario: The board and hazards are drawn while the game is over

- **WHEN** the game is over and a frame is rendered
- **THEN** every board tile is drawn
- **AND** every hazard is drawn
- **AND** the heads-up display is drawn showing 0 lives

### Requirement: The game over screen is drawn over the halted board

While the state is `GAME_OVER` the renderer SHALL draw, after the board, the
traffic, the player and the heads-up display: a translucent dark wash covering
the whole board, and over it the words `GAME OVER`, the final score, and a prompt
naming the keys that start a new run. The wash SHALL be translucent so the scene
beneath it remains visible.

#### Scenario: The screen is drawn last

- **WHEN** the game is over and a frame is rendered
- **THEN** the wash and its text are drawn after every board tile, every hazard,
  the player, and the heads-up display

#### Scenario: The screen covers the whole board

- **WHEN** the game is over and a frame is rendered
- **THEN** the wash spans the full width and height of the board

#### Scenario: The scene remains visible beneath the wash

- **WHEN** the game is over and a frame is rendered
- **THEN** the wash is drawn translucently rather than opaquely
- **AND** the board, the traffic and the player are still drawn beneath it

#### Scenario: The screen names the final score

- **GIVEN** the run ended with a score of 90
- **WHEN** the game over screen is drawn
- **THEN** the drawn text includes the words `GAME OVER`
- **AND** it includes the final score 90
- **AND** it includes a prompt naming the keys that start a new run

#### Scenario: The screen appears only while the game is over

- **WHEN** the game is playing, sinking or dying and a frame is rendered
- **THEN** no wash and no game over text are drawn

#### Scenario: The screen disappears when a new run starts

- **GIVEN** the game over screen is being drawn
- **WHEN** a new run is started and the next frame is rendered
- **THEN** no wash and no game over text are drawn
