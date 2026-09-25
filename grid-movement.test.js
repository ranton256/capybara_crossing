'use strict';
// Covers openspec/changes/walkable-board/specs/grid-movement/spec.md

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  COLS, ROWS, SPAWN,
  createState, createInput, pressKey, movePlayer, update,
} = require('./game.js');

test('initial state places the player at the spawn cell facing up', () => {
  const state = createState();
  assert.equal(state.player.col, 6);
  assert.equal(state.player.row, 6);
  assert.equal(state.player.facing, 'up');
  assert.deepEqual({ col: state.player.col, row: state.player.row }, { col: SPAWN.col, row: SPAWN.row });
});

test('each direction moves exactly one tile from an interior cell', () => {
  // The spawn cell sits on the bottom edge, so start one row up to test
  // movement without the edge clamp participating.
  const start = at_(6, 5);
  assert.deepEqual(pos(movePlayer(start, 'up')), [6, 4]);
  assert.deepEqual(pos(movePlayer(start, 'down')), [6, 6]);
  assert.deepEqual(pos(movePlayer(start, 'left')), [5, 5]);
  assert.deepEqual(pos(movePlayer(start, 'right')), [7, 5]);
});

test('facing follows the direction pressed', () => {
  const start = createState();
  for (const direction of ['up', 'down', 'left', 'right']) {
    assert.equal(movePlayer(start, direction).player.facing, direction);
  }
});

test('positions stay whole numbers within the board', () => {
  let state = createState();
  const presses = ['up', 'up', 'left', 'left', 'left', 'down', 'right', 'up'];
  for (const direction of presses) {
    state = movePlayer(state, direction);
    assert.ok(Number.isInteger(state.player.col), 'column is an integer');
    assert.ok(Number.isInteger(state.player.row), 'row is an integer');
    assert.ok(state.player.col >= 0 && state.player.col < COLS);
    assert.ok(state.player.row >= 0 && state.player.row < ROWS);
  }
});

test('three left presses move three columns and no further', () => {
  let state = createState();
  for (let i = 0; i < 3; i++) state = movePlayer(state, 'left');
  assert.equal(state.player.col, 3);
});

test('movePlayer does not mutate the state it is given', () => {
  const start = createState();
  const moved = movePlayer(start, 'up');
  assert.equal(start.player.row, 6, 'original state is untouched');
  assert.equal(moved.player.row, 5);
  assert.notEqual(start.player, moved.player);
});

test('pressing outward at each edge leaves the position unchanged', () => {
  const cases = [
    { at: [6, ROWS - 1], press: 'down',  edge: 'bottom' },
    { at: [6, 0],        press: 'up',    edge: 'top' },
    { at: [0, 3],        press: 'left',  edge: 'left' },
    { at: [COLS - 1, 3], press: 'right', edge: 'right' },
  ];
  for (const { at, press, edge } of cases) {
    const state = at_(at[0], at[1]);
    const after = movePlayer(state, press);
    assert.deepEqual(pos(after), at, `clamped at the ${edge} edge`);
    assert.equal(after.player.facing, press, `facing still updates at the ${edge} edge`);
  }
});

test('update applies a buffered direction exactly once', () => {
  const input = createInput();
  pressKey(input, 'ArrowUp');
  let state = createState();

  state = update(state, 0.016, input);
  assert.equal(state.player.row, 5, 'the buffered press was applied');

  state = update(state, 0.016, input);
  assert.equal(state.player.row, 5, 'the slot was not consumed a second time');
});

test('the input buffer keeps only the most recent press', () => {
  const input = createInput();
  pressKey(input, 'ArrowLeft');
  pressKey(input, 'ArrowRight');
  const state = update(createState(), 0.016, input);
  assert.equal(state.player.col, 7, 'the latest press won');
  assert.equal(state.player.facing, 'right');
});

test('non-directional keys are ignored', () => {
  const input = createInput();
  pressKey(input, 'Enter');
  pressKey(input, 'a');
  pressKey(input, ' ');
  assert.equal(input.pending, null, 'nothing was buffered');

  const start = createState();
  const after = update(start, 0.016, input);
  assert.deepEqual(pos(after), pos(start));
  assert.equal(after.player.facing, start.player.facing);
});

test('movePlayer ignores an unrecognised direction', () => {
  const start = createState();
  assert.equal(movePlayer(start, 'sideways'), start);
  assert.equal(movePlayer(start, undefined), start);
});

function pos(state) {
  return [state.player.col, state.player.row];
}

function at_(col, row) {
  const state = createState();
  state.player.col = col;
  state.player.row = row;
  return state;
}
