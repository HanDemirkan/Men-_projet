import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { DevelopmentBootstrapService } from "./common/bootstrap/development-bootstrap.service";
import { AppConfigService } from "./common/config/app-config.service";
import { ConfigModule } from "./common/config/config.module";
import { LoggerModule } from "./common/logging/logger.module";
import { RequestIdMiddleware } from "./common/logging/request-id.middleware";
import { AdminModule } from "./modules/admin/admin.module";
import { AuthModule } from "./modules/auth/auth.module";
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "./modules/auth/guards/permissions.guard";
import { TenantGuard } from "./modules/auth/guards/tenant.guard";
import { AuthContextMiddleware } from "./modules/auth/middleware/auth-context.middleware";
import { BusinessModule } from "./modules/business/business.module";
import { BusinessProfileModule } from "./modules/business-profile/business-profile.module";
import { CategoryModule } from "./modules/category/category.module";
import { HealthModule } from "./modules/health/health.module";
import { MediaModule } from "./modules/media/media.module";
import { MenuModule } from "./modules/menu/menu.module";
import { ProductModule } from "./modules/product/product.module";
import { PublicStorefrontContextMiddleware } from "./modules/public-storefront/middleware/public-storefront-context.middleware";
import { PublicStorefrontController } from "./modules/public-storefront/public-storefront.controller";
import { PublicStorefrontModule } from "./modules/public-storefront/public-storefront.module";
import { QrModule } from "./modules/qr/qr.module";
import { SearchModule } from "./modules/search/search.module";
import { StorageModule } from "./modules/storage/storage.module";
import { StorefrontConfigModule } from "./modules/storefront-config/storefront-config.module";

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
    AuthModule,
    AdminModule,
    BusinessModule,
    HealthModule,
    StorageModule,
    MediaModule,
    BusinessProfileModule,
    MenuModule,
    CategoryModule,
    ProductModule,
    StorefrontConfigModule,
    PublicStorefrontModule,
    QrModule,
    SearchModule,
  ],
  providers: [
    // Order matters: rate-limit first, then resolve identity/authorization
    // in the sequence a request is actually rejected in (401 before 403).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    DevelopmentBootstrapService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware, AuthContextMiddleware).forRoutes("*");
    // Scoped to PublicStorefrontController's own routes only - Nest resolves
    // this against that controller's actual registered paths, so `:tenantSlug`
    // (and the other params) are already populated on `req.params` the same
    // way they would be inside the controller itself. See ADR 0009.
    consumer.apply(PublicStorefrontContextMiddleware).forRoutes(PublicStorefrontController);
  }
}
