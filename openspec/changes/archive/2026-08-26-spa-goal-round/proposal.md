## Why

P5 punishes hits but never rewards the spa. ROADMAP P6 is reaching row 0: +50 bonus, a short sink beat (reuse idle on the spa tile — no sink frames in the atlas), then a new round at start with score and lives kept.

## What Changes

- When the player lands on row 0 (spa), award **50** bonus points (in addition to the Up hop’s +10).
- Play a brief sink beat on the spa tile using the existing idle-up frame, then respawn at (6, 6). Lives and score persist. Hazards keep moving (no +10% speed).
- Ignore hops during the sink beat so the player stays in the goal until respawn.
- No Game Over in this milestone.

## Capabilities

### Modified Capabilities

- `gameplay`: Goal bonus, sink beat, round reset to start.
- `engine`: Update evaluates goal after collision; no Game Over yet.
- `rendering`: Player remains drawn on the spa during the sink beat.

## Impact

- `game.js`: `resolveGoal`, `finishSink`, hop lock while sinking.
- `tests/`: goal/score/respawn tests.
- Out of scope: Game Over (P7), speed ramp, localStorage, audio.
