import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";

import type { RequestWithId } from "../../../common/types/request-context.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../../auth/decorators/require-permissions.decorator";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user.types";
import { CreateTenantDto } from "../dto/create-tenant.dto";
import { ListAuditLogsQueryDto } from "../dto/list-audit-logs-query.dto";
import { ListTenantsQueryDto } from "../dto/list-tenants-query.dto";
import { UpdateTenantDto } from "../dto/update-tenant.dto";
import { AdminTenantsService } from "../services/admin-tenants.service";

@ApiTags("admin-tenants")
@Controller("admin/tenants")
export class AdminTenantsController {
  constructor(private readonly tenantsService: AdminTenantsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ADMIN_TENANT_READ)
  @ApiOperation({ summary: "Tüm işletmeleri arama/filtre/sayfalama ile listeler" })
  list(@Query() query: ListTenantsQueryDto) {
    return this.tenantsService.list(query);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ADMIN_TENANT_CREATE)
  @ApiOperation({ summary: "Yeni işletme + ilk şube + sahip kullanıcıyı tek işlemde oluşturur" })
  create(@Body() dto: CreateTenantDto, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithId) {
    return this.tenantsService.create(dto, user, {
      requestId: request.requestId,
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    });
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.ADMIN_TENANT_READ)
  @ApiOperation({ summary: "Bir işletmenin detayını (sayaçlar + sahip) döner" })
  get(@Param("id") id: string) {
    return this.tenantsService.get(id);
  }

  @Patch(":id")
  @RequirePermissions(PERMISSIONS.ADMIN_TENANT_UPDATE)
  @ApiOperation({ summary: "İşletmeyi günceller (ör. aktif/pasif yap)" })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithId,
  ) {
    return this.tenantsService.update(id, dto, user, {
      requestId: request.requestId,
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    });
  }

  @Get(":id/users")
  @RequirePermissions(PERMISSIONS.ADMIN_TENANT_READ)
  @ApiOperation({ summary: "İşletmenin kullanıcı üyeliklerini listeler" })
  listUsers(@Param("id") id: string) {
    return this.tenantsService.listUsers(id);
  }

  @Get(":id/branches")
  @RequirePermissions(PERMISSIONS.ADMIN_TENANT_READ)
  @ApiOperation({ summary: "İşletmenin şubelerini listeler" })
  listBranches(@Param("id") id: string) {
    return this.tenantsService.listBranches(id);
  }

  @Get(":id/activity")
  @RequirePermissions(PERMISSIONS.ADMIN_TENANT_READ)
  @ApiOperation({ summary: "İşletmeye ait audit kayıtlarını listeler" })
  listActivity(@Param("id") id: string, @Query() query: ListAuditLogsQueryDto) {
    return this.tenantsService.listActivity(id, query);
  }
}
