# engine Specification

## Purpose
Provides the zero-dependency browser boot, the crisp integer-scale pixel canvas,
and the `requestAnimationFrame` update-then-render loop that every later
gameplay milestone attaches to.

## Requirements

### Requirement: Zero-dependency three-file boot

The system SHALL ship as `index.html`, `style.css`, and `game.js` with no
bundler, package manager, or module script type required at runtime. Opening
`index.html` directly from disk SHALL display the canvas without dependency,
module-loader, or bundling errors.

#### Scenario: Opening the game from disk

- **WHEN** the user opens `index.html` in a modern web browser with no local
  server and no package manager
- **THEN** the page SHALL load without module-loader or missing-dependency errors
- **AND** a canvas element SHALL be present in the document

#### Scenario: No runtime module loading or data fetching

- **WHEN** the page boots
- **THEN** the system SHALL NOT use `<script type="module">`
- **AND** the system SHALL NOT issue a runtime `fetch` or `XMLHttpRequest` for
  `manifest.json`

### Requirement: Crisp integer-scale canvas

The system SHALL present a canvas whose backing store is 576 by 336 pixels,
derived from 12 columns by 7 rows of 16-pixel tiles at an integer scale of 3.
The 2D drawing context SHALL have image smoothing disabled, and the stylesheet
SHALL request nearest-neighbour (pixelated) image rendering, so 16×16 art added
in later milestones stays blocky.

#### Scenario: Canvas backing store size

- **WHEN** the page has finished loading
- **THEN** the canvas SHALL report a width of 576 and a height of 336

#### Scenario: Anti-aliasing disabled

- **WHEN** the 2D drawing context is configured
- **THEN** image smoothing SHALL be disabled on that context
- **AND** the stylesheet SHALL request crisp pixel rendering for the canvas

### Requirement: Update-then-render animation loop

The system SHALL run a native `requestAnimationFrame` loop. Each animation-frame
callback SHALL complete the update phase before beginning the render phase, the
render phase SHALL clear the entire drawing surface before drawing, and each
callback SHALL schedule the next frame.

#### Scenario: Update completes before render

- **WHEN** the browser invokes the animation-frame callback
- **THEN** the update phase SHALL run to completion
- **AND** the render phase SHALL then run

#### Scenario: Surface cleared each frame

- **WHEN** the render phase begins
- **THEN** the full drawing surface SHALL be cleared before anything is drawn,
  so no ghosting or smearing from the previous frame remains

#### Scenario: Loop continues

- **WHEN** an animation-frame callback finishes
- **THEN** it SHALL schedule the next animation frame

#### Scenario: Elapsed time is available to the update phase

- **WHEN** an animation-frame callback runs
- **THEN** the update phase SHALL receive the time elapsed since the previous
  frame, so later milestones can scale motion by elapsed time rather than by
  frame count

### Requirement: Game logic importable without a browser

The system SHALL expose its state-transition logic as plain functions callable
without a canvas or DOM, through a guarded export block that a browser ignores,
so a Node test runner can import `game.js` directly.

#### Scenario: Node imports the game module

- **WHEN** a Node test runner imports `game.js` outside a browser
- **THEN** the import SHALL succeed without a canvas or DOM being present
- **AND** the loop, update, and render entry points SHALL be reachable from the
  imported module

#### Scenario: Browser ignores the export block

- **WHEN** the page loads `game.js` through a classic script tag in a browser
- **THEN** the export block SHALL NOT raise a reference error
