const COLS = 12;
const ROWS = 7;
const TILE_SIZE = 16;
const SCALE = 3;
const CANVAS_WIDTH = COLS * TILE_SIZE * SCALE;
const CANVAS_HEIGHT = ROWS * TILE_SIZE * SCALE;

const CLEAR_COLOR = "#1a1a2e";

// Source rects copied from assets/sprites/manifest.json (environment tiles only).
const ATLAS_PATH = "assets/sprites/capybara_crossing.png";
const TILE_FRAMES = {
  tile_start: { sx: 0, sy: 32, sw: 16, sh: 16 },
  tile_path: { sx: 16, sy: 32, sw: 16, sh: 16 },
  tile_median: { sx: 32, sy: 32, sw: 16, sh: 16 },
  tile_spa: { sx: 48, sy: 32, sw: 16, sh: 16 },
};

const ROW_TILES = [
  "tile_spa",
  "tile_path",
  "tile_median",
  "tile_path",
  "tile_start",
  "tile_start",
  "tile_start",
];

function configureCanvas(canvas) {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

function createDefaultBoard() {
  return ROW_TILES.map((tileKey) => Array(COLS).fill(tileKey));
}

function drawTile(ctx, atlas, col, row, tileKey) {
  const frame = atlas.frames[tileKey];
  const destSize = TILE_SIZE * SCALE;
  ctx.drawImage(
    atlas.image,
    frame.sx,
    frame.sy,
    frame.sw,
    frame.sh,
    col * destSize,
    row * destSize,
    destSize,
    destSize,
  );
}

function renderBoard(ctx, state) {
  if (!state.atlas || !state.board) {
    return;
  }
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      drawTile(ctx, state.atlas, col, row, state.board[row][col]);
    }
  }
}

function update(state, dt) {
  if (state._log) {
    state._log.push("update");
  }
}

function render(ctx, state) {
  if (state._log) {
    state._log.push("render");
  }
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (!state.atlas) {
    ctx.fillStyle = CLEAR_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  renderBoard(ctx, state);
}

function loadAtlasImage(callback, options = {}) {
  const ImageCtor =
    options.Image ?? (typeof Image !== "undefined" ? Image : undefined);
  if (!ImageCtor) {
    return;
  }
  const image = new ImageCtor();
  image.onload = () => {
    callback({ image, frames: TILE_FRAMES });
  };
  image.src = options.path ?? ATLAS_PATH;
}

function tick(state, ctx, now) {
  const lastTime = state.lastTime ?? now;
  const dt = now - lastTime;
  state.lastTime = now;
  update(state, dt);
  render(ctx, state);
}

function startLoop(scheduler, state, ctx) {
  function frame(now) {
    tick(state, ctx, now);
    scheduler(frame);
  }
  scheduler(frame);
}

function boot(options = {}) {
  const doc = options.document ?? document;
  const scheduler = options.scheduler ?? requestAnimationFrame;
  const canvas = doc.getElementById("game");
  const ctx = configureCanvas(canvas);
  const state = { board: createDefaultBoard() };
  loadAtlasImage((atlas) => {
    state.atlas = atlas;
  }, options);
  startLoop(scheduler, state, ctx);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    COLS,
    ROWS,
    TILE_SIZE,
    SCALE,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    ATLAS_PATH,
    TILE_FRAMES,
    configureCanvas,
    createDefaultBoard,
    drawTile,
    renderBoard,
    loadAtlasImage,
    update,
    render,
    tick,
    startLoop,
    boot,
  };
}
