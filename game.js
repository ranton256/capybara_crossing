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

const SPAWN_COL = 6;
const SPAWN_ROW = 6;
const SCORE_PER_FORWARD_HOP = 10;

// Walk frame pairs, transcribed from assets/sprites/manifest.json.
const PLAYER_FRAMES = {
  up: [{ sx: 0, sy: 0, sw: 16, sh: 16 }, { sx: 16, sy: 0, sw: 16, sh: 16 }],
  down: [{ sx: 32, sy: 0, sw: 16, sh: 16 }, { sx: 48, sy: 0, sw: 16, sh: 16 }],
  left: [{ sx: 64, sy: 0, sw: 16, sh: 16 }, { sx: 80, sy: 0, sw: 16, sh: 16 }],
  right: [{ sx: 96, sy: 0, sw: 16, sh: 16 }, { sx: 112, sy: 0, sw: 16, sh: 16 }],
};

const DIRECTION_DELTA = {
  up: { col: 0, row: -1 },
  down: { col: 0, row: 1 },
  left: { col: -1, row: 0 },
  right: { col: 1, row: 0 },
};

const ARROW_KEYS = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

// Hazard frames, transcribed from assets/sprites/manifest.json.
const HAZARD_FRAMES = {
  truck: { sx: 32, sy: 48, sw: 32, sh: 16 },
  atv_red: { sx: 0, sy: 48, sw: 16, sh: 16 },
  atv_blue: { sx: 16, sy: 48, sw: 16, sh: 16 },
};

// Tiles per second, from the Fixed Parameters table.
const TRUCK_SPEED = 1.5;
const ATV_SPEED = 2.5;

const HUD_FONT = "16px monospace";
const HUD_COLOR = "#f2f2e8";

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

// Hazard x is a float in tile units, matching the player's col/row space so
// P5's AABB check needs no unit conversion. Positive vx means rightward.
function createInitialHazards() {
  return [
    { kind: "truck", frame: "truck", row: 1, x: 0, vx: TRUCK_SPEED, width: 2 },
    { kind: "truck", frame: "truck", row: 1, x: 6, vx: TRUCK_SPEED, width: 2 },
    { kind: "atv", frame: "atv_red", row: 3, x: 3, vx: -ATV_SPEED, width: 1 },
    { kind: "atv", frame: "atv_blue", row: 3, x: 9, vx: -ATV_SPEED, width: 1 },
  ];
}

// Wrap by subtracting a full period rather than snapping to the edge, so the
// sub-tile remainder survives and evenly spaced vehicles stay evenly spaced.
function moveHazards(state, dt) {
  if (state.freeze || !state.hazards) {
    return;
  }
  for (const hazard of state.hazards) {
    hazard.x += hazard.vx * (dt / 1000);
    const period = COLS + hazard.width;
    if (hazard.vx > 0 && hazard.x > COLS) {
      hazard.x -= period;
    }
    if (hazard.vx < 0 && hazard.x + hazard.width < 0) {
      hazard.x += period;
    }
  }
}

function createInitialPlayer() {
  return { col: SPAWN_COL, row: SPAWN_ROW, facing: "up", step: 0 };
}

function createInitialState(options = {}) {
  return {
    lastTime: undefined,
    lastDelta: 0,
    frames: 0,
    atlas: undefined,
    board: createDefaultBoard(),
    freeze: shouldFreeze(options),
    player: createInitialPlayer(),
    hazards: createInitialHazards(),
    score: 0,
    // Farthest-north row reached this life. Scoring pays only for beating it,
    // which is what stops up/down hopping from farming points.
    bestRowThisLife: SPAWN_ROW,
    pendingDirection: null,
  };
}

function directionFromKey(key) {
  return ARROW_KEYS[key];
}

function handleKeydown(state, event) {
  const direction = directionFromKey(event && event.key);
  if (!direction) {
    return false;
  }
  state.pendingDirection = direction;
  return true;
}

// Discrete grid move. Positions stay integer columns and rows; nothing ever
// holds a fractional player coordinate.
function hop(state, direction) {
  const delta = DIRECTION_DELTA[direction];
  if (!delta || !state.player) {
    return false;
  }
  const nextCol = state.player.col + delta.col;
  const nextRow = state.player.row + delta.row;
  if (nextCol < 0 || nextCol >= COLS || nextRow < 0 || nextRow >= ROWS) {
    return false;
  }
  state.player.col = nextCol;
  state.player.row = nextRow;
  state.player.facing = direction;
  state.player.step = (state.player.step + 1) % 2;
  if (nextRow < state.bestRowThisLife) {
    state.bestRowThisLife = nextRow;
    state.score += SCORE_PER_FORWARD_HOP;
  }
  return true;
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
  if (state.pendingDirection) {
    hop(state, state.pendingDirection);
    state.pendingDirection = null;
  }
  moveHazards(state, dt);
  return state;
}

// Render phase. Clears the whole surface first so no previous frame shows
// through, then paints the empty board colour.
function playerFrame(player) {
  const pair = PLAYER_FRAMES[player.facing] ?? PLAYER_FRAMES.up;
  return pair[player.step % pair.length];
}

// All supplied vehicle art faces left, so right-movers are mirrored. The
// restore matters: a leaked transform would flip the player drawn next.
function renderHazards(state, ctx) {
  if (!state.atlas || !state.hazards) {
    return;
  }
  for (const hazard of state.hazards) {
    const frame = HAZARD_FRAMES[hazard.frame];
    if (!frame) {
      continue;
    }
    const dx = hazard.x * DEST_SIZE;
    const dy = hazard.row * DEST_SIZE;
    const dw = hazard.width * DEST_SIZE;
    if (hazard.vx > 0) {
      ctx.save();
      ctx.translate(dx + dw, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(state.atlas, frame.sx, frame.sy, frame.sw, frame.sh, 0, 0, dw, DEST_SIZE);
      ctx.restore();
    } else {
      ctx.drawImage(state.atlas, frame.sx, frame.sy, frame.sw, frame.sh, dx, dy, dw, DEST_SIZE);
    }
  }
}

function renderPlayer(state, ctx) {
  if (!state.atlas || !state.player) {
    return;
  }
  const frame = playerFrame(state.player);
  ctx.drawImage(
    state.atlas,
    frame.sx, frame.sy, frame.sw, frame.sh,
    state.player.col * DEST_SIZE, state.player.row * DEST_SIZE,
    DEST_SIZE, DEST_SIZE,
  );
}

function renderHud(state, ctx) {
  ctx.font = HUD_FONT;
  ctx.fillStyle = HUD_COLOR;
  ctx.fillText(`Score ${state.score}`, 8, 20);
}

function render(state, ctx) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = CLEAR_COLOR;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  renderBoard(state, ctx);
  renderHazards(state, ctx);
  renderPlayer(state, ctx);
  renderHud(state, ctx);
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
  const target = options.keyTarget ?? doc;
  if (target && typeof target.addEventListener === "function") {
    target.addEventListener("keydown", (event) => handleKeydown(state, event));
  }
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
    SPAWN_COL,
    SPAWN_ROW,
    SCORE_PER_FORWARD_HOP,
    PLAYER_FRAMES,
    HAZARD_FRAMES,
    TRUCK_SPEED,
    ATV_SPEED,
    DIRECTION_DELTA,
    configureCanvas,
    createDefaultBoard,
    shouldFreeze,
    loadAtlas,
    drawTile,
    renderBoard,
    createInitialPlayer,
    createInitialHazards,
    moveHazards,
    renderHazards,
    directionFromKey,
    handleKeydown,
    hop,
    playerFrame,
    renderPlayer,
    renderHud,
    createInitialState,
    update,
    render,
    tick,
    startLoop,
    boot,
  };
}
