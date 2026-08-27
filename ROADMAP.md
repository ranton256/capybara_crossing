# Capybara Crossing roadmap

Capture of the required work in `Capybara Crossing.md`. **Do not implement from this file until a change is explicitly proposed and applied.** Optional features in the spec stay parked.

## Current state

```
DONE                         NOT STARTED
─────────────────────        ────────────────────────────────
16×16 sprites + 128 atlas    index.html / style.css / game.js
manifest.json frame map      canvas, loop, input, hazards
Capybara Crossing.md (BDD)   score / lives / game over
OpenSpec scaffolding         any playable slice
```

Art is complete under `assets/sprites/`. There is no playable game yet.

## Required vs parked

The Gherkin features are the required game. The last section of the spec (“Optional features”) is out of scope until requested.

| Required now | Parked until asked |
|---|---|
| Sprite sheet (done) | Round countdown timer |
| Three-file zero-dependency boot | Variable speeds + wrap as a *system* |
| `requestAnimationFrame` update-then-render | +10% speed per successful round |
| Discrete arrow-key grid moves | Web Audio beeps |
| Tile world + HUD paint order | `localStorage` high score |
| AABB collision, lives, respawn | |
| Goal = +50, new round | |
| 0 lives → Game Over | |

**Multi-lane is already required.** The collision scenario describes a median between road lanes, so the board needs at least two road rows and a safe strip. Wrapping, alternating directions, and per-lane speed curves are the optional extra.

River logs, monkey, and parrot sit in the art layout as alternative hazards, not in Optional features. Sprites exist; wiring them into gameplay can wait. Treat them as unused atlas frames until requested.

## File-layout fork (undecided)

`project.md` (OpenSpec init) and the game spec disagree.

```
  Spec (file:// tutorial)              project.md (OpenSpec init)
  ───────────────────────              ─────────────────────────
  index.html                           index.html
  style.css                            src/app.js
  game.js                              src/components/
  open the file, no server             src/utils/
                                       ES modules → usually needs http
```

A zero-dependency tutorial that opens from disk favors the spec’s three files. `type="module"` from `file://` is a common footgun. `project.md` is a generic vanilla-JS skeleton, not this game.

Phases below assume the spec’s three-file shape unless that decision is reversed.

## Playable-slice order

Do not build a complete engine before there is something to see. Each phase should be clickable.

```
  P0 art ───────────────────────────────────────────────┐
                                                         │
  P1 boot  →  canvas + crisp pixels + rAF empty loop     │
       │                                                 │
  P2 world →  tile grid, spa at top, start at bottom     │
       │                                                 ▼
  P3 hop   →  arrow keys, 1 tile, bounds, +10 on Up    atlas
       │
  P4 traffic → ATV + truck on ≥2 lanes, painter’s order
       │
  P5 hit   → AABB, Zzz, −1 life, respawn, score persists
       │
  P6 spa   → enter goal, +50, sink beat, next round
       │
  P7 over  → lives hit 0, Game Over, HUD on top
```

P0 is done. P1–P7 cover the required Gherkin.

Why this order:

- **P1 before world** — boot is `index.html` + `style.css` + `game.js`, no bundler, crisp pixels (`image-rendering` / `imageSmoothingEnabled = false`).
- **P2 before hop** — movement is one grid unit; the grid has to exist.
- **Up scores +10 before hazards** — first full Given/When/Then you can demo.
- **P4 before P5** — AABB against nothing teaches the wrong lesson.
- **Game Over last among required play** — lives have to mean something.

HUD (score + lives) can appear as soon as those numbers exist (P3/P5), not as its own epic.

## Suggested board (still unspecified in the spec)

The spec never names columns, rows, or scale. Tutorial-friendly default:

```
  col →  0  1  2  3  4  5  6  7  8  9  10  11
row 0    S  S  S  S  S  S  S  S  S  S   S   S     spa (goal)
row 1    ============= road (e.g. trucks →) ======
row 2    ............. median ....................
row 3    ============= road (e.g. ATVs  ←) ======
row 4    ............. median ....................
row 5    ============= road (e.g. ATVs  →) ======
row 6    R  R  R  R  R  R  R  R  R  R   R   R     riverbank start
```

Player starts bottom-center. Tile size 16, integer scale (×3 or ×4) so pixels stay blocky. The truck occupies **two cells**; AABB must use sprite width, not “everything is 16×16.”

## Spec holes to pin down before coding

These are missing constants, not optional features:

| Gap | Why it blocks |
|---|---|
| Grid size, canvas size, scale | Cannot draw a stable board |
| Starting lives | Game Over needs a number (3 is the arcade default) |
| Hazard speed / spawn | Required “speeding ATV” has no velocity |
| Sink animation | Goal says “happily sinks”; atlas has no sink frames — overlay on spa tile, or reuse idle |
| Game Over contents | Required; “score submission” without `localStorage` probably means on-screen final score + restart |
| Input while dead/sinking | Instant hop is specified; no i-frames or input lock on Zzz |

## Later OpenSpec shape (not created yet)

When work is proposed, prefer **one change for the required game**, not five. Optional timer / wrap / difficulty / beeps / `localStorage` stay out until someone asks.

```
implement-core-game
├── proposal.md     scope: required Gherkin only; optional parked
├── specs/
│   ├── engine/          3-file boot, rAF update→render
│   ├── input/           discrete grid + bounds
│   ├── rendering/       clear, tiles → entities → HUD
│   ├── gameplay/        hop, score, goal, round reset
│   ├── collision/       AABB, lives, game over
│   └── assets/          uses existing 128×128 atlas
├── design.md       file layout, grid constants, atlas drawImage
└── tasks.md        P1–P7, each checkbox-small
```

## Open decisions

1. Three files (`game.js`) vs `src/` modules — tutorial `file://` vs nicer structure.
2. One OpenSpec change for the whole required game, or split engine vs gameplay (heavier process, same code).
