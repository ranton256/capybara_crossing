# Capybara Crossing Roadmap

Milestones derived from `Capybara Crossing.md`. Each is one OpenSpec change:
propose → apply → archive. Every milestone ends green on `npm test`.

The shipped game stays three files (`index.html`, `style.css`, `game.js`) with
no runtime dependencies. npm is dev-only.

| # | Change | Delivers | Spec source |
|---|---|---|---|
| P1 | `boot-canvas-loop` | Three-file boot, 576×336 canvas at integer scale ×3, smoothing off, `requestAnimationFrame` update-then-render, guarded `module.exports` | Game Engine Architecture and Loop Execution; Fixed Parameters |
| P2 | `world-tile-grid` | Atlas loaded via `<img>` with hardcoded source rects, 12×7 board (row 0 spa · 1 road · 2 median · 3 road · 4–6 riverbank), background drawn first | Canvas Rendering Pipeline; Fixed Parameters |
| P3 | `hop-grid-input` | Arrow keys move exactly one tile, boundary clamping, spawn at column 6 row 6 facing up, walk frames, +10 on a new farthest-north row per life, HUD | Discrete Grid Input Management; Advancing toward the spa |
| P4 | `traffic-lanes` | Row 1 trucks moving right at 1.5 tiles/sec (2 tiles wide), row 3 ATVs moving left at 2.5 tiles/sec, edge wrapping, right-movers drawn flipped, delta-time motion | Continuous traffic flow; Fixed Parameters |
| P5 | `hit-aabb-lives` | AABB overlap, 3 starting lives, 550ms death beat with defeat pose and 100ms flash, respawn at start, watermark reset | Capybara Collision Detection; Dodging jungle hazards |
| P6 | `spa-goal-round` | Entire top row is the goal, +50 bonus, 400ms sink beat, fresh capybara at start, score and lives persist | Reaching the ultimate goal; Game State and Level Lifecycle |
| P7 | `game-over-restart` | Zero lives ends the run, overlay shows the final score, Enter or Space starts a new run | Zero-life game over trigger |

## Out of scope

The "Optional features" section of the spec stays unimplemented until asked:
countdown timer, progressive difficulty scaling, procedural audio, and
localStorage high scores.

## Conventions

- Game logic is plain functions; canvas and DOM access stays in thin wrappers.
- `game.js` ends with a guarded `module.exports` so Node tests can import it
  while the browser ignores it.
- Sprite source rectangles are constants in `game.js`. `manifest.json` is a
  build-time reference only — nothing fetches it at runtime.
