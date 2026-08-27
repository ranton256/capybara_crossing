## MODIFIED Requirements

### Requirement: P2 board visual regression gate
The project SHALL provide a dev-only browser test that loads the game over local HTTP with hazard motion frozen, waits until the environment tile board is visible on the canvas, and compares a screenshot of the `#game` canvas element to a committed baseline image. The test SHALL fail when the canvas appearance materially differs from the baseline beyond a configured pixel tolerance.

#### Scenario: Baseline match after atlas load
- **WHEN** the visual regression test runs against a build where the tile board, player, and frozen hazards render correctly
- **THEN** the `#game` canvas screenshot SHALL match the committed baseline within the configured tolerance

#### Scenario: Regression detection
- **WHEN** the visual regression test runs against a build where tile rendering, board layout, player, or frozen hazard placement regresses
- **THEN** the test SHALL fail and report a visual diff

### Requirement: Visual tests separate from unit pre-commit gate
The visual regression test suite SHALL NOT be required by the existing `npm test` pre-commit hook. Unit tests SHALL remain the only automated gate on commit. Visual tests SHALL be invokable separately via a dedicated npm script.

#### Scenario: Pre-commit runs unit tests only
- **WHEN** a developer creates a git commit with the project hook enabled
- **THEN** the hook SHALL run `npm test` and SHALL NOT require Playwright browser tests to pass

#### Scenario: Visual tests run on demand
- **WHEN** a developer runs the dedicated end-to-end npm script
- **THEN** the visual regression test SHALL execute in a real browser with hazard motion frozen

### Requirement: Zero runtime impact on shipped game
Adding browser visual tests SHALL NOT introduce npm runtime dependencies to `index.html`, `style.css`, or `game.js`. Opening `index.html` without query parameters SHALL run with moving hazards. A freeze query parameter MAY pause hazard motion so visual tests can capture a deterministic frame.

#### Scenario: Game stays zero-dependency
- **WHEN** a user opens `index.html` without npm installed
- **THEN** the game SHALL run as before with no new scripts or modules required at runtime

#### Scenario: Default boot does not freeze traffic
- **WHEN** a user opens `index.html` without a freeze query parameter
- **THEN** hazards SHALL move during the update phase
