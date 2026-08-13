import { Injectable } from "@nestjs/common";
import { Prisma, prisma } from "@qr-platform/database";
import type { Branch, Tenant, TenantUser, User } from "@qr-platform/database";
import { ROLES } from "@qr-platform/permissions";

import type { ListTenantsQueryDto } from "../dto/list-tenants-query.dto";

export interface TenantCounts {
  branches: number;
  tenantUsers: number;
  menus: number;
  products: number;
}

export type TenantWithCounts = Tenant & { _count: TenantCounts };
export type TenantUserWithRelations = TenantUser & { user: User; role: { code: string; name: string }; branch: Branch | null };

const TENANT_COUNTS_INCLUDE = {
  _count: { select: { branches: true, tenantUsers: true, menus: true, products: true } },
} satisfies Prisma.TenantInclude;

// Read-side query building for the admin tenants area, kept separate from
// AdminTenantsService so the service can stay focused on orchestration/
// business rules (the multi-step create transaction, status-change audit
// logging) rather than Prisma `where`/`include` construction.
@Injectable()
export class AdminTenantsRepository {
  async findMany(query: ListTenantsQueryDto): Promise<{ tenants: TenantWithCounts[]; total: number }> {
    const where: Prisma.TenantWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" } },
              { slug: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { [query.sortBy]: query.sortDir },
        include: TENANT_COUNTS_INCLUDE,
      }),
      prisma.tenant.count({ where }),
    ]);

    return { tenants, total };
  }

  async findById(id: string): Promise<TenantWithCounts | null> {
    return prisma.tenant.findUnique({ where: { id }, include: TENANT_COUNTS_INCLUDE });
  }

  // The original owner, if one still exists - a tenant could in principle
  // have its owner's membership removed later, so this is a "best effort"
  // lookup, not a guaranteed relation.
  async findOwner(tenantId: string): Promise<(TenantUser & { user: User }) | null> {
    return prisma.tenantUser.findFirst({
      where: { tenantId, role: { code: ROLES.TENANT_OWNER } },
      orderBy: { createdAt: "asc" },
      include: { user: true },
    });
  }

  async findBranches(tenantId: string): Promise<Branch[]> {
    return prisma.branch.findMany({ where: { tenantId }, orderBy: { createdAt: "asc" } });
  }

  async findUsers(tenantId: string): Promise<TenantUserWithRelations[]> {
    return prisma.tenantUser.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
      include: { user: true, role: { select: { code: true, name: true } }, branch: true },
    });
  }

  async update(id: string, data: Prisma.TenantUpdateInput): Promise<Tenant> {
    return prisma.tenant.update({ where: { id }, data });
  }
}
