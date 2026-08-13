import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";

import { ReorderDto } from "../../common/dto/reorder.dto";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";

import { CreateOptionGroupDto } from "./dto/create-option-group.dto";
import { UpdateOptionGroupDto } from "./dto/update-option-group.dto";
import { OptionGroupService } from "./option-group.service";

@ApiTags("option-groups")
@Controller()
export class OptionGroupController {
  constructor(private readonly optionGroupService: OptionGroupService) {}

  @Post("products/:productId/option-groups")
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  @ApiOperation({ summary: "Ürüne yeni seçenek grubu ekler (örn. Ekstralar, Soslar)" })
  create(@Param("productId") productId: string, @Body() dto: CreateOptionGroupDto) {
    return this.optionGroupService.create(productId, dto);
  }

  @Get("products/:productId/option-groups")
  @RequirePermissions(PERMISSIONS.PRODUCT_READ)
  @ApiOperation({ summary: "Bir ürünün seçenek gruplarını listeler" })
  listByProduct(@Param("productId") productId: string) {
    return this.optionGroupService.listByProduct(productId);
  }

  // Must be registered before `PATCH /option-groups/:id`.
  @Patch("option-groups/reorder")
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  @ApiOperation({ summary: "Seçenek grubu sıralamasını günceller" })
  async reorder(@Body() dto: ReorderDto): Promise<{ reordered: true }> {
    await this.optionGroupService.reorder(dto);
    return { reordered: true };
  }

  @Patch("option-groups/:id")
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  @ApiOperation({ summary: "Seçenek grubunu günceller" })
  update(@Param("id") id: string, @Body() dto: UpdateOptionGroupDto) {
    return this.optionGroupService.update(id, dto);
  }

  @Delete("option-groups/:id")
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  @ApiOperation({ summary: "Seçenek grubunu siler" })
  async remove(@Param("id") id: string): Promise<{ deleted: true }> {
    await this.optionGroupService.remove(id);
    return { deleted: true };
  }
}
