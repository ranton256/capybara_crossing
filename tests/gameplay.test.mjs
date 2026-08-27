import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const game = require(join(root, "game.js"));

const { createInitialPlayer, hop, SPAWN_ROW } = game;

function session(overrides = {}) {
  return {
    player: createInitialPlayer(),
    score: 0,
    bestRowThisLife: SPAWN_ROW,
    walkPhase: 0,
    best: 0,
    ...overrides,
  };
}

test("default spawn is bottom-center facing up with score 0", () => {
  const player = createInitialPlayer();
  const state = session({ player });

  assert.equal(player.col, 6);
  assert.equal(player.row, 6);
  assert.equal(player.facing, "up");
  assert.equal(state.score, 0);
});

test("interior hops move one cell and update facing", () => {
  const state = session({ player: { col: 5, row: 3, facing: "up" } });

  hop(state, "up");
  assert.deepEqual(
    { col: state.player.col, row: state.player.row, facing: state.player.facing },
    { col: 5, row: 2, facing: "up" },
  );

  hop(state, "down");
  assert.deepEqual(
    { col: state.player.col, row: state.player.row, facing: state.player.facing },
    { col: 5, row: 3, facing: "down" },
  );

  hop(state, "left");
  assert.deepEqual(
    { col: state.player.col, row: state.player.row, facing: state.player.facing },
    { col: 4, row: 3, facing: "left" },
  );

  hop(state, "right");
  assert.deepEqual(
    { col: state.player.col, row: state.player.row, facing: state.player.facing },
    { col: 5, row: 3, facing: "right" },
  );
});

test("successful Up hop from start awards 10 points", () => {
  const state = session();

  hop(state, "up");

  assert.equal(state.player.row, 5);
  assert.equal(state.player.col, 6);
  assert.equal(state.score, 10);
  assert.equal(state.bestRowThisLife, 5);
});

test("re-upping the same progress does not score", () => {
  const state = session();
  hop(state, "up");
  assert.equal(state.score, 10);
  hop(state, "down");
  hop(state, "up");
  assert.equal(state.player.row, 5);
  assert.equal(state.score, 10);
});

test("out-of-bounds Up at spa row does not award points", () => {
  const state = session({
    player: { col: 6, row: 0, facing: "up" },
    score: 40,
    bestRowThisLife: 0,
  });

  assert.equal(hop(state, "up"), false);
  assert.equal(state.player.row, 0);
  assert.equal(state.player.col, 6);
  assert.equal(state.score, 40);
});

test("Left, Right, and Down hops do not change score", () => {
  const state = session({ player: { col: 5, row: 3, facing: "up" }, score: 20 });

  hop(state, "left");
  hop(state, "right");
  hop(state, "down");

  assert.equal(state.score, 20);
  assert.equal(state.player.col, 5);
  assert.equal(state.player.row, 4);
});

test("entering the spa awards hop plus fifty bonus", () => {
  const { resolveGoal } = game;
  const state = session({
    player: { col: 6, row: 1, facing: "up" },
    score: 0,
    lastTime: 0,
    bestRowThisLife: 1,
  });
  hop(state, "up");
  assert.equal(state.player.row, 0);
  assert.equal(state.score, 10);
  assert.equal(resolveGoal(state), true);
  assert.equal(state.score, 60);
  assert.ok(state.sinkingUntil > 0);
});

test("update ignores hops during the sink beat", () => {
  const { update } = game;
  const state = session({
    player: { col: 6, row: 0, facing: "up" },
    score: 60,
    sinkingUntil: 1000,
    lastTime: 100,
    pendingDirection: "down",
  });
  update(state, 16);
  assert.equal(state.player.row, 0);
  assert.equal(state.pendingDirection, null);
});

test("finishSink respawns at start, keeps score, bumps speed, resets watermark", () => {
  const { finishSink, createInitialPlayer } = game;
  const state = session({
    player: { col: 4, row: 0, facing: "up" },
    score: 60,
    lives: 2,
    lastTime: 500,
    sinkingUntil: 400,
    speedFactor: 1,
    bestRowThisLife: 0,
  });
  finishSink(state);
  assert.deepEqual(state.player, createInitialPlayer());
  assert.equal(state.score, 60);
  assert.equal(state.lives, 2);
  assert.equal(state.sinkingUntil, null);
  assert.equal(state.speedFactor, 1.1);
  assert.equal(state.bestRowThisLife, SPAWN_ROW);
});

test("resolveCollisions resets bestRowThisLife on death respawn", () => {
  const { resolveCollisions } = game;
  const state = session({
    player: { col: 6, row: 3, facing: "up" },
    hazards: [{ kind: "atv", frame: "atv_red", row: 3, x: 6, vx: -2.5, width: 1 }],
    lives: 3,
    score: 40,
    bestRowThisLife: 2,
    lastTime: 0,
  });
  assert.equal(resolveCollisions(state), true);
  assert.equal(state.bestRowThisLife, SPAWN_ROW);
});

test("update integrates hop into hazard then collision response", () => {
  const { update, createInitialPlayer } = game;
  const state = session({
    player: { col: 6, row: 4, facing: "up" },
    hazards: [{ kind: "atv", frame: "atv_red", row: 3, x: 6, vx: 0, width: 1 }],
    lives: 3,
    score: 20,
    lastTime: 0,
    pendingDirection: "up",
    freezeHazards: true,
    bestRowThisLife: 4,
  });
  update(state, 0);
  assert.equal(state.lives, 2);
  assert.deepEqual(state.player, createInitialPlayer());
  assert.equal(state.score, 30);
  assert.equal(state.pendingDirection, null);
});

test("update integrates hop into spa with goal bonus", () => {
  const { update } = game;
  const state = session({
    player: { col: 6, row: 1, facing: "up" },
    hazards: [],
    lives: 3,
    score: 0,
    lastTime: 0,
    pendingDirection: "up",
    freezeHazards: true,
    bestRowThisLife: 1,
  });
  update(state, 0);
  assert.equal(state.player.row, 0);
  assert.equal(state.score, 60);
  assert.ok(state.sinkingUntil > 0);
});

test("successful hop flips walkPhase", () => {
  const state = session({ walkPhase: 0 });
  hop(state, "up");
  assert.equal(state.walkPhase, 1);
  hop(state, "left");
  assert.equal(state.walkPhase, 0);
});
