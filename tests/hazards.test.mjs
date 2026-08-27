import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const game = require(join(root, "game.js"));

const { createInitialHazards, moveHazards, COLS } = game;

test("spawn places trucks on row 1 and ATVs on row 3 with opposite velocities", () => {
  const hazards = createInitialHazards();
  const trucks = hazards.filter((h) => h.kind === "truck");
  const atvs = hazards.filter((h) => h.kind === "atv");

  assert.ok(trucks.length >= 1);
  assert.ok(atvs.length >= 1);
  assert.ok(trucks.every((h) => h.row === 1 && h.width === 2 && h.vx > 0));
  assert.ok(atvs.every((h) => h.row === 3 && h.width === 1 && h.vx < 0));
});

test("moveHazards advances x by velocity times elapsed seconds", () => {
  const state = {
    hazards: [{ kind: "atv", frame: "atv_red", row: 3, x: 4, vx: -2.5, width: 1 }],
    freezeHazards: false,
  };

  moveHazards(state, 1000);

  assert.equal(state.hazards[0].x, 1.5);
});

test("moveHazards wraps at both board edges", () => {
  const right = {
    hazards: [{ kind: "truck", frame: "truck", row: 1, x: 11.5, vx: 1.5, width: 2 }],
    freezeHazards: false,
  };
  moveHazards(right, 1000);
  assert.ok(right.hazards[0].x < COLS);
  assert.ok(right.hazards[0].x < 11.5);

  const left = {
    hazards: [{ kind: "atv", frame: "atv_red", row: 3, x: 0, vx: -2.5, width: 1 }],
    freezeHazards: false,
  };
  moveHazards(left, 1000);
  assert.ok(left.hazards[0].x + left.hazards[0].width > 0);
  assert.ok(left.hazards[0].x > 0);
});

test("frozen hazards do not move", () => {
  const state = {
    hazards: [{ kind: "truck", frame: "truck", row: 1, x: 3, vx: 1.5, width: 2 }],
    freezeHazards: true,
  };

  moveHazards(state, 1000);

  assert.equal(state.hazards[0].x, 3);
});
