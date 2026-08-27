## 1. Forward-progress scoring

- [x] 1.1 Tests: Up scores only when `nextRow < bestRowThisLife`; re-up after Down does not; OOB Up still no score; watermark resets on death respawn.
- [x] 1.2 Implement watermark in `hop` / boot / `resolveCollisions` / `finishSink` / `restartSession`; update existing gameplay tests that assumed every Up scores.

## 2. Difficulty after spa

- [x] 2.1 Tests: `finishSink` multiplies `speedFactor` by 1.10; `moveHazards` scales by factor; restart restores 1.0.
- [x] 2.2 Wire `speedFactor` through state, motion, spa completion, and session restart.

## 3. Persistence and HUD Best

- [x] 3.1 Tests: load/save Best via injectable storage; score past Best updates storage; restart keeps Best, clears score.
- [x] 3.2 Implement `loadBest` / `saveBest` / `maybeUpdateBest`; boot Best; HUD shows Best.

## 4. Presentation polish

- [x] 4.1 Tests: walk phase flips after hop; sink draw uses offset/squash cue; overlay text mentions Space.
- [x] 4.2 Implement walk-frame pairs, sink cue, overlay copy `Enter / Space to restart`.

## 5. Verify

- [x] 5.1 `npm test` ≥80% coverage; update Playwright baseline if HUD/overlay pixels change (`npm run test:e2e:update`) then `npm run test:e2e`.
- [x] 5.2 Update README briefly for forward scoring, Best, and difficulty reset on restart.
