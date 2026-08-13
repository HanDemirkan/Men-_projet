import { Injectable, Module } from "@nestjs/common";
import type { OnApplicationShutdown } from "@nestjs/common";
import { prisma } from "@qr-platform/database";
import { Redis } from "ioredis";
import { PinoLogger } from "nestjs-pino";

import { AppConfigService } from "../../common/config/app-config.service";

import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { PRISMA_CLIENT, REDIS_CLIENT } from "./health.tokens";

// Ensures the shared Prisma/Redis connections are actually closed on
// shutdown. `main.ts` calls `app.enableShutdownHooks()`, which invokes
// `onApplicationShutdown` on every provider that implements it - this is the
// only place those two singletons are wired into that lifecycle.
@Injectable()
class DatabaseConnectionsLifecycle implements OnApplicationShutdown {
  constructor(
    private readonly redis: Redis,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DatabaseConnectionsLifecycle.name);
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    this.logger.info({ signal }, "Closing database/Redis connections");
    await Promise.all([prisma.$disconnect(), this.redis.quit().catch(() => undefined)]);
  }
}

@Module({
  controllers: [HealthController],
  providers: [
    HealthService,
    { provide: PRISMA_CLIENT, useValue: prisma },
    {
      provide: REDIS_CLIENT,
      inject: [AppConfigService, PinoLogger],
      useFactory: (appConfig: AppConfigService, logger: PinoLogger) => {
        logger.setContext("RedisClient");

        const redis = new Redis(appConfig.redisUrl, {
          lazyConnect: false,
          maxRetriesPerRequest: 1,
          // Backs off up to 5s between reconnect attempts instead of hammering
          // Redis or crashing the app while it's down.
          retryStrategy: (attempt: number) => Math.min(attempt * 500, 5000),
          reconnectOnError: () => true,
        });

        // ioredis emits `error` for every failed connection attempt; without
        // a listener this would eventually surface as an unhandled error.
        // Logging keeps `/health` reporting "degraded" instead of crashing
        // the process when Redis is unreachable.
        redis.on("error", (error: Error) => {
          logger.warn({ err: error }, "Redis connection error");
        });

        return redis;
      },
    },
    {
      provide: DatabaseConnectionsLifecycle,
      inject: [REDIS_CLIENT, PinoLogger],
      useFactory: (redis: Redis, logger: PinoLogger) =>
        new DatabaseConnectionsLifecycle(redis, logger),
    },
  ],
  // AdminSystemService reuses this instead of re-implementing DB/Redis checks.
  exports: [HealthService],
})
export class HealthModule {}
