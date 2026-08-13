import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";

import { ReorderDto } from "../../common/dto/reorder.dto";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";

import { CategoryService } from "./category.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@ApiTags("categories")
@Controller()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post("menus/:menuId/categories")
  @RequirePermissions(PERMISSIONS.CATEGORY_WRITE)
  @ApiOperation({ summary: "Menüye yeni kategori ekler" })
  create(@Param("menuId") menuId: string, @Body() dto: CreateCategoryDto) {
    return this.categoryService.create(menuId, dto);
  }

  @Get("menus/:menuId/categories")
  @RequirePermissions(PERMISSIONS.CATEGORY_READ)
  @ApiOperation({ summary: "Bir menünün kategorilerini listeler" })
  listByMenu(@Param("menuId") menuId: string) {
    return this.categoryService.listByMenu(menuId);
  }

  @Get("categories")
  @RequirePermissions(PERMISSIONS.CATEGORY_READ)
  @ApiOperation({ summary: "İşletmenin tüm kategorilerini (menü adıyla birlikte) listeler" })
  listAll() {
    return this.categoryService.listAllWithMenuName();
  }

  // Must be registered before `GET/PATCH /categories/:id` - Nest matches
  // routes in declaration order, and "reorder" would otherwise be consumed
  // by the `:id` param.
  @Patch("categories/reorder")
  @RequirePermissions(PERMISSIONS.CATEGORY_WRITE)
  @ApiOperation({ summary: "Kategori sıralamasını günceller" })
  async reorder(@Body() dto: ReorderDto): Promise<{ reordered: true }> {
    await this.categoryService.reorder(dto);
    return { reordered: true };
  }

  @Get("categories/:id")
  @RequirePermissions(PERMISSIONS.CATEGORY_READ)
  @ApiOperation({ summary: "Tek bir kategoriyi döner" })
  get(@Param("id") id: string) {
    return this.categoryService.get(id);
  }

  @Patch("categories/:id")
  @RequirePermissions(PERMISSIONS.CATEGORY_WRITE)
  @ApiOperation({ summary: "Kategoriyi günceller" })
  update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @Delete("categories/:id")
  @RequirePermissions(PERMISSIONS.CATEGORY_WRITE)
  @ApiOperation({ summary: "Kategoriyi siler" })
  async remove(@Param("id") id: string): Promise<{ deleted: true }> {
    await this.categoryService.remove(id);
    return { deleted: true };
  }
}
