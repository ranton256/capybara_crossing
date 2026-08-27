const COLS = 12;
const ROWS = 7;
const TILE_SIZE = 16;
const SCALE = 3;
const CANVAS_WIDTH = COLS * TILE_SIZE * SCALE;
const CANVAS_HEIGHT = ROWS * TILE_SIZE * SCALE;
const SPAWN_ROW = 6;

const CLEAR_COLOR = "#1a1a2e";
const BEST_STORAGE_KEY = "capybara_crossing_best";
const SPEED_BUMP = 1.1;
const SINK_DRAW_OFFSET = 6;

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

// Walk frame pairs from assets/sprites/manifest.json.
const PLAYER_FRAMES = {
  up: [
    { sx: 0, sy: 0, sw: 16, sh: 16 },
    { sx: 16, sy: 0, sw: 16, sh: 16 },
  ],
  down: [
    { sx: 32, sy: 0, sw: 16, sh: 16 },
    { sx: 48, sy: 0, sw: 16, sh: 16 },
  ],
  left: [
    { sx: 64, sy: 0, sw: 16, sh: 16 },
    { sx: 80, sy: 0, sw: 16, sh: 16 },
  ],
  right: [
    { sx: 96, sy: 0, sw: 16, sh: 16 },
    { sx: 112, sy: 0, sw: 16, sh: 16 },
  ],
};

const DEFEAT_FRAME = { sx: 0, sy: 16, sw: 16, sh: 16 };

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
const GOAL_BONUS = 50;
const STARTING_LIVES = 3;
const DEATH_MS = 550;
const FLASH_MS = 100;
const FLICKER_MS = 60;
const SINK_MS = 400;
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
  return { col: 6, row: SPAWN_ROW, facing: "up" };
}

function createInitialHazards() {
  return [
    { kind: "truck", frame: "truck", row: 1, x: 0, vx: TRUCK_SPEED, width: 2 },
    { kind: "truck", frame: "truck", row: 1, x: 6, vx: TRUCK_SPEED, width: 2 },
    { kind: "atv", frame: "atv_red", row: 3, x: 3, vx: -ATV_SPEED, width: 1 },
    { kind: "atv", frame: "atv_blue", row: 3, x: 9, vx: -ATV_SPEED, width: 1 },
  ];
}

function resolveStorage(options = {}) {
  if (options.localStorage) {
    return options.localStorage;
  }
  try {
    if (typeof localStorage !== "undefined") {
      return localStorage;
    }
  } catch (_err) {
    /* unavailable */
  }
  return null;
}

function loadBest(storage) {
  if (!storage || typeof storage.getItem !== "function") {
    return 0;
  }
  try {
    const raw = storage.getItem(BEST_STORAGE_KEY);
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch (_err) {
    return 0;
  }
}

function saveBest(storage, value) {
  if (!storage || typeof storage.setItem !== "function") {
    return;
  }
  try {
    storage.setItem(BEST_STORAGE_KEY, String(value));
  } catch (_err) {
    /* ignore quota / private mode */
  }
}

function maybeUpdateBest(state) {
  if (typeof state.score !== "number") {
    return;
  }
  if (state.score > (state.best ?? 0)) {
    state.best = state.score;
    saveBest(state.storage, state.best);
  }
}

function moveHazards(state, dt) {
  if (state.freezeHazards || !state.hazards) {
    return;
  }
  const factor = state.speedFactor ?? 1;
  for (const hazard of state.hazards) {
    hazard.x += hazard.vx * factor * (dt / 1000);
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

function aabbOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function isDying(state) {
  return (
    !state.gameOver &&
    typeof state.hurtUntil === "number" &&
    (state.lastTime ?? 0) < state.hurtUntil
  );
}

function resolveCollisions(state) {
  if (!state.player || !state.hazards) {
    return false;
  }
  const playerBox = { x: state.player.col, y: state.player.row, w: 1, h: 1 };
  for (const hazard of state.hazards) {
    const hazardBox = { x: hazard.x, y: hazard.row, w: hazard.width, h: 1 };
    if (aabbOverlap(playerBox, hazardBox)) {
      const now = state.lastTime ?? 0;
      state.lives -= 1;
      state.pendingDirection = null;
      state.hurtUntil = now + DEATH_MS;
      state.flashUntil = now + FLASH_MS;
      if (state.lives <= 0) {
        state.lives = 0;
        state.gameOver = true;
        maybeUpdateBest(state);
      }
      return true;
    }
  }
  return false;
}

function resolveGoal(state) {
  if (!state.player || state.player.row !== 0 || state.sinkingUntil) {
    return false;
  }
  state.score += GOAL_BONUS;
  maybeUpdateBest(state);
  state.sinkingUntil = (state.lastTime ?? 0) + SINK_MS;
  return true;
}

function finishSink(state) {
  if (!state.sinkingUntil) {
    return;
  }
  if ((state.lastTime ?? 0) < state.sinkingUntil) {
    return;
  }
  state.player = createInitialPlayer();
  state.sinkingUntil = null;
  state.bestRowThisLife = SPAWN_ROW;
  state.speedFactor = (state.speedFactor ?? 1) * SPEED_BUMP;
}

function finishDeath(state) {
  if (state.gameOver || typeof state.hurtUntil !== "number") {
    return;
  }
  if ((state.lastTime ?? 0) < state.hurtUntil) {
    return;
  }
  state.player = createInitialPlayer();
  state.hurtUntil = null;
  state.flashUntil = null;
  state.bestRowThisLife = SPAWN_ROW;
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
  state.walkPhase = state.walkPhase === 1 ? 0 : 1;
  const watermark = state.bestRowThisLife ?? SPAWN_ROW;
  if (direction === "up" && nextRow < watermark) {
    state.score += SCORE_PER_UP_HOP;
    state.bestRowThisLife = nextRow;
    maybeUpdateBest(state);
  }
  return true;
}

function directionFromKey(key) {
  return ARROW_KEYS[key] ?? null;
}

function handleKeydown(event, state) {
  if (state.gameOver) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      state.pendingRestart = true;
    }
    return;
  }
  const direction = directionFromKey(event.key);
  if (!direction) {
    return;
  }
  event.preventDefault();
  state.pendingDirection = direction;
}

function restartSession(state) {
  state.player = createInitialPlayer();
  state.hazards = createInitialHazards();
  state.score = 0;
  state.lives = STARTING_LIVES;
  state.gameOver = false;
  state.pendingRestart = false;
  state.pendingDirection = null;
  state.hurtUntil = null;
  state.flashUntil = null;
  state.sinkingUntil = null;
  state.bestRowThisLife = SPAWN_ROW;
  state.speedFactor = 1;
  state.walkPhase = 0;
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
  const now = state.lastTime ?? 0;
  const posed =
    state.gameOver ||
    (typeof state.hurtUntil === "number" && now < state.hurtUntil);
  if (posed && Math.floor(now / FLICKER_MS) % 2 === 1) {
    return;
  }
  const sinking =
    typeof state.sinkingUntil === "number" && now < state.sinkingUntil;
  let frame = DEFEAT_FRAME;
  if (!posed) {
    const frames = PLAYER_FRAMES[state.player.facing];
    if (!frames) {
      return;
    }
    const phase = state.walkPhase === 1 ? 1 : 0;
    frame = frames[phase] ?? frames[0];
  }
  if (!frame) {
    return;
  }
  const destSize = TILE_SIZE * SCALE;
  const dx = state.player.col * destSize;
  let dy = state.player.row * destSize;
  let dh = destSize;
  if (sinking) {
    dy += SINK_DRAW_OFFSET;
    dh = destSize - SINK_DRAW_OFFSET;
  }
  ctx.drawImage(
    state.atlas.image,
    frame.sx,
    frame.sy,
    frame.sw,
    frame.sh,
    dx,
    dy,
    destSize,
    dh,
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

function renderFlash(ctx, state) {
  const now = state.lastTime ?? 0;
  if (typeof state.flashUntil !== "number" || now >= state.flashUntil) {
    return;
  }
  ctx.fillStyle = "rgba(255, 248, 231, 0.45)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function renderHud(ctx, state) {
  if (typeof state.score !== "number") {
    return;
  }
  ctx.fillStyle = "#fff8e7";
  ctx.font = "16px monospace";
  ctx.textBaseline = "top";
  ctx.fillText(
    "Score: " +
      state.score +
      "   Lives: " +
      (state.lives ?? "") +
      "   Best: " +
      (state.best ?? 0),
    8,
    8,
  );
}

function renderOverlay(ctx, state) {
  if (!state.gameOver) {
    return;
  }
  ctx.fillStyle = "#fff8e7";
  ctx.font = "24px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;
  ctx.fillText("Game Over", cx, cy - 28);
  ctx.font = "16px monospace";
  ctx.fillText("Score: " + state.score, cx, cy);
  ctx.fillText("Enter / Space to restart", cx, cy + 24);
  ctx.textAlign = "start";
}

function update(state, dt) {
  if (state._log) {
    state._log.push("update");
  }
  if (state.pendingRestart) {
    restartSession(state);
    return;
  }
  if (state.gameOver) {
    state.pendingDirection = null;
    return;
  }
  if (state.pendingDirection) {
    if (!state.sinkingUntil && !isDying(state)) {
      hop(state, state.pendingDirection);
    }
    state.pendingDirection = null;
  }
  moveHazards(state, dt);
  finishDeath(state);
  if (!isDying(state)) {
    resolveCollisions(state);
  }
  resolveGoal(state);
  finishSink(state);
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
  renderFlash(ctx, state);
  renderHud(ctx, state);
  renderOverlay(ctx, state);
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
  const storage = resolveStorage(options);
  const state = {
    board: createDefaultBoard(),
    player: createInitialPlayer(),
    hazards: createInitialHazards(),
    score: 0,
    lives: STARTING_LIVES,
    best: loadBest(storage),
    storage,
    bestRowThisLife: SPAWN_ROW,
    speedFactor: 1,
    walkPhase: 0,
    gameOver: false,
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
    SPAWN_ROW,
    BEST_STORAGE_KEY,
    ATLAS_PATH,
    TILE_FRAMES,
    PLAYER_FRAMES,
    HAZARD_FRAMES,
    DEFEAT_FRAME,
    STARTING_LIVES,
    DEATH_MS,
    FLASH_MS,
    FLICKER_MS,
    configureCanvas,
    createDefaultBoard,
    createInitialPlayer,
    createInitialHazards,
    loadBest,
    saveBest,
    maybeUpdateBest,
    moveHazards,
    aabbOverlap,
    isDying,
    resolveCollisions,
    restartSession,
    resolveGoal,
    finishSink,
    finishDeath,
    hop,
    directionFromKey,
    handleKeydown,
    drawTile,
    renderBoard,
    renderPlayer,
    renderHazards,
    renderFlash,
    renderHud,
    renderOverlay,
    loadAtlasImage,
    update,
    render,
    tick,
    startLoop,
    boot,
  };
}
