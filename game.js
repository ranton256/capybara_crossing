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

// Source rects copied from assets/sprites/manifest.json (first frame per facing).
const PLAYER_FRAMES = {
  up: { sx: 0, sy: 0, sw: 16, sh: 16 },
  down: { sx: 32, sy: 0, sw: 16, sh: 16 },
  left: { sx: 64, sy: 0, sw: 16, sh: 16 },
  right: { sx: 96, sy: 0, sw: 16, sh: 16 },
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

const SCORE_PER_UP_HOP = 10;
const TRUCK_SPEED = 1.5;
const ATV_SPEED = 2.5;

// Source rects copied from assets/sprites/manifest.json (hazard frames).
const HAZARD_FRAMES = {
  atv_red: { sx: 0, sy: 48, sw: 16, sh: 16 },
  atv_blue: { sx: 16, sy: 48, sw: 16, sh: 16 },
  truck: { sx: 32, sy: 48, sw: 32, sh: 16 },
};

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

function createInitialPlayer() {
  return { col: 6, row: 6, facing: "up" };
}

function createInitialHazards() {
  return [
    { kind: "truck", frame: "truck", row: 1, x: 0, vx: TRUCK_SPEED, width: 2 },
    { kind: "truck", frame: "truck", row: 1, x: 6, vx: TRUCK_SPEED, width: 2 },
    { kind: "atv", frame: "atv_red", row: 3, x: 3, vx: -ATV_SPEED, width: 1 },
    { kind: "atv", frame: "atv_blue", row: 3, x: 9, vx: -ATV_SPEED, width: 1 },
  ];
}

function moveHazards(state, dt) {
  if (state.freezeHazards || !state.hazards) {
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

function shouldFreezeHazards(options) {
  if (options.freezeHazards === true) {
    return true;
  }
  const loc = options.location ?? (typeof location !== "undefined" ? location : undefined);
  if (loc && typeof loc.search === "string") {
    return loc.search.indexOf("freeze=1") !== -1;
  }
  return false;
}

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
  if (direction === "up") {
    state.score += SCORE_PER_UP_HOP;
  }
  return true;
}

function directionFromKey(key) {
  return ARROW_KEYS[key] ?? null;
}

function handleKeydown(event, state) {
  const direction = directionFromKey(event.key);
  if (!direction) {
    return;
  }
  event.preventDefault();
  state.pendingDirection = direction;
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

function renderPlayer(ctx, state) {
  if (!state.atlas || !state.player) {
    return;
  }
  const frame = PLAYER_FRAMES[state.player.facing];
  if (!frame) {
    return;
  }
  const destSize = TILE_SIZE * SCALE;
  ctx.drawImage(
    state.atlas.image,
    frame.sx,
    frame.sy,
    frame.sw,
    frame.sh,
    state.player.col * destSize,
    state.player.row * destSize,
    destSize,
    destSize,
  );
}

function renderHazards(ctx, state) {
  if (!state.atlas || !state.hazards) {
    return;
  }
  const destH = TILE_SIZE * SCALE;
  for (const hazard of state.hazards) {
    const frame = HAZARD_FRAMES[hazard.frame];
    if (!frame) {
      continue;
    }
    const dx = hazard.x * TILE_SIZE * SCALE;
    const dy = hazard.row * destH;
    const dw = frame.sw * SCALE;
    if (hazard.vx > 0 && typeof ctx.save === "function") {
      ctx.save();
      ctx.translate(dx + dw, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(
        state.atlas.image,
        frame.sx,
        frame.sy,
        frame.sw,
        frame.sh,
        0,
        0,
        dw,
        destH,
      );
      ctx.restore();
    } else {
      ctx.drawImage(
        state.atlas.image,
        frame.sx,
        frame.sy,
        frame.sw,
        frame.sh,
        dx,
        dy,
        dw,
        destH,
      );
    }
  }
}

function renderHud(ctx, state) {
  if (typeof state.score !== "number") {
    return;
  }
  ctx.fillStyle = "#fff8e7";
  ctx.font = "16px monospace";
  ctx.textBaseline = "top";
  ctx.fillText("Score: " + state.score, 8, 8);
}

function update(state, dt) {
  if (state._log) {
    state._log.push("update");
  }
  if (state.pendingDirection) {
    hop(state, state.pendingDirection);
    state.pendingDirection = null;
  }
  moveHazards(state, dt);
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
  renderHazards(ctx, state);
  renderPlayer(ctx, state);
  renderHud(ctx, state);
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
  const state = {
    board: createDefaultBoard(),
    player: createInitialPlayer(),
    hazards: createInitialHazards(),
    score: 0,
    pendingDirection: null,
    freezeHazards: shouldFreezeHazards(options),
  };
  const win = options.window ?? (typeof window !== "undefined" ? window : undefined);
  if (win && typeof win.addEventListener === "function") {
    win.addEventListener("keydown", (event) => {
      handleKeydown(event, state);
    });
  }
  loadAtlasImage((atlas) => {
    state.atlas = atlas;
  }, options);
  startLoop(scheduler, state, ctx);
  return state;
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
    PLAYER_FRAMES,
    HAZARD_FRAMES,
    configureCanvas,
    createDefaultBoard,
    createInitialPlayer,
    createInitialHazards,
    moveHazards,
    hop,
    directionFromKey,
    handleKeydown,
    drawTile,
    renderBoard,
    renderPlayer,
    renderHazards,
    renderHud,
    loadAtlasImage,
    update,
    render,
    tick,
    startLoop,
    boot,
  };
}
