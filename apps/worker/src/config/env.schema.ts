import { envSchema } from "@qr-platform/validation";
import type { z } from "zod";

// The worker only reads the subset of the shared env schema it actually uses.
export const workerEnvSchema = envSchema.pick({
  NODE_ENV: true,
  WORKER_PORT: true,
  DATABASE_URL: true,
  REDIS_URL: true,
  LOG_LEVEL: true,
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;
