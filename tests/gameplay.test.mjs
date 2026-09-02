import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const game = require("../game.js");

test("player walk frames match assets/sprites/manifest.json", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../assets/sprites/manifest.json", import.meta.url), "utf8"),
  );
  const byName = Object.fromEntries(manifest.frames.map((f) => [f.name, f]));
  const expected = {
    up: ["capy_up_1", "capy_up_2"],
    down: ["capy_down_1", "capy_down_2"],
    left: ["capy_left_1", "capy_left_2"],
    right: ["capy_right_1", "capy_right_2"],
  };
  for (const [facing, names] of Object.entries(expected)) {
    names.forEach((name, i) => {
      const src = byName[name];
      assert.deepEqual(
        { sx: src.x, sy: src.y, sw: src.w, sh: src.h },
        game.PLAYER_FRAMES[facing][i],
        `${name} rect drifted from the manifest`,
      );
    });
  }
});

test("a fresh session spawns at column 6 row 6 facing up with score 0", () => {
  const state = game.createInitialState();
  assert.equal(state.player.col, 6);
  assert.equal(state.player.row, 6);
  assert.equal(state.player.facing, "up");
  assert.equal(state.score, 0);
  assert.equal(state.bestRowThisLife, 6);
  assert.equal(game.SPAWN_COL, 6);
  assert.equal(game.SPAWN_ROW, 6);
});

test("the first Up hop awards ten and moves the watermark", () => {
  const state = game.createInitialState();
  game.hop(state, "up");
  assert.equal(state.player.row, 5);
  assert.equal(state.score, 10);
  assert.equal(state.bestRowThisLife, 5);
});

test("re-climbing ground already covered does not score again", () => {
  const state = game.createInitialState();
  game.hop(state, "up");
  game.hop(state, "up");
  assert.equal(state.score, 20);
  game.hop(state, "down");
  assert.equal(state.score, 20, "moving back does not score");
  game.hop(state, "up");
  assert.equal(state.score, 20, "re-entering a reached row must not pay again");
  assert.equal(state.bestRowThisLife, 4);
});

test("climbing all the way to the spa row scores once per row", () => {
  const state = game.createInitialState();
  for (let i = 0; i < 6; i++) game.hop(state, "up");
  assert.equal(state.player.row, 0);
  assert.equal(state.score, 60);
});

test("lateral hops move without scoring", () => {
  const state = game.createInitialState();
  game.hop(state, "left");
  assert.equal(state.player.col, 5);
  assert.equal(state.score, 0);
  game.hop(state, "right");
  assert.equal(state.player.col, 6);
  assert.equal(state.score, 0);
});

test("a blocked Up hop at row 0 does not score", () => {
  const state = game.createInitialState();
  for (let i = 0; i < 6; i++) game.hop(state, "up");
  const before = state.score;
  assert.equal(game.hop(state, "up"), false);
  assert.equal(state.player.row, 0);
  assert.equal(state.score, before);
});

test("facing follows an accepted hop", () => {
  const state = game.createInitialState();
  game.hop(state, "left");
  assert.equal(state.player.facing, "left");
  game.hop(state, "up");
  assert.equal(state.player.facing, "up");
  // Down is only accepted away from the bottom row.
  game.hop(state, "down");
  assert.equal(state.player.facing, "down");
});

test("facing survives a rejected hop", () => {
  const state = game.createInitialState();
  game.hop(state, "left");
  assert.equal(state.player.facing, "left");
  state.player.row = 6;
  assert.equal(game.hop(state, "down"), false);
  assert.equal(state.player.facing, "left", "a rejected hop must not spin the sprite");
});
