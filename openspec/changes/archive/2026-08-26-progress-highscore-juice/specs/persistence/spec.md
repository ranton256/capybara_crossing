## Purpose

Persists the player's best score across page reloads using browser localStorage and exposes it to the HUD.

## ADDED Requirements

### Requirement: Best score loads from localStorage on boot
The system SHALL read a stored best score from `localStorage` when a play session boots. If no valid stored value exists, Best SHALL be 0. The system SHALL tolerate missing or unavailable `localStorage` by treating Best as 0.

#### Scenario: Fresh browser has Best 0
- **WHEN** the game boots and no valid best score is stored
- **THEN** Best SHALL be 0

#### Scenario: Stored best is restored
- **WHEN** the game boots and localStorage holds a valid prior best of 120
- **THEN** Best SHALL be 120

### Requirement: Best updates when score exceeds it
Whenever the current run score becomes greater than Best, the system SHALL set Best to that score and write it to `localStorage`.

#### Scenario: New high score mid-run
- **WHEN** score advances past the current Best
- **THEN** Best SHALL equal the new score
- **AND** localStorage SHALL store that value

#### Scenario: Game Over with a new best
- **WHEN** Game Over begins and the final score is greater than the previous Best
- **THEN** Best SHALL equal the final score
- **AND** localStorage SHALL store that value
