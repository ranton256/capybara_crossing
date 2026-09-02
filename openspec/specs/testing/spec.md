# testing Specification

## Purpose
Guards the parts of the game that only a real browser can exercise, and keeps
that slow check separate from the fast unit gate that runs on every commit.

## Requirements

### Requirement: Browser visual regression gate

The system SHALL provide a browser-level test that opens the shipped
`index.html` from disk, waits until the sprite atlas has decoded and a frame has
painted, and compares the rendered canvas against a committed baseline image. The
test SHALL fail when the rendered board differs from that baseline.

#### Scenario: Board matches the committed baseline

- **WHEN** the visual test opens `index.html` over `file://` and the atlas has
  decoded
- **THEN** the rendered canvas SHALL match the committed baseline image

#### Scenario: A rendering regression fails the gate

- **WHEN** the rendered canvas differs from the committed baseline beyond the
  configured tolerance
- **THEN** the visual test SHALL fail

### Requirement: Deterministic visuals for the gate

The system SHALL accept a freeze flag that holds moving entities at their spawn
positions, so the visual baseline does not depend on timing.

#### Scenario: Freeze holds entities still

- **WHEN** the game is started with the freeze flag set
- **THEN** moving entities SHALL remain at their spawn coordinates across updates

#### Scenario: Freeze is off by default

- **WHEN** the game is started with no freeze flag
- **THEN** moving entities SHALL be free to move

### Requirement: Visual gate separate from the unit gate

The system SHALL keep the browser visual test out of the command run by the
pre-commit hook, so committing does not require a browser install. The unit test
command SHALL remain runnable with no third-party dependencies installed.

#### Scenario: Unit gate needs no browser

- **WHEN** the unit test command runs on a checkout with no browser installed
- **THEN** it SHALL pass without invoking the visual test

#### Scenario: Visual gate has its own command

- **WHEN** a developer runs the visual test command
- **THEN** the browser visual test SHALL run
