'use strict';
// Covers openspec/changes/win-loop/specs/game-lifecycle/spec.md

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PHASES, SINK_MS, SINK_SECONDS, DEATH_MS, DEATH_SECONDS,
  SPAWN, STARTING_LIVES, GOAL_ROW, MAX_DELTA_SECONDS,
  RESTART_KEYS,
  createState, createInput, pressKey, update, enterPhase, respawn, phaseAcceptsInput,
  strikePlayer,
} = require('./game.js');

const FRAME = 1 / 60;

// Lifecycle behaviour is independent of traffic, and M4 makes traffic lethal.
// These walks use a hazard-free board so a death never interrupts a test about
// the sink beat. Collision and the death beat have their own tests.
const game = () => Object.assign(createState(), { hazards: [] });


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

test('the duration constants match the spec figures', () => {
  assert.equal(SINK_MS, 400);
  assert.equal(SINK_SECONDS * 1000, 400);
  assert.equal(DEATH_MS, 550);
  assert.equal(DEATH_SECONDS * 1000, 550);
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
  let state = game();
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
  let state = walkToGoal(game(), input);
  assert.equal(state.phase, PHASES.SINKING);

  state = run(state, input, 0.399, 0.001);
  assert.equal(state.phase, PHASES.SINKING, 'still sinking at 399ms');
});

test('the beat ends once its duration is reached', () => {
  const input = createInput();
  let state = walkToGoal(game(), input);
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
  let state = walkToGoal(game(), input);
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
  let state = walkToGoal(game(), input);
  const frozen = Object.assign({}, state.player);

  pressKey(input, 'ArrowDown');
  state = update(state, FRAME, input);
  assert.deepEqual(state.player, frozen, 'the player did not move');
});

test('presses made while sinking do not fire on respawn', () => {
  const input = createInput();
  let state = walkToGoal(game(), input);

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
  let state = walkToGoal(game(), input);
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
  let state = walkToGoal(game(), input);
  state = run(state, input, SINK_SECONDS, FRAME);

  assert.deepEqual(state.player, { col: SPAWN.col, row: SPAWN.row, facing: SPAWN.facing });
  assert.equal(state.phase, PHASES.PLAYING);
});

test('score and lives survive the reset', () => {
  const input = createInput();
  let state = walkToGoal(game(), input);
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
  let state = game();
  const totals = [];
  for (let round = 0; round < 3; round++) {
    state = walkToGoal(state, input);
    totals.push(state.score);
    state = run(state, input, SINK_SECONDS, FRAME);
    assert.equal(state.phase, PHASES.PLAYING);
  }
  assert.ok(totals[1] > totals[0] && totals[2] > totals[1], 'each round added points');
});

/* --- the death beat ------------------------------------------------------- */

const truck = (x) => ({ row: 1, x, width: 2, speed: 1.5, sprite: 'truck' });

// A board with the player standing in a truck's path.
function struck() {
  return Object.assign(createState(), {
    player: { col: 6, row: 1, facing: 'up' },
    hazards: [truck(5.5)],
  });
}

function runDeath(state, input, seconds, step) {
  step = step || FRAME;
  for (let t = 0; t < seconds - 1e-9; t += step) state = update(state, step, input);
  return state;
}

test('a collision begins the death beat', () => {
  const input = createInput();
  const after = update(struck(), FRAME, input);
  assert.equal(after.phase, PHASES.DYING);
  assert.equal(after.phaseElapsed, 0, 'the beat clock restarts on entry');
});

test('the death beat does not end early and ends at 550ms', () => {
  const input = createInput();
  let state = update(struck(), FRAME, input);
  assert.equal(state.phase, PHASES.DYING);

  state = runDeath(state, input, 0.549, 0.001);
  assert.equal(state.phase, PHASES.DYING, 'still dying at 549ms');

  state = runDeath(state, input, 0.002, 0.001);
  assert.notEqual(state.phase, PHASES.DYING, 'left DYING by 550ms');
});

test('the death beat is the same length at 60Hz and 120Hz', () => {
  const a = createInput();
  let at60 = update(struck(), 1 / 60, a);
  at60 = runDeath(at60, a, DEATH_SECONDS, 1 / 60);

  const b = createInput();
  let at120 = update(struck(), 1 / 120, b);
  at120 = runDeath(at120, b, DEATH_SECONDS, 1 / 120);

  assert.equal(at60.phase, at120.phase);
  assert.equal(at60.lives, at120.lives);
  assert.deepEqual(at60.player, at120.player);
});

test('the capybara holds the position where it was struck', () => {
  const input = createInput();
  let state = Object.assign(struck(), { player: { col: 4, row: 1, facing: 'up' },
                                        hazards: [truck(3.5)] });
  state = update(state, FRAME, input);
  assert.equal(state.phase, PHASES.DYING);

  for (let i = 0; i < 20; i++) {
    state = update(state, FRAME, input);
    if (state.phase !== PHASES.DYING) break;
    assert.deepEqual({ c: state.player.col, r: state.player.row }, { c: 4, r: 1 },
      'held at the impact tile for the whole beat');
  }
});

test('input is ignored while dying and does not fire on respawn', () => {
  const input = createInput();
  let state = update(struck(), FRAME, input);
  const frozen = Object.assign({}, state.player);

  const frames = Math.round(DEATH_SECONDS / FRAME);
  for (let i = 0; i < frames - 1; i++) {
    pressKey(input, 'ArrowLeft');
    state = update(state, FRAME, input);
    assert.equal(state.phase, PHASES.DYING);
    assert.deepEqual(state.player, frozen, 'no movement during the beat');
  }
  state = update(state, FRAME, input);
  assert.equal(state.phase, PHASES.PLAYING);
  assert.equal(state.player.col, SPAWN.col, 'respawned, not carried left');
  assert.equal(input.pending, null, 'nothing left buffered');
});

/* --- routing on remaining lives ------------------------------------------- */

test('a remaining life respawns the player', () => {
  const input = createInput();
  let state = update(struck(), FRAME, input);
  assert.equal(state.lives, STARTING_LIVES - 1);

  state = runDeath(state, input, DEATH_SECONDS, FRAME);
  assert.equal(state.phase, PHASES.PLAYING);
  assert.deepEqual(state.player, { col: SPAWN.col, row: SPAWN.row, facing: SPAWN.facing });
});

test('the last life ends the game', () => {
  const input = createInput();
  let state = Object.assign(struck(), { lives: 1 });
  state = update(state, FRAME, input);
  assert.equal(state.lives, 0);
  assert.equal(state.phase, PHASES.DYING);

  state = runDeath(state, input, DEATH_SECONDS, FRAME);
  assert.equal(state.phase, PHASES.GAME_OVER);
  assert.notEqual(state.player.row, SPAWN.row, 'not returned to the spawn cell');
});

test('the score survives a death', () => {
  const input = createInput();
  let state = Object.assign(struck(), { score: 80 });
  state = update(state, FRAME, input);
  state = runDeath(state, input, DEATH_SECONDS, FRAME);
  assert.equal(state.score, 80);
});

test('the watermark resets after a death', () => {
  const input = createInput();
  let state = Object.assign(struck(), { northmost: 1, score: 40 });
  state = update(state, FRAME, input);
  state = runDeath(state, input, DEATH_SECONDS, FRAME);
  assert.equal(state.northmost, SPAWN.row, 'a death ends a round');
  assert.equal(state.score, 40, 'without costing points already scored');
});

/* --- the halted game ------------------------------------------------------ */

test('traffic keeps flowing while the game is over', () => {
  // DECISIONS.md gap 12: hazard motion is phase-independent. Asserted on a
  // populated board, because the halt test below runs on an empty one and so
  // cannot tell a frozen lane from a flowing one.
  const input = createInput();
  let state = Object.assign(createState(), {
    phase: PHASES.GAME_OVER, phaseElapsed: 0, lives: 0,
  });
  const before = state.hazards.map((h) => h.x);
  state = update(state, FRAME, input);

  for (let i = 0; i < before.length; i++) {
    assert.notEqual(state.hazards[i].x, before[i], `hazard ${i} kept moving`);
  }
});

/* --- starting a new run --------------------------------------------------- */

function gameOver(extra) {
  return Object.assign(createState(), {
    phase: PHASES.GAME_OVER, phaseElapsed: 0, lives: 0, score: 90,
    player: { col: 4, row: 1, facing: 'left' }, northmost: 1,
  }, extra || {});
}

test('Enter starts a new run', () => {
  const input = createInput();
  pressKey(input, 'Enter');
  const after = update(gameOver(), FRAME, input);
  assert.equal(after.phase, PHASES.PLAYING);
  assert.deepEqual(after.player, { col: SPAWN.col, row: SPAWN.row, facing: SPAWN.facing });
});

test('every declared restart key is one a browser actually produces', () => {
  // 'Space' is event.code and 'Spacebar' is legacy IE; neither can ever appear
  // as event.key in a modern browser, so neither belongs in the map.
  assert.deepEqual(Object.keys(RESTART_KEYS).sort(), [' ', 'Enter']);
  for (const key of Object.keys(RESTART_KEYS)) {
    const input = createInput();
    pressKey(input, key);
    assert.equal(input.restart, true, `${JSON.stringify(key)} registers`);
    assert.equal(input.pending, null, 'and does not populate the direction slot');
  }
});

test('Space starts a new run', () => {
  const input = createInput();
  pressKey(input, ' ');
  assert.equal(update(gameOver(), FRAME, input).phase, PHASES.PLAYING);
});

test('a new run clears the score and restores the board', () => {
  const fresh = createState();
  const input = createInput();
  pressKey(input, 'Enter');
  const after = update(gameOver(), FRAME, input);

  assert.equal(after.score, 0);
  assert.equal(after.lives, STARTING_LIVES);
  assert.equal(after.northmost, SPAWN.row);
  assert.deepEqual(after.hazards.map((h) => h.x), fresh.hazards.map((h) => h.x),
    'hazards are back at their starting layout');
  assert.deepEqual(after.hazards.map((h) => h.sprite), fresh.hazards.map((h) => h.sprite));
});

test('directional input does not leave the game over state', () => {
  // Replaces M4's "the game over state is terminal in this change", which this
  // change makes false. The delta spec records that retirement.
  const input = createInput();
  let state = gameOver();
  for (let i = 0; i < 30; i++) {
    pressKey(input, 'ArrowUp');
    state = update(state, FRAME, input);
  }
  assert.equal(state.phase, PHASES.GAME_OVER);
  assert.equal(state.player.col, 4, 'the player did not move');
  assert.equal(state.score, 90);
});

test('a direction buffered alongside the restart key is discarded', () => {
  // The restart path is the one place update returns before draining the
  // direction slot. Without an explicit discard, a player mashing an arrow while
  // hitting Enter leaves the spawn cell on the new run's next frame.
  const input = createInput();
  pressKey(input, 'ArrowUp');
  pressKey(input, 'Enter');

  let state = update(gameOver(), FRAME, input);
  assert.equal(state.phase, PHASES.PLAYING);
  assert.equal(input.pending, null, 'the direction was discarded, not carried');

  state = update(state, FRAME, input);
  assert.equal(state.player.row, SPAWN.row, 'still at the spawn cell');
  assert.equal(state.score, 0, 'and no points were awarded for a stale move');
});

test('restart keys do nothing while playing', () => {
  const input = createInput();
  const before = Object.assign(createState(), { score: 70, hazards: [] });
  pressKey(input, 'Enter');
  const after = update(before, FRAME, input);
  assert.equal(after.phase, PHASES.PLAYING);
  assert.equal(after.score, 70, 'the run was not reset');
  assert.deepEqual(after.player, before.player);
});

test('restart keys do nothing during a beat', () => {
  for (const phase of [PHASES.SINKING, PHASES.DYING]) {
    const input = createInput();
    let state = Object.assign(createState(), {
      phase: phase, phaseElapsed: 0, score: 70, hazards: [],
      player: { col: 3, row: 1, facing: 'up' },
    });
    pressKey(input, 'Enter');
    state = update(state, FRAME, input);
    assert.equal(state.phase, phase, `${phase} was not interrupted`);
    assert.equal(state.score, 70);
  }
});

test('a stray restart press cannot latch and fire on a later death', () => {
  // The slot is drained every update, so an Enter pressed mid-run is gone long
  // before the player dies. Otherwise it would restart the game out from under
  // them at the moment of impact.
  const input = createInput();
  let state = Object.assign(createState(), { score: 70, hazards: [] });
  pressKey(input, 'Enter');
  state = update(state, FRAME, input);
  assert.equal(input.restart, false, 'the press was consumed, not retained');

  state = Object.assign(state, {
    player: { col: 6, row: 1, facing: 'up' },
    hazards: [truck(5.5)], lives: 1,
  });
  state = update(state, FRAME, input);
  assert.equal(state.phase, PHASES.DYING, 'the death proceeded normally');
  assert.equal(state.score, 70, 'and no new run began');
});

test('a new run can itself be lost and restarted', () => {
  const input = createInput();
  pressKey(input, 'Enter');
  let state = update(gameOver(), FRAME, input);
  assert.equal(state.phase, PHASES.PLAYING);

  // Lose all three lives again.
  for (let life = 0; life < STARTING_LIVES; life++) {
    state = Object.assign({}, state, {
      player: { col: 6, row: 1, facing: 'up' }, hazards: [truck(5.5)],
    });
    state = update(state, FRAME, input);
    assert.equal(state.phase, PHASES.DYING, `death ${life + 1}`);
    for (let t = 0; t < DEATH_SECONDS + FRAME; t += FRAME) state = update(state, FRAME, input);
  }
  assert.equal(state.phase, PHASES.GAME_OVER);
  assert.equal(state.lives, 0);

  pressKey(input, ' ');
  state = update(state, FRAME, input);
  assert.equal(state.phase, PHASES.PLAYING, 'and restarts again');
  assert.equal(state.lives, STARTING_LIVES);
});

test('nothing advances while the game is over', () => {
  const input = createInput();
  let state = Object.assign(createState(), {
    phase: PHASES.GAME_OVER, phaseElapsed: 0, lives: 0, score: 130,
    player: { col: 4, row: 1, facing: 'up' }, hazards: [],
  });
  const before = Object.assign({}, state.player);

  for (let i = 0; i < 60; i++) {
    pressKey(input, 'ArrowUp');
    state = update(state, FRAME, input);
  }
  assert.equal(state.phase, PHASES.GAME_OVER, 'still halted without a restart key');
  assert.deepEqual(state.player, before);
  assert.equal(state.score, 130);
  assert.equal(state.lives, 0);
});

/* --- lives --------------------------------------------------------------- */

test('a collision costs exactly one life', () => {
  const after = update(struck(), FRAME, createInput());
  assert.equal(after.lives, STARTING_LIVES - 1);
});

test('a death costs one life however long the overlap lasts', () => {
  const input = createInput();
  let state = update(struck(), FRAME, input);
  for (let i = 0; i < 25; i++) state = update(state, FRAME, input);
  assert.equal(state.lives, STARTING_LIVES - 1, 'one death, one life');
});

test('striking a player with no lives left cannot go negative', () => {
  // Unreachable through play: at 0 lives the beat routes to GAME_OVER, which
  // blocks further collisions, so the floor is defensive. Exercised directly so
  // the spec's "SHALL NOT fall below 0" is verified rather than merely implied
  // by the routing that currently makes it moot.
  const after = strikePlayer(Object.assign(createState(), { lives: 0 }));
  assert.equal(after.lives, 0, 'floored, not -1');
  assert.equal(after.phase, PHASES.DYING);
});

test('the counter never falls below zero', () => {
  const input = createInput();
  let state = Object.assign(struck(), { lives: 1 });
  state = update(state, FRAME, input);
  assert.equal(state.lives, 0);
  for (let i = 0; i < 60; i++) state = update(state, FRAME, input);
  assert.equal(state.lives, 0, 'floored');
});



test('lives start at three and a completed round does not cost one', () => {
  const input = createInput();
  let state = game();
  assert.equal(state.lives, 3);
  state = walkToGoal(state, input);
  state = run(state, input, SINK_SECONDS, FRAME);
  assert.equal(state.lives, 3, 'nothing in this change decrements lives');
});
