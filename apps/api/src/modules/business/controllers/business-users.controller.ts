import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";

import type { RequestWithId } from "../../../common/types/request-context.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../../auth/decorators/require-permissions.decorator";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user.types";
import { CreateUserDto } from "../dto/create-user.dto";
import { ListUsersQueryDto } from "../dto/list-users-query.dto";
import { RevokeSessionsDto } from "../dto/revoke-sessions.dto";
import { SetUserPasswordDto } from "../dto/set-user-password.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { BusinessUsersService } from "../services/business-users.service";

function toMeta(request: RequestWithId): { requestId: string; ip?: string; userAgent?: string } {
  return { requestId: request.requestId, ip: request.ip, userAgent: request.headers["user-agent"] };
}

@ApiTags("business-users")
@Controller("business/users")
export class BusinessUsersController {
  constructor(private readonly usersService: BusinessUsersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.USER_READ)
  @ApiOperation({ summary: "İşletme kullanıcılarını listeler (BRANCH_MANAGER yalnızca kendi şubesini görür)" })
  list(@Query() query: ListUsersQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.list(query, user);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.USER_CREATE)
  @ApiOperation({ summary: "Yeni personel oluşturur veya mevcut kullanıcıya üyelik ekler" })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithId) {
    return this.usersService.create(dto, user, toMeta(request));
  }

  @Get(":membershipId")
  @RequirePermissions(PERMISSIONS.USER_READ)
  @ApiOperation({ summary: "Kullanıcı detayı: rol, şube, oturumlar, aktivite" })
  get(@Param("membershipId") membershipId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.get(membershipId, user);
  }

  @Patch(":membershipId")
  @RequirePermissions(PERMISSIONS.USER_UPDATE)
  @ApiOperation({ summary: "Rol/şube/durum günceller" })
  update(
    @Param("membershipId") membershipId: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithId,
  ) {
    return this.usersService.update(membershipId, dto, user, toMeta(request));
  }

  @Post(":membershipId/revoke-sessions")
  @RequirePermissions(PERMISSIONS.USER_SESSION_REVOKE)
  @ApiOperation({ summary: "Kullanıcının bir veya tüm oturumlarını sonlandırır" })
  revokeSessions(
    @Param("membershipId") membershipId: string,
    @Body() dto: RevokeSessionsDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithId,
  ) {
    return this.usersService.revokeSessions(membershipId, dto, user, toMeta(request));
  }

  @Post(":membershipId/reset-password")
  @RequirePermissions(PERMISSIONS.USER_PASSWORD_RESET)
  @ApiOperation({ summary: "Kullanıcı için yeni geçici şifre belirler ve mevcut oturumları sonlandırır" })
  resetPassword(
    @Param("membershipId") membershipId: string,
    @Body() dto: SetUserPasswordDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithId,
  ) {
    return this.usersService.setPassword(membershipId, dto, user, toMeta(request));
  }
}
