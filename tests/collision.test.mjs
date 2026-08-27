import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const game = require(join(root, "game.js"));

const {
  aabbOverlap,
  resolveCollisions,
  finishDeath,
  update,
  createInitialPlayer,
  DEATH_MS,
  FLASH_MS,
} = game;

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

test("resolveCollisions on hit decrements lives, holds at impact, and keeps score", () => {
  const impact = { col: 6, row: 3, facing: "up" };
  const state = {
    player: { ...impact },
    hazards: [{ kind: "atv", frame: "atv_red", row: 3, x: 6, vx: -2.5, width: 1 }],
    lives: 3,
    score: 40,
    lastTime: 1000,
    pendingDirection: "up",
  };

  const hit = resolveCollisions(state);

  assert.equal(hit, true);
  assert.equal(state.lives, 2);
  assert.deepEqual(state.player, impact);
  assert.equal(state.score, 40);
  assert.equal(state.hurtUntil, 1000 + DEATH_MS);
  assert.equal(state.flashUntil, 1000 + FLASH_MS);
  assert.equal(state.pendingDirection, null);
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

test("resolveCollisions truck width 2 overlap hits and holds at impact", () => {
  const impact = { col: 7, row: 1, facing: "up" };
  const state = {
    player: { ...impact },
    hazards: [{ kind: "truck", frame: "truck", row: 1, x: 6, vx: 1.5, width: 2 }],
    lives: 3,
    score: 25,
    lastTime: 500,
  };

  assert.equal(resolveCollisions(state), true);
  assert.equal(state.lives, 2);
  assert.deepEqual(state.player, impact);
  assert.equal(state.score, 25);
});

test("hops are ignored during the death beat", () => {
  const state = {
    player: { col: 6, row: 3, facing: "up" },
    hazards: [{ kind: "atv", frame: "atv_red", row: 3, x: 6, vx: 0, width: 1 }],
    lives: 2,
    score: 40,
    lastTime: 100,
    hurtUntil: 100 + DEATH_MS,
    flashUntil: 100 + FLASH_MS,
    pendingDirection: "left",
    freezeHazards: true,
  };
  update(state, 16);
  assert.equal(state.player.col, 6);
  assert.equal(state.player.row, 3);
  assert.equal(state.pendingDirection, null);
  assert.equal(state.lives, 2);
});

test("finishDeath respawns at start after the death beat", () => {
  const state = {
    player: { col: 6, row: 3, facing: "up" },
    hazards: [{ kind: "atv", frame: "atv_red", row: 3, x: 6, vx: 0, width: 1 }],
    lives: 2,
    score: 40,
    lastTime: 1000,
    hurtUntil: 900,
    flashUntil: 800,
    bestRowThisLife: 2,
  };
  finishDeath(state);
  assert.deepEqual(state.player, createInitialPlayer());
  assert.equal(state.score, 40);
  assert.equal(state.hurtUntil, null);
  assert.equal(state.flashUntil, null);
  assert.equal(state.bestRowThisLife, 6);
});

test("no further collision during the death beat", () => {
  const state = {
    player: { col: 6, row: 3, facing: "up" },
    hazards: [{ kind: "atv", frame: "atv_red", row: 3, x: 6, vx: 0, width: 1 }],
    lives: 2,
    score: 40,
    lastTime: 100,
    hurtUntil: 100 + DEATH_MS,
    freezeHazards: true,
  };
  update(state, 16);
  assert.equal(state.lives, 2);
  assert.equal(state.player.row, 3);
});

test("expiring death beat under a hazard respawns once without a second hit", () => {
  const state = {
    player: { col: 6, row: 3, facing: "up" },
    hazards: [{ kind: "atv", frame: "atv_red", row: 3, x: 6, vx: 0, width: 1 }],
    lives: 2,
    score: 40,
    lastTime: 1000,
    hurtUntil: 1000,
    flashUntil: 900,
    bestRowThisLife: 2,
    freezeHazards: true,
  };
  update(state, 16);
  assert.equal(state.lives, 2);
  assert.deepEqual(state.player, createInitialPlayer());
  assert.equal(state.hurtUntil, null);
  assert.equal(state.gameOver, undefined);
});
