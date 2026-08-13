import { Injectable } from "@nestjs/common";
import { prisma, tenantScopedPrisma } from "@qr-platform/database";

import { requireTenantId } from "../../../common/tenant/require-tenant-id";
import type { BusinessAuditLogEntry, BusinessDashboard } from "../types/business-dashboard.types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const RECENT_ACTIVITY_LIMIT = 10;

// Every field is a real query against the real database, scoped to the
// caller's own tenant - see the sprint's explicit "Gerçek veri bulunmayan
// metrik için sahte sayı gösterme" requirement. qrViewCount/viewsLast7Days
// come from StorefrontView, a real (if deliberately minimal) tracking table
// added specifically so these two numbers wouldn't have to be faked or
// omitted - see PublicStorefrontService and QrService.
@Injectable()
export class BusinessDashboardService {
  async getDashboard(): Promise<BusinessDashboard> {
    const tenantId = requireTenantId();
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);

    const [
      totalBranches,
      totalUsers,
      activeMenus,
      totalCategories,
      totalProducts,
      publishedProducts,
      inactiveProducts,
      qrViewCount,
      viewsLast7Days,
      tenant,
      recentActivity,
    ] = await Promise.all([
      tenantScopedPrisma.branch.count(),
      tenantScopedPrisma.tenantUser.count(),
      tenantScopedPrisma.menu.count({ where: { status: "PUBLISHED" } }),
      tenantScopedPrisma.category.count(),
      tenantScopedPrisma.product.count({ where: { deletedAt: null } }),
      tenantScopedPrisma.product.count({ where: { deletedAt: null, isAvailable: true } }),
      tenantScopedPrisma.product.count({ where: { deletedAt: null, isAvailable: false } }),
      prisma.storefrontView.count({ where: { tenantId, source: "qr" } }),
      prisma.storefrontView.count({ where: { tenantId, createdAt: { gte: sevenDaysAgo } } }),
      prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
      prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: RECENT_ACTIVITY_LIMIT,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
    ]);

    return {
      totalBranches,
      totalUsers,
      activeMenus,
      totalCategories,
      totalProducts,
      publishedProducts,
      inactiveProducts,
      qrViewCount,
      viewsLast7Days,
      profileCompletionPercent: this.computeProfileCompletion(tenant),
      recentActivity: recentActivity as BusinessAuditLogEntry[],
    };
  }

  private computeProfileCompletion(tenant: {
    logoImageId: string | null;
    coverImageId: string | null;
    about: string | null;
    phone: string | null;
    address: string | null;
    workingHours: unknown;
    email: string | null;
    whatsapp: string | null;
    instagram: string | null;
    facebook: string | null;
    website: string | null;
  }): number {
    const checks = [
      Boolean(tenant.logoImageId),
      Boolean(tenant.coverImageId),
      Boolean(tenant.about),
      Boolean(tenant.phone),
      Boolean(tenant.address),
      Boolean(tenant.workingHours),
      Boolean(tenant.email || tenant.whatsapp),
      Boolean(tenant.instagram || tenant.facebook || tenant.website),
    ];

    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }
}
