import { Injectable } from "@nestjs/common";
import { Prisma, prisma } from "@qr-platform/database";
import type { TenantUser, User } from "@qr-platform/database";
import { ROLES } from "@qr-platform/permissions";

import type { ListUsersQueryDto, UserSortField } from "../dto/list-users-query.dto";

export type TenantUserMembership = TenantUser & {
  tenant: { id: string; name: string; slug: string } | null;
  role: { code: string; name: string };
  branch: { id: string; name: string } | null;
};

export type UserWithMemberships = User & { tenantUsers: TenantUserMembership[] };

const MEMBERSHIP_INCLUDE = {
  tenant: { select: { id: true, name: true, slug: true } },
  role: { select: { code: true, name: true } },
  branch: { select: { id: true, name: true } },
} satisfies Prisma.TenantUserInclude;

const SORT_FIELD_MAP: Record<UserSortField, keyof Prisma.UserOrderByWithRelationInput> = {
  name: "firstName",
  email: "email",
  lastLoginAt: "lastLoginAt",
  createdAt: "createdAt",
};

@Injectable()
export class AdminUsersRepository {
  async findMany(query: ListUsersQueryDto): Promise<{ users: UserWithMemberships[]; total: number }> {
    const where: Prisma.UserWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { firstName: { contains: query.q, mode: "insensitive" } },
              { lastName: { contains: query.q, mode: "insensitive" } },
              { email: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(query.role || query.tenantId
        ? {
            tenantUsers: {
              some: {
                ...(query.role ? { role: { code: query.role } } : {}),
                ...(query.tenantId ? { tenantId: query.tenantId } : {}),
              },
            },
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { [SORT_FIELD_MAP[query.sortBy]]: query.sortDir },
        include: { tenantUsers: { include: MEMBERSHIP_INCLUDE } },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async findById(id: string): Promise<UserWithMemberships | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { tenantUsers: { include: MEMBERSHIP_INCLUDE } },
    });
  }

  async updateStatus(id: string, status: User["status"]): Promise<User> {
    return prisma.user.update({ where: { id }, data: { status } });
  }

  // Used by the "can't deactivate the last SUPER_ADMIN" policy check -
  // counts platform-level (tenantId null) SUPER_ADMIN memberships whose
  // user is still ACTIVE.
  async countActiveSuperAdmins(): Promise<number> {
    return prisma.tenantUser.count({
      where: { tenantId: null, role: { code: ROLES.SUPER_ADMIN }, user: { status: "ACTIVE" } },
    });
  }
}
