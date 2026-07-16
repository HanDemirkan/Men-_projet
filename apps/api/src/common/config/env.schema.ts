import { envSchema } from "@qr-platform/validation";
import type { z } from "zod";

// The API only reads the subset of the shared env schema it actually uses.
export const apiEnvSchema = envSchema.pick({
  NODE_ENV: true,
  API_PORT: true,
  DATABASE_URL: true,
  REDIS_URL: true,
  CORS_ALLOWED_ORIGINS: true,
  LOG_LEVEL: true,
  REQUEST_BODY_LIMIT: true,
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function validateApiEnv(config: Record<string, unknown>): ApiEnv {
  const result = apiEnvSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  return result.data;
}
