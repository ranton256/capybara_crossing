import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const game = require("../game.js");

const readShipped = (name) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");

// A context stub that records the drawing calls it receives, so ordering and
// clearing are asserted as observable behavior rather than internal plumbing.
function makeCtx(trace = []) {
  return {
    trace,
    imageSmoothingEnabled: true,
    fillStyle: null,
    font: null,
    clearRect: (...args) => trace.push(["clearRect", ...args]),
    fillRect: (...args) => trace.push(["fillRect", ...args]),
    fillText: (...args) => trace.push(["fillText", ...args]),
  };
}

function makeCanvas(trace = []) {
  const ctx = makeCtx(trace);
  return { width: 0, height: 0, getContext: () => ctx, ctx };
}

test("canvas backing store is 576x336", () => {
  assert.equal(game.CANVAS_WIDTH, 576);
  assert.equal(game.CANVAS_HEIGHT, 336);
  assert.equal(game.COLS * game.TILE_SIZE * game.SCALE, 576);
  assert.equal(game.ROWS * game.TILE_SIZE * game.SCALE, 336);
});

test("configureCanvas sizes the canvas and disables smoothing", () => {
  const canvas = makeCanvas();
  const ctx = game.configureCanvas(canvas);
  assert.equal(canvas.width, 576);
  assert.equal(canvas.height, 336);
  assert.equal(ctx.imageSmoothingEnabled, false);
});

test("stylesheet requests crisp pixel rendering", () => {
  const css = readShipped("style.css");
  assert.match(css, /image-rendering:\s*pixelated/);
});

test("update receives the elapsed time", () => {
  const state = game.createInitialState();
  game.update(state, 16);
  assert.equal(state.lastDelta, 16);
  assert.equal(state.frames, 1);
});

test("render clears the entire drawing surface", () => {
  const trace = [];
  const ctx = makeCtx(trace);
  game.render(game.createInitialState(), ctx);
  assert.deepEqual(trace[0], ["clearRect", 0, 0, 576, 336]);
});

test("tick runs update to completion before render", () => {
  const trace = [];
  const ctx = makeCtx(trace);
  const state = game.createInitialState();
  // Frame one establishes the clock, so its delta is 0.
  game.tick(state, ctx, 1000);
  assert.equal(state.lastDelta, 0);
  assert.equal(state.frames, 1);
  // The frame counter is already incremented by the time anything is drawn.
  assert.equal(trace.length > 0, true);

  game.tick(state, ctx, 1016);
  assert.equal(state.lastDelta, 16);
  assert.equal(state.frames, 2);
});

test("tick updates before it renders", () => {
  const trace = [];
  const ctx = makeCtx(trace);
  const state = game.createInitialState();
  // Record the frame count observed at draw time; update must have run already.
  ctx.clearRect = (...args) => trace.push(["clearRect", state.frames, ...args]);
  game.tick(state, ctx, 0);
  assert.equal(trace[0][1], 1, "update must run before render");
});

test("startLoop schedules the next frame each tick", () => {
  const state = game.createInitialState();
  const ctx = makeCtx();
  const queue = [];
  const scheduler = (fn) => queue.push(fn);

  game.startLoop(state, ctx, { scheduler });
  assert.equal(queue.length, 1, "loop must schedule a first frame");

  queue.shift()(0);
  assert.equal(queue.length, 1, "each frame must schedule the next");
  queue.shift()(16);
  assert.equal(queue.length, 1);
  assert.equal(state.frames, 2);
});

test("boot configures the canvas and starts the loop", () => {
  const canvas = makeCanvas();
  const queue = [];
  const doc = { getElementById: (id) => (id === "game" ? canvas : null) };
  const state = game.boot({ document: doc, scheduler: (fn) => queue.push(fn) });
  assert.equal(canvas.width, 576);
  assert.equal(queue.length, 1);
  assert.equal(state.frames, 0);
});

test("boot returns undefined without a document or canvas", () => {
  assert.equal(game.boot({ document: null }), undefined);
  assert.equal(game.boot({ document: { getElementById: () => null } }), undefined);
});

test("shipped files honour the file:// constraints", () => {
  const html = readShipped("index.html");
  assert.doesNotMatch(html, /type=["']module["']/, "module scripts are blocked over file://");
  assert.match(html, /<script src="game\.js"><\/script>/);

  const js = readShipped("game.js");
  assert.doesNotMatch(js, /\bfetch\s*\(/, "fetch is blocked over file://");
  assert.doesNotMatch(js, /XMLHttpRequest/, "XHR is blocked over file://");
  assert.match(js, /typeof module !== "undefined" && module\.exports/);
});
