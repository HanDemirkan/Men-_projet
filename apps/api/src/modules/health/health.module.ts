import { Module } from "@nestjs/common";
import { prisma } from "@qr-platform/database";
import { Redis } from "ioredis";

import { AppConfigService } from "../../common/config/app-config.service";

import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { PRISMA_CLIENT, REDIS_CLIENT } from "./health.tokens";

@Module({
  controllers: [HealthController],
  providers: [
    HealthService,
    { provide: PRISMA_CLIENT, useValue: prisma },
    {
      provide: REDIS_CLIENT,
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) =>
        new Redis(appConfig.redisUrl, { lazyConnect: false, maxRetriesPerRequest: 1 }),
    },
  ],
})
export class HealthModule {}
