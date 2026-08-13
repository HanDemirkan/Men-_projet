import { defineConfig, devices } from "@playwright/test";

const WEB_PORT = process.env["WEB_PORT"] ?? "3000";
const API_PORT = process.env["API_PORT"] ?? "4000";
// 127.0.0.1, not localhost - matches .env.production's WEB_APP_URL/
// CORS_ALLOWED_ORIGINS exactly (see ADR 0009's Lighthouse note: this is a
// real production *build* audited against the real API, not the dev
// server, since Next dev mode - no minification, no caching, HMR overhead -
// doesn't give a representative performance signal).
const baseURL = `http://127.0.0.1:${WEB_PORT}`;

export default defineConfig({
  testDir: "./lighthouse",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // playwright-lighthouse drives a real Lighthouse audit over this
        // same Chromium instance via CDP - it needs an explicit debugging
        // port to attach to.
        launchOptions: { args: ["--remote-debugging-port=9222"] },
      },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter @qr-platform/api start",
      url: `http://127.0.0.1:${API_PORT}/api/v1/health/live`,
      reuseExistingServer: false,
      cwd: "..",
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @qr-platform/web start",
      url: baseURL,
      reuseExistingServer: false,
      cwd: "..",
      timeout: 120_000,
    },
  ],
});
