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

function configureCanvas(canvas) {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

function createInitialState() {
  return {
    lastTime: undefined,
    lastDelta: 0,
    frames: 0,
  };
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
  const state = createInitialState();
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
    configureCanvas,
    createInitialState,
    update,
    render,
    tick,
    startLoop,
    boot,
  };
}
