import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { HealthModule } from "../health/health.module";

import { AdminAuditController } from "./controllers/admin-audit.controller";
import { AdminDashboardController } from "./controllers/admin-dashboard.controller";
import { AdminSystemController } from "./controllers/admin-system.controller";
import { AdminTenantsController } from "./controllers/admin-tenants.controller";
import { AdminUsersController } from "./controllers/admin-users.controller";
import { AdminAuditRepository } from "./repositories/admin-audit.repository";
import { AdminTenantsRepository } from "./repositories/admin-tenants.repository";
import { AdminUsersRepository } from "./repositories/admin-users.repository";
import { AdminAuditService } from "./services/admin-audit.service";
import { AdminDashboardService } from "./services/admin-dashboard.service";
import { AdminSystemService } from "./services/admin-system.service";
import { AdminTenantsService } from "./services/admin-tenants.service";
import { AdminUsersService } from "./services/admin-users.service";

// Sprint 4: SUPER_ADMIN-only platform management (tenants/users/audit/
// system/dashboard). Deliberately not one giant admin.service.ts - each
// resource gets its own controller + service (+ repository where list
// queries are non-trivial), matching the rest of the API's module
// conventions (see e.g. modules/product/).
@Module({
  imports: [AuditModule, AuthModule, HealthModule],
  controllers: [
    AdminDashboardController,
    AdminTenantsController,
    AdminUsersController,
    AdminAuditController,
    AdminSystemController,
  ],
  providers: [
    AdminDashboardService,
    AdminTenantsService,
    AdminUsersService,
    AdminAuditService,
    AdminSystemService,
    AdminTenantsRepository,
    AdminUsersRepository,
    AdminAuditRepository,
  ],
})
export class AdminModule {}
