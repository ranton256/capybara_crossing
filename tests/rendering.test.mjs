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
  PLAYER_FRAMES,
  ATLAS_PATH,
  createDefaultBoard,
  createInitialPlayer,
  createInitialHazards,
  drawTile,
  renderBoard,
  renderPlayer,
  render,
  tick,
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

test("renderPlayer uses defeat frame while hurtUntil is in the future", () => {
  const calls = [];
  const ctx = {
    drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
      calls.push({ sx, sy, sw, sh, dx, dy, dw, dh });
    },
  };
  renderPlayer(ctx, {
    atlas: stubAtlas(),
    player: { col: 6, row: 3, facing: "up" },
    lastTime: 0,
    hurtUntil: 550,
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].sx, 0);
  assert.equal(calls[0].sy, 16);
  assert.equal(calls[0].dy, 3 * TILE_SIZE * SCALE);
});

test("renderPlayer skips blit on flicker-off frames during death beat", () => {
  const calls = [];
  const ctx = {
    drawImage() {
      calls.push(true);
    },
  };
  renderPlayer(ctx, {
    atlas: stubAtlas(),
    player: { col: 6, row: 3, facing: "up" },
    lastTime: 60,
    hurtUntil: 550,
  });
  assert.equal(calls.length, 0);
});

test("render draws flash after player and before HUD", () => {
  const log = [];
  const ctx = {
    clearRect() {
      log.push("clearRect");
    },
    drawImage(_image, sx, sy) {
      if (sy === 0 || sy === 16) {
        log.push("player");
      } else if (sy === 48) {
        log.push("hazard");
      } else {
        log.push("tile");
      }
    },
    save() {},
    restore() {},
    translate() {},
    scale() {},
    fillText(text) {
      log.push("hud:" + text);
    },
    fillRect() {
      log.push("flash");
    },
    fillStyle: "",
    font: "",
    textBaseline: "",
  };
  const state = {
    board: createDefaultBoard(),
    atlas: stubAtlas(),
    player: { col: 6, row: 3, facing: "up" },
    hazards: [],
    score: 10,
    lives: 2,
    best: 40,
    lastTime: 50,
    hurtUntil: 550,
    flashUntil: 150,
  };

  render(ctx, state);

  const playerIndex = log.indexOf("player");
  const flashIndex = log.indexOf("flash");
  const hudIndex = log.findIndex((entry) => String(entry).startsWith("hud:"));
  assert.ok(playerIndex >= 0);
  assert.ok(flashIndex > playerIndex);
  assert.ok(hudIndex > flashIndex);
});

test("renderPlayer applies sink draw offset during sink beat", () => {
  const calls = [];
  const ctx = {
    drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
      calls.push({ dx, dy, dw, dh });
    },
  };
  const destSize = TILE_SIZE * SCALE;
  renderPlayer(ctx, {
    atlas: stubAtlas(),
    player: { col: 6, row: 0, facing: "up" },
    lastTime: 100,
    sinkingUntil: 500,
    walkPhase: 0,
  });
  assert.equal(calls[0].dx, 6 * destSize);
  assert.equal(calls[0].dy, 6);
  assert.equal(calls[0].dh, destSize - 6);
});

test("renderPlayer blits facing frame at scaled grid cell", () => {
  const calls = [];
  const ctx = {
    drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
      calls.push({ image, sx, sy, sw, sh, dx, dy, dw, dh });
    },
  };
  const atlas = stubAtlas();
  const state = {
    atlas,
    player: { col: 6, row: 6, facing: "up" },
  };

  renderPlayer(ctx, state);

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    image: atlas.image,
    sx: PLAYER_FRAMES.up[0].sx,
    sy: PLAYER_FRAMES.up[0].sy,
    sw: 16,
    sh: 16,
    dx: 6 * TILE_SIZE * SCALE,
    dy: 6 * TILE_SIZE * SCALE,
    dw: TILE_SIZE * SCALE,
    dh: TILE_SIZE * SCALE,
  });
});

test("render draws tiles then player then score HUD", () => {
  const log = [];
  const ctx = {
    clearRect() {
      log.push("clearRect");
    },
    drawImage(_image, sx, sy) {
      if (sy === 0) {
        log.push("player");
      } else if (sy === 48) {
        log.push("hazard");
      } else {
        log.push("tile");
      }
    },
    save() {},
    restore() {},
    translate() {},
    scale() {},
    fillText(text) {
      log.push("hud:" + text);
    },
    fillRect() {
      log.push("fillRect");
    },
    fillStyle: "",
    font: "",
    textBaseline: "",
  };
  const state = {
    board: createDefaultBoard(),
    atlas: stubAtlas(),
    player: createInitialPlayer(),
    hazards: createInitialHazards(),
    score: 10,
    lives: 3,
    best: 40,
  };

  render(ctx, state);

  assert.equal(log[0], "clearRect");
  const tileCount = log.filter((entry) => entry === "tile").length;
  const hazardCount = log.filter((entry) => entry === "hazard").length;
  const playerIndex = log.indexOf("player");
  const firstHazard = log.indexOf("hazard");
  const lastHazard = log.lastIndexOf("hazard");
  const hudIndex = log.findIndex((entry) => String(entry).startsWith("hud:"));
  assert.equal(tileCount, COLS * ROWS);
  assert.equal(hazardCount, 4);
  assert.ok(firstHazard > log.lastIndexOf("tile"));
  assert.ok(playerIndex > lastHazard);
  assert.ok(hudIndex > playerIndex);
  assert.match(log[hudIndex], /10/);
  assert.match(log[hudIndex], /Lives: 3/);
  assert.match(log[hudIndex], /Best: 40/);
  assert.ok(!log.includes("fillRect"));
});

test("tick applies pending hop before painting the new cell", () => {
  const dests = [];
  const ctx = {
    clearRect() {},
    fillRect() {},
    fillStyle: "",
    font: "",
    textBaseline: "",
    fillText() {},
    drawImage(_image, _sx, sy, _sw, _sh, dx, dy) {
      if (sy === 0) {
        dests.push({ dx, dy });
      }
    },
  };
  const state = {
    board: createDefaultBoard(),
    atlas: stubAtlas(),
    player: createInitialPlayer(),
    score: 0,
    pendingDirection: "up",
  };

  tick(state, ctx, 0);

  assert.equal(state.player.row, 5);
  assert.equal(state.pendingDirection, null);
  assert.deepEqual(dests[0], {
    dx: 6 * TILE_SIZE * SCALE,
    dy: 5 * TILE_SIZE * SCALE,
  });
});
