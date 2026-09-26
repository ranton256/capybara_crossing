'use strict';
// Covers openspec/changes/walkable-board/specs/rendering/spec.md

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  COLS, ROWS, TILE, SCALE, SPRITES, ROW_TILES, ROW_ROLES, ROLE_TILES,
  createState, movePlayer, setupContext, drawBoard, drawPlayer, render, playerSprite,
  drawHud, sinkProgress, PHASES, SINK_SECONDS, DEATH_SECONDS,
  FLASH_MS, FLASH_SECONDS, FLASH_TOGGLE_MS, FLASH_TOGGLE_SECONDS, flashHidden,
  LANES, createHazards, snapTile, drawHazard, drawHazards,
} = require('./game.js');

const ATLAS = { __stub: 'atlas image' };
const HAZARD_COUNT = LANES.reduce((n, l) => n + l.count, 0);

// Records every context call in order so draw ordering can be asserted.
function stubContext() {
  const calls = [];
  return {
    calls,
    setTransform(...args) { calls.push({ op: 'setTransform', args }); },
    clearRect(...args) { calls.push({ op: 'clearRect', args }); },
    fillRect(...args) { calls.push({ op: 'fillRect', args }); },
    save(...args) { calls.push({ op: 'save', args }); },
    restore(...args) { calls.push({ op: 'restore', args }); },
    translate(...args) { calls.push({ op: 'translate', args }); },
    scale(...args) { calls.push({ op: 'scale', args }); },
    fillText(...args) { calls.push({ op: 'fillText', args }); },
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

/* --- the defeat pose and the hit flash ------------------------------------ */

function dying(elapsed, extra) {
  return Object.assign(createState(), {
    phase: PHASES.DYING, phaseElapsed: elapsed,
    player: { col: 4, row: 1, facing: 'up' },
  }, extra || {});
}

test('a struck capybara is drawn from the defeat frame', () => {
  assert.equal(playerSprite(dying(0.2)), 'capy_defeat');
  assert.equal(playerSprite(createState()), 'capy_up_1', 'walk frames while playing');
});

test('the defeat pose is drawn where the player was struck', () => {
  const ctx = stubContext();
  drawPlayer(ctx, ATLAS, dying(0.2));
  const call = ctx.calls.find((c) => c.op === 'drawImage');
  assert.equal(call.dx, 4 * TILE, 'the impact column');
  assert.equal(call.dy, 1 * TILE, 'the impact row');
  assert.equal(call.sx, SPRITES.capy_defeat.x);
  assert.equal(call.sy, SPRITES.capy_defeat.y);
});

test('the player strobes during the flash window', () => {
  const seen = new Set();
  for (let t = 0; t < FLASH_SECONDS - 1e-9; t += FLASH_TOGGLE_SECONDS) {
    seen.add(flashHidden(dying(t + FLASH_TOGGLE_SECONDS / 2)));
  }
  assert.ok(seen.has(true) && seen.has(false), 'both drawn and not-drawn occur');
});

test('the flash alternates on each toggle boundary', () => {
  const samples = [];
  for (let i = 0; i < FLASH_MS / FLASH_TOGGLE_MS; i++) {
    samples.push(flashHidden(dying((i + 0.5) * FLASH_TOGGLE_SECONDS)));
  }
  for (let i = 1; i < samples.length; i++) {
    assert.notEqual(samples[i], samples[i - 1], `toggle ${i} flipped`);
  }
});

test('the flash ends before the beat does', () => {
  assert.equal(flashHidden(dying(FLASH_SECONDS)), false, 'drawn at the window edge');
  assert.equal(flashHidden(dying(0.3)), false, 'drawn well after it');
  assert.equal(flashHidden(dying(DEATH_SECONDS - 0.01)), false, 'drawn at the end');
});

test('the flash is identical at 60Hz and 120Hz', () => {
  // The property is that the flash is driven by accumulated seconds rather than
  // by a frame counter, which would strobe twice as fast at the higher rate. So
  // both clocks are advanced to the SAME instant -- a multiple of 1/60, which
  // both step sizes can reach -- and must agree there. Sampling the two clocks
  // at different instants would compare different points in the beat, which is
  // ordinary sampling, not rate dependence.
  for (let frames = 1; frames <= 8; frames++) {
    let a = 0;
    for (let i = 0; i < frames; i++) a += 1 / 60;
    let b = 0;
    for (let i = 0; i < frames * 2; i++) b += 1 / 120;

    assert.ok(Math.abs(a - b) < 1e-9, 'both clocks reached the same instant');
    assert.equal(flashHidden(dying(a)), flashHidden(dying(b)),
      `same drawn state after ${frames} frames of 1/60 vs ${frames * 2} of 1/120`);
  }
});

test('the flash is a function of elapsed time alone', () => {
  // Reaching 50ms in one big step or many small ones gives the same result.
  const oneStep = dying(0.05);
  let many = 0;
  for (let i = 0; i < 50; i++) many += 0.001;
  assert.equal(flashHidden(dying(many)), flashHidden(oneStep),
    'the path taken to an instant does not change the flash');
});

test('nothing flashes outside the dying phase', () => {
  assert.equal(flashHidden(createState()), false);
  assert.equal(flashHidden(Object.assign(createState(), {
    phase: PHASES.SINKING, phaseElapsed: 0.01 })), false);
  assert.equal(flashHidden(Object.assign(createState(), {
    phase: PHASES.GAME_OVER, phaseElapsed: 0.01 })), false);
});

test('the board and traffic are unaffected by the flash', () => {
  const hidden = [];
  for (let i = 0; i < FLASH_MS / FLASH_TOGGLE_MS; i++) {
    const t = (i + 0.5) * FLASH_TOGGLE_SECONDS;
    if (flashHidden(dying(t))) hidden.push(t);
  }
  assert.ok(hidden.length > 0, 'found a not-drawn moment');

  const ctx = stubContext();
  render(ctx, ATLAS, dying(hidden[0]));
  const draws = ctx.calls.filter((c) => c.op === 'drawImage');
  assert.equal(draws.length, COLS * ROWS + HAZARD_COUNT,
    'board and hazards drawn, player omitted');
  assert.ok(ctx.calls.some((c) => c.op === 'fillText'), 'the display is still drawn');
});

test('the player is drawn again in a shown moment', () => {
  const shown = [];
  for (let i = 0; i < FLASH_MS / FLASH_TOGGLE_MS; i++) {
    const t = (i + 0.5) * FLASH_TOGGLE_SECONDS;
    if (!flashHidden(dying(t))) shown.push(t);
  }
  const ctx = stubContext();
  render(ctx, ATLAS, dying(shown[0]));
  assert.equal(ctx.calls.filter((c) => c.op === 'drawImage').length,
    COLS * ROWS + HAZARD_COUNT + 1);
});

/* --- the halted game ------------------------------------------------------ */

test('a halted game holds the defeat pose', () => {
  // DECISIONS.md gap 15. Without this the phase falls through to a walk frame
  // and the capybara stands up unharmed at the tile where it was run over.
  const over = Object.assign(createState(), {
    phase: PHASES.GAME_OVER, phaseElapsed: 0, lives: 0,
    player: { col: 4, row: 3, facing: 'up' },
  });
  assert.equal(playerSprite(over), 'capy_defeat');

  const ctx = stubContext();
  drawPlayer(ctx, ATLAS, over);
  const call = ctx.calls.find((c) => c.op === 'drawImage');
  assert.equal(call.sx, SPRITES.capy_defeat.x);
  assert.equal(call.dx, 4 * TILE, 'at the tile of the final collision');
  assert.equal(call.dy, 3 * TILE);
});

test('a halted game still draws the board, the traffic and the display', () => {
  const ctx = stubContext();
  const state = Object.assign(createState(), {
    phase: PHASES.GAME_OVER, phaseElapsed: 0, lives: 0, score: 130,
  });
  render(ctx, ATLAS, state);

  const draws = ctx.calls.filter((c) => c.op === 'drawImage');
  assert.equal(draws.length, COLS * ROWS + HAZARD_COUNT + 1, 'nothing has stopped drawing');
  const text = ctx.calls.filter((c) => c.op === 'fillText').map((c) => c.args[0]);
  assert.ok(text.some((t) => /LIVES 0/.test(t)), 'the display shows no lives left');
  assert.ok(text.some((t) => /SCORE 130/.test(t)));
});

/* --- frame composition -------------------------------------------------- */

test('render clears the full canvas before drawing anything', () => {
  const ctx = stubContext();
  render(ctx, ATLAS, createState());
  assert.deepEqual(ctx.calls[0], { op: 'clearRect', args: [0, 0, COLS * TILE, ROWS * TILE] });
  assert.ok(!ctx.calls.slice(1).some((c) => c.op === 'clearRect'), 'cleared exactly once');
});

test('render draws background, then the player, then the display', () => {
  const ctx = stubContext();
  render(ctx, ATLAS, createState());
  const draws = ctx.calls.filter((c) => c.op === 'drawImage');
  assert.equal(draws.length, COLS * ROWS + HAZARD_COUNT + 1,
    'board tiles, hazards, then one player');

  const board = draws.slice(0, COLS * ROWS);
  const player = draws[draws.length - 1];
  const hazards = draws.slice(COLS * ROWS, draws.length - 1);
  assert.equal(hazards.length, HAZARD_COUNT, 'hazards sit between board and player');
  for (const call of board) {
    assert.ok(spriteAt(call).startsWith('tile_'), 'the background is drawn first');
  }
  assert.equal(spriteAt(player), 'capy_up_1', 'the player is drawn over the board');

  const firstText = ctx.calls.findIndex((c) => c.op === 'fillText');
  const lastImage = ctx.calls.map((c) => c.op).lastIndexOf('drawImage');
  assert.ok(firstText > lastImage, 'no sprite is drawn after the display');
});

/* --- hazards -------------------------------------------------------------- */

const truckAt = (x) => ({ row: 1, x, width: 2, speed: 1.5, sprite: 'truck' });
const atvAt = (x) => ({ row: 3, x, width: 1, speed: -2.5, sprite: 'atv_red' });

test('snapTile floors a continuous position to a whole art pixel', () => {
  for (const pos of [0, 0.5, 1.0 / 16, 4.3719, 11.999, -0.8]) {
    const snapped = snapTile(pos);
    assert.ok(Number.isInteger(snapped * TILE), `${pos} snapped to a whole pixel`);
    assert.ok(snapped <= pos + 1e-12, 'floored, never rounded up');
    assert.ok(pos - snapped < 1 / TILE, 'within one pixel of the true position');
  }
});

test('snapping never moves against the direction of travel', () => {
  let right = 0;
  let prev = -Infinity;
  for (let i = 0; i < 200; i++) {
    right += 1.5 / 60;
    const snapped = snapTile(right);
    assert.ok(snapped >= prev, 'rightward motion is monotonic');
    prev = snapped;
  }

  let left = 12;
  prev = Infinity;
  for (let i = 0; i < 200; i++) {
    left -= 2.5 / 60;
    const snapped = snapTile(left);
    assert.ok(snapped <= prev, 'leftward motion is monotonic');
    prev = snapped;
  }
});

test('a hazard is drawn at its lane row and its own width', () => {
  const ctx = stubContext();
  drawHazard(ctx, ATLAS, atvAt(4));
  const call = ctx.calls.find((c) => c.op === 'drawImage');
  assert.equal(call.dy, 3 * TILE, 'lane row');
  assert.equal(call.dw, TILE, 'one tile wide');
  assert.equal(call.sw, SPRITES.atv_red.w, 'full source rectangle');
});

test('a two-tile truck is drawn two tiles wide', () => {
  const ctx = stubContext();
  drawHazard(ctx, ATLAS, truckAt(3));
  const call = ctx.calls.find((c) => c.op === 'drawImage');
  assert.equal(call.dw, 2 * TILE);
  assert.equal(call.sw, SPRITES.truck.w);
  assert.equal(SPRITES.truck.w, 32, 'the atlas truck really is two tiles');
});

test('a hazard draws at a snapped destination', () => {
  const ctx = stubContext();
  drawHazard(ctx, ATLAS, atvAt(4.3719));
  const call = ctx.calls.find((c) => c.op === 'drawImage');
  assert.ok(Number.isInteger(call.dx), `dx ${call.dx} is a whole pixel`);
  assert.equal(call.dx, Math.floor(4.3719 * TILE));
});

test('a rightward hazard is mirrored about its own position', () => {
  const ctx = stubContext();
  drawHazard(ctx, ATLAS, truckAt(3));
  const ops = ctx.calls.map((c) => c.op);
  assert.deepEqual(ops, ['save', 'translate', 'scale', 'drawImage', 'restore']);

  const scale = ctx.calls.find((c) => c.op === 'scale');
  assert.deepEqual(scale.args, [-1, 1], 'flipped horizontally only');

  const translate = ctx.calls.find((c) => c.op === 'translate');
  assert.equal(translate.args[0], 3 * TILE + SPRITES.truck.w,
    'translated to the sprite far edge, so it occupies the same tiles');
  assert.equal(translate.args[1], 1 * TILE, 'at the lane row');
});

test('a leftward hazard is not mirrored', () => {
  const ctx = stubContext();
  drawHazard(ctx, ATLAS, atvAt(4));
  assert.deepEqual(ctx.calls.map((c) => c.op), ['drawImage'], 'drawn plainly');
});

test('mirroring does not leak into later drawing', () => {
  const ctx = stubContext();
  const state = Object.assign(createState(), { hazards: [truckAt(3)] });
  render(ctx, ATLAS, state);

  const saves = ctx.calls.filter((c) => c.op === 'save').length;
  const restores = ctx.calls.filter((c) => c.op === 'restore').length;
  assert.equal(saves, restores, 'every save is restored');

  const lastRestore = ctx.calls.map((c) => c.op).lastIndexOf('restore');
  const playerIndex = ctx.calls.map((c) => c.op).lastIndexOf('drawImage');
  assert.ok(playerIndex > lastRestore, 'the player is drawn after the flip is undone');
});

test('every configured hazard draws at the width its geometry claims', () => {
  // The hand-built fixtures above prove drawHazard honours a well-formed hazard.
  // This proves the shipped lanes are well-formed.
  for (const hazard of createHazards()) {
    const ctx = stubContext();
    drawHazard(ctx, ATLAS, hazard);
    const call = ctx.calls.find((c) => c.op === 'drawImage');
    assert.equal(call.dw, hazard.width * TILE,
      `${hazard.sprite} drew ${call.dw}px for a ${hazard.width}-tile hazard`);
    assert.equal(call.sw, call.dw, 'source and destination widths agree');
    assert.equal(call.dh, TILE, 'one tile tall');
  }
});

test('every hazard in state is drawn exactly once', () => {
  const ctx = stubContext();
  drawHazards(ctx, ATLAS, createState());
  assert.equal(ctx.calls.filter((c) => c.op === 'drawImage').length, HAZARD_COUNT);
});

test('drawing does not alter hazard positions', () => {
  const state = createState();
  const before = state.hazards.map((h) => h.x);
  render(stubContext(), ATLAS, state);
  assert.deepEqual(state.hazards.map((h) => h.x), before);
});

/* --- the heads-up display ------------------------------------------------ */

test('the display shows score at the left and lives at the right', () => {
  const ctx = stubContext();
  const state = Object.assign(createState(), { score: 120, lives: 3 });
  drawHud(ctx, state);

  const text = ctx.calls.filter((c) => c.op === 'fillText');
  assert.equal(text.length, 2);
  assert.match(text[0].args[0], /SCORE 120/);
  assert.match(text[1].args[0], /LIVES 3/);
  assert.ok(text[0].args[1] < COLS * TILE / 2, 'score sits at the left');
  assert.ok(text[1].args[1] > COLS * TILE / 2, 'lives sit at the right');
});

test('the display sits over row 0', () => {
  const ctx = stubContext();
  drawHud(ctx, createState());
  for (const call of ctx.calls.filter((c) => c.op === 'fillText')) {
    assert.ok(call.args[2] >= 0 && call.args[2] <= TILE, 'drawn within the top row');
  }
});

test('the display reads lives from state rather than assuming three', () => {
  // Lives cannot change through play until M4, so a HUD that hardcoded 3 would
  // be indistinguishable in this milestone. Drive it from constructed state so
  // the readout is proven to follow, before M4 depends on it.
  const ctx = stubContext();
  drawHud(ctx, Object.assign(createState(), { lives: 1 }));
  const text = ctx.calls.filter((c) => c.op === 'fillText').map((c) => c.args[0]);
  assert.ok(text.some((t) => /LIVES 1/.test(t)), 'drew the state value');
  assert.ok(!text.some((t) => /LIVES 3/.test(t)), 'did not draw a hardcoded 3');
});

test('the display follows a change in score', () => {
  const first = stubContext();
  drawHud(first, Object.assign(createState(), { score: 10 }));
  const second = stubContext();
  drawHud(second, Object.assign(createState(), { score: 70 }));

  assert.match(first.calls.find((c) => c.op === 'fillText').args[0], /SCORE 10/);
  assert.match(second.calls.find((c) => c.op === 'fillText').args[0], /SCORE 70/);
});

/* --- the sinking capybara ------------------------------------------------ */

function sinking(progress) {
  const state = createState();
  return Object.assign({}, state, {
    phase: PHASES.SINKING,
    phaseElapsed: SINK_SECONDS * progress,
    player: { col: 6, row: 0, facing: 'up' },
  });
}

test('sink progress is clamped at both ends', () => {
  // The running loop never exceeds ~0.96 because the phase ends first, so the
  // upper clamp is defensive. Exercise it directly rather than leave it unproven.
  const over = Object.assign(createState(), {
    phase: PHASES.SINKING, phaseElapsed: SINK_SECONDS * 3,
  });
  assert.equal(sinkProgress(over), 1, 'clamped above');

  const under = Object.assign(createState(), { phase: PHASES.SINKING, phaseElapsed: 0 });
  assert.equal(sinkProgress(under), 0, 'clamped below');
  assert.equal(sinkProgress(createState()), 0, 'zero while not sinking');

  const ctx = stubContext();
  drawPlayer(ctx, ATLAS, over);
  assert.equal(ctx.calls.length, 0, 'nothing drawn past the end of the beat');
});

test('the whole sprite is visible as the beat begins', () => {
  const ctx = stubContext();
  drawPlayer(ctx, ATLAS, sinking(0));
  const call = ctx.calls[0];
  assert.equal(call.sh, TILE, 'full source height');
  assert.equal(call.dy, 0, 'no offset yet');
});

test('the sprite is progressively hidden as the beat runs', () => {
  const early = stubContext();
  drawPlayer(early, ATLAS, sinking(0.25));
  const late = stubContext();
  drawPlayer(late, ATLAS, sinking(0.75));

  assert.ok(late.calls[0].sh < early.calls[0].sh, 'less of it is drawn later');
  assert.ok(late.calls[0].dy > early.calls[0].dy, 'and it sits farther down');
});

test('the bottom edge stays fixed across the whole beat', () => {
  const row = 0;
  for (const p of [0, 0.1, 0.25, 0.5, 0.75, 0.9]) {
    const ctx = stubContext();
    drawPlayer(ctx, ATLAS, sinking(p));
    const call = ctx.calls[0];
    assert.ok(Math.abs((call.dy + call.dh) - (row * TILE + TILE)) < 1e-9,
      `bottom line fixed at progress ${p}`);
  }
});

test('nothing is drawn once the beat completes', () => {
  const ctx = stubContext();
  drawPlayer(ctx, ATLAS, sinking(1));
  assert.equal(ctx.calls.length, 0, 'the sprite is gone');
});

test('the player draws normally while not sinking', () => {
  const ctx = stubContext();
  drawPlayer(ctx, ATLAS, createState());
  const call = ctx.calls[0];
  assert.equal(call.sh, TILE, 'full height');
  assert.equal(call.dy, 6 * TILE, 'no vertical offset');
});

test('render does not mutate the state it is given', () => {
  const state = Object.assign(createState(), { score: 60, lives: 3 });
  const snapshot = JSON.stringify(state);
  render(stubContext(), ATLAS, state);
  assert.equal(JSON.stringify(state), snapshot);
});
