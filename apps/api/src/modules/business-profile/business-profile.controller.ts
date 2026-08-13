import { Body, Controller, ForbiddenException, Get, Patch } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";

import { CurrentTenant } from "../auth/decorators/current-tenant.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";

import { BusinessProfileService } from "./business-profile.service";
import { UpdateBusinessProfileDto } from "./dto/update-business-profile.dto";

// Sprint 5: moved from `business-profile` to `business/profile` so the whole
// business panel API lives under one `/business/*` namespace alongside
// dashboard/branches/users/activity/settings - see BusinessModule.
@ApiTags("business-profile")
@Controller("business/profile")
export class BusinessProfileController {
  constructor(private readonly businessProfileService: BusinessProfileService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.TENANT_READ)
  @ApiOperation({ summary: "İşletme profilini döner" })
  get(@CurrentTenant() tenantId: string | null) {
    if (!tenantId) {
      throw new ForbiddenException("Bu işlem için bir işletmeye bağlı olmanız gerekir.");
    }

    return this.businessProfileService.get(tenantId);
  }

  @Patch()
  @RequirePermissions(PERMISSIONS.TENANT_UPDATE)
  @ApiOperation({ summary: "İşletme profilini günceller" })
  update(@CurrentTenant() tenantId: string | null, @Body() dto: UpdateBusinessProfileDto) {
    if (!tenantId) {
      throw new ForbiddenException("Bu işlem için bir işletmeye bağlı olmanız gerekir.");
    }

    return this.businessProfileService.update(tenantId, dto);
  }
}
