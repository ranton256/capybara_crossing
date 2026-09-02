import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

// Guards the dev harness itself: the shipped game must stay dependency-free
// and runnable straight from disk.

test("package.json declares no runtime dependencies", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.dependencies, undefined, "the shipped game must have no runtime deps");
  assert.equal(pkg.private, true);
});

test("sprite atlas and manifest are present", () => {
  const base = new URL("../assets/sprites/", import.meta.url);
  assert.ok(existsSync(new URL("capybara_crossing.png", base)), "atlas png missing");
  assert.ok(existsSync(new URL("manifest.json", base)), "manifest missing");
});
