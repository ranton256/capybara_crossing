// Copies .githooks/* into .git/hooks so `npm install` wires up the pre-commit gate.
import { chmodSync, copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, ".githooks");
const target = join(root, ".git", "hooks");

if (!existsSync(source) || !existsSync(join(root, ".git"))) {
  process.exit(0);
}

mkdirSync(target, { recursive: true });
for (const name of readdirSync(source)) {
  const dest = join(target, name);
  copyFileSync(join(source, name), dest);
  chmodSync(dest, 0o755);
}
console.log("install-hooks: git hooks installed");
