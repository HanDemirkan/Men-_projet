import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";

import { RequirePermissions } from "../../auth/decorators/require-permissions.decorator";
import { AdminDashboardService } from "../services/admin-dashboard.service";

@ApiTags("admin-dashboard")
@Controller("admin/dashboard")
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ADMIN_DASHBOARD_READ)
  @ApiOperation({ summary: "Platform genelinde gerçek özet metrikleri döner" })
  get() {
    return this.dashboardService.getDashboard();
  }
}
