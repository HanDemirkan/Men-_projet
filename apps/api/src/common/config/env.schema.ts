import path from "node:path";

import { envSchema } from "@qr-platform/validation";
import { z } from "zod";

// The API only reads the subset of the shared env schema it actually uses.
// Cross-field production guardrails live here (not in the shared schema)
// because the fields they check (STORAGE_DIR, CORS_ALLOWED_ORIGINS) are only
// meaningful in apps that actually own them.
export const apiEnvSchema = envSchema
  .pick({
    NODE_ENV: true,
    API_PORT: true,
    DATABASE_URL: true,
    REDIS_URL: true,
    STORAGE_DIR: true,
    STORAGE_MAX_FILE_SIZE_MB: true,
    STORAGE_ALLOWED_MIME_TYPES: true,
    RATE_LIMIT_TTL_SECONDS: true,
    RATE_LIMIT_MAX_REQUESTS: true,
    CORS_ALLOWED_ORIGINS: true,
    LOG_LEVEL: true,
    REQUEST_BODY_LIMIT: true,
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") {
      return;
    }

    if (!path.isAbsolute(env.STORAGE_DIR)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["STORAGE_DIR"],
        message: "STORAGE_DIR must be an absolute path in production.",
      });
    }

    if (
      env.CORS_ALLOWED_ORIGINS.split(",").some((origin) => origin.trim().includes("localhost"))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CORS_ALLOWED_ORIGINS"],
        message: "CORS_ALLOWED_ORIGINS must not contain localhost in production.",
      });
    }
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
