import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";

import { BusinessActivityController } from "./controllers/business-activity.controller";
import { BusinessBranchesController } from "./controllers/business-branches.controller";
import { BusinessDashboardController } from "./controllers/business-dashboard.controller";
import { BusinessSettingsController } from "./controllers/business-settings.controller";
import { BusinessUsersController } from "./controllers/business-users.controller";
import { BusinessBranchesRepository } from "./repositories/business-branches.repository";
import { BusinessUsersRepository } from "./repositories/business-users.repository";
import { BusinessActivityService } from "./services/business-activity.service";
import { BusinessBranchesService } from "./services/business-branches.service";
import { BusinessDashboardService } from "./services/business-dashboard.service";
import { BusinessSettingsService } from "./services/business-settings.service";
import { BusinessUsersService } from "./services/business-users.service";

// Sprint 5: TENANT_OWNER/BRANCH_MANAGER business management (dashboard/
// branches/users/activity/settings). Tenant-owned data flows through
// tenantScopedPrisma wherever the model is in TENANT_SCOPED_MODELS (Branch,
// TenantUser); branch-level scoping for BRANCH_MANAGER (which has no
// Prisma-extension-level enforcement) is applied explicitly in each service.
@Module({
  imports: [AuditModule, AuthModule],
  controllers: [
    BusinessDashboardController,
    BusinessBranchesController,
    BusinessUsersController,
    BusinessActivityController,
    BusinessSettingsController,
  ],
  providers: [
    BusinessDashboardService,
    BusinessBranchesService,
    BusinessUsersService,
    BusinessActivityService,
    BusinessSettingsService,
    BusinessBranchesRepository,
    BusinessUsersRepository,
  ],
})
export class BusinessModule {}
