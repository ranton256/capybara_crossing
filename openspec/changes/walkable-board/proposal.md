## Why

The repository contains a complete specification and a finished sprite atlas, and no
code at all. Nothing can be verified, demonstrated, or built upon until a capybara
can be moved around a drawn board.

This is the first of five milestones (see `DECISIONS.md`). It carries the whole
setup cost for the project: the three-file zero-dependency layout, the frame-rate
independent loop, the render order, and — most importantly — the seam that keeps
game logic testable outside a browser. Every later milestone assumes these exist.
Getting the seam wrong here is expensive to correct later, because by M4 there will
be collision, timers, and lifecycle logic tangled into whatever shape M1 established.

Scope is deliberately narrow: a board you can walk around on. No hazards, no
scoring, no goal, no lives. Those arrive in M2 through M5.

## What Changes

- Add `index.html`, `style.css`, and `game.js` — the only three files the game will
  ever ship. The page boots from `file://` with no server, no build step, and no
  package manager.
- Load the sprite atlas through an `<img>` element. Sprite source rectangles are
  copied from `assets/sprites/manifest.json` into `game.js` as constants at
  authoring time. The manifest is never read at runtime: `fetch`,
  `XMLHttpRequest`, and `<script type="module">` are all blocked over `file://`.
- Render the 12x7 board from the four tile sprites, with row roles fixed by the
  spec: row 0 spa, row 1 road, row 2 median, row 3 road, rows 4-6 riverbank. The
  riverbank grass band repeats across all three rows, as decided in `DECISIONS.md`.
- Drive the frame with `requestAnimationFrame`, splitting each tick into an update
  phase and a render phase. Elapsed time is measured in seconds and clamped to
  0.1s before it reaches any update function, so a backgrounded tab cannot return
  and advance the world by several seconds in one step.
- Move the capybara on discrete grid coordinates in response to `ArrowUp`,
  `ArrowDown`, `ArrowLeft`, and `ArrowRight`. Movement is one whole tile per press,
  with no interpolation and no floating-point position.
- Clamp movement at the board edges: a press directed outward leaves the capybara
  where it is rather than moving it off-screen. Row 0 is walkable in this milestone;
  it becomes the goal in M2.
- Expose state transitions through a guarded `module.exports` block that the browser
  ignores, so a Node test can import `game.js` with no canvas and no DOM present.
- Add unit tests runnable with `node --test`, which needs no `package.json` and no
  installed packages.

Non-goals for this milestone, stated so they are not smuggled in: hazards, collision,
scoring, lives, the HUD, the state machine, and every item under the spec's
"Optional features" heading.

## Capabilities

### New Capabilities

- `game-loop`: Boot and execution cycle. Zero-dependency `file://` startup, the
  `requestAnimationFrame` tick, the update-then-render ordering, delta time
  expressed in seconds and clamped, and the guarded export seam that makes game
  logic callable outside a browser.
- `grid-movement`: The board's coordinate model and player input. Discrete
  tile-addressed positions, one-tile translation per directional key press, and
  boundary clamping at the outer edges of the 12x7 grid.
- `rendering`: The canvas drawing pipeline. Crisp pixel-art scaling with
  anti-aliasing disabled, full-canvas clear each frame, atlas-sourced sprite
  drawing, the fixed row-to-tile mapping of the board, and painter's-algorithm
  layer order (background, then entities, then HUD).

### Modified Capabilities

None. This is the project's first change; `openspec/specs/` is empty.

## Impact

**New files.** `index.html`, `style.css`, `game.js` at the repository root, plus at
least one `*.test.js` for the Node test runner.

**Existing files.** None modified. `Capybara Crossing.md` stays unedited on purpose —
students read it cold, and `DECISIONS.md` records the gaps rather than closing them
in the source document.

**Dependencies.** None added, at runtime or otherwise. Tests run on Node's built-in
`node --test`, so no `package.json` is introduced. Playwright is present in an
untracked `node_modules/` but is not used by this change.

**Constraints this change locks in for M2-M5.** The export seam determines how every
later behaviour gets tested. The update/render split determines where the state
machine lands in M2. The delta-time contract determines whether M3's hazard speeds
are reproducible. These are the reasons M1 is the largest milestone despite
producing the least gameplay.
