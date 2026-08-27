## Why

A design review left three product decisions open: Up hops farm points forever, “slightly more energetic” after spa has no effect, and Game Over never records a high score. Players and the design doc both need those behaviors locked in, plus light presentation polish (walk cycle, sink beat, restart copy).

## What Changes

- **BREAKING (scoring):** +10 only when an Up hop reaches a row strictly less than `bestRowThisLife` (farthest-north watermark for the current life). Re-upping the same row after going down does not score. Spa entry still gets +10 (when it improves the watermark) plus +50.
- After each successful spa round: multiply hazard speeds by **1.10** (compounding); reset the multiplier to 1.0 on full session restart (Enter/Space). Reset `bestRowThisLife` on life loss respawn and on session restart.
- Minimal “energetic” visual: use the atlas’s two-frame walk cycle (toggle on successful hops).
- Light sink presentation during the spa beat (subtle vertical offset or squash using existing frames—no new art).
- Persist and show **Best** via `localStorage`; HUD shows Score, Lives, and Best; update Best when the run score exceeds it (including at Game Over). Session restart clears Score/lives/difficulty but keeps Best.
- Game Over overlay copy mentions Enter **and** Space.

Out of scope: Web Audio, round countdown timer, backend score submission, river logs/monkey/parrot.

## Capabilities

### New Capabilities

- `persistence`: Read/write session best score in `localStorage` and surface it in game state for the HUD.

### Modified Capabilities

- `gameplay`: Forward-progress Up scoring via `bestRowThisLife`; round completion applies difficulty bump and resets the watermark appropriately on death/restart.
- `hazards`: Hazard motion uses a session difficulty multiplier (+10% per successful spa round; reset on session restart).
- `rendering`: HUD includes Best; player walk-frame flip; minimal sink presentation; overlay restart hint includes Space.
- `session`: Restart resets difficulty multiplier and `bestRowThisLife`; Game Over path may refresh Best before/while overlay shows.

## Impact

- `game.js`: scoring, watermark, difficulty, walk/sink draw, HUD, `localStorage` helpers (injectable for tests).
- `tests/*.test.mjs`: scoring, difficulty, persistence, HUD/overlay strings.
- README: document Best / scoring / restart briefly if needed.
- Un-parks design-doc optional difficulty ramp (narrow form) and optional high-score storage.
