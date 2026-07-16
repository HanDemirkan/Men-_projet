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

  get port(): number {
    return this.configService.get("API_PORT", { infer: true });
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
}
