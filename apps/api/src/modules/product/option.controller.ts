import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";

import { ReorderDto } from "../../common/dto/reorder.dto";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";

import { CreateOptionDto } from "./dto/create-option.dto";
import { UpdateOptionDto } from "./dto/update-option.dto";
import { OptionService } from "./option.service";

@ApiTags("options")
@Controller()
export class OptionController {
  constructor(private readonly optionService: OptionService) {}

  @Post("option-groups/:optionGroupId/options")
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  @ApiOperation({ summary: "Seçenek grubuna yeni seçenek ekler (örn. Ekstra Peynir)" })
  create(@Param("optionGroupId") optionGroupId: string, @Body() dto: CreateOptionDto) {
    return this.optionService.create(optionGroupId, dto);
  }

  @Get("option-groups/:optionGroupId/options")
  @RequirePermissions(PERMISSIONS.PRODUCT_READ)
  @ApiOperation({ summary: "Bir seçenek grubunun seçeneklerini listeler" })
  listByOptionGroup(@Param("optionGroupId") optionGroupId: string) {
    return this.optionService.listByOptionGroup(optionGroupId);
  }

  // Must be registered before `PATCH /options/:id`.
  @Patch("options/reorder")
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  @ApiOperation({ summary: "Seçenek sıralamasını günceller" })
  async reorder(@Body() dto: ReorderDto): Promise<{ reordered: true }> {
    await this.optionService.reorder(dto);
    return { reordered: true };
  }

  @Patch("options/:id")
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  @ApiOperation({ summary: "Seçeneği günceller" })
  update(@Param("id") id: string, @Body() dto: UpdateOptionDto) {
    return this.optionService.update(id, dto);
  }

  @Delete("options/:id")
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  @ApiOperation({ summary: "Seçeneği siler" })
  async remove(@Param("id") id: string): Promise<{ deleted: true }> {
    await this.optionService.remove(id);
    return { deleted: true };
  }
}
