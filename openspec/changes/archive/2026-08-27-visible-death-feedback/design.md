## Context

Today a hit immediately teleports the player to spawn and sets `hurtUntil` for ~300ms, so the defeat frame draws at the start cell—easy to miss. Spa already uses a hold-then-respawn pattern via `sinkingUntil` / `finishSink`. See proposal.md for motivation. This revision adds sprite flicker and a brief screen flash on top of the impact hold.

## Goals / Non-Goals

**Goals:**
- Mirror the sink-beat pattern for mid-run hits so defeat feedback is readable at the impact cell.
- Make the hit unmistakable via defeat flicker + a short full-canvas flash under the HUD.
- Keep collision, scoring, Best, and Game Over restart contracts intact aside from when/where respawn happens and the new render cues.

**Non-Goals:**
- New atlas frames, particles, or audio.
- Changing death penalty (still −1 life) or Game Over restart keys.
- Invulnerability after respawn beyond the death beat itself.

## Decisions

### 1. Hold at impact, then `finishDeath` respawn
On hit with lives remaining: decrement lives, set `hurtUntil = now + DEATH_MS` (~550ms), keep `player` at the impact cell, clear pending hop. Do **not** call `createInitialPlayer()` until `finishDeath` when `now >= hurtUntil`.

**Alternative considered:** Instant teleport + longer Zzz at spawn — still reads as “spawn glitch,” not a death.

### 2. Gate hops and collisions while dying
Treat `now < hurtUntil && !gameOver` (or an explicit dying check) like `sinkingUntil`: skip applying hops; skip `resolveCollisions` so overlapping traffic cannot multi-hit during the beat. Hazards keep moving.

### 3. Last life stays on impact under Game Over
On lives → 0: set `gameOver`, keep player on impact with defeat pose; no `finishDeath` respawn. Flash still fires on that hit. Restart clears pose/flash as today.

### 4. Watermark resets on respawn (`finishDeath`)
Align with the gameplay requirement wording (“when … respawns”). On last-life Game Over there is no mid-run respawn, so watermark reset is irrelevant until restart.

### 5. Reuse `hurtUntil` as the death-beat clock; add `flashUntil`
`hurtUntil` drives defeat pose + flicker for the full death beat. On hit also set `flashUntil = now + FLASH_MS` (~100ms). Clear both on `finishDeath` / restart as appropriate.

### 6. Flicker via skipped player blit
While dying (and optionally under Game Over until restart), `renderPlayer` draws the defeat frame only when `Math.floor(now / FLICKER_MS) % 2 === 0` (target ~8–10 Hz, e.g. `FLICKER_MS = 60`). Flicker-off frames skip the player draw entirely.

### 7. Screen flash under HUD
After tiles/hazards/player, if `now < flashUntil`, fill the canvas with a semi-transparent light overlay (e.g. white/cream at ~0.35–0.5 alpha), then draw HUD and Game Over overlay. Keeps Score/Lives/Best readable during the flash.

## Risks / Trade-offs

- **[Risk] Player looks stuck under a truck for half a second** → Mitigation: defeat/Zzz + flicker + flash; beat is short (~550ms).
- **[Risk] Flash obscures playfield** → Mitigation: short window (~100ms) and under-HUD layering.
- **[Risk] Existing tests assume immediate respawn on hit** → Mitigation: update collision/gameplay/session/rendering tests in the same change; TDD first.
- **[Trade-off] No post-respawn i-frames** → Acceptable; spawn row has no traffic.

## Migration Plan

Ship with unit tests; no data migration. Rollback is reverting `game.js` + tests + specs.
