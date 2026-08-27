## 1. Tests first

- [x] 1.1 Mid-run hit: lives decrement, player stays on impact cell, `hurtUntil` set; hops ignored until beat ends.
- [x] 1.2 After death beat: player at (6,6), score unchanged, `bestRowThisLife` is 6; no further collision during the beat.
- [x] 1.3 Last life: Game Over with player still on impact cell; defeat frame drawn there on flicker-on frames.
- [x] 1.4 Update existing collision/respawn tests that assumed immediate teleport to spawn.
- [x] 1.5 Rendering: flicker-off skips player blit; flash window draws a fill after player and before HUD.

## 2. Implementation

- [x] 2.1 Change `resolveCollisions` to hold at impact + set death beat and `flashUntil`; add `finishDeath` (mirror `finishSink`); skip hops/collisions while dying.
- [x] 2.2 Lengthen death beat (~550ms); clear defeat/flash state on respawn; keep hazards moving.
- [x] 2.3 `renderPlayer` defeat at impact with time-based flicker; canvas flash under HUD while `flashUntil` is active.

## 3. Verify

- [x] 3.1 `npm test` passes with coverage gates; spot-check a mid-road hit in the browser if needed.
