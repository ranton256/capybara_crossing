'use strict';
// Covers openspec/changes/traffic/specs/hazards/spec.md

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  COLS, ROWS, TILE, LANES, SPRITES, MAX_DELTA_SECONDS, PHASES, SINK_SECONDS,
  createState, createInput, pressKey, update,
  wrapDistance, createHazards, advanceHazard, advanceHazards,
} = require('./game.js');

const lane = (row) => LANES.find((l) => l.row === row);
const inLane = (hazards, row) => hazards.filter((h) => h.row === row);
const advance = (hazards, seconds, step) => {
  for (let t = 0; t < seconds - 1e-9; t += step) hazards = advanceHazards(hazards, step);
  return hazards;
};

// Gaps between consecutive hazards, measured around the lane's wrap.
function gaps(hazards, row) {
  const span = wrapDistance(lane(row));
  const xs = inLane(hazards, row).map((h) => h.x).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < xs.length; i++) {
    const next = i + 1 < xs.length ? xs[i + 1] : xs[0] + span;
    out.push(next - xs[i]);
  }
  return out.sort((a, b) => a - b);
}

/* --- geometry and configuration ----------------------------------------- */

test('every hazard exposes its geometry', () => {
  for (const h of createHazards()) {
    assert.equal(typeof h.x, 'number');
    assert.ok(Number.isInteger(h.width) && h.width >= 1, 'whole-tile width');
    assert.ok(h.row >= 0 && h.row < ROWS, 'lane row is on the board');
    assert.notEqual(h.speed, 0, 'non-zero speed');
  }
});

test('row 1 carries two trucks travelling right at 1.5 tiles per second', () => {
  const row1 = inLane(createHazards(), 1);
  assert.equal(row1.length, 2);
  for (const h of row1) {
    assert.equal(h.width, 2);
    assert.equal(h.speed, 1.5);
    assert.ok(h.speed > 0, 'rightward');
    assert.equal(h.sprite, 'truck');
  }
});

test('row 3 carries three ATVs travelling left at 2.5 tiles per second', () => {
  const row3 = inLane(createHazards(), 3);
  assert.equal(row3.length, 3);
  for (const h of row3) {
    assert.equal(h.width, 1);
    assert.equal(h.speed, -2.5);
    assert.ok(h.speed < 0, 'leftward');
  }
  assert.deepEqual(row3.map((h) => h.sprite), ['atv_red', 'atv_blue', 'atv_red'],
    'colours alternate');
});

test('no other row carries traffic', () => {
  const rows = new Set(createHazards().map((h) => h.row));
  assert.deepEqual([...rows].sort(), [1, 3]);
  for (const row of [0, 2, 4, 5, 6]) {
    assert.ok(!rows.has(row), `row ${row} is clear`);
  }
});

test('every configured sprite is exactly as wide as its lane claims', () => {
  // Two sources of truth: wrapping and (in M4) collision use hazard.width, while
  // drawing uses the atlas rectangle. A mismatch gives a hitbox that does not
  // match the art. Assert they agree for the lanes the game actually ships.
  for (const l of LANES) {
    for (const name of l.sprites) {
      const sprite = SPRITES[name];
      assert.ok(sprite, `${name} is declared`);
      assert.equal(sprite.w, l.width * TILE,
        `${name} is ${sprite.w}px but row ${l.row} claims ${l.width} tiles`);
      assert.equal(sprite.h, TILE, `${name} is one tile tall`);
    }
  }
});

test('every hazard in state carries its lane width', () => {
  for (const h of createHazards()) {
    const l = lane(h.row);
    assert.equal(h.width, l.width);
    assert.equal(SPRITES[h.sprite].w, h.width * TILE,
      `${h.sprite} would draw at a width its geometry does not claim`);
  }
});

test('wrap distance is the board width plus the hazard width', () => {
  assert.equal(wrapDistance(lane(1)), COLS + 2);
  assert.equal(wrapDistance(lane(1)), 14);
  assert.equal(wrapDistance(lane(3)), COLS + 1);
  assert.equal(wrapDistance(lane(3)), 13);
});

test('hazards are spread evenly across their lane wrap distance', () => {
  const h = createHazards();
  const truckGaps = gaps(h, 1);
  const atvGaps = gaps(h, 3);
  for (const g of truckGaps) assert.ok(Math.abs(g - 14 / 2) < 1e-9, 'trucks 7 apart');
  for (const g of atvGaps) assert.ok(Math.abs(g - 13 / 3) < 1e-9, 'ATVs 13/3 apart');
});

/* --- motion -------------------------------------------------------------- */

test('a hazard advances by speed times elapsed time', () => {
  const truck = { row: 1, x: 2, width: 2, speed: 1.5, sprite: 'truck' };
  assert.ok(Math.abs(advanceHazard(truck, 1).x - 3.5) < 1e-9, '1.5 tiles rightward');

  const atv = { row: 3, x: 8, width: 1, speed: -2.5, sprite: 'atv_red' };
  assert.ok(Math.abs(advanceHazard(atv, 1).x - 5.5) < 1e-9, '2.5 tiles leftward');
});

test('direction follows the sign of the speed', () => {
  const right = advanceHazard({ row: 1, x: 3, width: 2, speed: 1.5, sprite: 'truck' }, 0.1);
  const left = advanceHazard({ row: 3, x: 3, width: 1, speed: -2.5, sprite: 'atv_red' }, 0.1);
  assert.ok(right.x > 3, 'rightward increases');
  assert.ok(left.x < 3, 'leftward decreases');
});

test('advanceHazard does not mutate the hazard it is given', () => {
  const before = { row: 1, x: 2, width: 2, speed: 1.5, sprite: 'truck' };
  advanceHazard(before, 1);
  assert.equal(before.x, 2);
});

test('travel over one second is equivalent at 60Hz and 120Hz', () => {
  const at60 = advance(createHazards(), 1, 1 / 60);
  const at120 = advance(createHazards(), 1, 1 / 120);
  for (let i = 0; i < at60.length; i++) {
    assert.ok(Math.abs(at60[i].x - at120[i].x) < 1e-9,
      `hazard ${i}: ${at60[i].x} vs ${at120[i].x}`);
  }
});

/* --- wrapping ------------------------------------------------------------ */

test('a rightward hazard reappears at the left edge', () => {
  const truck = { row: 1, x: COLS - 0.1, width: 2, speed: 1.5, sprite: 'truck' };
  const after = advanceHazard(truck, 0.1);      // crosses the right boundary
  assert.ok(after.x < 0, 'now entering from the left');
  assert.equal(after.speed, 1.5, 'speed unchanged');
});

test('a leftward hazard reappears at the right edge', () => {
  const atv = { row: 3, x: -0.9, width: 1, speed: -2.5, sprite: 'atv_red' };
  const after = advanceHazard(atv, 0.1);
  assert.ok(after.x > COLS - 2, 'now entering from the right');
  assert.equal(after.speed, -2.5, 'speed unchanged');
});

test('wrapping preserves the overshoot rather than snapping to the edge', () => {
  // A hazard that passes the boundary by a fraction must re-enter by that same
  // fraction. Assigning a fixed re-entry position would discard it, and the
  // lane's gaps would drift apart over a session.
  const span = COLS + 1;
  const atv = { row: 3, x: 0.2, width: 1, speed: -2.5, sprite: 'atv_red' };

  // At x = -0.8 the ATV still spans -0.8..0.2, so its trailing (right) edge has
  // not passed the left boundary and it must NOT wrap yet.
  assert.ok(Math.abs(advanceHazard(atv, 0.4).x - (-0.8)) < 1e-9,
    'no wrap while the trailing edge is still on the board');

  // Travelling 1.5 tiles puts it at -1.3, fully past the boundary by 0.3, so it
  // re-enters 0.3 in from the far edge rather than exactly at it.
  const after = advanceHazard(atv, 0.6);
  assert.ok(Math.abs(after.x - (0.2 - 1.5 + span)) < 1e-9,
    `expected exact translation, got ${after.x}`);
  assert.ok(Math.abs(after.x - 11.7) < 1e-9, 'overshoot of 0.3 preserved');
});

test('one full circuit travels the board width plus the hazard width', () => {
  const atv = { row: 3, x: 0, width: 1, speed: -2.5, sprite: 'atv_red' };
  const span = COLS + 1;
  const after = advanceHazard(atv, span / 2.5);  // exactly one circuit
  assert.ok(Math.abs(after.x - 0) < 1e-9, `back to the start, got ${after.x}`);
});

test('a hazard is never lost off the board, even on an unclamped step', () => {
  for (const seconds of [0.5, 3, 10, 120]) {
    for (const h of advanceHazards(createHazards(), seconds)) {
      assert.ok(h.x > -h.width - 1e-9 && h.x < COLS + 1e-9,
        `after ${seconds}s a hazard sat at ${h.x}`);
    }
  }
});

/* --- the spacing invariant ----------------------------------------------- */

test('gaps survive many wraps', () => {
  const initial = createHazards();
  const before1 = gaps(initial, 1);
  const before3 = gaps(initial, 3);

  const after = advance(initial, 30, 1 / 60);   // ~3 truck and ~6 ATV circuits
  const after1 = gaps(after, 1);
  const after3 = gaps(after, 3);

  for (let i = 0; i < before1.length; i++) {
    assert.ok(Math.abs(before1[i] - after1[i]) < 1e-6,
      `truck gap drifted: ${before1[i]} -> ${after1[i]}`);
  }
  for (let i = 0; i < before3.length; i++) {
    assert.ok(Math.abs(before3[i] - after3[i]) < 1e-6,
      `ATV gap drifted: ${before3[i]} -> ${after3[i]}`);
  }
});

/* --- independence from the game phase ------------------------------------ */

test('a new game starts with its lanes populated', () => {
  const state = createState();
  assert.equal(state.hazards.length, LANES.reduce((n, l) => n + l.count, 0));
  assert.equal(inLane(state.hazards, 1).length, 2);
  assert.equal(inLane(state.hazards, 3).length, 3);
});

test('traffic flows during the sink beat', () => {
  const input = createInput();
  let state = createState();
  for (let i = 0; i < 20 && state.phase === PHASES.PLAYING; i++) {
    pressKey(input, 'ArrowUp');
    state = update(state, 1 / 60, input);
  }
  assert.equal(state.phase, PHASES.SINKING, 'reached the goal');

  const before = state.hazards.map((h) => h.x);
  state = update(state, 1 / 60, input);
  const after = state.hazards.map((h) => h.x);

  for (let i = 0; i < before.length; i++) {
    assert.notEqual(after[i], before[i], `hazard ${i} kept moving while sinking`);
  }
});

test('hazards advance while the player is blocked at a board edge', () => {
  const input = createInput();
  let state = createState();
  const before = state.hazards.map((h) => h.x);
  pressKey(input, 'ArrowDown');                 // blocked at the bottom edge
  state = update(state, 1 / 60, input);
  assert.equal(state.player.row, 6, 'the player did not move');
  for (let i = 0; i < before.length; i++) {
    assert.notEqual(state.hazards[i].x, before[i], 'traffic still moved');
  }
});

/* --- the clamp margin M4 will depend on ---------------------------------- */

test('a maximum-length frame cannot carry a hazard a whole tile', () => {
  const fastest = Math.max(...LANES.map((l) => Math.abs(l.speed)));
  const travel = fastest * MAX_DELTA_SECONDS;
  assert.ok(travel < 1,
    `worst-case frame travel ${travel} tiles must stay under one tile`);
  assert.ok(travel < Math.min(...LANES.map((l) => l.width)),
    'and under the narrowest hazard, so collision cannot be skipped');
});
