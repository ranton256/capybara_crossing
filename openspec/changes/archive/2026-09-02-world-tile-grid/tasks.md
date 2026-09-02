## 1. Atlas loading

- [x] 1.1 Add `ATLAS_PATH` and `TILE_FRAMES` constants to `game.js`, transcribed
      from `manifest.json` with a comment naming the source; verify a test reads
      `manifest.json` and asserts each rect matches
- [x] 1.2 Implement `loadAtlas(callback, options)` using an injectable
      `ImageCtor` defaulting to `Image`; verify a test with a fake constructor
      fires `onload` and receives the atlas
- [x] 1.3 Store the atlas on game state from `boot` once loaded; verify a test
      asserts `state.atlas` is set after the fake image loads

## 2. Board

- [x] 2.1 Add `ROW_TILES` describing the seven rows from the Fixed Parameters
      table; verify a test asserts row 0 is spa, 1 and 3 are road, 2 is median,
      4 through 6 are riverbank
- [x] 2.2 Implement `createDefaultBoard()` returning a 7×12 grid of tile keys;
      verify a test asserts the grid shape and that every row is filled across
      all 12 columns

## 3. Tile rendering

- [x] 3.1 Implement `drawTile(ctx, atlas, col, row, tileKey)` blitting the tile's
      source rect to a 48×48 destination; verify a test asserts the destination
      rectangle for a known cell is at x = col × 48, y = row × 48
- [x] 3.2 Implement `renderBoard(state, ctx)` drawing all 84 cells, returning
      early when the atlas is absent; verify a test counts 84 `drawImage` calls
      with an atlas and 0 without
- [x] 3.3 Call `renderBoard` from `render` immediately after the clear; verify a
      test asserts the trace begins with `clearRect` followed by tile draws

## 4. Verification

- [x] 4.1 Run `npm test` and verify the suite passes with coverage at or above
      80% for lines, functions, and branches
- [x] 4.2 Render `index.html` over `file://` in a headless browser and confirm
      the board paints: spa row on top, two road rows split by a median, three
      riverbank rows below
- [x] 4.3 Run `openspec validate world-tile-grid --strict` and confirm it passes
