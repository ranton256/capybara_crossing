import { test, expect } from "@playwright/test";
import { pathToFileURL } from "node:url";

// Opens the shipped index.html straight off disk, exactly as a player would,
// and proves the real browser paints the real board once the atlas decodes.
// This is the one link unit tests cannot reach.
const indexUrl = pathToFileURL(new URL("../../index.html", import.meta.url).pathname).href;

test("board paints from file:// and matches the baseline", async ({ page }) => {
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));

  await page.goto(`${indexUrl}?freeze=1`);

  // Wait on an observable condition rather than a sleep. Note this cannot
  // inspect pixels: drawing a file:// image taints the canvas, so getImageData
  // throws a SecurityError. The game state handle is the reliable signal.
  await page.waitForFunction(() => {
    const state = window.game;
    const canvas = document.getElementById("game");
    return Boolean(state && state.atlas && state.frames > 1 && canvas && canvas.width === 576);
  }, null, { timeout: 15000 });

  const canvas = page.locator("canvas#game");
  await expect(canvas).toHaveScreenshot("p2-board.png");

  expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
});
