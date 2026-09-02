## Context

Nothing exists in the repo yet beyond the spec, the sprite atlas, and the dev
test harness. See `proposal.md` — Why. Two constraints from
`Capybara Crossing.md` shape every decision here:

1. `index.html` must work when opened from disk over `file://`. Browsers treat
   `file://` as an opaque origin, so `fetch`, `XMLHttpRequest`, and
   `<script type="module">` are all blocked there. Only classic scripts and
   `<img>` loads work.
2. The spec requires game logic that a Node test runner can import outside a
   browser, while the shipped game stays three dependency-free files.

The harness in `package.json` already gates coverage at 80% over `game.js`, so
whatever P1 adds must be reachable from tests.

## Goals / Non-Goals

**Goals:**

- A boot path that survives `file://` with no server.
- One `requestAnimationFrame` loop with a strict update-then-render order and a
  seam that lets tests drive frames deterministically.
- Elapsed time threaded into update from frame one, so P4's traffic can scale by
  time without reworking the loop.

**Non-Goals:**

- Any drawing beyond clearing the surface. Tiles land in P2.
- A fixed-timestep accumulator. The spec asks for frame-rate independence, not
  lockstep determinism; delta scaling is enough and is far simpler to teach.
- A module bundler, a dev server, or an npm runtime dependency.

## Decisions

**Classic script over ES modules.** `index.html` loads `game.js` with a plain
`<script src>` and calls `boot()` from a second inline script.
`<script type="module">` would be the modern default, but it is CORS-blocked on
`file://` and would break the spec's core "open it from disk" requirement.

**Guarded CommonJS export over ESM export.** `game.js` ends with:

```js
if (typeof module !== "undefined" && module.exports) { module.exports = { ... }; }
```

The browser never defines `module`, so the block is inert there; Node's test
runner imports it. Alternatives rejected: a separate `src/` module imported by
both (needs a bundler or module scripts, breaking constraint 1), and attaching
everything to `window` (untestable in Node without a DOM shim).

**Injectable scheduler and clock.** `startLoop` accepts an options object whose
`scheduler` defaults to `requestAnimationFrame` and whose time source defaults to
the callback timestamp. Tests pass a fake scheduler to step exactly one frame and
assert ordering, with no `requestAnimationFrame` and no real waiting. Without
this seam the loop is only testable through a browser, which contradicts the
spec's unit-testability requirement.

**Order asserted through an observable trace, not by inspecting internals.**
`tick` runs `update` then `render`; the test injects a context stub that records
the calls it receives, so the update-before-render and clear-before-draw
guarantees are verified as behavior rather than as call-order plumbing.

**Canvas size derived, not hardcoded.** `CANVAS_WIDTH` is computed as
`COLS * TILE_SIZE * SCALE` from the spec's Fixed Parameters rather than written
as `576`. The derived constants are exported so P2's board can reuse them and so
a test can assert the spec's 576×336 directly.

## Risks / Trade-offs

- **Delta-scaled motion can jump after a background tab resumes** → later
  milestones clamp the delta before using it; P1 only needs to pass it through,
  and the clamp lands with P4 where motion first depends on it.
- **The guarded export is unusual-looking to students** → it is documented in
  the spec's unit-testability scenario and in `ROADMAP.md` conventions, so it
  reads as a deliberate pattern rather than an accident.
- **An injectable scheduler adds a parameter students would not invent
  unprompted** → it stays optional with a `requestAnimationFrame` default, so
  the browser path reads normally and only tests pass the seam.
- **Coverage gate becomes live with this change** → P1 ships tests for boot,
  canvas configuration, frame ordering, and clearing, which covers the small
  surface it introduces.
