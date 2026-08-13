import type { AuditLog } from "@qr-platform/database";

export type BusinessAuditLogEntry = AuditLog & {
  user: { id: string; firstName: string; lastName: string; email: string } | null;
};

export interface BusinessDashboard {
  totalBranches: number;
  totalUsers: number;
  activeMenus: number;
  totalCategories: number;
  totalProducts: number;
  publishedProducts: number;
  inactiveProducts: number;
  qrViewCount: number;
  viewsLast7Days: number;
  profileCompletionPercent: number;
  recentActivity: BusinessAuditLogEntry[];
}
