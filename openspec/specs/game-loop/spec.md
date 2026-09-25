## Purpose

Defines how the game starts up in a browser opened directly from disk and how it
advances time, so that gameplay behaves identically regardless of display refresh
rate and so that game logic can be exercised by a test runner with no browser present.

## Requirements

### Requirement: Zero-dependency browser startup

The game SHALL run from an `index.html` opened directly from the filesystem, with no
local server, no package manager, and no build step. It SHALL NOT depend on any
browser API that is unavailable over the `file://` protocol.

#### Scenario: Opening the page straight off disk

- **WHEN** a user opens `index.html` directly in a modern browser using the `file://`
  protocol
- **THEN** the game boots and renders its first frame
- **AND** no error is reported to the browser console

#### Scenario: No blocked transport is used

- **WHEN** the loaded page and its scripts are inspected
- **THEN** no `fetch` call, `XMLHttpRequest`, or `<script type="module">` is present
- **AND** the sprite atlas is obtained through an `<img>` element
- **AND** sprite source rectangles are present as constants in the script rather than
  read from `assets/sprites/manifest.json` at runtime

#### Scenario: Rendering waits for the atlas

- **WHEN** the first animation frame occurs before the atlas image has finished loading
- **THEN** the game SHALL NOT throw
- **AND** the board is drawn once the image becomes available

### Requirement: Frame-rate independent time

The game SHALL advance world state using elapsed wall-clock time measured in seconds,
so that motion over a given interval is identical across display refresh rates.
Elapsed time SHALL be bounded before it is applied.

#### Scenario: Identical motion across refresh rates

- **WHEN** the same sequence of updates is applied over one second of elapsed time,
  once as 60 steps and once as 120 steps
- **THEN** the resulting world state is equivalent in both cases, within
  floating-point tolerance

#### Scenario: A long gap between frames is bounded

- **WHEN** an animation frame reports an elapsed time greater than 0.1 seconds, such
  as after the browser tab has been backgrounded
- **THEN** the update phase is applied with an elapsed time of no more than 0.1 seconds
- **AND** no entity advances by more than 0.1 seconds worth of motion in that frame

#### Scenario: The first frame does not jump

- **WHEN** the very first animation frame is processed and no previous timestamp exists
- **THEN** the elapsed time applied is zero or a single frame's duration
- **AND** no entity is displaced by an arbitrarily large amount

### Requirement: Update precedes render within a frame

Each animation frame SHALL complete its update phase before its render phase begins,
so that a frame never displays a mixture of pre-update and post-update state.

#### Scenario: Phase ordering within one frame

- **WHEN** the browser invokes the animation frame callback
- **THEN** pending input is consumed and world state is advanced first
- **AND** the canvas is drawn afterwards from the state resulting from that update

### Requirement: Game logic is callable without a browser

State transitions SHALL be plain functions that operate on game state values and
require no canvas, no document, and no window. They SHALL be reachable from a test
runner through an export mechanism that a browser ignores.

#### Scenario: Importing the logic outside a browser

- **WHEN** a test runner running on Node imports `game.js`
- **THEN** the import succeeds with no canvas or DOM available
- **AND** the movement and time-advancement transitions are callable as functions

#### Scenario: The export mechanism does not affect the browser

- **WHEN** the same file is loaded by a browser, where no module system is defined
- **THEN** the export block is skipped without error
- **AND** the zero-dependency startup behaviour is unchanged
