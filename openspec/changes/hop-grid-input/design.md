## Context

See proposal.md for motivation. P2 already provides `createDefaultBoard`, atlas tile blit, and clear → tiles render order on a 12×7 / 576×336 canvas. Specs for this change: `input`, `gameplay` (new), plus deltas to `engine` and `rendering`. TDD applies: hop, bounds, and score logic must be unit-tested from Node with 80% coverage on `game.js`.

## Goals / Non-Goals

**Goals:**
- Pure helpers for hop + score that tests can call without a browser.
- Browser keydown → queue → `update` applies one discrete hop per accepted event.
- Draw player + score HUD in painter order after tiles.
- Keep `file://` compatibility (hardcoded player frame rects; no manifest fetch).

**Non-Goals:**
- Walk-cycle animation between tiles (instant snap only).
- Key-repeat auto-fire tuning beyond what the browser already emits.
- Lives HUD, hazards, collision, goal/+50.
- Changing board layout or canvas size.

## Decisions

### 1. Player state on the existing game `state` object

```js
state.player = { col: 6, row: 6, facing: "up" };
state.score = 0;
state.pendingDirection = null; // set by keydown, consumed in update
```

`hop(state, direction)` validates bounds, updates `col`/`row`/`facing`, and if `direction === "up"` and the move succeeded, adds 10 to `score`. Pure and fully unit-tested.

**Alternative considered:** Continuous velocity in `update(dt)`. Rejected: Gherkin requires discrete one-tile snaps.

### 2. Input: keydown queue of at most one pending direction per frame

`keydown` on `ArrowUp|ArrowDown|ArrowLeft|ArrowRight` calls `preventDefault()` and sets `state.pendingDirection`. `update(state)` calls `hop` once if pending is set, then clears it. Multiple presses within one frame: last-wins is acceptable for P3.

**Alternative considered:** Process every keydown immediately outside the loop. Rejected: keeps update-before-render ordering and testability of `hop` separate from DOM.

### 3. Facing frames from atlas (first frame each direction)

Hardcode `PLAYER_FRAMES` like `TILE_FRAMES`:

| facing | frame | sx | sy |
|---|---|---|---|
| up | `capy_up_1` | 0 | 0 |
| down | `capy_down_1` | 32 | 0 |
| left | `capy_left_1` | 64 | 0 |
| right | `capy_right_1` | 96 | 0 |

No second-frame animation in P3.

**Alternative considered:** Always draw idle-up. Rejected: facing sprites already exist and make left/right hops readable.

### 4. Render pipeline extension

```js
function render(ctx, state) {
  ctx.clearRect(...);
  renderBoard(ctx, state);
  renderPlayer(ctx, state); // after tiles
  renderHud(ctx, state);    // score text after player
}
```

`renderHud` draws something like `Score: N` with `fillText` in a corner (e.g. top-left over spa tiles). Font choice is free as long as the value is visible; keep it simple (canvas default or a monospace CSS-linked font is fine).

### 5. Tests before implementation

Add `tests/input.test.mjs` and/or `tests/gameplay.test.mjs`:

- Interior hops for all four directions.
- Edge clamps (no wrap, no score on blocked Up).
- Up awards +10; lateral hops do not.
- Spawn defaults: col 6, row 6, score 0.

Extend rendering tests for player drawImage destination and HUD draw after player. Update Playwright snapshot via `npm run test:e2e:update` once the player is visible at spawn.

### 6. Boot wiring

On boot: initialize player + score, attach `window` keydown listener, keep existing atlas load + loop. No change to `index.html` structure beyond what is already needed for the canvas.

## Risks / Trade-offs

- **[Risk] Browser key-repeat fires many hops while held** → Mitigation: acceptable for arcade feel; document as intentional discrete repeats, not continuous velocity. Can debounce later if needed.
- **[Risk] Playwright snapshot platform-specific** → Mitigation: keep Chromium-only Darwin baseline pattern from P2; regenerate after player + HUD appear.
- **[Risk] HUD text softens pixel look** → Mitigation: accept for tutorial readability; pixel font optional later.

## Migration Plan

No data migration. Ship as additive `game.js` / test changes. Rollback: revert the change commit; P2 board-only behavior returns.

## Open Questions

None that block implementation. Lives remain deferred to P5.
