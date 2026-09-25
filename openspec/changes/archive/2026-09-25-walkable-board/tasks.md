## 1. Skeleton and constants

- [x] 1.1 Create `index.html` with a 576x336 `<canvas>`, an `<img>` for
  `assets/sprites/capybara_crossing.png`, a `<link>` to `style.css`, and a plain
  `<script src="game.js">` with no `type="module"`. Verify by opening the file
  directly with `open index.html` and confirming the page loads with an empty console.
- [x] 1.2 Create `style.css` setting a dark page background, centring the canvas, and
  applying `image-rendering: pixelated` to it. Verify the canvas is centred and the
  computed style shows the pixelated value.
- [x] 1.3 Create `game.js` with the section order fixed by `design.md` — constants,
  pure logic, rendering, boot, export guard — using comment banners. Verify the file
  loads in the browser without error.
- [x] 1.4 Declare board constants: `COLS` 12, `ROWS` 7, `TILE` 16, `SCALE` 3, the
  spawn cell (column 6, row 6), and the row-role mapping for rows 0 through 6. Verify
  a unit test asserts `COLS * TILE * SCALE === 576` and `ROWS * TILE * SCALE === 336`.
- [x] 1.5 Declare the atlas source rectangles needed by M1 — the four tiles and the
  eight capybara frames — transcribed from `assets/sprites/manifest.json`. Verify a
  unit test reads the manifest with `node:fs` and asserts every declared rectangle
  matches the recorded frame, so a transcription error fails rather than renders wrong.

## 2. Pure logic

- [x] 2.1 Implement `createState()` returning the initial world state: player at the
  spawn cell facing up. Verify a unit test asserts column 6, row 6, facing up.
- [x] 2.2 Implement `movePlayer(state, direction)` returning new state with the player
  translated one tile and facing set. Verify unit tests cover each of the four
  directions from an interior cell and assert positions stay integral.
- [x] 2.3 Add boundary clamping to `movePlayer` so an outward press leaves position
  unchanged while still updating facing. Verify unit tests press outward from all four
  edges and assert position is unchanged and facing is updated.
- [x] 2.4 Implement `update(state, dt, input)` as the single seam: consume at most one
  pending direction from `input`, apply it, and return new state. Verify a unit test
  asserts a pending direction is applied exactly once and the slot is not re-consumed
  on the following call.
- [x] 2.5 Make `update` ignore unrecognised input values. Verify a unit test passes a
  non-directional key and asserts state is unchanged.

## 3. Rendering

- [x] 3.1 Implement context setup: `setTransform(3, 0, 0, 3, 0, 0)` then
  `imageSmoothingEnabled = false`, in that order. Verify by drawing one tile and
  confirming it covers 48x48 canvas pixels with hard edges under magnification.
- [x] 3.2 Implement `drawBoard(ctx, atlas)` mapping each row to its tile — row 0 spa,
  rows 1 and 3 path, row 2 median, rows 4 to 6 riverbank, drawn unmodified so the
  grass band repeats per `DECISIONS.md` gap 5. Verify visually that there is exactly
  one road row per lane and the riverbank reads as three banded rows.
- [x] 3.3 Implement `drawPlayer(ctx, atlas, state)` selecting the capybara frame from
  the player's facing and drawing it at the occupied tile. Verify the capybara appears
  at column 6, row 6 on load and moves with arrow keys.
- [x] 3.4 Implement `render(ctx, atlas, state)` to clear the full canvas, then draw
  board, then player, in that order, taking state as read-only. Verify no ghosting
  when moving the capybara rapidly across the board.

## 4. Boot and input

- [x] 4.1 Wire a `keydown` listener on `window` that records at most one pending
  direction, latest press wins, and calls `preventDefault()` for the four arrow keys.
  Verify arrow keys do not scroll the page and that holding two keys applies only the
  most recent.
- [x] 4.2 Implement the `requestAnimationFrame` loop computing elapsed seconds from
  the frame timestamp, clamped to 0.1s, with the first frame yielding zero. Verify a
  unit test on the extracted clamp helper covers a 5-second gap, a normal 16ms frame,
  and the first-frame case.
- [x] 4.3 Order each tick as update-then-render, passing the updated state to render.
  Verify a unit test asserts `render` is never called with pre-update state, using a
  stub context.
- [x] 4.4 Gate loop start on `img.onload`, and add an `onerror` handler that draws a
  visible failure message to the canvas. Verify by temporarily pointing the `<img>` at
  a missing path and confirming the message appears instead of a silent blank canvas.
- [x] 4.5 Add the export guard testing both `typeof module !== 'undefined'` and
  `module.exports`, exporting the constants and pure functions the tests reach. Verify
  `node -e "require('./game.js')"` succeeds and the browser still boots cleanly.

## 5. Verification

- [x] 5.1 Run `node --test` and confirm the full suite passes with nothing installed
  and no `package.json` present.
- [x] 5.2 Confirm the delta-time contract by a test applying one second as 60 steps
  and as 120 steps and asserting equivalent resulting state within tolerance, so M3
  inherits a proven contract.
- [x] 5.3 Grep the three shipped files for `fetch`, `XMLHttpRequest`, and
  `type="module"` and confirm no match, satisfying the zero-dependency scenario in
  `specs/game-loop/spec.md`.
- [x] 5.4 Walk the capybara to all four board corners and into every edge from
  `file://`, confirming it never leaves the board and no console error is produced.
- [x] 5.5 Run the `project-critic` skill against the working tree and resolve anything
  it rejects before the change is considered complete.
