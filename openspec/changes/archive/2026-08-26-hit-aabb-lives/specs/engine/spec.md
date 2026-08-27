## MODIFIED Requirements

### Requirement: Update-then-render animation loop
The system SHALL start a native `requestAnimationFrame` loop when the page loads in a browser. Each animation-frame callback SHALL finish the update phase before the render phase. The update phase SHALL apply queued player input, move hazards, and evaluate collision before the render phase runs. The render phase SHALL clear the entire canvas, then draw tiles, hazards, the player (including defeat pose when active), and HUD (score and lives) per the rendering specification. In this milestone the update phase SHALL NOT evaluate goal conditions, and the render phase SHALL NOT show a Game Over overlay.

#### Scenario: Frame order on each tick
- **WHEN** the browser invokes the game's `requestAnimationFrame` callback
- **THEN** the update phase SHALL run to completion first
- **AND** the render phase SHALL then clear the drawing surface and draw tiles, hazards, player, and HUD when those layers apply

#### Scenario: Loop continues
- **WHEN** the game has started in a browser
- **THEN** each animation-frame callback SHALL schedule the next `requestAnimationFrame`

#### Scenario: Input applied in update before paint
- **WHEN** a directional arrow key has been pressed since the previous frame
- **THEN** the update phase SHALL apply the corresponding hop (or reject it at bounds) before the render phase draws the new player position

#### Scenario: Hazards move in update before paint
- **WHEN** freeze is off and elapsed time is positive
- **THEN** the update phase SHALL move hazards before the render phase draws their new positions

#### Scenario: Collision evaluated after motion
- **WHEN** the player and a hazard overlap after hops and hazard movement in the same update
- **THEN** the collision response SHALL run before the render phase paints the respawned player
