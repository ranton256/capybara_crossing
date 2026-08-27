## Context

See proposal.md — Why. Existing suites (`tests/collision.test.mjs`, `session.test.mjs`, `gameplay.test.mjs`, `hazards.test.mjs`, `engine.test.mjs`) already cover many helpers in isolation. This change only adds or extends Node tests so review gaps are asserted under `npm test`. Gameplay code stays unchanged.

## Goals / Non-Goals

**Goals:**

- Map each ADDED testing requirement to a concrete `node:test` case.
- Prefer extending existing files over new harnesses.
- Keep coverage ≥80% (should stay high; no new `game.js` branches required).

**Non-Goals:**

- Changing `game.js` behavior, scoring policy, animation, or overlay copy.
- Expanding Playwright beyond the frozen-spawn snapshot.
- Chasing every uncovered defensive early-return line (invalid frame keys, missing Image ctor).

## Decisions

1. **Unit-only for these gaps**  
   Browser e2e for hop/hit/spa/Game Over would need flaky timing and input injection. Prefer one `update(...)` integration test in Node.  
   *Alternative considered:* Playwright keyboard flows — deferred; higher cost, still out of pre-commit.

2. **File mapping**  
   - Truck AABB → `tests/collision.test.mjs`  
   - Space + hazard reset → `tests/session.test.mjs` (extend Enter test or add sibling; assert `createInitialHazards()` deep equality or field-wise match after restart)  
   - Game Over freeze → `tests/session.test.mjs` or `hazards.test.mjs` via `update` with `gameOver: true`  
   - OOB Up no score → `tests/gameplay.test.mjs` or `input.test.mjs`  
   - Integration → `tests/engine.test.mjs` or `gameplay.test.mjs` calling `update` with pending Up into a hazard or spa  

3. **Hazard reset assertion**  
   Compare post-restart `state.hazards` to a fresh `createInitialHazards()` (deepEqual), not hardcoded literals, so spawn tweaks don’t duplicate constants.

4. **Integration case shape**  
   Prefer collision path: player on a road cell with pendingDirection null, hazard overlapping, `update` after setting pendingDirection — or pending Up into overlap. Assert lives decremented and player at start. Optionally a second small case for spa: pending Up from row 1 → score 60 and `sinkingUntil` set. One of the two is enough if the other paths stay covered by helpers; prefer including both if cheap.

## Risks / Trade-offs

- [Brittle deepEqual on hazards] → Use `createInitialHazards()` as oracle; avoid floating timestamps in hazard objects.  
- [Integration test too coupled to dt] → Use `dt` 0 or small when motion isn’t under test; freeze off only when motion is asserted.  
- [False confidence without e2e gameplay] → Accepted; visual gate remains separate.
