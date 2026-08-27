#!/usr/bin/env node
/**
 * Dev-only static server for browser verification.
 * The shipped game still opens from disk with no server required.
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const port = Number(process.env.PORT) || 8765;
const host = process.env.HOST || "127.0.0.1";

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
};

function sendNotFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
}

createServer((req, res) => {
  const pathname = new URL(req.url ?? "/", `http://${host}`).pathname;
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const file = join(root, relative);

  if (!file.startsWith(root)) {
    sendNotFound(res);
    return;
  }

  if (!existsSync(file) || !statSync(file).isFile()) {
    sendNotFound(res);
    return;
  }

  const type = MIME[extname(file)] ?? "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  res.end(readFileSync(file));
}).listen(port, host, () => {
  const url = `http://${host}:${port}/index.html`;
  console.log(`Serving ${root}`);
  console.log(`Open ${url}`);
  console.log("Press Ctrl+C to stop.");
});
