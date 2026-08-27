## Context

See proposal.md for motivation. P1 (`engine` spec) boots a 576×336 canvas with clear-and-fill render only. The sprite atlas and four environment tile frames already exist under `assets/sprites/`. Specs for this change: `specs/rendering/spec.md` (new) and `specs/engine/spec.md` (render-phase delta). TDD applies: new logic must be testable from Node with 80% coverage on `game.js`.

## Goals / Non-Goals

**Goals:**
- Pin the simplified 12×7 row→tile map as pure data (`createDefaultBoard`).
- Blit tiles from the atlas using hardcoded source rects (Option C) and a runtime `Image` load of the PNG only.
- Split render into clear → `renderBoard` → (future entity/HUD stubs).
- Keep `file://` compatibility without fetching `manifest.json`.

**Non-Goals:**
- Drawing the capybara or any hazard sprites (P3/P4).
- Keyboard input, score, lives, HUD (P3+).
- Fetching or parsing `manifest.json` at runtime.
- Changing canvas dimensions or scale from P1.

## Decisions

### 1. Hardcoded `TILE_FRAMES` constant (Option C)

Embed the four environment tile source rectangles in `game.js`, copied from `assets/sprites/manifest.json`:

| Key | sx | sy | sw | sh |
|---|---|---|---|---|
| `tile_start` | 0 | 32 | 16 | 16 |
| `tile_path` | 16 | 32 | 16 | 16 |
| `tile_median` | 32 | 32 | 16 | 16 |
| `tile_spa` | 48 | 32 | 16 | 16 |

Load only `assets/sprites/capybara_crossing.png` via `new Image()` with a relative `src`. Tests inject a stub `{ image, frames: TILE_FRAMES }` object—no browser, no fetch.

**Alternative considered:** `fetch(manifest.json)`. Rejected: often blocked on `file://`; four rects are stable.

### 2. Simplified board with extra riverbank rows

Row map (12 cols each):

```
row 0  tile_spa     (goal)
row 1  tile_path    (road 1)
row 2  tile_median  (safe strip)
row 3  tile_path    (road 2)
row 4  tile_start   (riverbank)
row 5  tile_start
row 6  tile_start   (P3 spawn row)
```

`createDefaultBoard()` returns a `ROWS × COLS` array of tile keys. Pure function, fully unit-tested.

**Alternative considered:** ROADMAP’s 3-road / 2-median layout. Rejected per user choice to simplify while keeping two lanes + median for future collision scenarios.

### 3. Atlas load without blocking the loop

`boot()` starts `startLoop` immediately. `loadAtlasImage(onLoad)` sets `state.atlas` when `Image.onload` fires. `renderBoard` no-ops (after clear) until `state.atlas` exists. Optional: keep P1 solid fill as fallback behind tiles—once atlas loads, tiles cover it.

**Alternative considered:** Delay loop until atlas loads. Rejected: loop and tests stay simpler; brief empty frame acceptable.

### 4. Render pipeline shape

```js
function render(ctx, state) {
  ctx.clearRect(...);
  renderBoard(ctx, state);   // layer 1 — this change
  // renderEntities(ctx, state);  // P3+ stub omitted
  // renderHud(ctx, state);       // P5+ stub omitted
}
```

`drawTile(ctx, atlas, col, row, tileKey)` computes destination `(col * TILE_SIZE * SCALE, row * TILE_SIZE * SCALE)` and calls `drawImage` with integer coordinates.

### 5. Tests before implementation

Add `tests/rendering.test.mjs`:

- `createDefaultBoard()` row/column tile keys match spec layout.
- `drawTile` / `renderBoard` call `drawImage` with expected source and destination rects on stub ctx/atlas.
- `render` invokes board draw after clear when atlas present.
- Existing `tests/engine.test.mjs` updated if `render` behavior changes (e.g. no longer always `fillRect` when atlas loaded).

Export new helpers via CJS footer for coverage.

## Risks / Trade-offs

- [Manifest drift] → Comment in `game.js` points to manifest; only four rects duplicated.
- [Relative image path on `file://`] → Path `assets/sprites/capybara_crossing.png` relative to `index.html` at repo root; verify with disk open and `npm run serve`.
- [Coverage on async onload] → Test atlas path with pre-set `state.atlas`; optional small test for load callback wiring with stub `Image` factory injected into `boot` options if needed for branch coverage.

## Migration Plan

Extend `game.js` in place. No breaking API. Rollback is revert. P3 adds player draw in a new render layer without changing board layout.

## Open Questions

None. Row 6 is the intended bottom spawn row for P3 (column 6); no capybara drawn in P2.
