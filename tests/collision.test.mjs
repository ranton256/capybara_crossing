import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const game = require("../game.js");

function makeCtx(trace = []) {
  return {
    trace, fillStyle: null, font: null,
    clearRect: (...a) => trace.push(["clearRect", ...a]),
    fillRect: (...a) => trace.push(["fillRect", ...a]),
    fillText: (...a) => trace.push(["fillText", ...a]),
    drawImage: (...a) => trace.push(["drawImage", ...a]),
    save: () => trace.push(["save"]), restore: () => trace.push(["restore"]),
    translate: (...a) => trace.push(["translate", ...a]),
    scale: (...a) => trace.push(["scale", ...a]),
  };
}

// Put the player somewhere with a single hazard we control.
function scenario({ col = 3, row = 3, hazard = {}, lives } = {}) {
  const state = game.createInitialState();
  state.lastTime = 1000;
  state.player.col = col;
  state.player.row = row;
  state.hazards = [{ kind: "atv", frame: "atv_red", row: 3, x: 3, vx: -2.5, width: 1, ...hazard }];
  if (lives !== undefined) state.lives = lives;
  return state;
}

test("a fresh session has three lives", () => {
  assert.equal(game.STARTING_LIVES, 3);
  assert.equal(game.createInitialState().lives, 3);
});

test("aabbOverlap detects overlap and separation", () => {
  const a = { x: 0, y: 0, w: 1, h: 1 };
  assert.equal(game.aabbOverlap(a, { x: 0.5, y: 0, w: 1, h: 1 }), true);
  assert.equal(game.aabbOverlap(a, { x: 2, y: 0, w: 1, h: 1 }), false);
  assert.equal(game.aabbOverlap(a, { x: 0, y: 1, w: 1, h: 1 }), false, "row below");
});

test("boxes that merely touch do not collide", () => {
  const a = { x: 1, y: 0, w: 1, h: 1 };
  assert.equal(game.aabbOverlap(a, { x: 0, y: 0, w: 1, h: 1 }), false, "left edge touches");
  assert.equal(game.aabbOverlap(a, { x: 2, y: 0, w: 1, h: 1 }), false, "right edge touches");
});

test("a direct overlap registers a hit and costs one life", () => {
  const state = scenario();
  assert.equal(game.resolveCollisions(state), true);
  assert.equal(state.lives, 2);
  assert.equal(state.score, 0, "the score is not touched by a hit");
  assert.deepEqual([state.player.col, state.player.row], [3, 3], "pinned to the impact cell");
});

test("a truck hits across both of its tiles", () => {
  const left = scenario({ col: 4, hazard: { kind: "truck", frame: "truck", row: 3, x: 4, width: 2, vx: 1.5 } });
  assert.equal(game.resolveCollisions(left), true, "left tile hits");

  const right = scenario({ col: 5, hazard: { kind: "truck", frame: "truck", row: 3, x: 4, width: 2, vx: 1.5 } });
  assert.equal(game.resolveCollisions(right), true, "second tile of the truck also hits");

  const clear = scenario({ col: 6, hazard: { kind: "truck", frame: "truck", row: 3, x: 4, width: 2, vx: 1.5 } });
  assert.equal(game.resolveCollisions(clear), false, "just past the truck is safe");
});

test("a hazard on an adjacent row is safe", () => {
  const state = scenario({ row: 2 }); // median, hazard is on row 3
  assert.equal(game.resolveCollisions(state), false);
  assert.equal(state.lives, 3);
  assert.deepEqual([state.player.col, state.player.row], [3, 2]);
});

test("one impact costs exactly one life", () => {
  const state = scenario();
  assert.equal(game.resolveCollisions(state), true);
  assert.equal(state.lives, 2);
  // Still overlapping on the next frame, but the death beat suppresses it.
  assert.equal(game.resolveCollisions(state), false);
  assert.equal(state.lives, 2);
});

test("movement is ignored during the death beat", () => {
  const state = scenario();
  game.resolveCollisions(state);
  assert.equal(game.isDying(state), true);
  state.pendingDirection = "up";
  game.update(state, 16);
  assert.deepEqual([state.player.col, state.player.row], [3, 3], "no hop while dying");
  assert.equal(state.pendingDirection, null, "the press is consumed, not banked");
});

test("the beat ends with a respawn that restores scoring ground", () => {
  const state = scenario();
  state.bestRowThisLife = 3;
  state.score = 30;
  game.resolveCollisions(state);
  // Advance the clock past the beat and run the update that ends it.
  state.lastTime += game.DEATH_MS + 1;
  game.update(state, 16);
  assert.deepEqual([state.player.col, state.player.row], [6, 6]);
  assert.equal(state.lives, 2, "one impact costs one life even across the beat boundary");
  assert.equal(state.bestRowThisLife, 6, "watermark resets so the climb can score again");
  assert.equal(state.score, 30, "score carries over");
  assert.equal(game.isDying(state), false);
  game.hop(state, "up");
  assert.equal(state.score, 40, "a fresh climb scores again");
});

test("the last life ends the run without respawning", () => {
  const state = scenario({ lives: 1 });
  assert.equal(game.resolveCollisions(state), true);
  assert.equal(state.lives, 0);
  assert.equal(state.gameOver, true);
  assert.deepEqual([state.player.col, state.player.row], [3, 3], "stays where it died");
  // No respawn, even after the beat window would have elapsed.
  state.lastTime += game.DEATH_MS + 1;
  game.update(state, 16);
  assert.deepEqual([state.player.col, state.player.row], [3, 3]);
});

test("game over stops further hops", () => {
  const state = scenario({ lives: 1 });
  game.resolveCollisions(state);
  state.pendingDirection = "up";
  game.update(state, 16);
  assert.equal(state.player.row, 3);
});

test("elapsed time is clamped so hazards cannot tunnel", () => {
  const state = game.createInitialState();
  const ctx = makeCtx();
  game.tick(state, ctx, 0);
  game.tick(state, ctx, 2000); // a stalled tab
  assert.equal(state.lastDelta, game.MAX_DELTA_MS);
  game.tick(state, ctx, 2016); // a normal frame
  assert.equal(state.lastDelta, 16);
});

test("the defeat frame matches assets/sprites/manifest.json", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../assets/sprites/manifest.json", import.meta.url), "utf8"),
  );
  const src = manifest.frames.find((f) => f.name === "capy_defeat");
  assert.deepEqual({ sx: src.x, sy: src.y, sw: src.w, sh: src.h }, game.DEFEAT_FRAME);
});

test("the defeat pose replaces the walk frame while dying", () => {
  const state = scenario();
  state.atlas = "ATLAS";
  game.resolveCollisions(state);
  const trace = [];
  game.renderPlayer(state, makeCtx(trace));
  const [, , sx, sy] = trace[0];
  assert.deepEqual([sx, sy], [game.DEFEAT_FRAME.sx, game.DEFEAT_FRAME.sy]);
  assert.notEqual(sy, 0, "must not be a walk frame from atlas row 0");
});

test("the defeat pose persists through game over", () => {
  const state = scenario({ lives: 1 });
  state.atlas = "ATLAS";
  game.resolveCollisions(state);
  const trace = [];
  game.renderPlayer(state, makeCtx(trace));
  assert.equal(trace[0][4], game.DEFEAT_FRAME.sy);
});

test("the flash shows during its window and then stops", () => {
  const state = scenario();
  game.resolveCollisions(state);
  const during = [];
  game.renderFlash(state, makeCtx(during));
  assert.equal(during.length, 1, "flash drawn during the window");
  assert.deepEqual(during[0], ["fillRect", 0, 0, 576, 336]);

  state.lastTime += game.FLASH_MS + 1;
  const after = [];
  game.renderFlash(state, makeCtx(after));
  assert.equal(after.length, 0, "flash stops after its window");
});

test("the flash is drawn under the HUD", () => {
  const state = scenario();
  state.atlas = "ATLAS";
  game.resolveCollisions(state);
  const trace = [];
  game.render(state, makeCtx(trace));
  const kinds = trace.map((c) => c[0]);
  const flash = kinds.lastIndexOf("fillRect");
  const hud = kinds.indexOf("fillText");
  const lastSprite = kinds.lastIndexOf("drawImage");
  assert.ok(flash > lastSprite, "flash covers the world");
  assert.ok(hud > flash, "HUD stays readable above the flash");
});

test("the HUD shows lives", () => {
  const state = game.createInitialState();
  state.lives = 2;
  const trace = [];
  game.renderHud(state, makeCtx(trace));
  const texts = trace.filter((c) => c[0] === "fillText").map((c) => c[1]).join(" ");
  assert.match(texts, /2/);
  assert.match(texts, /Lives/i);
});
