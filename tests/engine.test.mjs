import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const game = require(join(root, "game.js"));

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  configureCanvas,
  tick,
  startLoop,
  boot,
} = game;

function stubContext() {
  return {
    imageSmoothingEnabled: true,
    clearRect() {},
    fillRect() {},
    fillStyle: "",
  };
}

function stubCanvas(ctx = stubContext()) {
  return {
    width: 0,
    height: 0,
    getContext(type) {
      assert.equal(type, "2d");
      return ctx;
    },
  };
}

test("game.js exports canvas size constants", () => {
  assert.equal(CANVAS_WIDTH, 576);
  assert.equal(CANVAS_HEIGHT, 336);
});

test("configureCanvas sets backing store and disables smoothing", () => {
  const ctx = stubContext();
  const canvas = stubCanvas(ctx);

  const returned = configureCanvas(canvas);

  assert.equal(canvas.width, 576);
  assert.equal(canvas.height, 336);
  assert.equal(ctx.imageSmoothingEnabled, false);
  assert.equal(returned, ctx);
});

test("tick runs update before render and clears the canvas", () => {
  const log = [];
  const ctx = {
    imageSmoothingEnabled: true,
    clearRect(x, y, w, h) {
      log.push("clearRect");
      assert.equal(x, 0);
      assert.equal(y, 0);
      assert.equal(w, 576);
      assert.equal(h, 336);
    },
    fillRect() {
      log.push("fillRect");
    },
    fillStyle: "",
  };
  const state = { _log: log };

  tick(state, ctx, 16);

  assert.deepEqual(log.slice(0, 2), ["update", "render"]);
  assert.ok(log.includes("clearRect"));
  assert.ok(log.includes("fillRect"));
});

test("startLoop schedules the next frame after each tick", () => {
  const ctx = stubContext();
  const state = {};
  const scheduled = [];

  startLoop((cb) => scheduled.push(cb), state, ctx);

  assert.equal(scheduled.length, 1);
  scheduled[0](0);
  assert.equal(scheduled.length, 2);
});

test("boot configures canvas and starts the loop without throwing", () => {
  const ctx = stubContext();
  const canvas = stubCanvas(ctx);
  const documentRef = {
    getElementById(id) {
      assert.equal(id, "game");
      return canvas;
    },
  };
  const scheduled = [];

  boot({ document: documentRef, scheduler: (cb) => scheduled.push(cb) });

  assert.equal(canvas.width, 576);
  assert.equal(canvas.height, 336);
  assert.equal(scheduled.length, 1);
});
