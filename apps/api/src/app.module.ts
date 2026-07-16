import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";

import { ConfigModule } from "./common/config/config.module";
import { LoggerModule } from "./common/logging/logger.module";
import { RequestIdMiddleware } from "./common/logging/request-id.middleware";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [ConfigModule, LoggerModule, HealthModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
