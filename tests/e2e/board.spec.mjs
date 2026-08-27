// Visual regression: canvas screenshot after atlas paints the tile board and player.
// Update baseline: npm run test:e2e:update
import { expect, test } from "@playwright/test";

const CANVAS_WIDTH = 576;
const CANVAS_HEIGHT = 336;

async function waitForTileBoard(page) {
  await page.waitForFunction(
    () => {
      const canvas = document.getElementById("game");
      if (!canvas || canvas.width !== 576 || canvas.height !== 336) {
        return false;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return false;
      }
      const { data } = ctx.getImageData(288, 24, 1, 1);
      const [r, g, b] = data;
      return r + g + b > 30;
    },
    undefined,
    { timeout: 10_000 },
  );
}

test("P2 board matches canvas baseline after atlas load", async ({ page }) => {
  await page.goto("/index.html?freeze=1");
  await waitForTileBoard(page);

  const canvas = page.locator("#game");
  await expect(canvas).toHaveJSProperty("width", CANVAS_WIDTH);
  await expect(canvas).toHaveJSProperty("height", CANVAS_HEIGHT);

  await expect(canvas).toHaveScreenshot("p2-board.png", {
    maxDiffPixelRatio: 0.01,
  });
});
