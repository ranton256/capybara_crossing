## Why

`Capybara Crossing.md` requires a game that runs from `index.html` opened
straight off disk, with no bundler, package manager, or local server. Nothing
exists yet. P1 establishes that boot path and the update-then-render loop every
later milestone attaches to, and it proves the two constraints that are easy to
violate later: no runtime module loading, and game logic that Node can import
without a browser.

## What Changes

- Add the three shipped files: `index.html`, `style.css`, `game.js`.
- Add a canvas whose backing store is 576×336 (12 columns × 7 rows of 16px
  tiles at integer scale ×3), per the spec's Fixed Parameters table.
- Disable image smoothing on the 2D context and request nearest-neighbour
  scaling in CSS so later 16×16 art stays blocky.
- Add a `requestAnimationFrame` loop where each callback completes the update
  phase before the render phase, clears the full drawing surface, and schedules
  the next frame.
- End `game.js` with a guarded `module.exports` block so the Node test harness
  can import the logic while the browser ignores it.
- Load `index.html` with a classic `<script src>` tag; no `type="module"`, and
  no runtime `fetch` of `manifest.json`.

Out of scope for P1: tiles, sprites, input, hazards, collision, HUD.

## Capabilities

### New Capabilities

- `engine`: zero-dependency browser boot, crisp integer-scale canvas, and the
  `requestAnimationFrame` update-then-render loop, plus the testability seam
  that exposes game logic to Node.

### Modified Capabilities

None. This is the first change in the project.

## Impact

- New files: `index.html`, `style.css`, `game.js`, `tests/engine.test.mjs`.
- The existing coverage gate in `package.json` already targets `game.js`, so it
  becomes live with this change: the suite must cover ≥80% of lines, functions,
  and branches from here on.
- No dependencies added. The shipped game stays dependency-free; npm remains
  dev-only.
