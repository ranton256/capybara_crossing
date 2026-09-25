## Purpose

Defines the states a round can be in, how it moves between them over elapsed time,
which of them accept player input, and what carries across a round boundary, so
that timed transitions are explicit rather than implied by scattered flags.

## Requirements

### Requirement: The round is always in exactly one named state

The game SHALL track a single current state drawn from a closed set. In this change
that set is `PLAYING` and `SINKING`. Every behaviour that depends on whether the
world is mid-transition SHALL be expressed in terms of that state rather than by
inferring it from other fields.

#### Scenario: A new game starts playing

- **WHEN** a new game begins
- **THEN** the state is `PLAYING`
- **AND** the player is at the spawn cell with 3 lives and a score of 0

#### Scenario: The state is never absent or unrecognised

- **WHEN** the state is read at any point during a round
- **THEN** it is one of the states the game defines

### Requirement: Only the playing state consumes directional input

Directional input SHALL be applied to the player only while the state is `PLAYING`.
In any other state a buffered direction SHALL be discarded rather than applied or
retained, so that presses made during a transition do not take effect when it ends.

#### Scenario: Input is ignored while sinking

- **WHEN** the state is `SINKING` and a directional key is pressed
- **THEN** the player's column, row, and facing are unchanged

#### Scenario: Presses made while sinking do not fire on respawn

- **GIVEN** the state is `SINKING` and a directional key was pressed during the beat
- **WHEN** the beat expires and the state returns to `PLAYING`
- **THEN** the player is at the spawn cell
- **AND** the buffered direction has been discarded rather than applied

### Requirement: Entering the goal row begins the sink

While `PLAYING`, a movement that carries the player onto row 0 SHALL place the
player on row 0 and transition the state to `SINKING`. The player SHALL NOT remain
on row 0 in the `PLAYING` state.

#### Scenario: Moving up from row 1 enters the goal

- **GIVEN** the state is `PLAYING` and the player is at row 1
- **WHEN** `ArrowUp` is pressed
- **THEN** the player occupies row 0
- **AND** the state is `SINKING`

#### Scenario: The goal spans the whole top row

- **WHEN** the player enters row 0 from any column
- **THEN** the state is `SINKING`
- **AND** no column of row 0 is treated differently from any other

### Requirement: The sink beat lasts 400 milliseconds of elapsed time

The `SINKING` state SHALL persist for 400 milliseconds of accumulated elapsed time
and SHALL then return to `PLAYING`. Its duration SHALL be measured from elapsed
seconds supplied to the update phase, so that it is identical at any refresh rate.

#### Scenario: The beat does not end early

- **GIVEN** the state is `SINKING`
- **WHEN** 399 milliseconds of elapsed time have been applied
- **THEN** the state is still `SINKING`

#### Scenario: The beat ends once its duration is reached

- **GIVEN** the state is `SINKING`
- **WHEN** 400 milliseconds of elapsed time have been applied
- **THEN** the state is `PLAYING`

#### Scenario: The beat is the same length at any refresh rate

- **WHEN** 400 milliseconds are applied as 24 steps of 1/60 second
- **AND** separately as 48 steps of 1/120 second
- **THEN** the state has returned to `PLAYING` in both cases
- **AND** the resulting player position is the same in both cases

#### Scenario: A long frame cannot overshoot into a later state

- **GIVEN** the state is `SINKING`
- **WHEN** a single clamped frame of elapsed time is applied
- **THEN** the state is either still `SINKING` or exactly `PLAYING`
- **AND** no transition is skipped

### Requirement: The round resets when the sink beat expires

When `SINKING` ends, the player SHALL be returned to the spawn cell at column 6,
row 6 facing up. The score and the lives counter SHALL carry across unchanged.

#### Scenario: A fresh capybara appears at the start

- **GIVEN** the state is `SINKING` with the player on row 0
- **WHEN** the beat expires
- **THEN** the player is at column 6, row 6 facing up
- **AND** the state is `PLAYING`

#### Scenario: Score and lives survive the reset

- **GIVEN** the player has a score of 120 and 3 lives and is mid-sink
- **WHEN** the beat expires
- **THEN** the score is still 120
- **AND** the lives counter is still 3

#### Scenario: Consecutive rounds each award the goal

- **WHEN** the player reaches the spa, respawns, and reaches it again
- **THEN** each arrival is scored
- **AND** the state returns to `PLAYING` after each beat

### Requirement: The game tracks remaining lives

The game SHALL carry a lives counter initialised to 3. No event in this change
SHALL decrement it; it exists as read state for the display until a later change
introduces losing a life.

#### Scenario: Lives start at three

- **WHEN** a new game begins
- **THEN** the lives counter is 3

#### Scenario: Reaching the goal does not cost a life

- **WHEN** the player reaches the spa and the beat expires
- **THEN** the lives counter is still 3
