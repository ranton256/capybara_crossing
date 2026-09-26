## ADDED Requirements

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
