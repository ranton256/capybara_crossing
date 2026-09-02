import { defineConfig, devices } from "@playwright/test";

// Browser-level gate only. The fast unit suite (npm test) stays dependency-free
// and is what the pre-commit hook runs.
//
// @playwright/test is pinned exactly: releases after 1.56.x no longer publish
// browser builds for macOS 12 (mac12-arm64), so a floating range breaks
// `npx playwright install` on that host.
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.spec.mjs",
  fullyParallel: true,
  reporter: "list",
  expect: {
    toHaveScreenshot: {
      // Deliberately tight. An earlier 1% ratio was loose enough that an
      // entire missing player sprite plus HUD text (~0.7% of the canvas)
      // compared as unchanged. The render is integer-aligned nearest-neighbour
      // blitting, so it is deterministic; this only absorbs encoder noise.
      maxDiffPixels: 40,
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
