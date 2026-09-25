'use strict';
// Covers openspec/changes/win-loop/specs/game-lifecycle/spec.md

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PHASES, SINK_MS, SINK_SECONDS, SPAWN, STARTING_LIVES, GOAL_ROW, MAX_DELTA_SECONDS,
  createState, createInput, pressKey, update, enterPhase, respawn, phaseAcceptsInput,
} = require('./game.js');

const FRAME = 1 / 60;

// Drives `update` until the predicate holds or the budget runs out.
function run(state, input, seconds, step) {
  step = step || FRAME;
  for (let t = 0; t < seconds - 1e-9; t += step) state = update(state, step, input);
  return state;
}

// Walks the player from the spawn cell to the goal row, one press per frame.
function walkToGoal(state, input) {
  for (let i = 0; i < 100; i++) {
    if (state.player.row <= GOAL_ROW && state.phase !== PHASES.PLAYING) return state;
    if (state.player.row <= GOAL_ROW && state.phase === PHASES.PLAYING) {
      throw new Error('reached the goal row but the sink never began');
    }
    pressKey(input, 'ArrowUp');
    state = update(state, FRAME, input);
  }
  throw new Error('never reached the goal row');
}

/* --- the state set ------------------------------------------------------- */

test('the duration constant matches the spec figure', () => {
  assert.equal(SINK_MS, 400);
  assert.equal(SINK_SECONDS * 1000, 400);
});

test('a new game starts playing at the spawn cell', () => {
  const state = createState();
  assert.equal(state.phase, PHASES.PLAYING);
  assert.equal(state.player.col, SPAWN.col);
  assert.equal(state.player.row, SPAWN.row);
  assert.equal(state.lives, STARTING_LIVES);
  assert.equal(state.score, 0);
  assert.equal(state.northmost, SPAWN.row);
  assert.equal(state.phaseElapsed, 0);
});

test('the phase is always one of the declared phases', () => {
  const known = new Set(Object.values(PHASES));
  const input = createInput();
  let state = createState();
  assert.ok(known.has(state.phase));

  for (let round = 0; round < 2; round++) {
    state = walkToGoal(state, input);
    assert.ok(known.has(state.phase), 'known after reaching the goal');
    for (let i = 0; i < 40; i++) {
      state = update(state, FRAME, input);
      assert.ok(known.has(state.phase), `known at step ${i}`);
    }
  }
});

test('entering a phase resets its accumulator, even re-entering the same one', () => {
  const state = Object.assign(createState(), { phaseElapsed: 0.3 });
  assert.equal(enterPhase(state, PHASES.SINKING).phaseElapsed, 0);
  assert.equal(enterPhase(state, PHASES.PLAYING).phaseElapsed, 0);
  assert.equal(state.phaseElapsed, 0.3, 'the original is untouched');
});

test('only the playing phase accepts input', () => {
  assert.equal(phaseAcceptsInput(PHASES.PLAYING), true);
  assert.equal(phaseAcceptsInput(PHASES.SINKING), false);
});

/* --- entering the goal --------------------------------------------------- */

test('moving up from row 1 enters the goal and begins the sink', () => {
  const input = createInput();
  let state = Object.assign(createState(), { player: { col: 6, row: 1, facing: 'up' } });
  pressKey(input, 'ArrowUp');
  state = update(state, FRAME, input);

  assert.equal(state.player.row, GOAL_ROW);
  assert.equal(state.phase, PHASES.SINKING);
});

test('the goal spans the whole top row', () => {
  for (const col of [0, 3, 6, 11]) {
    const input = createInput();
    let state = Object.assign(createState(), { player: { col: col, row: 1, facing: 'up' } });
    pressKey(input, 'ArrowUp');
    state = update(state, FRAME, input);
    assert.equal(state.phase, PHASES.SINKING, `column ${col} is goal`);
    assert.equal(state.player.col, col, 'the column is not altered');
  }
});

/* --- the beat ------------------------------------------------------------ */

test('the beat does not end early', () => {
  const input = createInput();
  let state = walkToGoal(createState(), input);
  assert.equal(state.phase, PHASES.SINKING);

  state = run(state, input, 0.399, 0.001);
  assert.equal(state.phase, PHASES.SINKING, 'still sinking at 399ms');
});

test('the beat ends once its duration is reached', () => {
  const input = createInput();
  let state = walkToGoal(createState(), input);
  state = run(state, input, 0.4, 0.001);
  assert.equal(state.phase, PHASES.PLAYING);
});

test('the beat is the same length at 60Hz and 120Hz', () => {
  const a = createInput();
  let at60 = walkToGoal(createState(), a);
  at60 = run(at60, a, SINK_SECONDS, 1 / 60);

  const b = createInput();
  let at120 = walkToGoal(createState(), b);
  at120 = run(at120, b, SINK_SECONDS, 1 / 120);

  assert.equal(at60.phase, at120.phase);
  assert.equal(at60.phase, PHASES.PLAYING);
  assert.deepEqual(at60.player, at120.player);
  assert.equal(at60.score, at120.score);
});

test('a long clamped frame cannot skip a transition', () => {
  const input = createInput();
  let state = walkToGoal(createState(), input);
  const seen = [state.phase];
  for (let i = 0; i < 6; i++) {
    state = update(state, MAX_DELTA_SECONDS, input);
    seen.push(state.phase);
  }
  assert.ok(seen.every((p) => Object.values(PHASES).includes(p)));
  assert.equal(seen[0], PHASES.SINKING);
  assert.equal(state.phase, PHASES.PLAYING, 'it ends in playing, not beyond it');
});

/* --- input suppression --------------------------------------------------- */

test('input is ignored while sinking', () => {
  const input = createInput();
  let state = walkToGoal(createState(), input);
  const frozen = Object.assign({}, state.player);

  pressKey(input, 'ArrowDown');
  state = update(state, FRAME, input);
  assert.deepEqual(state.player, frozen, 'the player did not move');
});

test('presses made while sinking do not fire on respawn', () => {
  const input = createInput();
  let state = walkToGoal(createState(), input);

  // Mash a direction through the beat, stopping one frame short of expiry so
  // this isolates presses made *during* the beat. A press arriving *on* the
  // expiry frame is a different scenario, covered by the test below.
  const frames = Math.round(SINK_SECONDS / FRAME);
  for (let i = 0; i < frames - 1; i++) {
    pressKey(input, 'ArrowUp');
    state = update(state, FRAME, input);
  }
  assert.equal(state.phase, PHASES.SINKING, 'still mid-beat');

  state = update(state, FRAME, input);

  assert.equal(state.phase, PHASES.PLAYING);
  assert.equal(state.player.row, SPAWN.row, 'respawned, not rocketed north');
  assert.equal(state.player.col, SPAWN.col);
  assert.equal(input.pending, null, 'nothing was left buffered');
});

test('a press on the expiry frame is applied to the respawned player', () => {
  const input = createInput();
  let state = walkToGoal(createState(), input);
  state = run(state, input, SINK_SECONDS - FRAME, FRAME);
  assert.equal(state.phase, PHASES.SINKING, 'still sinking just before expiry');

  pressKey(input, 'ArrowUp');
  state = update(state, FRAME, input);

  assert.equal(state.phase, PHASES.PLAYING);
  assert.equal(state.player.row, SPAWN.row - 1,
    'the expiry frame was still a frame the player could act in');
});

/* --- the round reset ----------------------------------------------------- */

test('a fresh capybara appears at the start', () => {
  const input = createInput();
  let state = walkToGoal(createState(), input);
  state = run(state, input, SINK_SECONDS, FRAME);

  assert.deepEqual(state.player, { col: SPAWN.col, row: SPAWN.row, facing: SPAWN.facing });
  assert.equal(state.phase, PHASES.PLAYING);
});

test('score and lives survive the reset', () => {
  const input = createInput();
  let state = walkToGoal(createState(), input);
  const scored = state.score;
  assert.ok(scored > 0);

  state = run(state, input, SINK_SECONDS, FRAME);
  assert.equal(state.score, scored);
  assert.equal(state.lives, STARTING_LIVES);
});

test('respawn faces the capybara up again', () => {
  // Every route to the goal arrives facing up, so a respawn that preserved the
  // old facing would be indistinguishable through gameplay. Drive it directly.
  const state = Object.assign(createState(), {
    player: { col: 2, row: 0, facing: 'left' },
  });
  const after = respawn(state);
  assert.equal(after.player.facing, 'up', 'facing reset, not carried over');
  assert.equal(after.player.col, SPAWN.col);
  assert.equal(after.player.row, SPAWN.row);
  assert.equal(state.player.facing, 'left', 'the original is untouched');
});

test('respawn resets the watermark without touching the score', () => {
  const state = Object.assign(createState(), { score: 90, northmost: 2 });
  const after = respawn(state);
  assert.equal(after.northmost, SPAWN.row);
  assert.equal(after.score, 90);
  assert.equal(state.northmost, 2, 'the original is untouched');
});

test('consecutive rounds each award the goal', () => {
  const input = createInput();
  let state = createState();
  const totals = [];
  for (let round = 0; round < 3; round++) {
    state = walkToGoal(state, input);
    totals.push(state.score);
    state = run(state, input, SINK_SECONDS, FRAME);
    assert.equal(state.phase, PHASES.PLAYING);
  }
  assert.ok(totals[1] > totals[0] && totals[2] > totals[1], 'each round added points');
});

/* --- lives --------------------------------------------------------------- */

test('lives start at three and a completed round does not cost one', () => {
  const input = createInput();
  let state = createState();
  assert.equal(state.lives, 3);
  state = walkToGoal(state, input);
  state = run(state, input, SINK_SECONDS, FRAME);
  assert.equal(state.lives, 3, 'nothing in this change decrements lives');
});
