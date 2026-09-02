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

// --- P7: game over and restart ---

function gameOverState() {
  const state = game.createInitialState();
  state.lastTime = 1000;
  state.score = 120;
  state.lives = 1;
  state.player.col = 3;
  state.player.row = 3;
  state.hazards = [{ kind: "atv", frame: "atv_red", row: 3, x: 3, vx: -2.5, width: 1 }];
  game.resolveCollisions(state);
  return state;
}

test("restart keys are Enter and Space only", () => {
  assert.equal(game.isRestartKey("Enter"), true);
  assert.equal(game.isRestartKey(" "), true);
  assert.equal(game.isRestartKey("ArrowUp"), false);
  assert.equal(game.isRestartKey("q"), false);
});

test("Enter and Space request a restart only while game over", () => {
  const over = gameOverState();
  assert.equal(over.gameOver, true);
  assert.equal(game.handleKeydown(over, { key: "Enter" }), true);
  assert.equal(over.pendingRestart, true);

  const spaced = gameOverState();
  game.handleKeydown(spaced, { key: " " });
  assert.equal(spaced.pendingRestart, true);

  const playing = game.createInitialState();
  assert.equal(game.handleKeydown(playing, { key: "Enter" }), false);
  assert.equal(playing.pendingRestart, false);
});

test("arrow keys are dead while game over", () => {
  const state = gameOverState();
  assert.equal(game.handleKeydown(state, { key: "ArrowUp" }), false);
  assert.equal(state.pendingDirection, null);
  game.update(state, 16);
  assert.deepEqual([state.player.col, state.player.row], [3, 3]);
});

test("preventDefault is called for a key that is acted on", () => {
  const state = gameOverState();
  let prevented = false;
  game.handleKeydown(state, { key: " ", preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true, "Space must not scroll the page");

  // A plain object event without preventDefault must still work.
  const plain = gameOverState();
  assert.doesNotThrow(() => game.handleKeydown(plain, { key: "Enter" }));
});

test("a restart clears score, lives, and the game-over state", () => {
  const state = gameOverState();
  game.restartSession(state);
  assert.equal(state.score, 0);
  assert.equal(state.lives, game.STARTING_LIVES);
  assert.equal(state.gameOver, false);
});

test("a restart returns the capybara and traffic to their starts", () => {
  const state = gameOverState();
  game.restartSession(state);
  assert.deepEqual([state.player.col, state.player.row], [6, 6]);
  assert.equal(state.player.facing, "up");
  assert.equal(state.bestRowThisLife, 6);
  assert.deepEqual(
    state.hazards.map((h) => h.x),
    game.createInitialHazards().map((h) => h.x),
    "hazards return to their starting positions",
  );
});

test("a restart clears every pending beat", () => {
  const state = gameOverState();
  state.hurtUntil = 9999;
  state.flashUntil = 9999;
  state.sinkingUntil = 9999;
  game.restartSession(state);
  assert.equal(game.isDying(state), false);
  assert.equal(game.isSinking(state), false);
  assert.equal(state.hurtUntil, 0);
  assert.equal(state.flashUntil, 0);
  assert.equal(state.sinkingUntil, 0);
});

test("a pending restart is applied in the same update", () => {
  const state = gameOverState();
  game.handleKeydown(state, { key: "Enter" });
  game.update(state, 16);
  assert.equal(state.gameOver, false);
  assert.equal(state.score, 0);
  assert.equal(state.pendingRestart, false);
});

test("hazards hold still while game over", () => {
  const state = gameOverState();
  const before = state.hazards.map((h) => h.x);
  game.update(state, 200);
  state.hazards.forEach((h, i) => assert.equal(h.x, before[i]));
});

test("the run is playable again after a restart", () => {
  const state = gameOverState();
  game.handleKeydown(state, { key: "Enter" });
  game.update(state, 16);
  game.handleKeydown(state, { key: "ArrowUp" });
  game.update(state, 16);
  assert.equal(state.player.row, 5, "arrow keys work again");
  assert.equal(state.score, 10);
});

test("the overlay shows the outcome, the final score, and the way out", () => {
  const state = gameOverState();
  const trace = [];
  game.renderOverlay(state, makeCtx(trace));
  const texts = trace.filter((c) => c[0] === "fillText").map((c) => c[1]).join(" | ");
  assert.match(texts, /GAME OVER/i);
  assert.match(texts, /120/, "final score");
  assert.match(texts, /Enter/);
  assert.match(texts, /Space/);
  assert.ok(trace.some((c) => c[0] === "fillRect"), "a scrim is drawn");
});

test("the overlay is drawn after the HUD and only while game over", () => {
  const state = gameOverState();
  state.atlas = "ATLAS";
  const trace = [];
  game.render(state, makeCtx(trace));
  const texts = trace.filter((c) => c[0] === "fillText").map((c) => c[1]);
  const hud = texts.findIndex((t) => /Score/.test(t));
  const overlay = texts.findIndex((t) => /GAME OVER/i.test(t));
  assert.ok(overlay > hud, "overlay comes after the HUD");

  const playing = [];
  const alive = game.createInitialState();
  alive.atlas = "ATLAS";
  game.render(alive, makeCtx(playing));
  const aliveTexts = playing.filter((c) => c[0] === "fillText").map((c) => c[1]).join(" ");
  assert.doesNotMatch(aliveTexts, /GAME OVER/i, "no overlay during normal play");
});
