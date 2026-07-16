import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AppConfigService } from "./common/config/app-config.service";
import { ConfigModule } from "./common/config/config.module";
import { LoggerModule } from "./common/logging/logger.module";
import { RequestIdMiddleware } from "./common/logging/request-id.middleware";
import { HealthModule } from "./modules/health/health.module";
import { StorageModule } from "./modules/storage/storage.module";

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ThrottlerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => ({
        throttlers: [
          { ttl: appConfig.rateLimitTtlSeconds * 1000, limit: appConfig.rateLimitMaxRequests },
        ],
      }),
    }),
    HealthModule,
    StorageModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
