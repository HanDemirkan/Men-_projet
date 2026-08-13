import { Injectable } from "@nestjs/common";
import { prisma } from "@qr-platform/database";

import { HealthService } from "../../health/health.service";
import type { ListAuditLogsQueryDto } from "../dto/list-audit-logs-query.dto";
import { AdminAuditRepository } from "../repositories/admin-audit.repository";
import type { AdminDashboard } from "../types/admin-dashboard.types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const RECENT_AUDIT_LOG_LIMIT = 10;

// Every number here is a real aggregate query against the real database -
// no mock/fixture data. Kept as plain `prisma` counts rather than routing
// through AdminTenantsRepository/AdminUsersRepository, since a dashboard
// summary's needs (simple counts, no filtering/pagination/sorting) don't
// share enough with those repositories' list-query concerns to justify it.
@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly healthService: HealthService,
    private readonly auditRepository: AdminAuditRepository,
  ) {}

  async getDashboard(): Promise<AdminDashboard> {
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);

    const [
      totalTenants,
      activeTenants,
      inactiveTenants,
      totalUsers,
      totalBranches,
      totalMenus,
      totalProducts,
      newTenantsLast7Days,
      loginsLast7Days,
      systemHealth,
      recentAudit,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: "ACTIVE" } }),
      prisma.tenant.count({ where: { status: "SUSPENDED" } }),
      prisma.user.count(),
      prisma.branch.count(),
      prisma.menu.count(),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.tenant.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.auditLog.count({ where: { action: "auth.login", createdAt: { gte: sevenDaysAgo } } }),
      this.healthService.check(),
      this.auditRepository.findMany({ page: 1, pageSize: RECENT_AUDIT_LOG_LIMIT } as ListAuditLogsQueryDto),
    ]);

    return {
      totalTenants,
      activeTenants,
      inactiveTenants,
      totalUsers,
      totalBranches,
      totalMenus,
      totalProducts,
      newTenantsLast7Days,
      loginsLast7Days,
      systemHealth,
      recentAuditLogs: recentAudit.logs,
    };
  }
}
