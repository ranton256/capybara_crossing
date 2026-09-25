## ADDED Requirements

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
