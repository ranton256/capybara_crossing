## Context

See proposal.md for motivation. P3 already hops a 12×7 board with player + score HUD. Road rows are 1 and 3. TDD applies. Specs: new `hazards`; deltas to `engine`, `rendering`, `testing`.

## Goals / Non-Goals

**Goals:**
- Pure `createInitialHazards` / `moveHazards` testable from Node.
- Two lanes, opposite directions, wrap, truck width 2.
- Painter order: tiles → hazards → player → HUD.
- Deterministic e2e via `?freeze=1`.

**Non-Goals:**
- AABB, lives, Zzz, goal, logs/monkey/parrot.
- Per-lane speed curves or +10% per round.
- Manifest fetch.

## Decisions

### 1. Hazard state

```js
{ kind: "truck" | "atv", frame, row, x, vx, width }
```

`x` is a float in tile units. `width` is 2 for truck, 1 for ATV. `vx` is tiles per second (truck `+1.5`, ATV `-2.5`).

Spawn (deterministic):

- Row 1: trucks at `x = 0` and `x = 6`, `vx = +1.5`
- Row 3: ATVs at `x = 3` (`atv_red`) and `x = 9` (`atv_blue`), `vx = -2.5`

**Alternative considered:** Pixel-space `x`. Rejected: hop already uses tile columns; AABB in P5 can compare tile units.

### 2. Wrap

```js
const period = COLS + hazard.width;
if (hazard.vx > 0 && hazard.x > COLS) hazard.x -= period;
if (hazard.vx < 0 && hazard.x + hazard.width < 0) hazard.x += period;
```

Recorded as classic wrap, not the parked “variable speeds + wrap as a system.”

### 3. Draw and facing

Hardcode `HAZARD_FRAMES` from the manifest (`atv_red` 0,48 16×16; `atv_blue` 16,48 16×16; `truck` 32,48 32×16). Destination x = `hazard.x * TILE_SIZE * SCALE`. If `vx > 0`, flip horizontally so left-facing atlas art travels right.

### 4. Freeze for e2e

`boot` sets `state.freezeHazards` when `options.freezeHazards` is true or `location.search` contains `freeze=1`. `moveHazards` no-ops when frozen. Playwright opens `/index.html?freeze=1`. Opening without the query keeps live traffic.

### 5. Tests

`tests/hazards.test.mjs`: spawn lanes/widths, motion over dt, wrap, freeze. Extend rendering tests for hazard `drawImage` between tiles and player. Engine: update moves hazards before render.

## Risks / Trade-offs

- **[Risk] Flaky e2e if freeze is forgotten** → Mitigation: e2e always uses `?freeze=1`.
- **[Risk] Horizontal flip quality** → Mitigation: integer dest coords; `imageSmoothingEnabled` stays false.
- **[Risk] Player can overlap vehicles with no penalty** → Accepted until P5.

## Migration Plan

Additive `game.js` / tests. Rollback: revert the change commit.

## Open Questions

None that block P4. AABB deferred to P5.
