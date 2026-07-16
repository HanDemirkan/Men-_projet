import pino from "pino";

import type { WorkerEnv } from "../config/env.schema";

const SENSITIVE_FIELD_PATTERNS = [
  "*.password",
  "*.token",
  "*.secret",
  "*.accessKey",
  "*.secretKey",
];

export function createLogger(env: WorkerEnv): pino.Logger {
  return pino({
    level: env.LOG_LEVEL,
    base: { application: "worker", environment: env.NODE_ENV },
    redact: { paths: SENSITIVE_FIELD_PATTERNS, censor: "[REDACTED]" },
    transport:
      env.NODE_ENV === "production"
        ? undefined
        : { target: "pino-pretty", options: { colorize: true, singleLine: true } },
  });
}
