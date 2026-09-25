'use strict';

/* =============================================================================
 * Capybara Crossing
 *
 * One file, no dependencies, runs from file://. Sections below are in
 * dependency order and that order is load-bearing: everything above the
 * RENDERING banner must stay free of canvas and DOM references so the test
 * runner can import it. See openspec/changes/walkable-board/design.md.
 * ========================================================================== */

/* =============================================================================
 * 1. CONSTANTS
 * ========================================================================== */

const COLS = 12;
const ROWS = 7;
const TILE = 16;
const SCALE = 3;

const CANVAS_WIDTH = COLS * TILE * SCALE;   // 576
const CANVAS_HEIGHT = ROWS * TILE * SCALE;  // 336

const SPAWN = { col: 6, row: 6, facing: 'up' };

// The closed set of states a round can be in. DYING arrives in M4 and
// GAME_OVER in M5; the machine is shaped so those are additions.
const PHASES = { PLAYING: 'playing', SINKING: 'sinking' };

// Fixed Parameters give the spa sink as 400ms. Derived here rather than
// restated, so the spec's millisecond figure stays the single source.
const SINK_MS = 400;
const SINK_SECONDS = SINK_MS / 1000;

// Points, from the gameplay scenarios.
const POINTS_ADVANCE = 10;
const POINTS_GOAL = 50;

const GOAL_ROW = 0;

const HUD_COLOR = '#f0e0b0';
const HUD_FONT = '8px monospace';
const HUD_MARGIN = 2;
const STARTING_LIVES = 3;

// Accumulating dt in floating point leaves the running sum a few ulps short of
// an exact duration, and the shortfall depends on the step size: 24 steps of
// 1/60s reach 0.39999999999999997 while 48 steps of 1/120s reach
// 0.40000000000000041. Comparing a phase duration exactly would therefore end
// the beat a whole frame later at 60Hz than at 120Hz, which is precisely the
// refresh-rate dependence the spec forbids. A nanosecond of tolerance sits far
// below any real frame and removes the difference.
const TIME_EPSILON = 1e-9;

// Longest step the world may take in one frame. A backgrounded tab returns with
// a multi-second timestamp gap; without this the world lurches. See
// DECISIONS.md gap 6.
const MAX_DELTA_SECONDS = 0.1;

// Row roles, top to bottom, fixed by the spec's Fixed Parameters table.
const ROW_ROLES = [
  'spa',        // 0
  'road',       // 1
  'median',     // 2
  'road',       // 3
  'riverbank',  // 4
  'riverbank',  // 5
  'riverbank',  // 6
];

// Which atlas tile draws each role. Rows 4-6 all resolve to tile_start and are
// drawn unmodified, so its grass band repeats once per row. That is deliberate:
// DECISIONS.md gap 5.
const ROLE_TILES = {
  spa: 'tile_spa',
  road: 'tile_path',
  median: 'tile_median',
  riverbank: 'tile_start',
};

const ROW_TILES = ROW_ROLES.map(function (role) { return ROLE_TILES[role]; });

// Source rectangles in assets/sprites/capybara_crossing.png, transcribed from
// assets/sprites/manifest.json. The manifest is a build-time reference for
// humans; it is never read at runtime. render.test.js asserts these still match.
const SPRITES = {
  capy_up_1:    { x:   0, y:  0, w: 16, h: 16 },
  capy_up_2:    { x:  16, y:  0, w: 16, h: 16 },
  capy_down_1:  { x:  32, y:  0, w: 16, h: 16 },
  capy_down_2:  { x:  48, y:  0, w: 16, h: 16 },
  capy_left_1:  { x:  64, y:  0, w: 16, h: 16 },
  capy_left_2:  { x:  80, y:  0, w: 16, h: 16 },
  capy_right_1: { x:  96, y:  0, w: 16, h: 16 },
  capy_right_2: { x: 112, y:  0, w: 16, h: 16 },
  tile_start:   { x:   0, y: 32, w: 16, h: 16 },
  tile_path:    { x:  16, y: 32, w: 16, h: 16 },
  tile_median:  { x:  32, y: 32, w: 16, h: 16 },
  tile_spa:     { x:  48, y: 32, w: 16, h: 16 },
};

const DIRECTIONS = {
  up:    { dc:  0, dr: -1 },
  down:  { dc:  0, dr:  1 },
  left:  { dc: -1, dr:  0 },
  right: { dc:  1, dr:  0 },
};

const KEY_DIRECTIONS = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/* =============================================================================
 * 2. PURE LOGIC  -- no canvas, no document, no window below this line
 * ========================================================================== */

function clamp(value, low, high) {
  return value < low ? low : value > high ? high : value;
}

function createState() {
  return {
    player: { col: SPAWN.col, row: SPAWN.row, facing: SPAWN.facing },
    elapsed: 0,
    phase: PHASES.PLAYING,
    phaseElapsed: 0,
    score: 0,
    lives: STARTING_LIVES,
    // Northmost row reached this life. Resets to the spawn row each round.
    northmost: SPAWN.row,
  };
}

// The input buffer holds at most one direction. A queue would let presses pile
// up during a modal beat and fire in a burst afterwards; a single slot discards
// them, which is what a player expects. See design.md.
function createInput() {
  return { pending: null };
}

function pressKey(input, key) {
  const direction = KEY_DIRECTIONS[key];
  if (direction) input.pending = direction;
  return input;
}

function takeDirection(input) {
  const direction = input.pending;
  input.pending = null;
  return direction;
}

// Every transition resets the per-phase accumulator, including a transition to
// the phase already current. A per-phase counter rather than an absolute deadline
// keeps phase timing independent of the world clock. See design.md.
function enterPhase(state, phase) {
  return Object.assign({}, state, { phase: phase, phaseElapsed: 0 });
}

// Knows nothing about the goal. The spa bonus composes on top of this, so the
// final step north scores both awards without a special case. See design.md.
function scoreMove(northmost, row) {
  if (row < northmost) return { points: POINTS_ADVANCE, northmost: row };
  return { points: 0, northmost: northmost };
}

// Back to the spawn cell with a fresh watermark. Score and lives carry across.
function respawn(state) {
  return Object.assign({}, state, {
    player: { col: SPAWN.col, row: SPAWN.row, facing: SPAWN.facing },
    northmost: SPAWN.row,
  });
}

// Returns new state; never mutates the state passed in. Facing updates even when
// the move is blocked by the board edge.
function movePlayer(state, direction) {
  const delta = DIRECTIONS[direction];
  if (!delta) return state;
  const player = state.player;
  return Object.assign({}, state, {
    player: {
      col: clamp(player.col + delta.dc, 0, COLS - 1),
      row: clamp(player.row + delta.dr, 0, ROWS - 1),
      facing: direction,
    },
  });
}

// Seconds elapsed between two frame timestamps, clamped. The first frame has no
// predecessor and yields zero rather than the page's whole load time.
function frameDelta(timestamp, previousTimestamp) {
  if (previousTimestamp === null || previousTimestamp === undefined) return 0;
  const seconds = (timestamp - previousTimestamp) / 1000;
  if (!(seconds > 0)) return 0;
  return Math.min(seconds, MAX_DELTA_SECONDS);
}

// Applies a move that has already been resolved: awards the watermark advance,
// and if it landed on the goal row, the spa bonus and the sink transition.
function resolveMove(state, direction) {
  const moved = movePlayer(state, direction);
  const award = scoreMove(state.northmost, moved.player.row);

  let next = Object.assign({}, moved, {
    score: state.score + award.points,
    northmost: award.northmost,
  });

  if (moved.player.row === GOAL_ROW) {
    next = Object.assign({}, next, { score: next.score + POINTS_GOAL });
    next = enterPhase(next, PHASES.SINKING);
  }
  return next;
}

// Which phases apply directional input to the player.
function phaseAcceptsInput(phase) {
  return phase === PHASES.PLAYING;
}

// Resolves an expired phase. Runs before input is consumed so the frame a beat
// ends is still a frame the player can act in. See design.md.
function resolvePhase(state) {
  if (state.phase === PHASES.SINKING &&
      state.phaseElapsed >= SINK_SECONDS - TIME_EPSILON) {
    return enterPhase(respawn(state), PHASES.PLAYING);
  }
  return state;
}

// The seam. Advances both clocks, resolves an expired phase, then consumes at
// most one buffered direction if the resulting phase accepts input.
// Pure with respect to state; draining the input buffer is the buffer's purpose.
function update(state, deltaSeconds, input) {
  let next = Object.assign({}, state, {
    elapsed: state.elapsed + deltaSeconds,
    phaseElapsed: state.phaseElapsed + deltaSeconds,
  });

  next = resolvePhase(next);

  if (!phaseAcceptsInput(next.phase)) {
    // Drain and throw away. Merely declining to drain is not the same thing:
    // the slot holds the most recent press, so a direction mashed mid-beat
    // would survive and fire on the first playing frame after respawn.
    takeDirection(input);
    return next;
  }

  const direction = takeDirection(input);
  return direction ? resolveMove(next, direction) : next;
}

// How far through the sink beat, 0 to 1, clamped at both ends.
function sinkProgress(state) {
  if (state.phase !== PHASES.SINKING) return 0;
  return clamp(state.phaseElapsed / SINK_SECONDS, 0, 1);
}

function playerSprite(state) {
  return 'capy_' + state.player.facing + '_1';
}

// One tick: update first, then draw the state that update produced. Extracted
// from the animation frame callback so the ordering is testable with a stub.
function tick(state, deltaSeconds, input, draw) {
  const next = update(state, deltaSeconds, input);
  draw(next);
  return next;
}

/* =============================================================================
 * 3. RENDERING  -- canvas below this line
 * ========================================================================== */

// Scale once on the context so every draw call afterwards works in 16px tile
// units that match the atlas. Smoothing must be disabled after the transform.
function setupContext(ctx) {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

function drawSprite(ctx, atlas, name, col, row) {
  const s = SPRITES[name];
  ctx.drawImage(atlas, s.x, s.y, s.w, s.h, col * TILE, row * TILE, s.w, s.h);
}

function drawBoard(ctx, atlas) {
  for (let row = 0; row < ROWS; row++) {
    const tile = ROW_TILES[row];
    for (let col = 0; col < COLS; col++) {
      drawSprite(ctx, atlas, tile, col, row);
    }
  }
}

// While sinking, the sprite's top edge descends toward a fixed lower line and
// everything below it is clipped away, so it reads as going under rather than
// vanishing. DECISIONS.md gap 7. Destination offset and drawn height always sum
// to a full tile, which is what keeps the bottom line fixed.
function drawPlayer(ctx, atlas, state) {
  const sprite = SPRITES[playerSprite(state)];
  const progress = sinkProgress(state);
  const visible = TILE * (1 - progress);
  if (visible <= 0) return;

  ctx.drawImage(
    atlas,
    sprite.x, sprite.y, sprite.w, visible,
    state.player.col * TILE, state.player.row * TILE + TILE * progress,
    sprite.w, visible);
}

// Score left, lives right, over row 0. DECISIONS.md gaps 4 and 8. Drawn inside
// the scaled context so it shares the board's coordinate space. Both values are
// read from state; the renderer tracks nothing of its own.
function drawHud(ctx, state) {
  ctx.fillStyle = HUD_COLOR;
  ctx.font = HUD_FONT;
  ctx.textBaseline = 'middle';

  ctx.textAlign = 'left';
  ctx.fillText('SCORE ' + state.score, HUD_MARGIN, TILE / 2);

  ctx.textAlign = 'right';
  ctx.fillText('LIVES ' + state.lives, COLS * TILE - HUD_MARGIN, TILE / 2);
}

// Painter's order: clear, background, entities, display.
function render(ctx, atlas, state) {
  ctx.clearRect(0, 0, COLS * TILE, ROWS * TILE);
  drawBoard(ctx, atlas);
  drawPlayer(ctx, atlas, state);
  drawHud(ctx, state);
}

function drawLoadFailure(ctx) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#14181d';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#e8d8a0';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Could not load assets/sprites/capybara_crossing.png',
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

/* =============================================================================
 * 4. BOOT
 * ========================================================================== */

// `doc` and `win` default to the real globals. They are parameters so the test
// runner can drive boot against a stub and cover the atlas gate and the input
// wiring, which no pure-logic test can reach.
function boot(doc, win) {
  const d = doc || (typeof document !== 'undefined' ? document : null);
  const w = win || (typeof window !== 'undefined' ? window : null);

  const canvas = d.getElementById('board');
  const atlas = d.getElementById('atlas');
  const ctx = canvas.getContext('2d');

  const input = createInput();
  w.addEventListener('keydown', function (event) {
    if (!KEY_DIRECTIONS[event.key]) return;
    event.preventDefault();
    pressKey(input, event.key);
  });

  function start() {
    setupContext(ctx);
    let state = createState();
    let previousTimestamp = null;
    function frame(timestamp) {
      const deltaSeconds = frameDelta(timestamp, previousTimestamp);
      previousTimestamp = timestamp;
      state = tick(state, deltaSeconds, input, function (next) {
        render(ctx, atlas, next);
      });
      w.requestAnimationFrame(frame);
    }
    w.requestAnimationFrame(frame);
  }

  // Gate the loop on the atlas so the render path carries no is-it-ready branch.
  // A file:// 404 resolves before this script runs, so the already-settled cases
  // must be handled here: by the time a listener is attached the event is gone.
  if (atlas.complete) {
    if (atlas.naturalWidth > 0) start();
    else drawLoadFailure(ctx);
  } else {
    atlas.addEventListener('load', start);
    atlas.addEventListener('error', function () { drawLoadFailure(ctx); });
  }

  return { ctx: ctx, input: input, atlas: atlas };
}

if (typeof document !== 'undefined') {
  boot(document, window);
}

/* =============================================================================
 * 5. EXPORT GUARD  -- ignored by the browser, which defines no module object
 * ========================================================================== */

// Both clauses matter: an injected script can define a bare `module`, and
// assigning to `module.exports` would then throw during page load.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    COLS, ROWS, TILE, SCALE, CANVAS_WIDTH, CANVAS_HEIGHT,
    SPAWN, MAX_DELTA_SECONDS, ROW_ROLES, ROLE_TILES, ROW_TILES, SPRITES,
    PHASES, SINK_MS, SINK_SECONDS, POINTS_ADVANCE, POINTS_GOAL,
    GOAL_ROW, STARTING_LIVES, TIME_EPSILON,
    DIRECTIONS, KEY_DIRECTIONS,
    clamp, createState, createInput, pressKey, takeDirection,
    movePlayer, frameDelta, update, playerSprite, tick,
    enterPhase, scoreMove, respawn, resolveMove, resolvePhase,
    phaseAcceptsInput, sinkProgress,
    HUD_COLOR, HUD_FONT, HUD_MARGIN,
    setupContext, drawSprite, drawBoard, drawPlayer, drawHud, render,
    drawLoadFailure,
    boot,
  };
}
