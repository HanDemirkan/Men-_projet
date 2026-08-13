import type { HealthStatus } from "@qr-platform/shared";

import type { AuditLogWithActor } from "../repositories/admin-audit.repository";

export interface AdminDashboard {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  totalUsers: number;
  totalBranches: number;
  totalMenus: number;
  totalProducts: number;
  newTenantsLast7Days: number;
  loginsLast7Days: number;
  systemHealth: HealthStatus;
  recentAuditLogs: AuditLogWithActor[];
}
