## ADDED Requirements

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
