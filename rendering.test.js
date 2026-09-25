'use strict';
// Covers openspec/changes/walkable-board/specs/rendering/spec.md

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  COLS, ROWS, TILE, SCALE, SPRITES, ROW_TILES, ROW_ROLES, ROLE_TILES,
  createState, movePlayer, setupContext, drawBoard, drawPlayer, render, playerSprite,
} = require('./game.js');

const ATLAS = { __stub: 'atlas image' };

// Records every context call in order so draw ordering can be asserted.
function stubContext() {
  const calls = [];
  return {
    calls,
    setTransform(...args) { calls.push({ op: 'setTransform', args }); },
    clearRect(...args) { calls.push({ op: 'clearRect', args }); },
    drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
      calls.push({ op: 'drawImage', image, sx, sy, sw, sh, dx, dy, dw, dh });
    },
    set imageSmoothingEnabled(value) { calls.push({ op: 'imageSmoothingEnabled', value }); },
    get imageSmoothingEnabled() { return false; },
  };
}

// Reverse-maps a source rectangle back to the sprite name that produced it.
function spriteAt(call) {
  for (const [name, r] of Object.entries(SPRITES)) {
    if (r.x === call.sx && r.y === call.sy && r.w === call.sw && r.h === call.sh) return name;
  }
  throw new Error(`no sprite matches source rect ${call.sx},${call.sy},${call.sw},${call.sh}`);
}

/* --- atlas rectangles --------------------------------------------------- */

test('every declared sprite rectangle matches the manifest', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'assets/sprites/manifest.json'), 'utf8'));
  const frames = new Map(manifest.frames.map((f) => [f.name, f]));

  for (const [name, rect] of Object.entries(SPRITES)) {
    const frame = frames.get(name);
    assert.ok(frame, `manifest has no frame named ${name}`);
    assert.deepEqual(
      { x: rect.x, y: rect.y, w: rect.w, h: rect.h },
      { x: frame.x, y: frame.y, w: frame.w, h: frame.h },
      `${name} rectangle drifted from the manifest`);
  }
  assert.equal(manifest.tile_size, TILE);
});

test('every sprite M1 actually draws is declared', () => {
  const drawn = [
    'tile_spa', 'tile_path', 'tile_median', 'tile_start',
    'capy_up_1', 'capy_down_1', 'capy_left_1', 'capy_right_1',
  ];
  for (const name of drawn) assert.ok(SPRITES[name], `${name} is declared`);
});

test('the second walk frames are declared ahead of M2 but drawn by nothing yet', () => {
  const source = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
  for (const name of ['capy_up_2', 'capy_down_2', 'capy_left_2', 'capy_right_2']) {
    assert.ok(SPRITES[name], `${name} is declared for the M2 walk cycle`);
  }
  assert.match(source, /'capy_' \+ state\.player\.facing \+ '_1'/,
    'M1 draws only the first frame of each cycle');
});

test('the stylesheet asks for pixelated rendering on the canvas', () => {
  const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
  const board = css.slice(css.indexOf('#board'));
  assert.match(board, /image-rendering:\s*pixelated/,
    'specs/rendering: the canvas element CSS specifies pixelated image rendering');
});

test('the row tiles are derived from the row roles, not restated', () => {
  assert.deepEqual(ROW_TILES, ROW_ROLES.map((role) => ROLE_TILES[role]));
});

/* --- context setup ------------------------------------------------------ */

test('the context is scaled once, then smoothing is disabled', () => {
  const ctx = stubContext();
  setupContext(ctx);
  assert.deepEqual(ctx.calls[0], { op: 'setTransform', args: [SCALE, 0, 0, SCALE, 0, 0] });
  assert.deepEqual(ctx.calls[1], { op: 'imageSmoothingEnabled', value: false });
  assert.equal(ctx.calls.length, 2, 'setup does nothing else');
});

test('a scaled tile covers 48x48 canvas pixels at whole coordinates', () => {
  const ctx = stubContext();
  drawPlayer(ctx, ATLAS, createState());
  const call = ctx.calls[0];
  assert.equal(call.dw * SCALE, 48);
  assert.equal(call.dh * SCALE, 48);
  assert.ok(Number.isInteger(call.dx * SCALE) && Number.isInteger(call.dy * SCALE));
});

/* --- board tiles -------------------------------------------------------- */

test('each row is drawn from the tile its role assigns', () => {
  const ctx = stubContext();
  drawBoard(ctx, ATLAS);
  assert.equal(ctx.calls.length, COLS * ROWS, 'every board tile is drawn once');

  const expected = {
    0: 'tile_spa', 1: 'tile_path', 2: 'tile_median', 3: 'tile_path',
    4: 'tile_start', 5: 'tile_start', 6: 'tile_start',
  };
  for (const call of ctx.calls) {
    const row = call.dy / TILE;
    assert.equal(spriteAt(call), expected[row], `row ${row} uses ${expected[row]}`);
  }
});

test('every column of every row is covered exactly once', () => {
  const ctx = stubContext();
  drawBoard(ctx, ATLAS);
  const seen = new Set(ctx.calls.map((c) => `${c.dx / TILE},${c.dy / TILE}`));
  assert.equal(seen.size, COLS * ROWS);
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) assert.ok(seen.has(`${col},${row}`));
  }
});

test('there is exactly one road row per lane', () => {
  const roadRows = ROW_TILES
    .map((tile, row) => ({ tile, row }))
    .filter(({ tile }) => tile === 'tile_path')
    .map(({ row }) => row);
  assert.deepEqual(roadRows, [1, 3], 'rows 1 and 3 only');
  for (let i = 1; i < ROW_TILES.length; i++) {
    assert.ok(!(ROW_TILES[i] === 'tile_path' && ROW_TILES[i - 1] === 'tile_path'),
      'no two road rows are stacked');
  }
  assert.deepEqual(ROW_ROLES, ['spa', 'road', 'median', 'road', 'riverbank', 'riverbank', 'riverbank']);
});

test('the riverbank tile is drawn unmodified in all three rows', () => {
  const ctx = stubContext();
  drawBoard(ctx, ATLAS);
  const bank = ctx.calls.filter((c) => c.dy / TILE >= 4);
  assert.equal(bank.length, COLS * 3);
  for (const call of bank) {
    assert.equal(spriteAt(call), 'tile_start');
    assert.equal(call.sy, SPRITES.tile_start.y, 'no vertical offset into the tile');
    assert.equal(call.sh, TILE, 'the whole tile is drawn, so its grass band repeats');
  }
});

/* --- player ------------------------------------------------------------- */

test('the player frame follows its facing', () => {
  const start = createState();
  assert.equal(playerSprite(start), 'capy_up_1');
  assert.equal(playerSprite(movePlayer(start, 'left')), 'capy_left_1');
  assert.equal(playerSprite(movePlayer(start, 'right')), 'capy_right_1');
  assert.equal(playerSprite(movePlayer(start, 'down')), 'capy_down_1');
});

test('the player is drawn at the tile it occupies', () => {
  const ctx = stubContext();
  const state = movePlayer(movePlayer(createState(), 'up'), 'left');
  drawPlayer(ctx, ATLAS, state);
  const call = ctx.calls[0];
  assert.equal(call.image, ATLAS, 'drawn from the atlas image');
  assert.equal(call.dx, state.player.col * TILE);
  assert.equal(call.dy, state.player.row * TILE);
  assert.deepEqual(
    { x: call.sx, y: call.sy }, { x: SPRITES.capy_left_1.x, y: SPRITES.capy_left_1.y });
});

/* --- frame composition -------------------------------------------------- */

test('render clears the full canvas before drawing anything', () => {
  const ctx = stubContext();
  render(ctx, ATLAS, createState());
  assert.deepEqual(ctx.calls[0], { op: 'clearRect', args: [0, 0, COLS * TILE, ROWS * TILE] });
  assert.ok(!ctx.calls.slice(1).some((c) => c.op === 'clearRect'), 'cleared exactly once');
});

test('render draws background, then the player, in painters order', () => {
  const ctx = stubContext();
  render(ctx, ATLAS, createState());
  const draws = ctx.calls.filter((c) => c.op === 'drawImage');
  assert.equal(draws.length, COLS * ROWS + 1, 'board tiles plus one player');

  const board = draws.slice(0, COLS * ROWS);
  const player = draws[draws.length - 1];
  for (const call of board) {
    assert.ok(spriteAt(call).startsWith('tile_'), 'the background is drawn first');
  }
  assert.equal(spriteAt(player), 'capy_up_1', 'the player is drawn last');
});

test('render does not mutate the state it is given', () => {
  const state = createState();
  const snapshot = JSON.stringify(state);
  render(stubContext(), ATLAS, state);
  assert.equal(JSON.stringify(state), snapshot);
});
