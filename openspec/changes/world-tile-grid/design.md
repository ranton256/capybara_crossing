## Context

See `proposal.md` — Why. P1 left `render` clearing to a flat colour with an
injectable-scheduler test seam already in place. The `file://` constraint from
the engine spec still binds: the atlas can only arrive through an `<img>`, never
through `fetch`.

The supplied art carries two quirks that shape the board (both are called out in
`Capybara Crossing.md` under the sprite-sheet tip):

- `tile_start` has its grass band baked into the top row only.
- `tile_path` has road shoulders baked into its top and bottom rows, leaving
  roughly 10px of asphalt.

## Goals / Non-Goals

**Goals:**

- Draw the exact board the Fixed Parameters table specifies.
- Prove the no-manifest-fetch rule in shipped code, not just in prose.
- Keep the render phase safe on the frames before the atlas decodes.

**Non-Goals:**

- Per-cell tile variation or seam-hiding. The art has one tile per terrain type;
  visible repetition across a row is expected and accepted at this scale.
- Off-screen caching of the board to a second canvas. 84 `drawImage` calls per
  frame is trivial, and caching would obscure the painter's-algorithm ordering
  the spec is teaching.

## Decisions

**Source rectangles transcribed as constants, with the origin recorded.**
`TILE_FRAMES` holds the four `{sx, sy, sw, sh}` rects copied from
`assets/sprites/manifest.json`, with a comment naming that file as their source.
Reading the manifest at runtime is the obvious alternative and is exactly what
the spec forbids, because `fetch` fails over `file://`. A build step that
generates the constants was considered and rejected: it reintroduces a toolchain
the three-file rule exists to avoid.

**Board as a row-of-tile-keys array, expanded to a full grid.** `ROW_TILES` lists
one tile key per row, and `createDefaultBoard()` expands it into a 7×12 array of
keys. Storing the full grid rather than reading `ROW_TILES` at draw time means P6
and later can vary individual cells without reshaping the renderer.

**Injectable image constructor.** `loadAtlas` takes an optional `ImageCtor` and
invokes a callback on load. Tests pass a fake constructor, fire `onload`, and
assert the atlas reaches state — no DOM, no real file I/O, no waiting. The
browser path passes nothing and gets `Image`.

**Atlas readiness is a state check, not an exception.** `renderBoard` returns
early when the atlas is absent. The loop starts before the image decodes, so the
first frames legitimately have no atlas; treating that as an error would make
normal startup noisy.

**One row constant drives both the board and later lane logic.** Row indices for
the two road rows are the same numbers P4's traffic will use. Keeping the layout
in one place avoids the board and the hazard lanes drifting apart.

## Risks / Trade-offs

- **A wrong source rectangle produces subtly wrong art rather than an error** →
  a test asserts the four rects match the values in `manifest.json`, read at test
  time, so a transcription slip fails the suite even though the game never reads
  that file.
- **Baked-in tile bands make stacked rows look striped** → accepted, and now
  documented in the spec's art notes. The board uses one road row per lane, which
  is what the art was drawn for; the three riverbank rows do repeat their grass
  band, which reads as texture at this scale.
- **Drawing 84 cells every frame is redundant work for a static board** → it is
  well under any frame budget at this size, and it keeps the render phase
  stateless, which matters more for a teaching codebase.
