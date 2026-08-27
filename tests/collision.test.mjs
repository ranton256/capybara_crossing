import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const game = require(join(root, "game.js"));

const { aabbOverlap, resolveCollisions, createInitialPlayer } = game;

test("aabbOverlap is true when boxes intersect and false when they do not", () => {
  assert.equal(
    aabbOverlap({ x: 6, y: 3, w: 1, h: 1 }, { x: 5.5, y: 3, w: 2, h: 1 }),
    true,
  );
  assert.equal(
    aabbOverlap({ x: 6, y: 2, w: 1, h: 1 }, { x: 5, y: 3, w: 1, h: 1 }),
    false,
  );
});

test("resolveCollisions on hit decrements lives, respawns, and keeps score", () => {
  const state = {
    player: { col: 6, row: 3, facing: "up" },
    hazards: [{ kind: "atv", frame: "atv_red", row: 3, x: 6, vx: -2.5, width: 1 }],
    lives: 3,
    score: 40,
    lastTime: 1000,
  };

  const hit = resolveCollisions(state);

  assert.equal(hit, true);
  assert.equal(state.lives, 2);
  assert.deepEqual(state.player, createInitialPlayer());
  assert.equal(state.score, 40);
  assert.ok(state.hurtUntil > 1000);
});

test("resolveCollisions on a miss leaves lives and position", () => {
  const player = { col: 6, row: 2, facing: "up" };
  const state = {
    player,
    hazards: [{ kind: "atv", frame: "atv_red", row: 3, x: 6, vx: -2.5, width: 1 }],
    lives: 3,
    score: 10,
  };

  assert.equal(resolveCollisions(state), false);
  assert.equal(state.lives, 3);
  assert.equal(state.player.row, 2);
  assert.equal(state.score, 10);
});
