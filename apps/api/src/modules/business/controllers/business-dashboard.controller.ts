import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";

import { RequirePermissions } from "../../auth/decorators/require-permissions.decorator";
import { BusinessDashboardService } from "../services/business-dashboard.service";

@ApiTags("business-dashboard")
@Controller("business/dashboard")
export class BusinessDashboardController {
  constructor(private readonly dashboardService: BusinessDashboardService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.BUSINESS_DASHBOARD_READ)
  @ApiOperation({ summary: "İşletmenin gerçek özet metriklerini döner" })
  get() {
    return this.dashboardService.getDashboard();
  }
}
