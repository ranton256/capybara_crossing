## ADDED Requirements

### Requirement: Elapsed time is clamped

The system SHALL clamp the elapsed time passed to the update phase to a bounded
maximum, so that a stalled or backgrounded tab cannot advance moving entities far
enough in one step to pass through the player between two collision checks.

#### Scenario: A very long frame is clamped

- **WHEN** an animation frame reports an elapsed time far larger than a normal
  frame
- **THEN** the update phase SHALL receive the clamped maximum rather than the
  raw value

#### Scenario: Normal frames are unaffected

- **WHEN** an animation frame reports a typical elapsed time
- **THEN** the update phase SHALL receive that value unchanged
