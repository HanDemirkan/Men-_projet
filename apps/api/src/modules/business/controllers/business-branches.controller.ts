import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";

import type { RequestWithId } from "../../../common/types/request-context.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../../auth/decorators/require-permissions.decorator";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user.types";
import { CreateBranchDto } from "../dto/create-branch.dto";
import { ListBranchesQueryDto } from "../dto/list-branches-query.dto";
import { UpdateBranchDto } from "../dto/update-branch.dto";
import { BusinessBranchesService } from "../services/business-branches.service";

function toMeta(request: RequestWithId): { requestId: string; ip?: string; userAgent?: string } {
  return { requestId: request.requestId, ip: request.ip, userAgent: request.headers["user-agent"] };
}

@ApiTags("business-branches")
@Controller("business/branches")
export class BusinessBranchesController {
  constructor(private readonly branchesService: BusinessBranchesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.BRANCH_READ)
  @ApiOperation({ summary: "Şubeleri listeler (BRANCH_MANAGER yalnızca kendi şubesini görür)" })
  list(@Query() query: ListBranchesQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.branchesService.list(query, user);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.BRANCH_CREATE)
  @ApiOperation({ summary: "Yeni şube oluşturur (yalnızca TENANT_OWNER)" })
  create(@Body() dto: CreateBranchDto, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithId) {
    return this.branchesService.create(dto, user, toMeta(request));
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.BRANCH_READ)
  @ApiOperation({ summary: "Şube detayını döner" })
  get(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.branchesService.get(id, user);
  }

  @Patch(":id")
  @RequirePermissions(PERMISSIONS.BRANCH_UPDATE)
  @ApiOperation({ summary: "Şubeyi günceller (ör. aktif/pasif yap)" })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithId,
  ) {
    return this.branchesService.update(id, dto, user, toMeta(request));
  }
}
