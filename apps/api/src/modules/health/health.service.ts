import { Inject, Injectable } from "@nestjs/common";
import type { PrismaClient } from "@qr-platform/database";
import type { HealthStatus, ServiceStatus } from "@qr-platform/shared";
import type { Redis } from "ioredis";
import { PinoLogger } from "nestjs-pino";

import { PRISMA_CLIENT, REDIS_CLIENT } from "./health.tokens";

@Injectable()
export class HealthService {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(HealthService.name);
  }

  async check(): Promise<HealthStatus> {
    const [database, redis] = await Promise.all([this.checkDatabase(), this.checkRedis()]);

    const allUp = database === "up" && redis === "up";

    return {
      status: allUp ? "healthy" : "degraded",
      services: { api: "up", database, redis },
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return "up";
    } catch (error) {
      this.logger.warn({ err: error }, "Database health check failed");
      return "down";
    }
  }

  private async checkRedis(): Promise<ServiceStatus> {
    try {
      const pong = await this.redis.ping();
      return pong === "PONG" ? "up" : "down";
    } catch (error) {
      this.logger.warn({ err: error }, "Redis health check failed");
      return "down";
    }
  }
}
