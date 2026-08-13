import { Injectable } from "@nestjs/common";
import { Prisma, tenantScopedPrisma } from "@qr-platform/database";
import type { Branch } from "@qr-platform/database";

import type { ListBranchesQueryDto } from "../dto/list-branches-query.dto";

export type BranchWithUserCount = Branch & { _count: { tenantUsers: number } };

const USER_COUNT_INCLUDE = { _count: { select: { tenantUsers: true } } } satisfies Prisma.BranchInclude;

// Uses tenantScopedPrisma throughout (Branch is in TENANT_SCOPED_MODELS) -
// tenant isolation is enforced structurally by the Prisma extension itself,
// not by any `where: { tenantId }` written here. Branch-level scoping (for
// BRANCH_MANAGER, who may only see their own branch) is layered on top by
// BusinessBranchesService, since no Prisma-extension-level enforcement
// exists for that narrower scope.
@Injectable()
export class BusinessBranchesRepository {
  async findMany(
    query: ListBranchesQueryDto,
    restrictToBranchId?: string,
  ): Promise<{ branches: BranchWithUserCount[]; total: number }> {
    const where: Prisma.BranchWhereInput = {
      ...(restrictToBranchId ? { id: restrictToBranchId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.q ? { name: { contains: query.q, mode: "insensitive" } } : {}),
    };

    const [branches, total] = await Promise.all([
      tenantScopedPrisma.branch.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { [query.sortBy]: query.sortDir },
        include: USER_COUNT_INCLUDE,
      }),
      tenantScopedPrisma.branch.count({ where }),
    ]);

    return { branches, total };
  }

  async findById(id: string): Promise<BranchWithUserCount | null> {
    return tenantScopedPrisma.branch.findUnique({ where: { id }, include: USER_COUNT_INCLUDE });
  }

  async create(data: Prisma.BranchUncheckedCreateInput): Promise<Branch> {
    return tenantScopedPrisma.branch.create({ data });
  }

  async update(id: string, data: Prisma.BranchUpdateInput): Promise<Branch> {
    return tenantScopedPrisma.branch.update({ where: { id }, data });
  }

  async countActive(): Promise<number> {
    return tenantScopedPrisma.branch.count({ where: { status: "ACTIVE" } });
  }

  async countAll(): Promise<number> {
    return tenantScopedPrisma.branch.count();
  }
}
