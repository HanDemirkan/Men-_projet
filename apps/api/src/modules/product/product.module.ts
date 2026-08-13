import { Module } from "@nestjs/common";

import { OptionGroupController } from "./option-group.controller";
import { OptionGroupService } from "./option-group.service";
import { OptionController } from "./option.controller";
import { OptionService } from "./option.service";
import { ProductController } from "./product.controller";
import { ProductService } from "./product.service";
import { VariantController } from "./variant.controller";
import { VariantService } from "./variant.service";

@Module({
  controllers: [ProductController, VariantController, OptionGroupController, OptionController],
  providers: [ProductService, VariantService, OptionGroupService, OptionService],
})
export class ProductModule {}
