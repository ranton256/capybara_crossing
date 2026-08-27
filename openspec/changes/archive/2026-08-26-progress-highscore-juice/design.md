## Context

See proposal.md — Why. Current game awards +10 on every Up, uses static frame-1 sprites, has fixed hazard speeds, and shows Score/Lives only with no persistence. This change spans scoring, hazards, rendering, session restart, and a thin `localStorage` adapter.

## Goals / Non-Goals

**Goals:**

- Implement locked product decisions: forward-progress scoring, energetic both (×1.10 speed + walk frames), Best HUD + localStorage, polish sink cue and overlay copy.
- Keep zero runtime npm deps; inject storage in tests.
- TDD: failing tests first for scoring, difficulty, persistence, HUD.

**Non-Goals:**

- Audio, timer, server leaderboards, changing board layout, new sink art frames.

## Decisions

1. **Watermark `bestRowThisLife`**  
   Smaller row index = farther north. Award +10 iff `nextRow < bestRowThisLife`, then set watermark to `nextRow`. Init/reset to 6 on boot, death respawn, spa finishSink, and session restart.  
   *Alt:* max-row-ever for whole session — rejected; death should let players re-earn climb points.

2. **Difficulty**  
   `speedFactor` starts at 1.0; on `finishSink` after spa, `speedFactor *= 1.10`. `moveHazards` uses `vx * speedFactor * dt/1000`. Restart sets `speedFactor = 1.0` and respawns base hazards.  
   *Alt:* increase base constants permanently — session reset is fairer with Best persistence.

3. **Walk frames**  
   Hardcode frame pairs from manifest (`capy_*_1` / `*_2`). Toggle `walkPhase` 0/1 on successful hop. Defeat overrides.

4. **Sink cue**  
   During `sinkingUntil`, draw player with a few pixels of downward offset (or 90% height squash) inside the spa cell—existing facing frame.

5. **Persistence**  
   Key e.g. `capybara_crossing_best`. Helpers `loadBest(storage)` / `saveBest(storage, n)` with `options.localStorage` or global `localStorage`. ParseInt; invalid → 0. Call `maybeUpdateBest(state)` after score increases and when entering Game Over.

6. **HUD string**  
   `Score: N   Lives: L   Best: B`. Overlay: `Enter / Space to restart`.

7. **E2e snapshot**  
   Freeze spawn HUD gains “Best: 0”; update Playwright baseline after implement.

## Risks / Trade-offs

- [localStorage blocked in private / file:// quirks] → try/catch; Best stays 0 in memory.  
- [Compounding speed becomes unfair] → reset on Game Over restart; no cap for tutorial simplicity (document in README).  
- [E2e baseline drift] → `npm run test:e2e:update` once HUD text changes.  
- [Existing tests assume every Up scores] → update gameplay tests as part of apply.
