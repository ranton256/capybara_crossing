## Context

The repository has a specification, a sprite atlas, and no code. See `proposal.md` —
Why for motivation, and `DECISIONS.md` for the gaps in `Capybara Crossing.md` that
were resolved before planning began.

Three constraints shape everything below and none of them are negotiable:

- **The game runs from `file://`.** No server, no bundler, no package manager. This
  rules out ES modules, `fetch`, and `XMLHttpRequest` — browsers block all three on
  that protocol. It is the reason the sprite atlas arrives through an `<img>` element
  and the reason `manifest.json` is a build-time reference for humans rather than a
  runtime input.
- **Three files ship: `index.html`, `style.css`, `game.js`.** Game logic and canvas
  glue live in the same file, so the separation between them has to be established by
  discipline rather than by file boundaries.
- **Logic must be testable outside a browser.** The spec requires state transitions to
  be plain functions callable with no canvas and no DOM, reachable through a guarded
  `module.exports` block that the browser ignores.

M1 produces very little gameplay and nearly all of the structure. The decisions here
are the ones that M2 through M5 cannot renegotiate cheaply.

## Goals / Non-Goals

**Goals:**

- Establish a single seam between world state and the browser, such that every
  behaviour specified in M2 through M5 can be tested through it without a DOM.
- Make the update phase the only place world state changes, so that M2's modal states
  (`SINKING`, `DYING`, `GAME_OVER`) can suppress input by simply not consuming it.
- Fix the time contract — seconds, clamped, measured once per frame — before M3
  introduces anything whose speed depends on it.

**Non-Goals:**

- A state machine. M1 has exactly one state, so introducing the enum now would be
  scaffolding without a second case to justify its shape. M2 introduces it alongside
  `SINKING`, which is its first real instance. The input-buffering decision below is
  what makes that introduction cheap.
- An entity system. M1 has one entity. Hazards arrive in M3 and will be a plain array.
- Any abstraction whose second use case does not yet exist.

## Decisions

### State is a plain object; transitions are pure functions over it

World state is one plain JavaScript object — no classes, no getters, no prototype
chain. Transitions have the shape `fn(state, ...args) -> state`, returning a new
object rather than mutating the argument.

The single seam the loop drives is:

```
    update(state, dt, input)  ->  state'          pure, no DOM
    render(ctx, state)                            draws, returns nothing
```

*Why:* a pure function is testable by calling it and comparing the result, which is
exactly what `node --test` can do with no browser. It also makes the update/render
ordering requirement self-enforcing: `render` receives a state it cannot change.

*Alternative considered — mutate state in place.* Fewer allocations, and testing still
works by asserting on the mutated object. Rejected because the discipline is weaker:
nothing stops `render` from writing to state, and by M4 the temptation to adjust lives
from inside a draw call is real. The allocation cost is one small object per frame for
a game with at most six entities, which is not a consideration at this scale.

### Input is buffered and consumed in the update phase

The `keydown` handler does not move the player. It records at most one pending
direction, and `update` consumes it. The latest press wins; the slot is cleared when
consumed.

*Why:* this is the decision that makes M2 through M5 cheap. Modal states ignore input
by declining to consume the pending slot — no flag checks scattered through an event
handler, no listener to detach and reattach. It also satisfies the requirement that
the update phase processes input, rather than input arriving asynchronously between
phases and producing a frame drawn from a half-updated state.

*Alternative considered — move the player directly in the `keydown` handler.* Simpler
by one indirection, and adequate for M1 alone. Rejected because M2 immediately needs
input suppression during the 400ms sink beat, and retrofitting the buffer at that point
means rewriting the input path with gameplay already depending on it.

*Why a single slot rather than a queue:* a queue lets presses accumulate during a
550ms death beat and then fire in a burst on respawn. A single slot discards them,
which is the behaviour a player expects.

### The canvas transform carries the ×3 scale

The canvas is 576×336 as the Fixed Parameters require. Rather than multiplying every
coordinate by 48, the context is scaled once at startup with
`setTransform(3, 0, 0, 3, 0, 0)`, after which all drawing happens in 16-pixel tile
units that match the atlas directly.

*Why:* a tile's destination rectangle becomes `col * 16, row * 16, 16, 16`, identical
in form to its source rectangle in the atlas. Scale factor appears once in the codebase
instead of at every draw site, and there is nowhere for a stray `* 3` to be forgotten.

*Trade-off:* `ctx.imageSmoothingEnabled = false` must be set after the transform is
applied and re-set if the context is ever reset. This is the one place the decision
costs something.

### The atlas load is a boot gate, not a per-frame check

`img.onload` sets a ready flag and starts the loop. The loop does not begin until the
atlas is decoded.

*Why:* it removes the "is the image ready" branch from the render path entirely. The
alternative — starting the loop immediately and early-returning from `render` until
ready — spreads the concern across every frame for the benefit of the first three.

*Trade-off:* if the atlas fails to load, nothing happens at all rather than a blank
board appearing. An `onerror` handler writes a visible message to the canvas so the
failure is not silent.

### Export guard tests both `module` and `module.exports`

```js
if (typeof module !== 'undefined' && module.exports) { module.exports = { ... } }
```

*Why:* testing `typeof module !== 'undefined'` alone is the common form and is not
quite safe — a browser extension or an injected script can define a bare `module`
object, and the assignment then throws during page load. Checking both costs one
clause and makes the browser path unconditionally safe.

### `game.js` is sectioned in dependency order

One file, with an enforced reading order: constants (board geometry, atlas rectangles,
timing) → pure logic → rendering → boot and event wiring → export guard.

*Why:* with logic and glue sharing a file, the only available boundary is positional.
Everything above the rendering section must be DOM-free, which makes "did I just put
logic in the wrong place" a question answerable by looking at where the cursor is. The
export block sits at the bottom and names exactly what the tests reach.

### Tests run on `node --test` with no `package.json`

Test files are `*.test.js` at the repository root, discovered by `node --test`.

*Why:* it needs nothing installed and adds no configuration file, which keeps the
repository as clean as the zero-dependency rule implies. A student clones the branch
and runs one command.

*Alternative considered — Playwright.* It is already present in an untracked
`node_modules/` and would give a genuine `file://` boot smoke test, which is the one
requirement unit tests cannot verify. Deferred rather than rejected: it requires a
`package.json` and changes what students see in the repository, and the boot path is
more usefully smoke-tested once there is a whole game behind it. Until then, the
zero-dependency requirement is verified by manual inspection and by the scenario in
`specs/game-loop/spec.md` that forbids the blocked transports.

## Risks / Trade-offs

**Frame-rate independence cannot be fully proven in M1** → M1 has nothing that moves
continuously, so the delta-time contract is only exercised by tests that call the
advance function directly with synthetic time steps. Those tests are written now
anyway, because M3 depends on the contract holding and will not be a good place to
discover it does not.

**Logic and DOM code share one file, so the seam can rot** → Enforced by section
order and by the test suite: every behaviour specified for M1 is tested through the
exported functions with no DOM present, so logic that drifts into the rendering
section becomes untestable and visibly so.

**`image-rendering: pixelated` has uneven historical support** → Both the CSS property
and `ctx.imageSmoothingEnabled` are set. Modern browsers honour at least one; the spec
targets modern browsers only.

**Row 0 is walkable in M1 but becomes the goal in M2** → A deliberate temporary
behaviour, specified as such in `specs/grid-movement/spec.md` rather than left as an
accident, so that M2's change to it is a specified modification rather than a
correction.

**Clamping at 0.1s is a guess about acceptable worst-case motion** → Recorded in
`DECISIONS.md` as an engineering judgment rather than a spec requirement. At M3's lane
speeds, 0.1s is at most 0.25 tiles of travel, which is well under the width of the
narrowest hazard, so nothing can pass through the player's tile within one clamped step.

## Open Questions

None blocking. The HUD's exact typeface and positioning are deferred to M2, which is
the milestone that introduces anything to display.
