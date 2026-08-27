## MODIFIED Requirements

### Requirement: Update-then-render animation loop
The system SHALL start a native `requestAnimationFrame` loop when the page loads in a browser. Each animation-frame callback SHALL finish the update phase before the render phase. The render phase SHALL clear the entire canvas and draw the static environment tile grid per the rendering specification before any entity or HUD layers. In this milestone the update phase SHALL not apply player input, move hazards, or evaluate collision or goal conditions, and the render phase SHALL not draw player sprites, hazard entities, or HUD text.

#### Scenario: Frame order on each tick
- **WHEN** the browser invokes the game's `requestAnimationFrame` callback
- **THEN** the update phase SHALL run to completion first
- **AND** the render phase SHALL then clear the drawing surface and draw environment tiles when the atlas is ready

#### Scenario: Loop continues
- **WHEN** the game has started in a browser
- **THEN** each animation-frame callback SHALL schedule the next `requestAnimationFrame`
