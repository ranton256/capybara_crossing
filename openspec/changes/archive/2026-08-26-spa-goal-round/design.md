## Context

See proposal.md. Atlas has no sink frames; reuse idle-up on the spa cell. SINK_MS = 400.

## Goals / Non-Goals

**Goals:** +50 on row 0, sink beat, respawn at start, persist score/lives.
**Non-Goals:** Game Over, difficulty ramp, dedicated sink art.

## Decisions

1. Goal is occupying `player.row === 0` after hop (any column).
2. Score: hop +10 then goal +50 on that same Up.
3. `sinkingUntil = lastTime + 400`. Skip `hop` while sinking. `finishSink` when `lastTime >= sinkingUntil` resets player.
4. Collision still runs; spa is not a road so no hit.

## Risks / Trade-offs

- **[Risk] Player hops Up from row 0 during sink** → Hops ignored until respawn.

## Migration Plan

Additive. Rollback by revert.

## Open Questions

None.
