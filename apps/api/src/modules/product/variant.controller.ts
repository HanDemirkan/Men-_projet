import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";

import { ReorderDto } from "../../common/dto/reorder.dto";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";

import { CreateVariantDto } from "./dto/create-variant.dto";
import { UpdateVariantDto } from "./dto/update-variant.dto";
import { VariantService } from "./variant.service";

@ApiTags("variants")
@Controller()
export class VariantController {
  constructor(private readonly variantService: VariantService) {}

  @Post("products/:productId/variants")
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  @ApiOperation({ summary: "Ürüne yeni variant ekler (örn. Küçük/Orta/Büyük)" })
  create(@Param("productId") productId: string, @Body() dto: CreateVariantDto) {
    return this.variantService.create(productId, dto);
  }

  @Get("products/:productId/variants")
  @RequirePermissions(PERMISSIONS.PRODUCT_READ)
  @ApiOperation({ summary: "Bir ürünün variant'larını listeler" })
  listByProduct(@Param("productId") productId: string) {
    return this.variantService.listByProduct(productId);
  }

  // Must be registered before `PATCH /variants/:id`.
  @Patch("variants/reorder")
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  @ApiOperation({ summary: "Variant sıralamasını günceller" })
  async reorder(@Body() dto: ReorderDto): Promise<{ reordered: true }> {
    await this.variantService.reorder(dto);
    return { reordered: true };
  }

  @Patch("variants/:id")
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  @ApiOperation({ summary: "Variant'ı günceller" })
  update(@Param("id") id: string, @Body() dto: UpdateVariantDto) {
    return this.variantService.update(id, dto);
  }

  @Delete("variants/:id")
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  @ApiOperation({ summary: "Variant'ı siler" })
  async remove(@Param("id") id: string): Promise<{ deleted: true }> {
    await this.variantService.remove(id);
    return { deleted: true };
  }
}
