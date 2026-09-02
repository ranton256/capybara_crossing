## 1. Shipped files

- [x] 1.1 Create `index.html` with a `<canvas id="game">`, a classic
      `<script src="game.js">`, and an inline `boot()` call; verify by opening
      the file over `file://` and seeing no console errors
- [x] 1.2 Create `style.css` with `image-rendering: pixelated` on the canvas and
      a dark page background; verify the canvas renders crisp, not blurred
- [x] 1.3 Create `game.js` with the derived constants `COLS` 12, `ROWS` 7,
      `TILE_SIZE` 16, `SCALE` 3, `CANVAS_WIDTH`, `CANVAS_HEIGHT`; verify a test
      asserts `CANVAS_WIDTH` is 576 and `CANVAS_HEIGHT` is 336

## 2. Canvas configuration

- [x] 2.1 Implement `configureCanvas(canvas)` to set the backing store to
      576×336, get the 2D context, and set `imageSmoothingEnabled = false`;
      verify a test passing a stub canvas asserts all three
- [x] 2.2 Confirm `style.css` requests crisp rendering for the same element;
      verify a test reads the stylesheet and asserts a pixelated rule is present

## 3. Loop

- [x] 3.1 Implement `update(state, dt)` as a no-op placeholder that records the
      elapsed time it received; verify a test asserts the recorded delta
- [x] 3.2 Implement `render(state, ctx)` to clear the full drawing surface;
      verify a test asserts `clearRect` covers 0, 0, 576, 336
- [x] 3.3 Implement `tick(state, ctx, now)` to compute the delta from the
      previous timestamp, run `update`, then run `render`; verify a test using a
      trace-recording context stub asserts update runs before render
- [x] 3.4 Implement `startLoop(state, ctx, options)` with an injectable
      `scheduler` defaulting to `requestAnimationFrame`; verify a test drives
      two frames with a fake scheduler and asserts the next frame is scheduled
      each time
- [x] 3.5 Implement `boot(options)` to find the canvas, configure it, build the
      initial state, and start the loop; verify a test boots against stubs
      without a real DOM

## 4. Test seam and gate

- [x] 4.1 Add the guarded `module.exports` block at the end of `game.js`
      exporting the constants and functions above; verify `tests/engine.test.mjs`
      imports `game.js` successfully under Node
- [x] 4.2 Add a test asserting `index.html` uses no `type="module"` and that
      `game.js` contains no `fetch` or `XMLHttpRequest` call, guarding the
      `file://` constraint
- [x] 4.3 Run `npm test` and verify the suite passes with coverage at or above
      80% for lines, functions, and branches on `game.js`

## 5. Verification

- [x] 5.1 Open `index.html` from disk and confirm a 576×336 canvas paints with
      no console errors and no network requests for `manifest.json`
- [x] 5.2 Run `openspec validate boot-canvas-loop --strict` and confirm it passes
