import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const game = require(join(root, "game.js"));

const {
  resolveCollisions,
  update,
  handleKeydown,
  renderOverlay,
  createInitialPlayer,
  createInitialHazards,
} = game;

test("last remaining life collision enters Game Over", () => {
  const state = {
    player: { col: 6, row: 3, facing: "up" },
    hazards: [{ kind: "atv", frame: "atv_red", row: 3, x: 6, vx: -2.5, width: 1 }],
    lives: 1,
    score: 40,
    lastTime: 0,
  };
  assert.equal(resolveCollisions(state), true);
  assert.equal(state.lives, 0);
  assert.equal(state.gameOver, true);
  assert.deepEqual(state.player, createInitialPlayer());
  assert.equal(state.score, 40);
});

test("Enter restarts a Game Over session", () => {
  const state = {
    player: { col: 3, row: 3, facing: "left" },
    hazards: [{ kind: "truck", frame: "truck", row: 1, x: 8, vx: 1.5, width: 2 }],
    lives: 0,
    score: 90,
    gameOver: true,
    pendingRestart: false,
  };
  handleKeydown({ key: "Enter", preventDefault() {} }, state);
  assert.equal(state.pendingRestart, true);
  update(state, 16);
  assert.equal(state.gameOver, false);
  assert.equal(state.lives, 3);
  assert.equal(state.score, 0);
  assert.deepEqual(state.player, createInitialPlayer());
});

test("arrows do not hop during Game Over", () => {
  const state = {
    player: createInitialPlayer(),
    lives: 0,
    score: 10,
    gameOver: true,
    pendingDirection: null,
  };
  handleKeydown({ key: "ArrowUp", preventDefault() {} }, state);
  assert.equal(state.pendingDirection, null);
  update(state, 16);
  assert.equal(state.player.row, 6);
});

test("Space restarts a Game Over session and resets hazards", () => {
  const state = {
    player: { col: 3, row: 3, facing: "left" },
    hazards: [{ kind: "truck", frame: "truck", row: 1, x: 8, vx: 1.5, width: 2 }],
    lives: 0,
    score: 90,
    gameOver: true,
    pendingRestart: false,
  };
  handleKeydown({ key: " ", preventDefault() {} }, state);
  assert.equal(state.pendingRestart, true);
  update(state, 16);
  assert.equal(state.gameOver, false);
  assert.equal(state.lives, 3);
  assert.equal(state.score, 0);
  assert.deepEqual(state.player, createInitialPlayer());
  assert.deepEqual(state.hazards, createInitialHazards());
});

test("hazards do not move during Game Over", () => {
  const state = {
    player: createInitialPlayer(),
    hazards: [{ kind: "atv", frame: "atv_red", row: 3, x: 4, vx: -2.5, width: 1 }],
    lives: 0,
    score: 10,
    gameOver: true,
    freezeHazards: false,
  };
  update(state, 1000);
  assert.equal(state.hazards[0].x, 4);
});

test("renderOverlay draws Game Over and final score", () => {
  const texts = [];
  renderOverlay(
    {
      fillStyle: "",
      font: "",
      textAlign: "",
      textBaseline: "",
      fillText(text) {
        texts.push(text);
      },
    },
    { gameOver: true, score: 70 },
  );
  assert.ok(texts.some((t) => t.includes("Game Over")));
  assert.ok(texts.some((t) => t.includes("70")));
});
