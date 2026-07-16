import { defineConfig, devices } from "@playwright/test";

const WEB_PORT = process.env["WEB_PORT"] ?? "3000";
const baseURL = `http://localhost:${WEB_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm --filter @qr-platform/web dev",
    url: baseURL,
    reuseExistingServer: !process.env["CI"],
    cwd: "..",
    timeout: 120_000,
  },
});
