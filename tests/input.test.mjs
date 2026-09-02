import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const game = require("../game.js");

const at = (state, col, row) => { state.player.col = col; state.player.row = row; };

test("directionFromKey maps the four arrows and nothing else", () => {
  assert.equal(game.directionFromKey("ArrowUp"), "up");
  assert.equal(game.directionFromKey("ArrowDown"), "down");
  assert.equal(game.directionFromKey("ArrowLeft"), "left");
  assert.equal(game.directionFromKey("ArrowRight"), "right");
  assert.equal(game.directionFromKey("Enter"), undefined);
  assert.equal(game.directionFromKey("a"), undefined);
  assert.equal(game.directionFromKey(undefined), undefined);
});

test("handleKeydown records one pending direction", () => {
  const state = game.createInitialState();
  assert.equal(game.handleKeydown(state, { key: "ArrowLeft" }), true);
  assert.equal(state.pendingDirection, "left");
});

test("handleKeydown ignores non-arrow keys", () => {
  const state = game.createInitialState();
  assert.equal(game.handleKeydown(state, { key: "q" }), false);
  assert.equal(state.pendingDirection, null);
  assert.equal(game.handleKeydown(state, {}), false);
});

test("an interior hop moves exactly one cell", () => {
  const state = game.createInitialState();
  at(state, 6, 4);
  assert.equal(game.hop(state, "up"), true);
  assert.deepEqual([state.player.col, state.player.row], [6, 3]);
  game.hop(state, "right");
  assert.deepEqual([state.player.col, state.player.row], [7, 3]);
  game.hop(state, "down");
  assert.deepEqual([state.player.col, state.player.row], [7, 4]);
  game.hop(state, "left");
  assert.deepEqual([state.player.col, state.player.row], [6, 4]);
});

test("repeated presses each move one further cell", () => {
  const state = game.createInitialState();
  at(state, 6, 6);
  for (let i = 0; i < 3; i++) game.hop(state, "up");
  assert.equal(state.player.row, 3);
});

test("outward hops at every edge are rejected without wrapping", () => {
  const state = game.createInitialState();

  at(state, 0, 3);
  assert.equal(game.hop(state, "left"), false);
  assert.deepEqual([state.player.col, state.player.row], [0, 3]);

  at(state, 11, 3);
  assert.equal(game.hop(state, "right"), false);
  assert.equal(state.player.col, 11);

  at(state, 5, 0);
  assert.equal(game.hop(state, "up"), false);
  assert.equal(state.player.row, 0);

  at(state, 5, 6);
  assert.equal(game.hop(state, "down"), false);
  assert.equal(state.player.row, 6);
});

test("inward hops from an edge succeed", () => {
  const state = game.createInitialState();
  at(state, 0, 0);
  assert.equal(game.hop(state, "right"), true);
  assert.equal(state.player.col, 1);
  assert.equal(game.hop(state, "down"), true);
  assert.equal(state.player.row, 1);
});

test("an unknown direction is rejected", () => {
  const state = game.createInitialState();
  assert.equal(game.hop(state, "sideways"), false);
});

test("update consumes exactly one pending press", () => {
  const state = game.createInitialState();
  game.handleKeydown(state, { key: "ArrowUp" });
  game.update(state, 16);
  assert.equal(state.player.row, 5);
  assert.equal(state.pendingDirection, null);
  // A second update with nothing pending must not move the player again.
  game.update(state, 16);
  assert.equal(state.player.row, 5);
});

test("boot wires keydown to the pending direction", () => {
  const listeners = {};
  const canvas = { width: 0, height: 0, getContext: () => ({ imageSmoothingEnabled: true }) };
  const doc = {
    getElementById: () => canvas,
    addEventListener: (type, fn) => { listeners[type] = fn; },
  };
  const state = game.boot({ document: doc, scheduler: () => {}, ImageCtor: class { set src(v) {} } });
  listeners.keydown({ key: "ArrowRight" });
  assert.equal(state.pendingDirection, "right");
});
