## REMOVED Requirements

### Requirement: The game over state halts play

**Reason**: The requirement asserted that `GAME_OVER` is terminal, which this
change makes false. Its scenario "The game over state is terminal in this change"
cannot be restated truthfully, because a restart key now leaves the state. The
halting behaviour itself survives and is carried into the replacement requirement
below.

**Migration**: Replaced by "The game over state halts play until a new run
begins", which keeps the no-movement, no-scoring and no-collision guarantees and
the "nothing advances" scenario, and adds the one way out.

## MODIFIED Requirements

### Requirement: The game tracks remaining lives

The game SHALL carry a lives counter initialised to 3. A registered collision
SHALL decrement it by exactly 1, once per death rather than once per frame of
overlap. The counter SHALL NOT fall below 0. Starting a new run SHALL restore it
to 3.

#### Scenario: Lives start at three

- **WHEN** a new game begins
- **THEN** the lives counter is 3

#### Scenario: Reaching the goal does not cost a life

- **WHEN** the player reaches the spa and the beat expires
- **THEN** the lives counter is still 3

#### Scenario: A collision costs exactly one life

- **GIVEN** the player has 3 lives
- **WHEN** a collision is registered
- **THEN** the lives counter is 2

#### Scenario: A death costs one life however long the overlap lasts

- **GIVEN** a collision has been registered and the death beat is running
- **WHEN** the hazard continues to overlap the player for many frames
- **THEN** the lives counter has fallen by exactly 1

#### Scenario: The counter never falls below zero

- **GIVEN** the player has 1 life
- **WHEN** a collision is registered
- **THEN** the lives counter is 0
- **AND** no subsequent event takes it lower

#### Scenario: A new run restores all three lives

- **GIVEN** the game is over with 0 lives
- **WHEN** a new run is started
- **THEN** the lives counter is 3

## ADDED Requirements

### Requirement: The game over state halts play until a new run begins

While the state is `GAME_OVER` the game SHALL NOT move the player, award points,
or register collisions. Elapsed time SHALL continue to be accepted without error.
The state SHALL be left only by a restart key.

#### Scenario: Nothing advances while the game is over

- **GIVEN** the state is `GAME_OVER`
- **WHEN** elapsed time is applied over many frames
- **THEN** the player's position, the score and the life count are unchanged
- **AND** the state is still `GAME_OVER`

#### Scenario: Directional input does not leave the game over state

- **GIVEN** the state is `GAME_OVER`
- **WHEN** a directional key is pressed
- **THEN** the state remains `GAME_OVER`
- **AND** the player's position is unchanged

### Requirement: Enter or Space starts a new run when the game is over

While the state is `GAME_OVER`, pressing `Enter` or `Space` SHALL start a new
run. A new run SHALL return the player to the spawn cell facing up, set the score
to 0, restore the lives counter, return the northward watermark to the spawn row,
return every hazard to its starting position, discard any buffered direction,
and set the state to `PLAYING`.
These keys SHALL have no effect on game state in any other state. Their browser
default action SHALL be suppressed whenever the game has focus, because `Space`
would otherwise scroll the page out from under the board.

#### Scenario: Enter starts a new run

- **GIVEN** the state is `GAME_OVER`
- **WHEN** `Enter` is pressed
- **THEN** the state is `PLAYING`
- **AND** the player is at column 6, row 6 facing up

#### Scenario: Space starts a new run

- **GIVEN** the state is `GAME_OVER`
- **WHEN** `Space` is pressed
- **THEN** the state is `PLAYING`

#### Scenario: A new run clears the score and restores the board

- **GIVEN** the game is over after a run that scored 90 points
- **WHEN** a new run is started
- **THEN** the score is 0
- **AND** the watermark is the spawn row
- **AND** every hazard is at the position it held when the game first began

#### Scenario: A direction buffered alongside the restart key is discarded

- **GIVEN** the state is `GAME_OVER` and both a directional key and a restart key
  have been pressed before the next update
- **WHEN** the new run starts
- **THEN** the buffered direction is discarded rather than applied
- **AND** the player is still at the spawn cell on the following update

#### Scenario: Restart keys do nothing while playing

- **GIVEN** the state is `PLAYING` with a score already accumulated
- **WHEN** `Enter` or `Space` is pressed
- **THEN** the state is still `PLAYING`
- **AND** the score, the player position and the life count are unchanged

#### Scenario: Restart keys do nothing during a beat

- **GIVEN** the state is `DYING` or `SINKING`
- **WHEN** `Enter` or `Space` is pressed
- **THEN** the beat continues to its normal conclusion
- **AND** no new run is started

#### Scenario: Restart keys do not scroll the page

- **WHEN** `Enter` or `Space` is pressed while the game has focus
- **THEN** the browser's default action for that key is suppressed
- **AND** keys that are neither directional nor restart keys keep their default
  action

#### Scenario: A new run can itself be lost and restarted

- **GIVEN** a new run has been started after a game over
- **WHEN** the player loses all three lives again
- **THEN** the state is `GAME_OVER`
- **AND** a restart key starts another new run
