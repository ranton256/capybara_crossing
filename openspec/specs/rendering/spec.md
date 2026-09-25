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
