import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";

import { RequirePermissions } from "../../auth/decorators/require-permissions.decorator";
import { AdminSystemService } from "../services/admin-system.service";

@ApiTags("admin-system")
@Controller("admin/system")
export class AdminSystemController {
  constructor(private readonly systemService: AdminSystemService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ADMIN_SYSTEM_READ)
  @ApiOperation({ summary: "API/DB/Redis/Worker durumu, environment, uptime, versiyon, storage, son migration" })
  get() {
    return this.systemService.get();
  }
}
