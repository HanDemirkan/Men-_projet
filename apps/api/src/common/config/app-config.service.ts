import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { ApiEnv } from "./env.schema";

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<ApiEnv, true>) {}

  get nodeEnv(): ApiEnv["NODE_ENV"] {
    return this.configService.get("NODE_ENV", { infer: true });
  }

  get isProduction(): boolean {
    return this.nodeEnv === "production";
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === "development";
  }

  get port(): number {
    return this.configService.get("API_PORT", { infer: true });
  }

  // "0.0.0.0" in development so the API is reachable from other devices on
  // the LAN (e.g. a phone scanning a QR code), not just localhost.
  get host(): string {
    return this.configService.get("API_HOST", { infer: true });
  }

  // Native/single-host deployment (see ADR 0005) - API and worker always run
  // on the same host, so this is a safe assumption for AdminSystemService's
  // worker health check, not a general-purpose service discovery mechanism.
  get workerHealthUrl(): string {
    const workerPort = this.configService.get("WORKER_PORT", { infer: true });
    return `http://localhost:${workerPort}/health`;
  }

  get databaseUrl(): string {
    return this.configService.get("DATABASE_URL", { infer: true });
  }

  get redisUrl(): string {
    return this.configService.get("REDIS_URL", { infer: true });
  }

  get corsAllowedOrigins(): string[] {
    return this.configService
      .get("CORS_ALLOWED_ORIGINS", { infer: true })
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  get logLevel(): ApiEnv["LOG_LEVEL"] {
    return this.configService.get("LOG_LEVEL", { infer: true });
  }

  get requestBodyLimit(): string {
    return this.configService.get("REQUEST_BODY_LIMIT", { infer: true });
  }

  get storageDir(): string {
    return this.configService.get("STORAGE_DIR", { infer: true });
  }

  get storageMaxFileSizeMb(): number {
    return this.configService.get("STORAGE_MAX_FILE_SIZE_MB", { infer: true });
  }

  get storageAllowedMimeTypes(): string[] {
    return this.configService
      .get("STORAGE_ALLOWED_MIME_TYPES", { infer: true })
      .split(",")
      .map((mimeType) => mimeType.trim())
      .filter(Boolean);
  }

  get rateLimitTtlSeconds(): number {
    return this.configService.get("RATE_LIMIT_TTL_SECONDS", { infer: true });
  }

  get rateLimitMaxRequests(): number {
    return this.configService.get("RATE_LIMIT_MAX_REQUESTS", { infer: true });
  }

  get jwtAccessSecret(): string {
    return this.configService.get("JWT_ACCESS_SECRET", { infer: true });
  }

  get webAppUrl(): string {
    return this.configService.get("WEB_APP_URL", { infer: true });
  }

  get passwordResetUrl(): string {
    return `${this.webAppUrl}/reset-password`;
  }

  // The externally-reachable URL QR codes are generated against - see
  // PUBLIC_APP_URL's own comment in packages/validation/src/env.schema.ts.
  get publicAppUrl(): string {
    return this.configService.get("PUBLIC_APP_URL", { infer: true });
  }

  // Development-only automatic SUPER_ADMIN bootstrap. Undefined whenever the
  // corresponding DEV_ADMIN_* var isn't set - callers must treat a missing
  // value as "bootstrap disabled", never fall back to a hardcoded default.
  get devAdminName(): string | undefined {
    return this.configService.get("DEV_ADMIN_NAME", { infer: true });
  }

  get devAdminEmail(): string | undefined {
    return this.configService.get("DEV_ADMIN_EMAIL", { infer: true });
  }

  get devAdminPassword(): string | undefined {
    return this.configService.get("DEV_ADMIN_PASSWORD", { infer: true });
  }
}
