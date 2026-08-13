import { HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Prisma, prisma } from "@qr-platform/database";
import { ROLES } from "@qr-platform/permissions";
import * as argon2 from "argon2";

import { AppException } from "../../../common/exceptions/app.exception";
import type { PaginatedResult } from "../../../common/pagination";
import { toPaginatedResult } from "../../../common/pagination";
import { sanitizeUser } from "../../../common/sanitize-user";
import { slugify } from "../../../common/slugify";
import { AuditService } from "../../audit/audit.service";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user.types";
import type { CreateTenantDto } from "../dto/create-tenant.dto";
import type { ListAuditLogsQueryDto } from "../dto/list-audit-logs-query.dto";
import type { ListTenantsQueryDto } from "../dto/list-tenants-query.dto";
import type { UpdateTenantDto } from "../dto/update-tenant.dto";
import { AdminAuditRepository } from "../repositories/admin-audit.repository";
import { AdminTenantsRepository } from "../repositories/admin-tenants.repository";

export interface RequestMetadata {
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AdminTenantsService {
  constructor(
    private readonly tenantsRepository: AdminTenantsRepository,
    private readonly auditRepository: AdminAuditRepository,
    private readonly auditService: AuditService,
  ) {}

  async list(query: ListTenantsQueryDto) {
    const { tenants, total } = await this.tenantsRepository.findMany(query);
    return toPaginatedResult(tenants, total, query.page, query.pageSize);
  }

  async get(id: string) {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException("İşletme bulunamadı.");
    }

    const owner = await this.tenantsRepository.findOwner(id);

    return { ...tenant, owner: owner ? sanitizeUser(owner.user) : null };
  }

  // Single transaction: Tenant -> Branch -> User (find-or-create) ->
  // TenantUser(TENANT_OWNER) -> AuditLog. Any failure at any step rolls back
  // everything - no partial tenant/branch/user/membership is ever left
  // behind (see the sprint's explicit "hata halinde kısmi veri bırakma"
  // requirement).
  async create(dto: CreateTenantDto, actor: AuthenticatedUser, meta: RequestMetadata) {
    return prisma.$transaction(async (tx) => {
      // "Role ve permission ilişkilerini doğrula" - fail loudly (not with a
      // powerless owner account) if the TENANT_OWNER role or its permissions
      // are somehow missing from a seed that should always have run.
      const ownerRole = await tx.role.findFirst({ where: { tenantId: null, code: ROLES.TENANT_OWNER } });
      if (!ownerRole) {
        throw new InternalServerErrorException("TENANT_OWNER rolü bulunamadı - önce seed/bootstrap çalıştırılmalı.");
      }
      const ownerPermissionCount = await tx.rolePermission.count({ where: { roleId: ownerRole.id } });
      if (ownerPermissionCount === 0) {
        throw new InternalServerErrorException("TENANT_OWNER rolünün izin ilişkileri eksik.");
      }

      let tenant;
      try {
        tenant = await tx.tenant.create({
          data: {
            name: dto.name,
            slug: dto.slug ?? slugify(dto.name),
            phone: dto.phone,
            status: dto.status ?? "ACTIVE",
          },
        });
      } catch (error) {
        this.rethrowSlugConflict(error);
      }

      const branch = await tx.branch.create({ data: { tenantId: tenant.id, name: dto.branchName } });

      let owner = await tx.user.findUnique({ where: { email: dto.ownerEmail } });
      const ownerCreated = !owner;

      if (!owner) {
        const passwordHash = await argon2.hash(dto.ownerPassword, { type: argon2.argon2id });
        owner = await tx.user.create({
          data: {
            firstName: dto.ownerFirstName,
            lastName: dto.ownerLastName,
            email: dto.ownerEmail,
            passwordHash,
            emailVerifiedAt: new Date(),
          },
        });
      }
      // If the owner account already existed (e.g. they own another tenant
      // already), it is only ever attached to this new tenant - its
      // password is never touched, matching the same discipline as
      // createSuperAdminIfMissing().

      const membership = await tx.tenantUser.create({
        data: { tenantId: tenant.id, userId: owner.id, branchId: branch.id, roleId: ownerRole.id, status: "ACTIVE" },
      });

      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: actor.userId,
          action: "admin.tenant.create",
          entity: "Tenant",
          entityId: tenant.id,
          requestId: meta.requestId ?? null,
          ip: meta.ip ?? null,
          userAgent: meta.userAgent ?? null,
          newValue: {
            tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, status: tenant.status },
            branch: { id: branch.id, name: branch.name },
            owner: { id: owner.id, email: owner.email, reused: !ownerCreated },
          },
        },
      });

      return { tenant, branch, owner: sanitizeUser(owner), membership };
    });
  }

  async update(id: string, dto: UpdateTenantDto, actor: AuthenticatedUser, meta: RequestMetadata) {
    const before = await this.tenantsRepository.findById(id);
    if (!before) {
      throw new NotFoundException("İşletme bulunamadı.");
    }

    const updated = await this.tenantsRepository.update(id, {
      name: dto.name,
      phone: dto.phone,
      status: dto.status,
    });

    await this.auditService.log({
      tenantId: id,
      userId: actor.userId,
      action: "admin.tenant.update",
      entity: "Tenant",
      entityId: id,
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      oldValue: { name: before.name, phone: before.phone, status: before.status },
      newValue: { name: updated.name, phone: updated.phone, status: updated.status },
    });

    return updated;
  }

  async listUsers(tenantId: string) {
    await this.assertExists(tenantId);
    const memberships = await this.tenantsRepository.findUsers(tenantId);
    return memberships.map((membership) => ({ ...membership, user: sanitizeUser(membership.user) }));
  }

  async listBranches(tenantId: string) {
    await this.assertExists(tenantId);
    return this.tenantsRepository.findBranches(tenantId);
  }

  async listActivity(tenantId: string, query: Omit<ListAuditLogsQueryDto, "tenantId">) {
    await this.assertExists(tenantId);
    const { logs, total } = await this.auditRepository.findMany(query as ListAuditLogsQueryDto, { tenantId });
    return toPaginatedResult(logs, total, query.page, query.pageSize);
  }

  private async assertExists(id: string): Promise<void> {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException("İşletme bulunamadı.");
    }
  }

  private rethrowSlugConflict(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppException("SLUG_ALREADY_EXISTS", "Bu slug başka bir işletme tarafından kullanılıyor.", HttpStatus.CONFLICT, [
        { field: "slug", message: "Bu slug zaten kullanımda." },
      ]);
    }

    throw error;
  }
}

export type { PaginatedResult };
