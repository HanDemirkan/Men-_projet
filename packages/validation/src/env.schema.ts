import { z } from "zod";

// Kept as a plain ZodObject (not wrapped in .superRefine/.transform) so that
// consuming apps can still call `.pick()` to derive the subset they read.
// Environment-specific cross-field rules (e.g. "no localhost CORS in
// production") live in the app that owns those fields, not here.
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  API_PORT: z.coerce.number().int().positive().default(4000),
  WORKER_PORT: z.coerce.number().int().positive().default(4100),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // Absolute path to the directory files are written to. Deliberately kept
  // outside the repo/app directory so it survives deploys and isn't wiped by
  // a fresh `pnpm build`. See `packages/storage`.
  STORAGE_DIR: z.string().min(1),
  STORAGE_MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(10),
  STORAGE_ALLOWED_MIME_TYPES: z.string().min(1).default("image/png,image/jpeg,image/webp"),

  RATE_LIMIT_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),

  CORS_ALLOWED_ORIGINS: z.string().min(1).default("http://localhost:3000"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  REQUEST_BODY_LIMIT: z.string().default("1mb"),
});

export type Env = z.infer<typeof envSchema>;
