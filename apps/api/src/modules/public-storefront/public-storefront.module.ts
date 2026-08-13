import { Module } from "@nestjs/common";

import { PublicStorefrontController } from "./public-storefront.controller";
import { PublicStorefrontService } from "./public-storefront.service";

@Module({
  controllers: [PublicStorefrontController],
  providers: [PublicStorefrontService],
})
export class PublicStorefrontModule {}
