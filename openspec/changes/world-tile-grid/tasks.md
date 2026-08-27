## 1. Failing rendering tests

- [ ] 1.1 Add `tests/rendering.test.mjs` that imports helpers from `game.js` (fails until they exist).
- [ ] 1.2 Test `createDefaultBoard()` returns 7×12 keys: row 0 all `tile_spa`, rows 1/3 `tile_path`, row 2 `tile_median`, rows 4–6 `tile_start`.
- [ ] 1.3 Test `drawTile` on stub ctx/atlas calls `drawImage` with correct source rect and scaled destination for a given cell.
- [ ] 1.4 Test `renderBoard` draws 84 tiles when `state.board` and `state.atlas` are set.
- [ ] 1.5 Test `render` clears then draws board when atlas is present; update `tests/engine.test.mjs` if render no longer always fills solid color.

## 2. Board and atlas constants in `game.js`

- [ ] 2.1 Add `TILE_FRAMES` (four rects from manifest) and `ATLAS_PATH` constant with a comment pointing at `assets/sprites/manifest.json`.
- [ ] 2.2 Implement `createDefaultBoard()` returning the simplified row layout.
- [ ] 2.3 Implement `drawTile`, `renderBoard`, and wire `render` to clear → `renderBoard` (no entity/HUD layers).
- [ ] 2.4 Implement `loadAtlasImage(callback)` using `new Image()`; set `state.atlas` on load. Export new helpers via CJS footer.

## 3. Boot integration

- [ ] 3.1 Initialize `state.board = createDefaultBoard()` in `boot`.
- [ ] 3.2 Call `loadAtlasImage` from `boot` without blocking `startLoop`.
- [ ] 3.3 Run `npm test` and keep `game.js` at ≥80% line, function, and branch coverage.

## 4. Verify P2 only

- [ ] 4.1 Open via `npm run serve` or disk: full tile board visible after atlas loads; no capybara, hazards, or HUD.
- [ ] 4.2 Confirm no `fetch` of `manifest.json`, no keyboard handlers, and no `drawImage` for character/hazard frames.
