import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("npm test requires line, function, and branch coverage of 80%", () => {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const script = pkg.scripts.test;
  for (const flag of [
    "--test-coverage-lines=80",
    "--test-coverage-functions=80",
    "--test-coverage-branches=80",
  ]) {
    assert.match(script, new RegExp(flag.replaceAll(".", "\\.")));
  }
});

test("pre-commit hook is committed and runs npm test", () => {
  const hook = readFileSync(join(root, ".githooks", "pre-commit"), "utf8");
  assert.match(hook, /npm test/);
});
