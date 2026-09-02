import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const game = require("../game.js");

function makeCtx(trace = []) {
  return {
    trace,
    fillStyle: null, font: null,
    clearRect: (...a) => trace.push(["clearRect", ...a]),
    fillRect: (...a) => trace.push(["fillRect", ...a]),
    fillText: (...a) => trace.push(["fillText", ...a]),
    drawImage: (...a) => trace.push(["drawImage", ...a]),
    save: () => trace.push(["save"]),
    restore: () => trace.push(["restore"]),
    translate: (...a) => trace.push(["translate", ...a]),
    scale: (...a) => trace.push(["scale", ...a]),
  };
}

test("hazard frames match assets/sprites/manifest.json", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../assets/sprites/manifest.json", import.meta.url), "utf8"),
  );
  const byName = Object.fromEntries(manifest.frames.map((f) => [f.name, f]));
  for (const [key, rect] of Object.entries(game.HAZARD_FRAMES)) {
    const src = byName[key];
    assert.ok(src, `manifest has no frame named ${key}`);
    assert.deepEqual({ sx: src.x, sy: src.y, sw: src.w, sh: src.h }, rect, `${key} drifted`);
  }
  assert.equal(game.HAZARD_FRAMES.truck.sw, 32, "truck is double width in the atlas");
});

test("ATVs are faster than trucks", () => {
  assert.equal(game.TRUCK_SPEED, 1.5);
  assert.equal(game.ATV_SPEED, 2.5);
  assert.ok(game.ATV_SPEED > game.TRUCK_SPEED);
});

test("both road rows carry traffic in opposite directions", () => {
  const hazards = game.createInitialHazards();
  const trucks = hazards.filter((h) => h.kind === "truck");
  const atvs = hazards.filter((h) => h.kind === "atv");
  assert.ok(trucks.length >= 1, "row 1 needs a truck");
  assert.ok(atvs.length >= 1, "row 3 needs an ATV");
  for (const t of trucks) {
    assert.equal(t.row, 1);
    assert.equal(t.width, 2, "trucks are two tiles wide");
    assert.ok(t.vx > 0, "row 1 travels right");
  }
  for (const a of atvs) {
    assert.equal(a.row, 3);
    assert.equal(a.width, 1, "ATVs are one tile wide");
    assert.ok(a.vx < 0, "row 3 travels left");
  }
  // Lanes must line up with the board's road rows.
  assert.deepEqual(game.ROAD_ROWS, [1, 3]);
});

test("hazards advance in their direction of travel", () => {
  const state = game.createInitialState();
  const before = state.hazards.map((h) => h.x);
  game.moveHazards(state, 100);
  state.hazards.forEach((h, i) => {
    if (h.vx > 0) assert.ok(h.x > before[i]);
    else assert.ok(h.x < before[i]);
  });
});

test("distance travelled does not depend on frame rate", () => {
  const one = game.createInitialState();
  const two = game.createInitialState();
  game.moveHazards(one, 32);
  game.moveHazards(two, 16);
  game.moveHazards(two, 16);
  one.hazards.forEach((h, i) => {
    assert.ok(Math.abs(h.x - two.hazards[i].x) < 1e-9, "32ms must equal 2x16ms");
  });
});

test("an ATV outruns a truck over the same elapsed time", () => {
  const state = game.createInitialState();
  const truck = state.hazards.find((h) => h.kind === "truck");
  const atv = state.hazards.find((h) => h.kind === "atv");
  const t0 = truck.x, a0 = atv.x;
  game.moveHazards(state, 500);
  assert.ok(Math.abs(atv.x - a0) > Math.abs(truck.x - t0));
});

test("a right-moving hazard wraps past the right edge", () => {
  const state = game.createInitialState();
  state.hazards = [{ kind: "truck", frame: "truck", row: 1, x: 11.9, vx: 1.5, width: 2 }];
  game.moveHazards(state, 200); // +0.3 -> 12.2, past COLS
  const h = state.hazards[0];
  assert.ok(h.x < 0, `expected a wrap to the left side, got ${h.x}`);
  // Period is COLS + width = 14; 12.2 - 14 = -1.8, remainder preserved.
  assert.ok(Math.abs(h.x - -1.8) < 1e-9, `expected -1.8, got ${h.x}`);
});

test("a left-moving hazard wraps past the left edge", () => {
  const state = game.createInitialState();
  state.hazards = [{ kind: "atv", frame: "atv_red", row: 3, x: -0.9, vx: -2.5, width: 1 }];
  game.moveHazards(state, 100); // -0.25 -> -1.15, fully past the left edge
  const h = state.hazards[0];
  assert.ok(h.x > 0, `expected a wrap to the right side, got ${h.x}`);
  // Period is 13; -1.15 + 13 = 11.85.
  assert.ok(Math.abs(h.x - 11.85) < 1e-9, `expected 11.85, got ${h.x}`);
});

test("a hazard still fully on the board does not wrap", () => {
  const state = game.createInitialState();
  state.hazards = [{ kind: "atv", frame: "atv_red", row: 3, x: 5, vx: -2.5, width: 1 }];
  game.moveHazards(state, 100);
  assert.ok(Math.abs(state.hazards[0].x - 4.75) < 1e-9);
});

test("freeze holds every hazard still", () => {
  const state = game.createInitialState({ freeze: true });
  const before = state.hazards.map((h) => h.x);
  game.moveHazards(state, 500);
  state.hazards.forEach((h, i) => assert.equal(h.x, before[i]));
});

test("update moves hazards", () => {
  const state = game.createInitialState();
  const before = state.hazards[0].x;
  game.update(state, 100);
  assert.notEqual(state.hazards[0].x, before);
});

test("renderHazards places a left-mover at its lane row unflipped", () => {
  const trace = [];
  const state = game.createInitialState();
  state.atlas = "ATLAS";
  state.hazards = [{ kind: "atv", frame: "atv_red", row: 3, x: 2, vx: -2.5, width: 1 }];
  game.renderHazards(state, makeCtx(trace));
  assert.equal(trace.filter((c) => c[0] === "save").length, 0, "no flip for a left-mover");
  const [, , sx, sy, sw, sh, dx, dy, dw, dh] = trace[0];
  assert.deepEqual([sx, sy, sw, sh], [0, 48, 16, 16]);
  assert.deepEqual([dx, dy, dw, dh], [2 * 48, 3 * 48, 48, 48]);
});

test("renderHazards mirrors a right-mover and restores the transform", () => {
  const trace = [];
  const state = game.createInitialState();
  state.atlas = "ATLAS";
  state.hazards = [{ kind: "truck", frame: "truck", row: 1, x: 4, vx: 1.5, width: 2 }];
  game.renderHazards(state, makeCtx(trace));
  const kinds = trace.map((c) => c[0]);
  assert.deepEqual(kinds, ["save", "translate", "scale", "drawImage", "restore"]);
  assert.deepEqual(trace[1].slice(1), [4 * 48 + 96, 1 * 48], "translate to the far edge");
  assert.deepEqual(trace[2].slice(1), [-1, 1], "mirror horizontally");
  const draw = trace[3];
  assert.deepEqual(draw.slice(2, 6), [32, 48, 32, 16], "truck uses the 32x16 rect");
  assert.deepEqual(draw.slice(6), [0, 0, 96, 48], "double-width destination");
});

test("renderHazards skips an unknown frame and draws nothing without an atlas", () => {
  const trace = [];
  const state = game.createInitialState();
  state.atlas = "ATLAS";
  state.hazards = [{ kind: "x", frame: "nope", row: 1, x: 0, vx: 1, width: 1 }];
  game.renderHazards(state, makeCtx(trace));
  assert.equal(trace.length, 0);

  const t2 = [];
  const noAtlas = game.createInitialState();
  game.renderHazards(noAtlas, makeCtx(t2));
  assert.equal(t2.length, 0);
});

test("render order is tiles, hazards, player, HUD", () => {
  const trace = [];
  const state = game.createInitialState({ freeze: true });
  state.atlas = "ATLAS";
  game.render(state, makeCtx(trace));
  const draws = trace.map((c, i) => [c, i]).filter(([c]) => c[0] === "drawImage");
  // 84 tiles, then 4 hazards, then the player.
  assert.equal(draws.length, 84 + 4 + 1);
  const hazardDraw = draws[84][0];
  assert.equal(hazardDraw[3], 48, "first hazard draw uses a hazard source row");
  const playerDraw = draws[88][0];
  assert.deepEqual(playerDraw.slice(6, 8), [6 * 48, 6 * 48], "player is drawn last");
  const hud = trace.findIndex((c) => c[0] === "fillText");
  assert.ok(hud > draws[88][1], "HUD comes after every sprite");
});
