## MODIFIED Requirements

### Requirement: Score HUD on top
The system SHALL render the current score, remaining lives, and Best as text on the canvas after tiles, hazards, and the player sprite so the HUD remains readable above gameplay pixels.

#### Scenario: Score text visible after hops
- **WHEN** the score is greater than zero and the render phase runs
- **THEN** the canvas SHALL show the current score value in the HUD layer
- **AND** that text SHALL be drawn after the player sprite

#### Scenario: Lives shown in HUD
- **WHEN** the render phase runs with a numeric lives counter
- **THEN** the HUD SHALL include the remaining life count

#### Scenario: Best shown in HUD
- **WHEN** the render phase runs with a numeric Best value
- **THEN** the HUD SHALL include the Best score

### Requirement: Player sprite drawn from atlas
The system SHALL draw the player as a single 16×16 atlas frame at the player's current grid cell, scaled by the existing integer scale factor (three). Source rectangles for player frames SHALL be hardcoded (no runtime `manifest.json` fetch). The drawn frame SHALL match the player's facing direction and SHALL alternate between the two atlas walk frames for that facing across successful hops (minimal energetic presentation). While the defeat pose is active, the defeat frame SHALL override walk frames.

#### Scenario: Player blit at grid cell
- **WHEN** the atlas is loaded and the render phase runs with the player at a grid cell
- **THEN** a capybara frame SHALL be drawn at that cell's scaled destination rectangle
- **AND** no runtime request SHALL be made for `manifest.json`

#### Scenario: Walk frame flips after a hop
- **WHEN** the player completes a successful hop and is not in the defeat pose
- **THEN** the next render SHALL use the alternate walk frame for the current facing

### Requirement: Player drawn on spa during sink
While the sink beat is active, the system SHALL keep drawing the player sprite on the spa row using an existing capybara frame (no dedicated sink frames) with a minimal visual sink cue (slight vertical draw offset or squash within the cell).

#### Scenario: Sinking player remains visible
- **WHEN** the sink beat is active and the render phase runs
- **THEN** the player sprite SHALL be drawn on row 0
- **AND** the draw SHALL apply the minimal sink cue

### Requirement: Game Over overlay
While Game Over is active, the system SHALL draw overlay text including Game Over, the final score, and a restart hint that mentions Enter and Space, after world and HUD layers.

#### Scenario: Overlay shows final score
- **WHEN** Game Over is active and the render phase runs
- **THEN** the canvas SHALL show Game Over text
- **AND** the canvas SHALL show the final score
- **AND** the canvas SHALL show a restart hint that mentions Enter and Space
