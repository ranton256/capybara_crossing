import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const game = require("../game.js");

function makeCtx(trace = []) {
  return {
    trace, fillStyle: null, font: null,
    clearRect: (...a) => trace.push(["clearRect", ...a]),
    fillRect: (...a) => trace.push(["fillRect", ...a]),
    fillText: (...a) => trace.push(["fillText", ...a]),
    drawImage: (...a) => trace.push(["drawImage", ...a]),
    save: () => trace.push(["save"]), restore: () => trace.push(["restore"]),
    translate: (...a) => trace.push(["translate", ...a]),
    scale: (...a) => trace.push(["scale", ...a]),
  };
}

// A session one hop below the spa, with the watermark already at row 1.
function atSpaDoor(col = 6) {
  const state = game.createInitialState();
  state.lastTime = 1000;
  state.player.col = col;
  state.player.row = 1;
  state.bestRowThisLife = 1;
  return state;
}

test("goal constants match the spec", () => {
  assert.equal(game.GOAL_BONUS, 50);
  assert.equal(game.SINK_MS, 400);
  assert.equal(game.GOAL_ROW, 0);
});

test("entering the spa from row 1 pays sixty", () => {
  const state = atSpaDoor();
  state.score = 0;
  game.hop(state, "up");
  assert.equal(state.score, 10, "the forward hop pays first");
  game.resolveGoal(state);
  assert.equal(state.score, 60, "10 for the hop plus 50 for the spa");
});

test("any column of the top row counts as the goal", () => {
  for (const col of [0, 5, 11]) {
    const state = atSpaDoor(col);
    state.player.row = 0;
    assert.equal(game.resolveGoal(state), true, `column ${col} should reach the spa`);
  }
});

test("the bonus is not paid repeatedly while sinking", () => {
  const state = atSpaDoor();
  state.player.row = 0;
  game.resolveGoal(state);
  const once = state.score;
  game.resolveGoal(state);
  game.resolveGoal(state);
  assert.equal(state.score, once, "one arrival pays once");
});

test("movement is ignored while sinking", () => {
  const state = atSpaDoor();
  state.player.row = 0;
  game.resolveGoal(state);
  assert.equal(game.isSinking(state), true);
  state.pendingDirection = "down";
  game.update(state, 16);
  assert.equal(state.player.row, 0, "no hop while sinking");
  assert.equal(state.pendingDirection, null);
});

test("traffic keeps moving while sinking", () => {
  const state = atSpaDoor();
  state.player.row = 0;
  game.resolveGoal(state);
  const before = state.hazards.map((h) => h.x);
  game.update(state, 50);
  state.hazards.forEach((h, i) => assert.notEqual(h.x, before[i]));
});

test("the sink beat ends with a fresh capybara at the start", () => {
  const state = atSpaDoor();
  state.score = 0;
  state.lives = 2;
  game.hop(state, "up");
  game.resolveGoal(state);
  assert.equal(state.score, 60);

  state.lastTime += game.SINK_MS + 1;
  game.update(state, 16);

  assert.deepEqual([state.player.col, state.player.row], [6, 6]);
  assert.equal(state.player.facing, "up");
  assert.equal(state.score, 60, "score carries into the next round");
  assert.equal(state.lives, 2, "lives carry into the next round");
  assert.equal(state.bestRowThisLife, 6, "the next approach can score again");
  assert.equal(game.isSinking(state), false);
});

test("the next climb scores again after a spa clear", () => {
  const state = atSpaDoor();
  state.score = 0;
  game.hop(state, "up");
  game.resolveGoal(state);
  state.lastTime += game.SINK_MS + 1;
  game.update(state, 16);
  game.hop(state, "up");
  assert.equal(state.score, 70, "60 from the first round plus 10 for a new climb");
});

test("two rounds in a row both pay the bonus", () => {
  const state = atSpaDoor();
  state.score = 0;
  for (let round = 0; round < 2; round++) {
    while (state.player.row > 0) game.hop(state, "up");
    game.resolveGoal(state);
    state.lastTime += game.SINK_MS + 1;
    game.update(state, 16);
  }
  // Round 1: 10 + 50. Round 2: six Up hops from row 6 = 60, plus 50.
  assert.equal(state.score, 60 + 60 + 50);
  assert.deepEqual([state.player.col, state.player.row], [6, 6]);
});

test("finishSink leaves score and lives untouched", () => {
  const state = atSpaDoor();
  state.score = 999;
  state.lives = 1;
  game.finishSink(state);
  assert.equal(state.score, 999);
  assert.equal(state.lives, 1);
  assert.equal(state.sinkingUntil, 0);
});

test("the goal is not awarded during a death beat or after game over", () => {
  const dying = atSpaDoor();
  dying.player.row = 0;
  dying.hurtUntil = dying.lastTime + game.DEATH_MS;
  assert.equal(game.resolveGoal(dying), false);

  const over = atSpaDoor();
  over.player.row = 0;
  over.gameOver = true;
  assert.equal(game.resolveGoal(over), false);
});

test("the sinking capybara is drawn on the spa row with a downward offset", () => {
  const state = atSpaDoor();
  state.atlas = "ATLAS";
  state.player.row = 0;
  game.resolveGoal(state);

  const sinking = [];
  game.renderPlayer(state, makeCtx(sinking));
  assert.equal(sinking[0][7], 0 * 48 + game.SINK_DRAW_OFFSET, "offset downward on row 0");

  state.lastTime += game.SINK_MS + 1;
  const after = [];
  game.renderPlayer(state, makeCtx(after));
  assert.equal(after[0][7], 0, "no offset once the beat is over");
});
