## Context

See proposal.md for why this is P1. There is no `index.html` / `game.js` yet. `project.md` sketches `src/` ES modules; the game spec and ROADMAP require three classic files that open from `file://`. Dev-only Node 22 tests (`npm test`, 80% coverage on `game.js` and `src/**`) already exist; adding an untested `game.js` would fail that gate. Specs for this change live in `specs/engine/spec.md`.

## Goals / Non-Goals

**Goals:**
- Pick a file layout that works from disk and stays testable in Node.
- Pin canvas constants now so P2 (tile world) does not resize the viewport.
- Structure `game.js` so update and render are separate functions and frame order can be unit-tested with a fake scheduler.

**Non-Goals:**
- Loading the sprite atlas, drawing tiles, or wiring input (later milestones).
- Adding jsdom, canvas npm packages, or any runtime npm dependency.
- Changing `project.md` in this change (layout decision is recorded here; docs can catch up later).

## Decisions

### 1. Three classic files, not `src/` modules

`index.html` links `style.css` and a classic `<script src="game.js">` (no `type="module"`). That matches the Gherkin boot scenario and avoids `file://` module CORS issues.

**Alternative considered:** ES modules under `src/` as in `project.md`. Rejected for this tutorial: opening the file from disk is a required scenario, and splitting into modules would force a local server or bundler.

### 2. Canvas size locked to the suggested board

Internal canvas is 576×336: 12 columns × 7 rows × 16 px tiles × integer scale 3. CSS width/height match the backing store at 100% zoom. `ctx.imageSmoothingEnabled = false` plus `image-rendering: pixelated` (and `-webkit-crisp-edges` / `crisp-edges` as fallbacks).

**Alternative considered:** A throwaway 320×240 canvas for P1, then resize in P2. Rejected: a resize would churn CSS, tests, and later HUD layout.

**Alternative considered:** Scale ×4 (768×448). ×3 is enough for a readable 16×16 tile and fits more laptops without scrolling.

### 3. Boot only when `document` exists; export helpers for Node

Top-level `game.js` MUST NOT call `requestAnimationFrame` when the file is loaded. Pattern:

- Named functions: `configureCanvas(canvas)`, `update(state, dt)`, `render(ctx, state)`, `tick(state, ctx, now)`, `startLoop(scheduler, state, ctx)`, `boot()`.
- `boot()` queries `#game` (or the page canvas), configures it, and starts the loop.
- `index.html` loads `game.js` then calls `boot()` from a second classic script tag so Node `require` does not auto-start the loop and does not need a `typeof document` branch (that branch would miss coverage).
- CommonJS export footer so `tests/*.test.mjs` can `createRequire` the file: `configureCanvas`, `tick`, `startLoop`, `boot`, and the size constants.

**Alternative considered:** Duplicate logic in `src/` for tests and `game.js` for the browser. Rejected: two sources of truth and coverage would split.

**Alternative considered:** jsdom in tests. Rejected: extra dependency; canvas config and tick order can be tested with a stub `{ width, height, getContext }` and a fake `requestAnimationFrame`.

### 4. Empty update, clear-only render

`update` is a no-op (or only records that it ran, for tests). `render` calls `clearRect(0, 0, width, height)` and MAY fill with a solid dark color so the canvas is visible against a typical white page. No `drawImage`, no HUD text.

`tick` always calls `update` then `render` in that order. `startLoop` uses the injected scheduler in tests and `requestAnimationFrame` in the browser; each callback MUST schedule the next frame.

### 5. Tests before `game.js` body

Write `tests/engine.test.mjs` first (failing), then the minimum `game.js` / HTML / CSS to pass `npm test` at 80% line/function/branch coverage on `game.js`. HTML/CSS are not in the coverage include. Cover the CJS export footer by requiring `game.js` from tests; cover `boot` by calling it with a stub `document.getElementById` / canvas.

## Risks / Trade-offs

- [Coverage vs `file://` boot] → Do not auto-boot on script load. Tests `require` `game.js` and call `boot`/`tick` with stubs. Manual check: open `index.html` from disk.
- [Stub canvas ≠ real browser] → Tests assert width/height assignment and `imageSmoothingEnabled = false`; crisp CSS is a visual/file check, not Node coverage.
- [Constants in spec] → Changing grid size later is a spec change, not a silent CSS tweak.
- [`project.md` still mentions `src/`] → Follow this design until that doc is updated; do not add `src/` for P1.

## Migration Plan

Add the three runtime files and engine tests on this branch. No data migration. Rollback is revert. Later phases append to `game.js` rather than introducing a bundler.

## Open Questions

None that block P1. Grid layout of spa/road/median is P2.
