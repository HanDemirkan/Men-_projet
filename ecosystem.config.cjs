// PM2 process definitions for production (and local PM2 smoke-testing).
//
// Usage:
//   Production:            NODE_ENV=production pm2 start ecosystem.config.cjs
//   Local smoke test:      NODE_ENV=development pnpm exec pm2 start ecosystem.config.cjs
//   Zero-downtime reload:  pm2 reload ecosystem.config.cjs --update-env
//   Persist across reboot: pm2 save && pm2 startup   (see docs/setup/pm2.md)
//
// Each app must already be built (`pnpm build`) before starting under PM2 -
// PM2 runs the compiled `dist/` output directly, it does not build anything.
const fs = require("node:fs");
const path = require("node:path");

const dotenv = require("dotenv");

const nodeEnv = process.env.NODE_ENV || "production";
const rootDir = __dirname;
const envFile = path.join(rootDir, `.env.${nodeEnv}`);
const logsDir = path.join(rootDir, "logs");

if (!fs.existsSync(envFile)) {
  throw new Error(
    `${envFile} not found. Copy .env.${nodeEnv}.example to .env.${nodeEnv} and fill it in first.`,
  );
}

// PM2 (as of 5.x) has no built-in per-app "env file" loading despite an
// `env_file` key existing in some example configs online - it's silently
// ignored. Parse the file ourselves and pass every value through `env`
// instead, so this is the one place that actually determines what each
// process sees.
const fileEnv = dotenv.parse(fs.readFileSync(envFile));

// Next.js's `next start` only respects the generic `PORT` env var, while
// every other app reads its own `*_PORT` name (see packages/validation's
// shared env schema).
const webPort = fileEnv.WEB_PORT || "3000";

// Shared defaults so each app doesn't have to repeat the same operational
// tuning. `kill_timeout` gives the app's own graceful-shutdown handlers
// (`app.enableShutdownHooks()` in the API, `registerGracefulShutdown` in the
// worker, Next's own SIGTERM handling) time to finish before PM2 escalates
// to SIGKILL.
const common = {
  env: { ...fileEnv, NODE_ENV: nodeEnv },
  autorestart: true,
  max_restarts: 10,
  min_uptime: "10s",
  restart_delay: 2000,
  kill_timeout: 5000,
  merge_logs: true,
  time: true,
};

module.exports = {
  apps: [
    {
      ...common,
      name: "qr-platform-api",
      cwd: path.join(rootDir, "apps/api"),
      script: "dist/main.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "300M",
      out_file: path.join(logsDir, "api-out.log"),
      error_file: path.join(logsDir, "api-error.log"),
    },
    {
      ...common,
      name: "qr-platform-worker",
      cwd: path.join(rootDir, "apps/worker"),
      script: "dist/index.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "250M",
      out_file: path.join(logsDir, "worker-out.log"),
      error_file: path.join(logsDir, "worker-error.log"),
    },
    {
      ...common,
      name: "qr-platform-web",
      cwd: path.join(rootDir, "apps/web"),
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      env: { ...common.env, PORT: webPort },
      max_memory_restart: "400M",
      out_file: path.join(logsDir, "web-out.log"),
      error_file: path.join(logsDir, "web-error.log"),
    },
  ],
};
