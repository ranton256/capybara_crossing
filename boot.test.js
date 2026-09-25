'use strict';
// Covers the boot path: specs/game-loop/spec.md scenarios "Opening the page
// straight off disk", "Rendering waits for the atlas" and "The export mechanism
// does not affect the browser", and specs/grid-movement/spec.md scenario
// "Arrow keys do not scroll the page".
//
// These are the only behaviours no pure-logic test can reach, so boot() takes
// its document and window as parameters and is driven here against a stub.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { boot, TILE, SPRITES } = require('./game.js');

/* --- a hand-rolled DOM, no dependencies --------------------------------- */

function fakeEnv(atlas) {
  const calls = [];
  const record = (op) => (...args) => calls.push({ op, args });
  const ctx = {
    calls,
    setTransform: record('setTransform'),
    clearRect: record('clearRect'),
    fillRect: record('fillRect'),
    fillText: record('fillText'),
    drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
      calls.push({ op: 'drawImage', sx, sy, sw, sh, dx, dy, dw, dh });
    },
    set imageSmoothingEnabled(v) { calls.push({ op: 'imageSmoothingEnabled', args: [v] }); },
    get imageSmoothingEnabled() { return false; },
    set fillStyle(v) { calls.push({ op: 'fillStyle', args: [v] }); },
    get fillStyle() { return ''; },
    set font(v) { calls.push({ op: 'font', args: [v] }); },
    get font() { return ''; },
    set textAlign(v) { calls.push({ op: 'textAlign', args: [v] }); },
    get textAlign() { return ''; },
  };

  const listeners = {};
  const image = {
    complete: atlas.complete,
    naturalWidth: atlas.naturalWidth,
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    fire(type) { (listeners[type] || []).forEach((fn) => fn()); },
  };

  const doc = {
    getElementById(id) {
      if (id === 'board') return { getContext: () => ctx };
      if (id === 'atlas') return image;
      return null;
    },
  };

  const frames = [];
  const keydown = [];
  const win = {
    addEventListener(type, fn) { if (type === 'keydown') keydown.push(fn); },
    requestAnimationFrame(fn) { frames.push(fn); return frames.length; },
  };

  return { ctx, calls, image, doc, win, frames, keydown };
}

const loaded = () => fakeEnv({ complete: true, naturalWidth: 128 });
const failed = () => fakeEnv({ complete: true, naturalWidth: 0 });
const pending = () => fakeEnv({ complete: false, naturalWidth: 0 });

function runFrame(env, timestamp) {
  const frame = env.frames.shift();
  assert.ok(frame, 'a frame was scheduled');
  frame(timestamp);
}

function press(env, key) {
  let prevented = false;
  env.keydown.forEach((fn) => fn({ key, preventDefault() { prevented = true; } }));
  return prevented;
}

// The player is the last sprite drawn in a frame; its row falls out of dy.
function playerRow(env) {
  const draws = env.calls.filter((c) => c.op === 'drawImage');
  return draws[draws.length - 1].dy / TILE;
}

/* --- the atlas gate ----------------------------------------------------- */

test('an already-loaded atlas starts the loop immediately', () => {
  const env = loaded();
  boot(env.doc, env.win);
  assert.deepEqual(env.calls[0], { op: 'setTransform', args: [3, 0, 0, 3, 0, 0] });
  assert.equal(env.frames.length, 1, 'the loop was scheduled');
});

test('an atlas that already failed draws the failure message, not a blank canvas', () => {
  // Regression test. A file:// 404 settles before game.js runs, so `complete`
  // is already true with naturalWidth 0 and an error listener attached here
  // would never fire. That produced a silently blank canvas.
  const env = failed();
  boot(env.doc, env.win);

  const text = env.calls.filter((c) => c.op === 'fillText');
  assert.equal(text.length, 1, 'a message was drawn');
  assert.match(text[0].args[0], /capybara_crossing\.png/);
  assert.ok(env.calls.some((c) => c.op === 'fillRect'), 'the canvas was filled, not left blank');
  assert.equal(env.frames.length, 0, 'the loop does not run without an atlas');
});

test('a pending atlas draws nothing until it resolves', () => {
  const env = pending();
  boot(env.doc, env.win);
  assert.equal(env.calls.length, 0, 'nothing drawn yet');
  assert.equal(env.frames.length, 0, 'no loop yet');

  env.image.fire('load');
  assert.equal(env.frames.length, 1, 'the loop starts once the atlas arrives');
  assert.deepEqual(env.calls[0], { op: 'setTransform', args: [3, 0, 0, 3, 0, 0] });
});

test('a pending atlas that errors draws the failure message', () => {
  const env = pending();
  boot(env.doc, env.win);
  env.image.fire('error');
  assert.ok(env.calls.some((c) => c.op === 'fillText'));
  assert.equal(env.frames.length, 0);
});

/* --- the running loop --------------------------------------------------- */

test('the first frame renders the board and the player', () => {
  const env = loaded();
  boot(env.doc, env.win);
  runFrame(env, 0);

  assert.ok(env.calls.some((c) => c.op === 'clearRect'), 'cleared');
  const draws = env.calls.filter((c) => c.op === 'drawImage');
  assert.equal(draws.length, 12 * 7 + 1, 'board tiles plus the player');
  assert.equal(playerRow(env), 6, 'the player starts on the spawn row');
});

test('the loop keeps scheduling frames', () => {
  const env = loaded();
  boot(env.doc, env.win);
  runFrame(env, 0);
  assert.equal(env.frames.length, 1, 'the next frame was scheduled');
  runFrame(env, 16);
  assert.equal(env.frames.length, 1);
});

test('boot updates before it renders within a real frame', () => {
  const env = loaded();
  boot(env.doc, env.win);
  runFrame(env, 0);
  assert.equal(playerRow(env), 6);

  press(env, 'ArrowUp');
  runFrame(env, 16);
  assert.equal(playerRow(env), 5, 'the frame rendered the post-update position');
});

/* --- input wiring ------------------------------------------------------- */

test('the four arrow keys have their default action suppressed', () => {
  const env = loaded();
  boot(env.doc, env.win);
  for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
    assert.equal(press(env, key), true, `${key} was preventDefault'ed`);
  }
});

test('other keys keep their default action and move nothing', () => {
  const env = loaded();
  boot(env.doc, env.win);
  runFrame(env, 0);
  for (const key of ['Enter', ' ', 'a', 'Tab']) {
    assert.equal(press(env, key), false, `${key} was not suppressed`);
  }
  runFrame(env, 16);
  assert.equal(playerRow(env), 6, 'the player did not move');
});

test('only the most recent press survives to the next frame', () => {
  const env = loaded();
  boot(env.doc, env.win);
  runFrame(env, 0);
  press(env, 'ArrowUp');
  press(env, 'ArrowLeft');
  runFrame(env, 16);

  const draws = env.calls.filter((c) => c.op === 'drawImage');
  const player = draws[draws.length - 1];
  assert.equal(player.sx, SPRITES.capy_left_1.x, 'the latest press won');
  assert.equal(playerRow(env), 6, 'and the earlier ArrowUp was discarded');
});

/* --- the export guard, evaluated as a browser would ---------------------- */

const SOURCE = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');

test('a bare module object does not break the browser load', () => {
  // An injected script can define `module` without `exports`. The guard's
  // second clause is what stops the assignment throwing during page load.
  const sandbox = { module: {} };
  assert.doesNotThrow(() => vm.runInNewContext(SOURCE, sandbox));
  assert.equal(sandbox.module.exports, undefined, 'nothing was exported');
});

test('the file boots in a context with no module system at all', () => {
  const env = loaded();
  const sandbox = { document: env.doc, window: env.win };
  assert.doesNotThrow(() => vm.runInNewContext(SOURCE, sandbox));
  assert.equal(env.frames.length, 1, 'boot ran and started the loop');
});
