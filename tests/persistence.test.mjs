import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const game = require(join(root, "game.js"));

const {
  loadBest,
  saveBest,
  maybeUpdateBest,
  hop,
  restartSession,
  handleKeydown,
  update,
  createInitialPlayer,
  createInitialHazards,
  BEST_STORAGE_KEY,
  SPAWN_ROW,
} = game;

function memoryStorage(seed = {}) {
  const data = { ...seed };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
    _data: data,
  };
}

test("loadBest returns 0 when missing or invalid", () => {
  assert.equal(loadBest(null), 0);
  assert.equal(loadBest(memoryStorage()), 0);
  assert.equal(loadBest(memoryStorage({ [BEST_STORAGE_KEY]: "nope" })), 0);
});

test("loadBest restores a stored high score", () => {
  assert.equal(loadBest(memoryStorage({ [BEST_STORAGE_KEY]: "120" })), 120);
});

test("maybeUpdateBest writes when score exceeds Best", () => {
  const storage = memoryStorage({ [BEST_STORAGE_KEY]: "50" });
  const state = { score: 80, best: 50, storage };
  maybeUpdateBest(state);
  assert.equal(state.best, 80);
  assert.equal(storage.getItem(BEST_STORAGE_KEY), "80");
});

test("hop past Best updates persisted Best", () => {
  const storage = memoryStorage();
  const state = {
    player: createInitialPlayer(),
    score: 0,
    best: 0,
    bestRowThisLife: SPAWN_ROW,
    walkPhase: 0,
    storage,
  };
  hop(state, "up");
  assert.equal(state.score, 10);
  assert.equal(state.best, 10);
  assert.equal(storage.getItem(BEST_STORAGE_KEY), "10");
});

test("restart keeps Best and clears score and speedFactor", () => {
  const state = {
    player: { col: 1, row: 1, facing: "up" },
    hazards: [{ kind: "truck", frame: "truck", row: 1, x: 8, vx: 1.5, width: 2 }],
    lives: 0,
    score: 90,
    best: 90,
    gameOver: true,
    pendingRestart: false,
    speedFactor: 1.21,
    bestRowThisLife: 0,
    storage: memoryStorage({ [BEST_STORAGE_KEY]: "90" }),
  };
  handleKeydown({ key: "Enter", preventDefault() {} }, state);
  update(state, 16);
  assert.equal(state.score, 0);
  assert.equal(state.best, 90);
  assert.equal(state.speedFactor, 1);
  assert.equal(state.bestRowThisLife, SPAWN_ROW);
  assert.deepEqual(state.player, createInitialPlayer());
  assert.deepEqual(state.hazards, createInitialHazards());
});

test("saveBest is a no-op without storage", () => {
  saveBest(null, 10);
});
