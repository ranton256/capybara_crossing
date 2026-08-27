import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const game = require(join(root, "game.js"));

const {
  createInitialPlayer,
  hop,
  update,
  handleKeydown,
  directionFromKey,
} = game;

function session(overrides = {}) {
  return {
    player: createInitialPlayer(),
    score: 0,
    pendingDirection: null,
    ...overrides,
  };
}

test("outward hops at edges leave position unchanged and do not wrap", () => {
  const top = session({ player: { col: 6, row: 0, facing: "up" }, score: 30 });
  hop(top, "up");
  assert.equal(top.player.row, 0);
  assert.equal(top.player.col, 6);
  assert.equal(top.score, 30);

  const bottom = session({ player: { col: 6, row: 6, facing: "up" } });
  hop(bottom, "down");
  assert.equal(bottom.player.row, 6);

  const left = session({ player: { col: 0, row: 3, facing: "left" } });
  hop(left, "left");
  assert.equal(left.player.col, 0);

  const right = session({ player: { col: 11, row: 3, facing: "right" } });
  hop(right, "right");
  assert.equal(right.player.col, 11);
});

test("inward hop from an edge succeeds", () => {
  const state = session({ player: { col: 0, row: 6, facing: "up" } });

  hop(state, "right");
  hop(state, "up");

  assert.equal(state.player.col, 1);
  assert.equal(state.player.row, 5);
});

test("update consumes pendingDirection as one discrete hop", () => {
  const state = session({ pendingDirection: "up" });

  update(state, 16);

  assert.equal(state.player.row, 5);
  assert.equal(state.score, 10);
  assert.equal(state.pendingDirection, null);

  update(state, 16);
  assert.equal(state.player.row, 5);
  assert.equal(state.score, 10);
});

test("arrow keydown queues a direction and preventDefault", () => {
  assert.equal(directionFromKey("ArrowUp"), "up");
  assert.equal(directionFromKey("ArrowDown"), "down");
  assert.equal(directionFromKey("ArrowLeft"), "left");
  assert.equal(directionFromKey("ArrowRight"), "right");
  assert.equal(directionFromKey("w"), null);

  const state = session();
  let prevented = false;
  handleKeydown(
    {
      key: "ArrowLeft",
      preventDefault() {
        prevented = true;
      },
    },
    state,
  );

  assert.equal(prevented, true);
  assert.equal(state.pendingDirection, "left");
});
