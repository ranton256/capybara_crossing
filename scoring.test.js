'use strict';
// Covers openspec/changes/win-loop/specs/scoring/spec.md

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  SPAWN, GOAL_ROW, PHASES, SINK_SECONDS, POINTS_ADVANCE, POINTS_GOAL, COLS,
  createState, createInput, pressKey, update, scoreMove,
} = require('./game.js');

const FRAME = 1 / 60;

function press(state, input, key) {
  pressKey(input, key);
  return update(state, FRAME, input);
}

// Bounded so a defect that stops a phase ever changing fails the test instead of
// spinning forever. An unbounded `while (phase === PLAYING)` hangs the suite.
function until(state, input, phase, act, limit) {
  limit = limit || 500;
  for (let i = 0; i < limit; i++) {
    if (state.phase !== phase) return state;
    state = act(state);
  }
  throw new Error(`phase stayed '${phase}' for ${limit} steps; it should have changed`);
}

function at(col, row, extra) {
  return Object.assign(createState(), { player: { col: col, row: row, facing: 'up' } }, extra || {});
}

/* --- the watermark ------------------------------------------------------- */

test('scoreMove awards only for a row north of the watermark', () => {
  assert.deepEqual(scoreMove(6, 5), { points: POINTS_ADVANCE, northmost: 5 });
  assert.deepEqual(scoreMove(5, 5), { points: 0, northmost: 5 });
  assert.deepEqual(scoreMove(5, 6), { points: 0, northmost: 5 });
  assert.deepEqual(scoreMove(4, 2), { points: POINTS_ADVANCE, northmost: 2 });
});

test('a first step north scores ten', () => {
  const input = createInput();
  const state = press(createState(), input, 'ArrowUp');
  assert.equal(state.score, POINTS_ADVANCE);
  assert.equal(state.northmost, SPAWN.row - 1);
});

test('returning to a row already reached scores nothing', () => {
  const input = createInput();
  let state = createState();
  state = press(state, input, 'ArrowUp');   // row 5, +10
  state = press(state, input, 'ArrowUp');   // row 4, +10
  const peak = state.score;

  state = press(state, input, 'ArrowDown'); // back to row 5
  state = press(state, input, 'ArrowUp');   // row 4 again
  assert.equal(state.score, peak, 'no points for ground already covered');
  assert.equal(state.northmost, 4);
});

test('moving sideways scores nothing', () => {
  const input = createInput();
  let state = createState();
  state = press(state, input, 'ArrowLeft');
  state = press(state, input, 'ArrowRight');
  assert.equal(state.score, 0);
});

test('a blocked move scores nothing', () => {
  const input = createInput();
  let state = at(0, 6);
  state = press(state, input, 'ArrowLeft');
  assert.equal(state.player.col, 0, 'the move was blocked');
  assert.equal(state.score, 0);
});

test('a blocked move at the bottom edge scores nothing', () => {
  const input = createInput();
  const state = press(at(6, 6), input, 'ArrowDown');
  assert.equal(state.player.row, 6);
  assert.equal(state.score, 0);
});

/* --- the goal bonus ------------------------------------------------------ */

test('the final step scores the advance and the bonus together', () => {
  const input = createInput();
  const state = press(at(6, 1, { northmost: 1 }), input, 'ArrowUp');
  assert.equal(state.player.row, GOAL_ROW);
  assert.equal(state.score, POINTS_ADVANCE + POINTS_GOAL);
  assert.equal(state.score, 60);
});

test('the bonus applies from every column', () => {
  for (let col = 0; col < COLS; col++) {
    const input = createInput();
    const state = press(at(col, 1, { northmost: 1 }), input, 'ArrowUp');
    assert.equal(state.score, 60, `column ${col} scores the same`);
  }
});

test('the bonus is awarded once per arrival and nothing accrues during the beat', () => {
  const input = createInput();
  let state = press(at(6, 1, { northmost: 1 }), input, 'ArrowUp');
  const onArrival = state.score;
  assert.equal(state.phase, PHASES.SINKING);

  for (let t = 0; t < SINK_SECONDS - FRAME; t += FRAME) {
    state = update(state, FRAME, input);
    assert.equal(state.score, onArrival, 'score is static through the beat');
  }
});

/* --- lifetimes ----------------------------------------------------------- */

test('score starts at zero with the watermark at the spawn row', () => {
  const state = createState();
  assert.equal(state.score, 0);
  assert.equal(state.northmost, SPAWN.row);
});

test('the watermark resets after a spa clear but the score does not', () => {
  const input = createInput();
  let state = createState();

  // Walk the whole way up, scoring each new row plus the goal.
  state = until(state, input, PHASES.PLAYING, (st) => press(st, input, 'ArrowUp'));
  const afterFirstRound = state.score;
  assert.equal(afterFirstRound, 6 * POINTS_ADVANCE + POINTS_GOAL, '6 advances + goal');

  // Run out the beat.
  state = until(state, input, PHASES.SINKING, (st) => update(st, FRAME, input));
  assert.equal(state.score, afterFirstRound, 'score survived the reset');
  assert.equal(state.northmost, SPAWN.row, 'the watermark reset');

  // The same row scores again in the new round.
  state = press(state, input, 'ArrowUp');
  assert.equal(state.score, afterFirstRound + POINTS_ADVANCE);
});

test('score accumulates across rounds', () => {
  const input = createInput();
  let state = createState();
  const perRound = 6 * POINTS_ADVANCE + POINTS_GOAL;

  for (let round = 1; round <= 3; round++) {
    state = until(state, input, PHASES.PLAYING, (st) => press(st, input, 'ArrowUp'));
    state = until(state, input, PHASES.SINKING, (st) => update(st, FRAME, input));
    assert.equal(state.score, perRound * round, `after round ${round}`);
  }
});

test('scoreMove does not mutate and is a pure function of its arguments', () => {
  const a = scoreMove(6, 5);
  const b = scoreMove(6, 5);
  assert.deepEqual(a, b);
  assert.notEqual(a, b, 'a fresh result each call');
});
