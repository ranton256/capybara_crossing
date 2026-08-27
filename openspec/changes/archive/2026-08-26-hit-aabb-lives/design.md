## Context

See proposal.md. P4 already moves wrapping trucks/ATVs. Collision is new. Lives start at 3 (arcade default). Game Over is P7.

## Goals / Non-Goals

**Goals:**
- Pure `aabbOverlap` / `resolveCollisions` for Node tests.
- Hit: −1 life, respawn (6,6), score unchanged, defeat frame ~300ms, input unlocked.
- HUD shows lives.

**Non-Goals:**
- Game Over overlay, goal/+50, i-frames, invulnerability after hit.

## Decisions

### 1. Tile-space AABB

```js
playerBox = { x: player.col, y: player.row, w: 1, h: 1 }
hazardBox = { x: hazard.x, y: hazard.row, w: hazard.width, h: 1 }
```

Standard overlap: `a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y`.

### 2. One hit per update

`resolveCollisions` checks all hazards; on first overlap, apply hit and return (player is already off the road).

### 3. Zzz pose without input lock

`state.hurtUntil` timestamp. `renderPlayer` uses `capy_defeat` (sx 0, sy 16) while `now < hurtUntil`. Hop still works. Duration 300ms.

### 4. HUD

`Score: N   Lives: L`

### 5. Zero lives in P5

Lives may reach 0; still respawn. P7 adds Game Over.

## Risks / Trade-offs

- **[Risk] Repeated hits if respawn overlapped a hazard** → Spawn is row 6; traffic is rows 1 and 3.
- **[Risk] Instant life drain if i-frames missing on the road** → Accepted per spec.

## Migration Plan

Additive. Rollback by reverting the commit.

## Open Questions

None for P5. Game Over copy is P7.
