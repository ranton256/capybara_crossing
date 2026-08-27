#!/usr/bin/env node
/**
 * Install repo git hooks by copying into .git/hooks.
 * Does not run git config (hooksPath stays default).
 */
import { chmodSync, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const gitDir = join(root, ".git");
if (!existsSync(gitDir)) {
  process.exit(0);
}

const destDir = join(gitDir, "hooks");
mkdirSync(destDir, { recursive: true });
const src = join(root, ".githooks", "pre-commit");
const dest = join(destDir, "pre-commit");
copyFileSync(src, dest);
chmodSync(dest, 0o755);
console.log("Installed git hook:", dest);
