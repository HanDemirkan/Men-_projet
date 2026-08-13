import { z } from "zod";

// Kept as a plain ZodObject (not wrapped in .superRefine/.transform) so that
// consuming apps can still call `.pick()` to derive the subset they read.
// Environment-specific cross-field rules (e.g. "no localhost CORS in
// production") live in the app that owns those fields, not here.
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  API_PORT: z.coerce.number().int().positive().default(4000),
  WORKER_PORT: z.coerce.number().int().positive().default(4100),
  // "0.0.0.0" so the API is reachable from other devices on the LAN (e.g. a
  // phone scanning a QR code) as well as localhost - see Sprint 6.
  API_HOST: z.string().min(1).default("0.0.0.0"),

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

  // Signs/verifies access tokens (see apps/api's auth module). Minimum
  // length guards against an accidentally weak secret in production.
  JWT_ACCESS_SECRET: z.string().min(32),

  // The web app's own origin, used to build links that point back at it
  // (e.g. the password reset link embedded in the forgot-password flow).
  WEB_APP_URL: z.string().url().default("http://localhost:3000"),

  // The externally-reachable origin QR codes are generated against - in
  // development this is the machine's LAN IP (a phone can't resolve
  // "localhost"), in production it's the same as WEB_APP_URL. Kept as its
  // own var (not reused from WEB_APP_URL) so a LAN IP can be configured for
  // QR codes without changing every other web-app link. See Sprint 6.
  PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  CORS_ALLOWED_ORIGINS: z.string().min(1).default("http://localhost:3000"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  REQUEST_BODY_LIMIT: z.string().default("1mb"),

  // Optional: development-only automatic SUPER_ADMIN bootstrap (see apps/api's
  // DevelopmentBootstrapService). Left optional here so their absence never
  // breaks production validation; business-rule validation (email format,
  // password policy) happens in that service's own local schema, not here.
  DEV_ADMIN_NAME: z.string().optional(),
  DEV_ADMIN_EMAIL: z.string().optional(),
  DEV_ADMIN_PASSWORD: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
