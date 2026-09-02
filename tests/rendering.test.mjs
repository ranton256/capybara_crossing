import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const game = require("../game.js");

function makeCtx(trace = []) {
  return {
    trace,
    imageSmoothingEnabled: true,
    fillStyle: null,
    clearRect: (...a) => trace.push(["clearRect", ...a]),
    fillRect: (...a) => trace.push(["fillRect", ...a]),
    drawImage: (...a) => trace.push(["drawImage", ...a]),
  };
}

const drawCalls = (trace) => trace.filter((c) => c[0] === "drawImage");

// A fake image whose load can be fired on demand, standing in for Image.
function fakeImageCtor(created = []) {
  return class FakeImage {
    constructor() {
      this.onload = null;
      this._src = null;
      created.push(this);
    }
    set src(value) {
      this._src = value;
    }
    get src() {
      return this._src;
    }
  };
}

test("tile source rects match assets/sprites/manifest.json", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../assets/sprites/manifest.json", import.meta.url), "utf8"),
  );
  const byName = Object.fromEntries(manifest.frames.map((f) => [f.name, f]));
  for (const [key, rect] of Object.entries(game.TILE_FRAMES)) {
    const src = byName[key];
    assert.ok(src, `manifest has no frame named ${key}`);
    assert.deepEqual(
      { sx: src.x, sy: src.y, sw: src.w, sh: src.h },
      rect,
      `${key} rect drifted from the manifest`,
    );
  }
});

test("board rows follow the Fixed Parameters table", () => {
  assert.deepEqual(game.ROW_TILES, [
    "tile_spa",
    "tile_path",
    "tile_median",
    "tile_path",
    "tile_start",
    "tile_start",
    "tile_start",
  ]);
  assert.deepEqual(game.ROAD_ROWS, [1, 3]);
});

test("createDefaultBoard fills 7 rows of 12 columns", () => {
  const board = game.createDefaultBoard();
  assert.equal(board.length, 7);
  for (const row of board) {
    assert.equal(row.length, 12);
    assert.equal(new Set(row).size, 1, "each row uses a single tile type");
  }
  assert.equal(board[0][11], "tile_spa");
  assert.equal(board[2][0], "tile_median");
  assert.equal(board[6][5], "tile_start");
});

test("loadAtlas resolves through an injectable image constructor", () => {
  const created = [];
  let loaded = null;
  game.loadAtlas((atlas) => { loaded = atlas; }, { ImageCtor: fakeImageCtor(created) });
  assert.equal(created.length, 1);
  assert.equal(created[0].src, game.ATLAS_PATH);
  created[0].onload();
  assert.equal(loaded, created[0]);
});

test("drawTile places a cell at grid position times scale", () => {
  const trace = [];
  const ctx = makeCtx(trace);
  game.drawTile(ctx, "ATLAS", 3, 2, "tile_median");
  const [, atlas, sx, sy, sw, sh, dx, dy, dw, dh] = trace[0];
  assert.equal(atlas, "ATLAS");
  assert.deepEqual([sx, sy, sw, sh], [32, 32, 16, 16]);
  assert.deepEqual([dx, dy, dw, dh], [3 * 48, 2 * 48, 48, 48]);
});

test("drawTile ignores an unknown tile key", () => {
  const trace = [];
  game.drawTile(makeCtx(trace), "ATLAS", 0, 0, "tile_nope");
  assert.equal(trace.length, 0);
});

test("renderBoard draws all 84 cells once the atlas is ready", () => {
  const trace = [];
  const state = game.createInitialState();
  state.atlas = "ATLAS";
  game.renderBoard(state, makeCtx(trace));
  assert.equal(drawCalls(trace).length, 84);
});

test("renderBoard draws nothing before the atlas decodes", () => {
  const trace = [];
  const state = game.createInitialState();
  assert.equal(state.atlas, undefined);
  game.renderBoard(state, makeCtx(trace));
  assert.equal(trace.length, 0);
});

test("render clears before drawing tiles", () => {
  const trace = [];
  const state = game.createInitialState();
  state.atlas = "ATLAS";
  game.render(state, makeCtx(trace));
  assert.equal(trace[0][0], "clearRect");
  assert.equal(drawCalls(trace).length, 84, "tiles drawn after the clear");
  const firstDraw = trace.findIndex((c) => c[0] === "drawImage");
  assert.ok(firstDraw > 0, "tiles must come after the clear");
});

test("render still clears on frames before the atlas decodes", () => {
  const trace = [];
  game.render(game.createInitialState(), makeCtx(trace));
  assert.deepEqual(trace[0], ["clearRect", 0, 0, 576, 336]);
  assert.equal(drawCalls(trace).length, 0);
});

test("boot loads the atlas into state", () => {
  const created = [];
  const ctx = makeCtx();
  const canvas = { width: 0, height: 0, getContext: () => ctx };
  const state = game.boot({
    document: { getElementById: () => canvas },
    scheduler: () => {},
    ImageCtor: fakeImageCtor(created),
  });
  assert.equal(state.atlas, undefined);
  created[0].onload();
  assert.equal(state.atlas, created[0]);
});

test("freeze flag reads freeze=1 from the query string", () => {
  assert.equal(game.shouldFreeze({ location: { search: "?freeze=1" } }), true);
  assert.equal(game.shouldFreeze({ location: { search: "?other=1" } }), false);
  assert.equal(game.shouldFreeze({ location: { search: "" } }), false);
  assert.equal(game.shouldFreeze({ freeze: true }), true);
  assert.equal(game.shouldFreeze({}), false);
});

test("boot stores the freeze flag on state", () => {
  const ctx = makeCtx();
  const canvas = { width: 0, height: 0, getContext: () => ctx };
  const state = game.boot({
    document: { getElementById: () => canvas },
    scheduler: () => {},
    ImageCtor: fakeImageCtor([]),
    location: { search: "?freeze=1" },
  });
  assert.equal(state.freeze, true);
});
