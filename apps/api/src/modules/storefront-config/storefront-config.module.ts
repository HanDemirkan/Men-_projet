import { Module } from "@nestjs/common";

import { StorefrontConfigController } from "./storefront-config.controller";
import { StorefrontConfigService } from "./storefront-config.service";

@Module({
  controllers: [StorefrontConfigController],
  providers: [StorefrontConfigService],
})
export class StorefrontConfigModule {}
