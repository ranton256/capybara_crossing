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
  ctx.fillStyle = CLEAR_COLOR;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
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
  const state = {};
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
    configureCanvas,
    update,
    render,
    tick,
    startLoop,
    boot,
  };
}
