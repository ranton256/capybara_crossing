## 1. Failing engine tests

- [x] 1.1 Add `tests/engine.test.mjs` that `createRequire`s `../game.js` and fails until the file exists.
- [x] 1.2 Test `configureCanvas` on a stub canvas/`getContext`: sets width 576, height 336, and `imageSmoothingEnabled === false`.
- [x] 1.3 Test `tick` records update-then-render order (spy or ordered log) and that render calls `clearRect` for the full canvas.
- [x] 1.4 Test `startLoop` with a fake scheduler: the first callback schedules another frame (loop continues).
- [x] 1.5 Test `boot` with a stub `document`/`canvas` wires configure + `startLoop` and does not throw.

## 2. `game.js` to make tests pass

- [x] 2.1 Add `game.js` with exported constants (12×7×16×3 → 576×336) and `configureCanvas`, `update`, `render`, `tick`, `startLoop`, `boot`.
- [x] 2.2 Implement empty `update` (no input, hazards, or collision) and `render` that only `clearRect`s (optional solid fill). No `drawImage`, tiles, or HUD.
- [x] 2.3 Implement CJS `module.exports` footer. Do not auto-start the loop on load (Node `require` must not call `requestAnimationFrame`).
- [x] 2.4 Run `npm test` and raise coverage on `game.js` to at least 80% lines, functions, and branches.

## 3. Disk-openable page

- [x] 3.1 Add `index.html` with a canvas, classic `<script src="game.js">` (no `type="module"`), then a second script that calls `boot()`.
- [x] 3.2 Add `style.css` that sizes the canvas to 576×336 and sets `image-rendering: pixelated` plus crisp-edge fallbacks. Confirm `index.html` references the stylesheet.
- [x] 3.3 Confirm HTML/JS have no runtime npm imports and no bundler.

## 4. Verify P1 only

- [x] 4.1 Open `index.html` from disk (or equivalent `file://` check): canvas visible, no console module/dependency errors, loop running (canvas stays cleared/filled).
- [x] 4.2 Confirm this change does not load sprites, handle keys, or add `src/` modules.
