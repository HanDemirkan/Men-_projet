import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@qr-platform/database";
import { ROLES } from "@qr-platform/permissions";

import { toPaginatedResult } from "../../../common/pagination";
import { requireTenantId } from "../../../common/tenant/require-tenant-id";
import { AuditService } from "../../audit/audit.service";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user.types";
import type { CreateBranchDto } from "../dto/create-branch.dto";
import type { ListBranchesQueryDto } from "../dto/list-branches-query.dto";
import type { UpdateBranchDto } from "../dto/update-branch.dto";
import { assertCanChangeBranchStatus } from "../policies/branch-status.policy";
import { BusinessBranchesRepository } from "../repositories/business-branches.repository";
import type { RequestMetadata } from "../types/request-metadata";

@Injectable()
export class BusinessBranchesService {
  constructor(
    private readonly branchesRepository: BusinessBranchesRepository,
    private readonly auditService: AuditService,
  ) {}

  async list(query: ListBranchesQueryDto, actor: AuthenticatedUser) {
    // BRANCH_MANAGER's "list" is always exactly their own single branch -
    // there is no Prisma-extension-level branch scoping (only tenant), so
    // this restriction is applied here, explicitly, every time.
    const restrictToBranchId = actor.roleCode === ROLES.BRANCH_MANAGER ? (actor.branchId ?? "") : undefined;
    const { branches, total } = await this.branchesRepository.findMany(query, restrictToBranchId);
    return toPaginatedResult(branches, total, query.page, query.pageSize);
  }

  async get(id: string, actor: AuthenticatedUser) {
    this.assertCanAccessBranch(id, actor);

    const branch = await this.branchesRepository.findById(id);
    if (!branch) {
      throw new NotFoundException("Şube bulunamadı.");
    }

    return branch;
  }

  async create(dto: CreateBranchDto, actor: AuthenticatedUser, meta: RequestMetadata) {
    const branch = await this.branchesRepository.create({
      tenantId: requireTenantId(),
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      googleMapsLink: dto.googleMapsLink,
      workingHours: dto.workingHours as Prisma.InputJsonValue | undefined,
    });

    await this.auditService.log({
      tenantId: branch.tenantId,
      userId: actor.userId,
      action: "business.branch.create",
      entity: "Branch",
      entityId: branch.id,
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      newValue: { name: branch.name, status: branch.status },
    });

    return branch;
  }

  async update(id: string, dto: UpdateBranchDto, actor: AuthenticatedUser, meta: RequestMetadata) {
    this.assertCanAccessBranch(id, actor);

    const before = await this.branchesRepository.findById(id);
    if (!before) {
      throw new NotFoundException("Şube bulunamadı.");
    }

    if (dto.status) {
      const activeCount = await this.branchesRepository.countActive();
      const isLastActiveBranch = before.status === "ACTIVE" && activeCount <= 1;
      assertCanChangeBranchStatus({ newStatus: dto.status, isLastActiveBranch });
    }

    const updated = await this.branchesRepository.update(id, {
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      googleMapsLink: dto.googleMapsLink,
      workingHours: dto.workingHours as Prisma.InputJsonValue | undefined,
      status: dto.status,
    });

    await this.auditService.log({
      tenantId: updated.tenantId,
      userId: actor.userId,
      action: "business.branch.update",
      entity: "Branch",
      entityId: id,
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      oldValue: { name: before.name, status: before.status },
      newValue: { name: updated.name, status: updated.status },
    });

    return updated;
  }

  private assertCanAccessBranch(branchId: string, actor: AuthenticatedUser): void {
    if (actor.roleCode === ROLES.BRANCH_MANAGER && actor.branchId !== branchId) {
      throw new ForbiddenException("Yalnızca kendi şubenize erişebilirsiniz.");
    }
  }
}
