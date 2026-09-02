## Context

See `proposal.md` — Why. The blocker is specific: Firefox's `--screenshot` has no
wait condition, and the atlas `<img>` is created by JavaScript after the load
event, so the shot lands on an empty canvas. Playwright can wait for an arbitrary
page condition before capturing, which is the capability actually needed.

Playwright browser binaries are already cached on this machine, so the install
cost here is the npm package alone.

## Goals / Non-Goals

**Goals:**

- One check that proves the shipped `index.html` paints the real board in a real
  browser, loaded from disk.
- A baseline stable enough that P4's motion does not make it flap.

**Non-Goals:**

- Cross-browser coverage. One Chromium run is enough to catch a broken draw call;
  the game targets no browser-specific APIs.
- Putting the visual check in the pre-commit hook. Requiring a browser install to
  commit would make the repo hostile to a student cloning it fresh.

## Decisions

**Playwright over a hand-rolled headless driver.** Its `waitForFunction` plus
`toHaveScreenshot` do exactly the wait-then-compare this needs, with baseline
management included. The alternative — driving Firefox through the CDP/remote
protocol by hand — is more code to maintain than the thing it tests.

**Wait on an observable page condition, not a fixed sleep.** The test waits until
the canvas has a non-uniform pixel histogram, which is true only once tiles have
actually been drawn. A `waitForTimeout` would be flaky on a cold cache and slow
on a warm one.

**Freeze flag read from the query string.** `?freeze=1` sets a state flag that
later milestones honour when moving hazards. Introducing it now, before any
motion exists, means P4 has a stable baseline from its first commit rather than
needing the gate rewritten. The flag is inert today by construction.

**Baseline scoped to the canvas element, not the page.** Page chrome and window
size vary between machines; the canvas is a fixed 576×336 surface. Screenshotting
the element keeps the baseline meaningful.

**Separate script, not a separate test runner config for units.** `npm test`
keeps using `node --test` with zero dependencies. Someone who never runs
`npm install` can still run the unit suite.

## Risks / Trade-offs

- **A committed PNG baseline is machine-sensitive (font rendering, GPU)** → the
  shot is a pure canvas blit of nearest-neighbour pixel art with no text, which
  is deterministic across machines; a small pixel tolerance absorbs encoder
  differences.
- **The baseline must be regenerated whenever the board legitimately changes** →
  `npm run test:e2e:update` exists for that, and P3 onward will add entities on
  top of the board, so the baseline is expected to be refreshed at those points.
- **Playwright is a heavy dev dependency for a zero-dependency teaching repo** →
  it is confined to `devDependencies` and one script; a test asserts the shipped
  files still import nothing.
