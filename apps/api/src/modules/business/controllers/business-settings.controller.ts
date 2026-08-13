import { Body, Controller, Get, Patch, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";

import type { RequestWithId } from "../../../common/types/request-context.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../../auth/decorators/require-permissions.decorator";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user.types";
import { UpdateSettingsDto } from "../dto/update-settings.dto";
import { BusinessSettingsService } from "../services/business-settings.service";

@ApiTags("business-settings")
@Controller("business/settings")
export class BusinessSettingsController {
  constructor(private readonly settingsService: BusinessSettingsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.BUSINESS_SETTINGS_READ)
  @ApiOperation({ summary: "İşletme ayarlarını döner (dil/para birimi/saat dilimi/QR varsayılanları)" })
  get() {
    return this.settingsService.get();
  }

  @Patch()
  @RequirePermissions(PERMISSIONS.BUSINESS_SETTINGS_UPDATE)
  @ApiOperation({ summary: "İşletme ayarlarını günceller (yalnızca TENANT_OWNER)" })
  update(@Body() dto: UpdateSettingsDto, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithId) {
    return this.settingsService.update(dto, user, {
      requestId: request.requestId,
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    });
  }
}
