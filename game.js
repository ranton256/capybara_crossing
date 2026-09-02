// Capybara Crossing - shipped as three dependency-free files.
// Open index.html directly from disk; there is no build step and no server.
//
// Nothing here fetches manifest.json or uses ES modules: browsers block both
// over file://. Sprite source rectangles live as constants in this file.

// Board geometry, from the Fixed Parameters table in "Capybara Crossing.md".
const COLS = 12;
const ROWS = 7;
const TILE_SIZE = 16;
const SCALE = 3;
const CANVAS_WIDTH = COLS * TILE_SIZE * SCALE;
const CANVAS_HEIGHT = ROWS * TILE_SIZE * SCALE;

const CLEAR_COLOR = "#1a1a2e";
const DEST_SIZE = TILE_SIZE * SCALE;

// Source rectangles transcribed from assets/sprites/manifest.json at authoring
// time. The game never reads that file: fetch is blocked over file://.
const ATLAS_PATH = "assets/sprites/capybara_crossing.png";
const TILE_FRAMES = {
  tile_spa: { sx: 48, sy: 32, sw: 16, sh: 16 },
  tile_path: { sx: 16, sy: 32, sw: 16, sh: 16 },
  tile_median: { sx: 32, sy: 32, sw: 16, sh: 16 },
  tile_start: { sx: 0, sy: 32, sw: 16, sh: 16 },
};

// One tile key per board row, top to bottom, from the Fixed Parameters table.
const ROW_TILES = [
  "tile_spa",
  "tile_path",
  "tile_median",
  "tile_path",
  "tile_start",
  "tile_start",
  "tile_start",
];

// Road rows; P4's traffic lanes read the same indices.
const ROAD_ROWS = [1, 3];

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

// The image constructor is injectable so tests can resolve loading without a
// DOM; the browser path uses the global Image.
function loadAtlas(callback, options = {}) {
  const ImageCtor = options.ImageCtor ?? (typeof Image !== "undefined" ? Image : undefined);
  if (!ImageCtor) {
    return undefined;
  }
  const image = new ImageCtor();
  image.onload = () => callback(image);
  image.src = options.atlasPath ?? ATLAS_PATH;
  return image;
}

// The visual gate boots with ?freeze=1 so moving entities stay at their spawn
// coordinates and the baseline image does not depend on timing.
function shouldFreeze(options = {}) {
  if (options.freeze === true) {
    return true;
  }
  const loc = options.location ?? (typeof location !== "undefined" ? location : undefined);
  if (loc && typeof loc.search === "string") {
    return loc.search.indexOf("freeze=1") !== -1;
  }
  return false;
}

function createInitialState(options = {}) {
  return {
    lastTime: undefined,
    lastDelta: 0,
    frames: 0,
    atlas: undefined,
    board: createDefaultBoard(),
    freeze: shouldFreeze(options),
  };
}

function drawTile(ctx, atlas, col, row, tileKey) {
  const frame = TILE_FRAMES[tileKey];
  if (!frame) {
    return;
  }
  ctx.drawImage(
    atlas,
    frame.sx,
    frame.sy,
    frame.sw,
    frame.sh,
    col * DEST_SIZE,
    row * DEST_SIZE,
    DEST_SIZE,
    DEST_SIZE,
  );
}

// The loop starts before the atlas decodes, so a missing atlas is normal
// startup, not an error.
function renderBoard(state, ctx) {
  if (!state.atlas || !state.board) {
    return;
  }
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      drawTile(ctx, state.atlas, col, row, state.board[row][col]);
    }
  }
}

// Update phase. P1 has nothing to move yet, but it threads elapsed time
// through from frame one so later milestones can scale motion by time.
function update(state, dt) {
  state.lastDelta = dt;
  state.frames += 1;
  return state;
}

// Render phase. Clears the whole surface first so no previous frame shows
// through, then paints the empty board colour.
function render(state, ctx) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = CLEAR_COLOR;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  renderBoard(state, ctx);
  return state;
}

// One frame: update runs to completion, then render.
function tick(state, ctx, now) {
  const lastTime = state.lastTime ?? now;
  const dt = now - lastTime;
  state.lastTime = now;
  update(state, dt);
  render(state, ctx);
  return state;
}

// The scheduler is injectable so tests can step frames without
// requestAnimationFrame; the browser path uses the default.
function startLoop(state, ctx, options = {}) {
  const scheduler = options.scheduler ?? requestAnimationFrame;
  const frame = (now) => {
    tick(state, ctx, now);
    scheduler(frame);
  };
  scheduler(frame);
  return state;
}

function boot(options = {}) {
  const doc = options.document ?? (typeof document !== "undefined" ? document : undefined);
  if (!doc) {
    return undefined;
  }
  const canvas = options.canvas ?? doc.getElementById("game");
  if (!canvas) {
    return undefined;
  }
  const ctx = configureCanvas(canvas);
  const state = createInitialState(options);
  loadAtlas((atlas) => {
    state.atlas = atlas;
  }, options);
  startLoop(state, ctx, options);
  return state;
}

// Guarded export: the browser never defines `module`, so this block is inert
// there. Node's test runner uses it to import the logic without a DOM.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    COLS,
    ROWS,
    TILE_SIZE,
    SCALE,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    CLEAR_COLOR,
    DEST_SIZE,
    ATLAS_PATH,
    TILE_FRAMES,
    ROW_TILES,
    ROAD_ROWS,
    configureCanvas,
    createDefaultBoard,
    shouldFreeze,
    loadAtlas,
    drawTile,
    renderBoard,
    createInitialState,
    update,
    render,
    tick,
    startLoop,
    boot,
  };
}
