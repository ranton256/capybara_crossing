import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const game = require(join(root, "game.js"));

const {
  COLS,
  ROWS,
  TILE_SIZE,
  SCALE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TILE_FRAMES,
  ATLAS_PATH,
  createDefaultBoard,
  drawTile,
  renderBoard,
  render,
  loadAtlasImage,
} = game;

function stubAtlas() {
  return {
    image: {},
    frames: TILE_FRAMES,
  };
}

test("createDefaultBoard returns simplified 7×12 tile layout", () => {
  const board = createDefaultBoard();

  assert.equal(board.length, ROWS);
  for (const row of board) {
    assert.equal(row.length, COLS);
  }

  assert.ok(board[0].every((key) => key === "tile_spa"));
  assert.ok(board[1].every((key) => key === "tile_path"));
  assert.ok(board[2].every((key) => key === "tile_median"));
  assert.ok(board[3].every((key) => key === "tile_path"));
  for (const row of [4, 5, 6]) {
    assert.ok(board[row].every((key) => key === "tile_start"));
  }
});

test("drawTile blits scaled atlas rect to grid cell", () => {
  const calls = [];
  const ctx = {
    drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
      calls.push({ image, sx, sy, sw, sh, dx, dy, dw, dh });
    },
  };
  const atlas = stubAtlas();

  drawTile(ctx, atlas, 2, 3, "tile_path");

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    image: atlas.image,
    sx: 16,
    sy: 32,
    sw: 16,
    sh: 16,
    dx: 2 * TILE_SIZE * SCALE,
    dy: 3 * TILE_SIZE * SCALE,
    dw: TILE_SIZE * SCALE,
    dh: TILE_SIZE * SCALE,
  });
});

test("renderBoard draws all 84 tiles when atlas and board are set", () => {
  let drawCount = 0;
  const ctx = {
    drawImage() {
      drawCount += 1;
    },
  };
  const state = {
    board: createDefaultBoard(),
    atlas: stubAtlas(),
  };

  renderBoard(ctx, state);

  assert.equal(drawCount, COLS * ROWS);
});

test("render clears then draws board when atlas is present", () => {
  const log = [];
  const ctx = {
    clearRect(x, y, w, h) {
      log.push("clearRect");
      assert.equal(w, CANVAS_WIDTH);
      assert.equal(h, CANVAS_HEIGHT);
    },
    drawImage() {
      log.push("drawImage");
    },
    fillRect() {
      log.push("fillRect");
    },
    fillStyle: "",
  };
  const state = {
    board: createDefaultBoard(),
    atlas: stubAtlas(),
  };

  render(ctx, state);

  assert.equal(log[0], "clearRect");
  assert.ok(log.includes("drawImage"));
  assert.ok(!log.includes("fillRect"));
});

test("render uses solid fill fallback when atlas is not loaded", () => {
  const log = [];
  const ctx = {
    clearRect() {
      log.push("clearRect");
    },
    fillRect() {
      log.push("fillRect");
    },
    fillStyle: "",
  };

  render(ctx, {});

  assert.deepEqual(log, ["clearRect", "fillRect"]);
});

test("loadAtlasImage invokes callback with atlas frames", () => {
  class FakeImage {
    set src(value) {
      this._src = value;
      this.onload();
    }
  }

  let loaded = null;
  loadAtlasImage((atlas) => {
    loaded = atlas;
  }, { Image: FakeImage, path: ATLAS_PATH });

  assert.equal(loaded.image._src, ATLAS_PATH);
  assert.deepEqual(loaded.frames, TILE_FRAMES);
});
