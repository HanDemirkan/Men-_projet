import { Injectable } from "@nestjs/common";
import { Prisma, tenantScopedPrisma } from "@qr-platform/database";
import type { TenantUser, User } from "@qr-platform/database";
import { ROLES } from "@qr-platform/permissions";

import type { ListUsersQueryDto } from "../dto/list-users-query.dto";

export type MembershipWithRelations = TenantUser & {
  user: User;
  role: { code: string; name: string };
  branch: { id: string; name: string } | null;
};

const MEMBERSHIP_INCLUDE = {
  user: true,
  role: { select: { code: true, name: true } },
  branch: { select: { id: true, name: true } },
} satisfies Prisma.TenantUserInclude;

const SORT_FIELD_MAP: Record<string, string> = {
  name: "user.firstName",
  email: "user.email",
  lastLoginAt: "user.lastLoginAt",
  createdAt: "createdAt",
};

// Uses tenantScopedPrisma throughout (TenantUser is in TENANT_SCOPED_MODELS)
// - tenant isolation is structural. Branch-level scoping for BRANCH_MANAGER
// is applied by BusinessUsersService passing `restrictToBranchId`, same
// pattern as BusinessBranchesRepository.
@Injectable()
export class BusinessUsersRepository {
  async findMany(
    query: ListUsersQueryDto,
    restrictToBranchId?: string,
  ): Promise<{ memberships: MembershipWithRelations[]; total: number }> {
    const where: Prisma.TenantUserWhereInput = {
      ...(restrictToBranchId ? { branchId: restrictToBranchId } : {}),
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.role ? { role: { code: query.role } } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            user: {
              OR: [
                { firstName: { contains: query.q, mode: "insensitive" } },
                { lastName: { contains: query.q, mode: "insensitive" } },
                { email: { contains: query.q, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    };

    // "name"/"email"/"lastLoginAt" sort by a related User field - Prisma
    // needs a nested orderBy object for that, not a flat key.
    const sortField = SORT_FIELD_MAP[query.sortBy] ?? "createdAt";
    const orderBy = sortField.startsWith("user.")
      ? { user: { [sortField.slice(5)]: query.sortDir } }
      : { [sortField]: query.sortDir };

    const [memberships, total] = await Promise.all([
      tenantScopedPrisma.tenantUser.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy,
        include: MEMBERSHIP_INCLUDE,
      }),
      tenantScopedPrisma.tenantUser.count({ where }),
    ]);

    return { memberships, total };
  }

  async findById(membershipId: string): Promise<MembershipWithRelations | null> {
    return tenantScopedPrisma.tenantUser.findUnique({ where: { id: membershipId }, include: MEMBERSHIP_INCLUDE });
  }

  async update(membershipId: string, data: Prisma.TenantUserUpdateInput): Promise<TenantUser> {
    return tenantScopedPrisma.tenantUser.update({ where: { id: membershipId }, data });
  }

  async countActiveOwners(): Promise<number> {
    return tenantScopedPrisma.tenantUser.count({
      where: { role: { code: ROLES.TENANT_OWNER }, status: "ACTIVE", user: { status: "ACTIVE" } },
    });
  }
}
