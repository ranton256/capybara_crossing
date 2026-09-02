# Capybara Crossing

A retro arcade tutorial: hop a pixel-art capybara across jungle roads to a mud
spa. The **shipped game is three files** — `index.html`, `style.css`, `game.js` —
with no bundler and no runtime dependencies. Open `index.html` in a browser.

npm is **dev-only**: unit tests and one browser visual test.

## Play

- **Move:** arrow keys, one tile per press
- **Score:** +10 when you hop Up onto a row farther north than any you have
  reached this life — re-climbing ground you already covered does not pay again.
  +50 more for reaching the spa.
- **Lives:** 3. Touching an ATV or truck costs one, holds a short defeat beat,
  then respawns you at the start. Your score carries over.
- **Spa:** the whole top row. Reaching it sinks the capybara, then a fresh one
  starts the next round with your score and lives intact.
- **Game over:** lives reach 0. **Enter** or **Space** starts a new run.

## Run

No install required:

```bash
open index.html
```

Nothing is fetched at runtime, so `file://` works with no server. Add `?freeze=1`
to hold traffic still (used by the visual test).

## Development

Requires **Node.js 22+** (see `.nvmrc`).

```bash
npm install
```

That also copies `.githooks/pre-commit` into `.git/hooks`, so commits run
`npm test` and fail on a coverage miss.

| Command | What it does |
|---|---|
| `npm test` | Node unit tests plus the coverage gate (what pre-commit runs) |
| `npm run test:watch` | Re-run unit tests on change |
| `npm run test:e2e` | Playwright canvas snapshot against a committed baseline |
| `npm run test:e2e:update` | Rewrite that baseline |

`npm test` needs no third-party packages. The browser test does; note
`@playwright/test` is pinned to **1.56.1**, because later releases publish no
browser builds for macOS 12.

## How it fits together

```
index.html          # boot; assigns window.game so tests can inspect state
style.css           # crisp pixel canvas
game.js             # constants, loop, input, hazards, collision, render
assets/sprites/     # 128x128 atlas, frame map, palette
tests/*.test.mjs    # unit tests
tests/e2e/          # browser visual gate
openspec/           # capability specs and archived changes
```

Three conventions worth knowing before editing `game.js`:

- **Nothing reads `manifest.json` at runtime.** Sprite source rectangles are
  constants in `game.js`; `fetch` is blocked over `file://`. Tests read the
  manifest and assert the constants still match it, so a typo fails the suite.
- **`game.js` ends with a guarded `module.exports`.** The browser never defines
  `module`, so it is inert there; Node imports it for the unit tests.
- **The update phase is the only thing that mutates the world.** Key handlers
  record intent (`pendingDirection`, `pendingRestart`) and `update` applies it,
  in the order: restart, input, hazards, beat completion, collision, goal.

Behavior is specified in `Capybara Crossing.md`; `ROADMAP.md` maps each milestone
to the spec section it implements. The optional features there — countdown timer,
difficulty scaling, audio, and localStorage high scores — are deliberately not
implemented.
