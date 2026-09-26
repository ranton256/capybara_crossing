'use strict';
// Covers openspec/changes/danger/specs/collision/spec.md

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PHASES, LANES, MAX_DELTA_SECONDS, STARTING_LIVES, DEATH_SECONDS,
  createState, createInput, pressKey, update,
  overlaps, playerBox, hazardBox, hits, hitBy,
} = require('./game.js');

const FRAME = 1 / 60;
const player = (col, row) => ({ col, row, facing: 'up' });
const truck = (x, row) => ({ row: row === undefined ? 1 : row, x, width: 2, speed: 1.5, sprite: 'truck' });
const atv = (x, row) => ({ row: row === undefined ? 3 : row, x, width: 1, speed: -2.5, sprite: 'atv_red' });

// A board with the player placed deliberately and only the traffic a test wants.
function board(col, row, hazards, extra) {
  return Object.assign(createState(), {
    player: player(col, row),
    hazards: hazards || [],
  }, extra || {});
}

/* --- the boxes ----------------------------------------------------------- */

test('the player box is one tile, half-open', () => {
  const b = playerBox(player(6, 1));
  assert.equal(b.start, 6);
  assert.equal(b.end, 7);
  assert.equal(b.row, 1);
});

test('a hazard box is its own width, half-open', () => {
  const b = hazardBox(truck(3.5));
  assert.equal(b.start, 3.5);
  assert.equal(b.end, 5.5);
  assert.equal(b.row, 1);

  const a = hazardBox(atv(8));
  assert.equal(a.end - a.start, 1, 'a one-tile hazard spans one tile');
});

/* --- the overlap predicate ----------------------------------------------- */

test('overlaps is true only for a genuine intersection', () => {
  assert.equal(overlaps(6, 7, 5.5, 7.5), true, 'containing');
  assert.equal(overlaps(6, 7, 6.2, 6.8), true, 'contained');
  assert.equal(overlaps(6, 7, 6.9, 8.9), true, 'partial from the right');
  assert.equal(overlaps(6, 7, 4.5, 6.1), true, 'partial from the left');
});

test('spans that merely touch do not overlap', () => {
  // The classic tile-collision off-by-one. Closed intervals would make an
  // adjacent, non-overlapping vehicle lethal.
  assert.equal(overlaps(6, 7, 4, 6), false, 'hazard ends exactly where the player starts');
  assert.equal(overlaps(6, 7, 7, 9), false, 'hazard starts exactly where the player ends');
});

test('disjoint spans do not overlap', () => {
  assert.equal(overlaps(6, 7, 0, 2), false);
  assert.equal(overlaps(6, 7, 9, 11), false);
});

/* --- hits ---------------------------------------------------------------- */

test('overlapping spans on a shared row hit', () => {
  assert.equal(hits(player(6, 1), truck(5.5, 1)), true);
});

test('a hazard on an adjacent row never hits', () => {
  assert.equal(hits(player(6, 2), truck(5.5, 1)), false, 'player on the median');
  assert.equal(hits(player(6, 0), truck(5.5, 1)), false, 'player on the spa row');
  assert.equal(hits(player(6, 4), atv(5.5, 3)), false, 'player on the riverbank');
});

test('a hazard passing beside the player does not hit', () => {
  const state = board(6, 2, [truck(5.5, 1), atv(5.5, 3)]);
  assert.equal(hitBy(state), false, 'resting on the median between both lanes');
  assert.equal(state.lives, STARTING_LIVES);
});

test('touching exactly does not hit', () => {
  assert.equal(hits(player(6, 1), truck(7, 1)), false, 'truck begins where the player ends');
  assert.equal(hits(player(6, 1), truck(4, 1)), false, 'truck ends where the player starts');
});

test('hitBy reports a single event for two simultaneous overlaps', () => {
  const state = board(6, 1, [truck(5.5, 1), truck(6.5, 1)]);
  assert.equal(hitBy(state), true);
  assert.equal(typeof hitBy(state), 'boolean', 'one event, not a count');
});

test('hitBy is false on an empty lane', () => {
  assert.equal(hitBy(board(6, 1, [])), false);
});

/* --- when collision is evaluated ----------------------------------------- */

test('moving into a hazard kills in that same frame', () => {
  const input = createInput();
  const state = board(6, 2, [truck(5.5, 1)]);       // truck already covers col 6
  pressKey(input, 'ArrowUp');
  const after = update(state, FRAME, input);

  assert.equal(after.player.row, 1, 'the move was applied');
  assert.equal(after.phase, PHASES.DYING);
  assert.equal(after.lives, STARTING_LIVES - 1);
});

test('a hazard moving onto a stationary player kills in that same frame', () => {
  const input = createInput();
  // ATV moving left at 2.5 t/s, just right of the player, one frame away.
  const state = board(6, 3, [atv(7.01, 3)]);
  assert.equal(hitBy(state), false, 'clear to begin with');

  const after = update(state, FRAME, input);
  assert.equal(after.phase, PHASES.DYING, 'the traffic closed the gap');
  assert.equal(after.lives, STARTING_LIVES - 1);
});

test('the player is left where it was struck', () => {
  const input = createInput();
  const after = update(board(4, 1, [truck(3.5, 1)]), FRAME, input);
  assert.equal(after.phase, PHASES.DYING);
  assert.deepEqual(
    { col: after.player.col, row: after.player.row }, { col: 4, row: 1 },
    'held at the impact tile, not moved to spawn');
});

/* --- which phases are subject to collision -------------------------------- */

test('a dying player is not struck again', () => {
  const input = createInput();
  let state = update(board(6, 1, [truck(5.5, 1)]), FRAME, input);
  assert.equal(state.phase, PHASES.DYING);
  const afterFirst = state.lives;

  for (let i = 0; i < 20; i++) state = update(state, FRAME, input);
  assert.ok(state.lives >= afterFirst - 0, 'no further life lost to the same overlap');
  assert.equal(state.lives, STARTING_LIVES - 1, 'exactly one life for one death');
});

test('a sinking player is not struck', () => {
  const input = createInput();
  const state = board(6, 0, [truck(5.5, 0)], {
    phase: PHASES.SINKING, phaseElapsed: 0,
  });
  const after = update(state, FRAME, input);
  assert.equal(after.phase, PHASES.SINKING);
  assert.equal(after.lives, STARTING_LIVES);
});

test('traffic during a halted game does not strike', () => {
  const input = createInput();
  let state = board(6, 1, [truck(5.5, 1)], {
    phase: PHASES.GAME_OVER, phaseElapsed: 0, lives: 0,
  });
  for (let i = 0; i < 30; i++) state = update(state, FRAME, input);
  assert.equal(state.phase, PHASES.GAME_OVER);
  assert.equal(state.lives, 0, 'never goes below zero');
});

/* --- the margin this once-per-frame check depends on ---------------------- */

test('no hazard can cross the player tile between two collision checks', () => {
  // Collision is evaluated once per frame rather than swept. That is only sound
  // while a clamped frame advances a hazard less than the player's own width.
  // Asserted here as well as in hazards.test.js so the dependency is visible
  // from the collision tests, which are the ones that rest on it.
  const fastest = Math.max(...LANES.map((l) => Math.abs(l.speed)));
  const travel = fastest * MAX_DELTA_SECONDS;
  assert.ok(travel < 1,
    `a clamped frame moves a hazard ${travel} tiles; it must stay under the player's one tile`);
});

test('a hazard one clamped frame away is caught on the next check', () => {
  const input = createInput();
  const fastest = Math.max(...LANES.map((l) => Math.abs(l.speed)));
  // Place an ATV just clear of the player, closer than one clamped frame.
  const state = board(6, 3, [atv(7 + fastest * MAX_DELTA_SECONDS * 0.5, 3)]);
  assert.equal(hitBy(state), false, 'clear before the frame');

  const after = update(state, MAX_DELTA_SECONDS, input);
  assert.equal(after.phase, PHASES.DYING, 'caught rather than tunnelled through');
});
