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
      // Nearest-neighbour pixel art with no text: near-exact across machines,
      // with a small allowance for PNG encoder differences.
      maxDiffPixelRatio: 0.01,
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
