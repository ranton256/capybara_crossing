# engine Specification

## Purpose

Provides the zero-dependency browser boot, crisp pixel canvas, and `requestAnimationFrame` update-then-render loop that later gameplay attaches to.

## Requirements

### Requirement: Zero-dependency three-file boot
The system SHALL ship as `index.html`, `style.css`, and `game.js` with no bundler, package manager, or ES-module script type required at runtime. Opening `index.html` from disk SHALL display the canvas without dependency or bundling errors.

#### Scenario: Opening the game from disk
- **WHEN** the user opens `index.html` in a modern web browser without a local server or package manager
- **THEN** the page loads without module-loader or missing-dependency errors
- **AND** a canvas viewport is visible in the document

### Requirement: Crisp integer-scale canvas
The system SHALL present a canvas whose internal resolution is 576 by 336 pixels (twelve columns, seven rows, sixteen-pixel tiles, integer scale of three). CSS SHALL use pixelated (or equivalent nearest-neighbor) image rendering. The 2D drawing context SHALL have image smoothing disabled so later 16×16 sprites stay blocky.

#### Scenario: Canvas backing store size
- **WHEN** the page has finished loading
- **THEN** the canvas element SHALL report a width of 576 and a height of 336

#### Scenario: Disabled anti-aliasing
- **WHEN** the canvas 2D context is configured for drawing
- **THEN** image smoothing SHALL be disabled
- **AND** stylesheet rules SHALL request crisp pixel rendering for the canvas

### Requirement: Update-then-render animation loop
The system SHALL start a native `requestAnimationFrame` loop when the page loads in a browser. Each animation-frame callback SHALL finish the update phase before the render phase. The render phase SHALL clear the entire canvas and draw the static environment tile grid per the rendering specification before any entity or HUD layers. In this milestone the update phase SHALL not apply player input, move hazards, or evaluate collision or goal conditions, and the render phase SHALL not draw player sprites, hazard entities, or HUD text.

#### Scenario: Frame order on each tick
- **WHEN** the browser invokes the game's `requestAnimationFrame` callback
- **THEN** the update phase SHALL run to completion first
- **AND** the render phase SHALL then clear the drawing surface and draw environment tiles when the atlas is ready

#### Scenario: Loop continues
- **WHEN** the game has started in a browser
- **THEN** each animation-frame callback SHALL schedule the next `requestAnimationFrame`
