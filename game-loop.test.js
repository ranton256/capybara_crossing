'use strict';
// Covers openspec/changes/walkable-board/specs/game-loop/spec.md

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  COLS, ROWS, TILE, SCALE, CANVAS_WIDTH, CANVAS_HEIGHT, MAX_DELTA_SECONDS,
  createState, createInput, pressKey, frameDelta, update, tick,
} = require('./game.js');

const SHIPPED = ['index.html', 'style.css', 'game.js'];
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');

/* --- zero-dependency startup ------------------------------------------- */

test('importing game.js outside a browser succeeds with no DOM', () => {
  // Reaching this line at all proves it: the require above ran with no
  // document, window, or canvas defined.
  assert.equal(typeof globalThis.document, 'undefined');
  assert.equal(typeof globalThis.window, 'undefined');
  assert.equal(typeof createState, 'function');
  assert.equal(typeof update, 'function');
});

test('no shipped file uses a transport blocked over file://', () => {
  const forbidden = [
    [/\bfetch\b/, 'fetch'],
    [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
    [/type\s*=\s*["']module["']/, 'type="module"'],
    [/^\s*import\s/m, 'ES import statement'],
    [/^\s*export\s/m, 'ES export statement'],
  ];
  for (const file of SHIPPED) {
    const source = read(file);
    for (const [pattern, label] of forbidden) {
      assert.ok(!pattern.test(source), `${file} must not contain ${label}`);
    }
  }
});

test('the atlas is obtained through an img element and the script is classic', () => {
  const html = read('index.html');
  assert.match(html, /<img[^>]+id=["']atlas["'][^>]+src=["']assets\/sprites\/capybara_crossing\.png["']/);
  assert.match(html, /<script\s+src=["']game\.js["']\s*>/);
});

test('sprite rectangles are constants in the source, not read at runtime', () => {
  const source = read('game.js');
  assert.ok(!/manifest\.json/.test(source.replace(/^\s*\/\/.*$/gm, '')),
    'manifest.json is referenced only in comments, never in executable code');
  assert.match(source, /const SPRITES = \{/);
});

test('the export guard checks both module and module.exports', () => {
  assert.match(read('game.js'), /typeof module !== ['"]undefined['"] && module\.exports/);
});

/* --- frame-rate independent time --------------------------------------- */

test('frameDelta returns zero on the first frame', () => {
  assert.equal(frameDelta(1234.5, null), 0);
  assert.equal(frameDelta(1234.5, undefined), 0);
});

test('frameDelta converts a normal frame to seconds', () => {
  assert.ok(Math.abs(frameDelta(1016, 1000) - 0.016) < 1e-12);
});

test('frameDelta clamps a long gap between frames', () => {
  assert.equal(frameDelta(6000, 1000), MAX_DELTA_SECONDS, 'a 5s gap is clamped to 0.1s');
  assert.equal(frameDelta(1101, 1000), MAX_DELTA_SECONDS, 'a 101ms gap is clamped');
  assert.ok(frameDelta(1099, 1000) < MAX_DELTA_SECONDS, 'a 99ms gap is not clamped');
});

test('frameDelta rejects a non-advancing timestamp', () => {
  assert.equal(frameDelta(1000, 1000), 0);
  assert.equal(frameDelta(900, 1000), 0, 'a backwards clock yields no motion');
});

test('one second of elapsed time is equivalent at 60Hz and 120Hz', () => {
  let at60 = createState();
  const input60 = createInput();
  for (let i = 0; i < 60; i++) at60 = update(at60, 1 / 60, input60);

  let at120 = createState();
  const input120 = createInput();
  for (let i = 0; i < 120; i++) at120 = update(at120, 1 / 120, input120);

  assert.ok(Math.abs(at60.elapsed - at120.elapsed) < 1e-9,
    `elapsed differed: ${at60.elapsed} vs ${at120.elapsed}`);
  assert.deepEqual(at60.player, at120.player);
});

test('no single frame advances the world by more than the clamp', () => {
  const before = createState();
  const after = update(before, frameDelta(9000, 1000), createInput());
  assert.ok(after.elapsed - before.elapsed <= MAX_DELTA_SECONDS);
});

/* --- update precedes render -------------------------------------------- */

test('tick updates before it draws, and draws the updated state', () => {
  const input = createInput();
  pressKey(input, 'ArrowUp');
  const before = createState();

  const drawn = [];
  const after = tick(before, 0.016, input, (state) => drawn.push(state));

  assert.equal(drawn.length, 1, 'drawn exactly once');
  assert.equal(drawn[0].player.row, 5, 'the draw saw post-update state');
  assert.equal(before.player.row, 6, 'the pre-update state was not mutated');
  assert.equal(drawn[0], after, 'the drawn state is the state tick returned');
});

test('tick still draws on a frame with no input', () => {
  const drawn = [];
  tick(createState(), 0.016, createInput(), (state) => drawn.push(state));
  assert.equal(drawn.length, 1);
});

/* --- board geometry ----------------------------------------------------- */

test('canvas dimensions follow from the board at integer scale', () => {
  assert.equal(COLS * TILE * SCALE, 576);
  assert.equal(ROWS * TILE * SCALE, 336);
  assert.equal(CANVAS_WIDTH, 576);
  assert.equal(CANVAS_HEIGHT, 336);
  assert.equal(SCALE, 3);
});

test('the html canvas element matches those dimensions', () => {
  assert.match(read('index.html'), /<canvas[^>]+width=["']576["'][^>]+height=["']336["']/);
});
