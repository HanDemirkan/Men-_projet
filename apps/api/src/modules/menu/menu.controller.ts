import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";

import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";

import { CreateMenuDto } from "./dto/create-menu.dto";
import { UpdateMenuDto } from "./dto/update-menu.dto";
import { MenuService } from "./menu.service";

@ApiTags("menus")
@Controller("menus")
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.MENU_WRITE)
  @ApiOperation({ summary: "Yeni menü oluşturur" })
  create(@Body() dto: CreateMenuDto) {
    return this.menuService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MENU_READ)
  @ApiOperation({ summary: "Tenant'ın menülerini listeler" })
  list() {
    return this.menuService.list();
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.MENU_READ)
  @ApiOperation({ summary: "Tek bir menüyü döner" })
  get(@Param("id") id: string) {
    return this.menuService.get(id);
  }

  @Patch(":id")
  @RequirePermissions(PERMISSIONS.MENU_WRITE)
  @ApiOperation({ summary: "Menüyü günceller" })
  update(@Param("id") id: string, @Body() dto: UpdateMenuDto) {
    return this.menuService.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.MENU_WRITE)
  @ApiOperation({ summary: "Menüyü siler" })
  async remove(@Param("id") id: string): Promise<{ deleted: true }> {
    await this.menuService.remove(id);
    return { deleted: true };
  }
}
