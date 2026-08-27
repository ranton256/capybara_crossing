import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const game = require(join(root, "game.js"));

const { createInitialPlayer, hop } = game;

function session(overrides = {}) {
  return {
    player: createInitialPlayer(),
    score: 0,
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
