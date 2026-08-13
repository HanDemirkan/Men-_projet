import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";

import type { RequestWithId } from "../../../common/types/request-context.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../../auth/decorators/require-permissions.decorator";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user.types";
import { ListUsersQueryDto } from "../dto/list-users-query.dto";
import { RevokeSessionsDto } from "../dto/revoke-sessions.dto";
import { UpdateUserStatusDto } from "../dto/update-user-status.dto";
import { AdminUsersService } from "../services/admin-users.service";

@ApiTags("admin-users")
@Controller("admin/users")
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ADMIN_USER_READ)
  @ApiOperation({ summary: "Platformdaki tüm kullanıcıları arama/filtre/sayfalama ile listeler" })
  list(@Query() query: ListUsersQueryDto) {
    return this.usersService.list(query);
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.ADMIN_USER_READ)
  @ApiOperation({ summary: "Kullanıcı detayı: üyelikler, oturumlar, son aktiviteler" })
  get(@Param("id") id: string) {
    return this.usersService.get(id);
  }

  @Patch(":id/status")
  @RequirePermissions(PERMISSIONS.ADMIN_USER_UPDATE)
  @ApiOperation({ summary: "Kullanıcıyı aktif/pasif yapar" })
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithId,
  ) {
    return this.usersService.updateStatus(id, dto, user, {
      requestId: request.requestId,
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    });
  }

  @Post(":id/revoke-sessions")
  @RequirePermissions(PERMISSIONS.ADMIN_SESSION_REVOKE)
  @ApiOperation({ summary: "Kullanıcının bir veya tüm oturumlarını sonlandırır" })
  revokeSessions(
    @Param("id") id: string,
    @Body() dto: RevokeSessionsDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithId,
  ) {
    return this.usersService.revokeSessions(id, dto, user, {
      requestId: request.requestId,
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    });
  }
}
