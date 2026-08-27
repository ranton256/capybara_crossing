## Context

See proposal.md. Last required Gherkin slice. No localStorage.

## Goals / Non-Goals

**Goals:** Game Over at 0 lives; overlay; Enter/Space restart.
**Non-Goals:** High score persistence, timer, audio.

## Decisions

1. `state.gameOver`. On hit with lives becoming 0, set flag; still reset player to start for a clean overlay.
2. `update` returns early after restart handling when `gameOver`.
3. `restartSession(state)` resets player, hazards, score, lives, hurt/sink flags, gameOver.
4. Overlay: `Game Over` / `Score: N` / `Enter to restart` centered, drawn last.
5. `handleKeydown`: if gameOver and Enter/Space, `state.pendingRestart = true`. Arrows ignored.

## Risks / Trade-offs

- **[Risk] Overlay font differs across platforms** → e2e freeze snapshot at spawn is not Game Over; unit-test overlay calls.

## Migration Plan

Additive. Rollback by revert.

## Open Questions

None.
