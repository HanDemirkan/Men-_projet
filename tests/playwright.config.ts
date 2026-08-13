import { defineConfig, devices } from "@playwright/test";

// 3001, not Next's usual 3000 - avoids colliding with another local
// project's dev server on this machine (see .env.development).
const WEB_PORT = process.env["WEB_PORT"] ?? "3001";
const API_PORT = process.env["API_PORT"] ?? "4000";
const baseURL = `http://localhost:${WEB_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Verifies the API's actual dependencies (Postgres, Redis) are reachable
  // and that both ports genuinely belong to this project - not just that
  // *some* process answered. See global-setup.ts for why this is a real gap
  // the webServer polling below doesn't close on its own.
  globalSetup: "./e2e/global-setup.ts",
  // Serialized on purpose: the webServer is a Next.js *dev* server that
  // compiles each route on first request. Running specs in parallel means
  // several workers hit different never-before-compiled routes at once,
  // which reliably times out the first run against a cold server (only
  // "/" gets warmed by the webServer readiness check below). A handful of
  // specs finishing in series costs a few seconds; flaky first-run e2e
  // failures cost a lot more.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  reporter: [["html", { open: "never" }]],
  // Next.js dev-server routes compile on first request; a spec that's the
  // first to hit a given route needs more than the 5s default to get past
  // that one-time compile.
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Both apps are started here so specs that exercise real login/session
  // flows (not just static pages) work in the same automated `pnpm
  // test:e2e` run that CI/a fresh checkout uses - previously only the web
  // app was started, so anything hitting the real API silently depended on
  // a developer having `pnpm dev:api` running in another terminal.
  webServer: [
    {
      command: "pnpm --filter @qr-platform/api dev",
      // /health/ready, not /health/live: liveness only proves the Node
      // process is listening. Readiness actually queries Postgres
      // (`SELECT 1`) and pings Redis, returning 503 until both are
      // reachable - the real signal tests need before hitting the API.
      url: `http://localhost:${API_PORT}/api/v1/health/ready`,
      reuseExistingServer: !process.env["CI"],
      cwd: "..",
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @qr-platform/web dev",
      url: baseURL,
      reuseExistingServer: !process.env["CI"],
      cwd: "..",
      timeout: 120_000,
    },
  ],
});
