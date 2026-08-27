## MODIFIED Requirements

### Requirement: Update-then-render animation loop
The system SHALL start a native `requestAnimationFrame` loop when the page loads in a browser. Each animation-frame callback SHALL finish the update phase before the render phase. The update phase SHALL apply queued player input (discrete hops and score updates) before the render phase runs. The render phase SHALL clear the entire canvas, draw the static environment tile grid, then draw the player entity and score HUD per the rendering specification. In this milestone the update phase SHALL NOT move hazards or evaluate collision or goal conditions, and the render phase SHALL NOT draw hazard entities or a lives counter.

#### Scenario: Frame order on each tick
- **WHEN** the browser invokes the game's `requestAnimationFrame` callback
- **THEN** the update phase SHALL run to completion first
- **AND** the render phase SHALL then clear the drawing surface, draw environment tiles when the atlas is ready, and draw the player and score HUD when those layers apply

#### Scenario: Loop continues
- **WHEN** the game has started in a browser
- **THEN** each animation-frame callback SHALL schedule the next `requestAnimationFrame`

#### Scenario: Input applied in update before paint
- **WHEN** a directional arrow key has been pressed since the previous frame
- **THEN** the update phase SHALL apply the corresponding hop (or reject it at bounds) before the render phase draws the new player position
