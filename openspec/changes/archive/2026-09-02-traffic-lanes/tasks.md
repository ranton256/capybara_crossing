## 1. Hazard model

- [x] 1.1 Add `HAZARD_FRAMES` source rects for truck, atv_red, and atv_blue,
      transcribed from `manifest.json`; verify a test asserts each matches
- [x] 1.2 Add `TRUCK_SPEED` 1.5 and `ATV_SPEED` 2.5 in tiles per second; verify a
      test asserts ATV speed exceeds truck speed
- [x] 1.3 Implement `createInitialHazards()` placing trucks on row 1 moving right
      and ATVs on row 3 moving left; verify a test asserts row assignment,
      widths, and direction signs

## 2. Motion

- [x] 2.1 Implement `moveHazards(state, dt)` advancing by `vx * dt / 1000`;
      verify a test asserts one 32ms step equals two 16ms steps
- [x] 2.2 Wrap by subtracting the period `COLS + width` at each edge; verify
      tests cover a right-moving and a left-moving wrap, and that the sub-tile
      remainder is preserved
- [x] 2.3 Skip motion entirely when freeze is set; verify a test asserts
      positions are unchanged after an update with freeze on
- [x] 2.4 Call `moveHazards` from `update`; verify a test asserts hazards move
      during a normal update

## 3. Rendering

- [x] 3.1 Implement `renderHazards(state, ctx)` drawing each hazard at its lane
      row and position; verify a test asserts the destination rect for a known
      hazard, including double width for trucks
- [x] 3.2 Mirror right-moving hazards with save/translate/scale/restore; verify
      tests assert a right-mover is flipped, a left-mover is not, and the
      transform is restored
- [x] 3.3 Call `renderHazards` from `render` between tiles and player; verify a
      test asserts the draw order

## 4. Verification

- [x] 4.1 Run `npm test` and verify the suite passes with coverage at or above
      80% for lines, functions, and branches
- [x] 4.2 Regenerate the visual baseline under `?freeze=1` and run
      `npm run test:e2e`; verify vehicles appear on both road rows facing their
      direction of travel
- [x] 4.3 Run `openspec validate traffic-lanes --strict` and confirm it passes
