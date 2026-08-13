import { ForbiddenException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, prisma } from "@qr-platform/database";
import { ROLES } from "@qr-platform/permissions";
import * as argon2 from "argon2";

import { AppException } from "../../../common/exceptions/app.exception";
import { toPaginatedResult } from "../../../common/pagination";
import { sanitizeUser } from "../../../common/sanitize-user";
import { requireTenantId } from "../../../common/tenant/require-tenant-id";
import { AuditService } from "../../audit/audit.service";
import { SessionService } from "../../auth/services/session.service";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user.types";
import type { CreateUserDto } from "../dto/create-user.dto";
import type { ListUsersQueryDto } from "../dto/list-users-query.dto";
import type { RevokeSessionsDto } from "../dto/revoke-sessions.dto";
import type { SetUserPasswordDto } from "../dto/set-user-password.dto";
import type { UpdateUserDto } from "../dto/update-user.dto";
import {
  assertCanAssignRole,
  assertCanChangeUserStatus,
  assertCanRevokeSessions,
  assertWithinManagedBranch,
} from "../policies/user-management.policy";
import { BusinessUsersRepository } from "../repositories/business-users.repository";
import type { RequestMetadata } from "../types/request-metadata";

const RECENT_AUDIT_LOG_LIMIT = 20;

@Injectable()
export class BusinessUsersService {
  constructor(
    private readonly usersRepository: BusinessUsersRepository,
    private readonly auditService: AuditService,
    private readonly sessionService: SessionService,
  ) {}

  async list(query: ListUsersQueryDto, actor: AuthenticatedUser) {
    const restrictToBranchId = actor.roleCode === ROLES.BRANCH_MANAGER ? (actor.branchId ?? "") : undefined;
    const { memberships, total } = await this.usersRepository.findMany(query, restrictToBranchId);
    const sanitized = memberships.map((membership) => ({ ...membership, user: sanitizeUser(membership.user) }));
    return toPaginatedResult(sanitized, total, query.page, query.pageSize);
  }

  async get(membershipId: string, actor: AuthenticatedUser) {
    const membership = await this.getOwnedMembership(membershipId, actor);

    const [sessions, recentActivity] = await Promise.all([
      this.sessionService.listByUserId(membership.userId),
      prisma.auditLog.findMany({
        where: { userId: membership.userId, tenantId: membership.tenantId },
        orderBy: { createdAt: "desc" },
        take: RECENT_AUDIT_LOG_LIMIT,
      }),
    ]);

    return { ...membership, user: sanitizeUser(membership.user), sessions, recentAuditLogs: recentActivity };
  }

  // Single transaction: User (find-or-create) -> TenantUser membership ->
  // AuditLog. Uses raw `prisma.$transaction` (not tenantScopedPrisma) since
  // it touches User, a model deliberately excluded from tenant scoping -
  // same reasoning as AdminTenantsService.create() in the admin module.
  async create(dto: CreateUserDto, actor: AuthenticatedUser, meta: RequestMetadata) {
    assertCanAssignRole({ callerRoleCode: actor.roleCode, targetRole: dto.role });
    assertWithinManagedBranch({
      callerRoleCode: actor.roleCode,
      callerBranchId: actor.branchId,
      targetBranchId: dto.branchId ?? null,
    });

    const tenantId = requireTenantId();

    return prisma.$transaction(async (tx) => {
      if (dto.branchId) {
        const branch = await tx.branch.findFirst({ where: { id: dto.branchId, tenantId } });
        if (!branch) {
          throw new NotFoundException("Şube bulunamadı.");
        }
      }

      const role = await tx.role.findFirst({ where: { tenantId: null, code: dto.role } });
      if (!role) {
        throw new AppException("ROLE_NOT_FOUND", "Belirtilen rol bulunamadı.", HttpStatus.BAD_REQUEST);
      }

      let user = await tx.user.findUnique({ where: { email: dto.email } });
      const userCreated = !user;

      if (!user) {
        const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
        user = await tx.user.create({
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            passwordHash,
            emailVerifiedAt: new Date(),
          },
        });
      }
      // If the user already existed (e.g. staff at another tenant), only a
      // new membership is attached here - their password is never touched.

      let membership;
      try {
        membership = await tx.tenantUser.create({
          data: {
            tenantId,
            userId: user.id,
            branchId: dto.branchId ?? null,
            roleId: role.id,
            status: dto.status ?? "ACTIVE",
          },
        });
      } catch (error) {
        this.rethrowDuplicateMembership(error);
      }

      await tx.auditLog.create({
        data: {
          tenantId,
          branchId: dto.branchId ?? null,
          userId: actor.userId,
          action: "business.user.create",
          entity: "TenantUser",
          entityId: membership.id,
          requestId: meta.requestId ?? null,
          ip: meta.ip ?? null,
          userAgent: meta.userAgent ?? null,
          newValue: {
            user: { id: user.id, email: user.email, reused: !userCreated },
            role: dto.role,
            branchId: dto.branchId ?? null,
          },
        },
      });

      return { user: sanitizeUser(user), membership };
    });
  }

  async update(membershipId: string, dto: UpdateUserDto, actor: AuthenticatedUser, meta: RequestMetadata) {
    const membership = await this.getOwnedMembership(membershipId, actor);

    if (dto.role) {
      assertCanAssignRole({ callerRoleCode: actor.roleCode, targetRole: dto.role });
    }
    if (dto.branchId !== undefined) {
      assertWithinManagedBranch({
        callerRoleCode: actor.roleCode,
        callerBranchId: actor.branchId,
        targetBranchId: dto.branchId,
      });
    }

    if (dto.status) {
      const isTargetOwner = membership.role.code === ROLES.TENANT_OWNER;
      const isLastActiveTenantOwner =
        isTargetOwner && membership.status === "ACTIVE" && (await this.usersRepository.countActiveOwners()) <= 1;

      assertCanChangeUserStatus({
        targetUserId: membership.userId,
        callerUserId: actor.userId,
        newStatus: dto.status,
        isLastActiveTenantOwner,
      });
    }

    let roleId: string | undefined;
    if (dto.role) {
      const role = await prisma.role.findFirst({ where: { tenantId: null, code: dto.role } });
      if (!role) {
        throw new AppException("ROLE_NOT_FOUND", "Belirtilen rol bulunamadı.", HttpStatus.BAD_REQUEST);
      }
      roleId = role.id;
    }

    const updated = await this.usersRepository.update(membershipId, {
      ...(roleId ? { role: { connect: { id: roleId } } } : {}),
      ...(dto.branchId !== undefined
        ? { branch: dto.branchId ? { connect: { id: dto.branchId } } : { disconnect: true } }
        : {}),
      ...(dto.status ? { status: dto.status } : {}),
    });

    await this.auditService.log({
      tenantId: membership.tenantId,
      userId: actor.userId,
      action: "business.user.update",
      entity: "TenantUser",
      entityId: membershipId,
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      oldValue: { role: membership.role.code, branchId: membership.branchId, status: membership.status },
      newValue: { role: dto.role ?? membership.role.code, branchId: dto.branchId ?? membership.branchId, status: updated.status },
    });

    return updated;
  }

  async revokeSessions(membershipId: string, dto: RevokeSessionsDto, actor: AuthenticatedUser, meta: RequestMetadata) {
    const membership = await this.getOwnedMembership(membershipId, actor);

    assertCanRevokeSessions({
      targetUserId: membership.userId,
      callerUserId: actor.userId,
      callerSessionId: actor.sessionId,
      sessionIdToRevoke: dto.sessionId,
    });

    const revokedCount = dto.sessionId
      ? await this.revokeOne(membership.userId, dto.sessionId)
      : await this.sessionService.revokeAllForUser(membership.userId);

    await this.auditService.log({
      tenantId: membership.tenantId,
      userId: actor.userId,
      action: "business.user.revoke_sessions",
      entity: "Session",
      entityId: dto.sessionId ?? null,
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      newValue: { targetMembershipId: membershipId, sessionId: dto.sessionId ?? "all", revokedCount },
    });

    return { revokedCount };
  }

  async setPassword(membershipId: string, dto: SetUserPasswordDto, actor: AuthenticatedUser, meta: RequestMetadata) {
    const membership = await this.getOwnedMembership(membershipId, actor);

    const passwordHash = await argon2.hash(dto.newPassword, { type: argon2.argon2id });
    await prisma.user.update({ where: { id: membership.userId }, data: { passwordHash } });
    // Setting a new password invalidates every existing session for this
    // user - the old password (and any session issued under it) should not
    // silently keep working.
    await this.sessionService.revokeAllForUser(membership.userId);

    await this.auditService.log({
      tenantId: membership.tenantId,
      userId: actor.userId,
      action: "business.user.set_password",
      entity: "User",
      entityId: membership.userId,
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      // Never the password itself, hashed or otherwise.
      newValue: { targetMembershipId: membershipId },
    });

    return { updated: true };
  }

  private async getOwnedMembership(membershipId: string, actor: AuthenticatedUser) {
    const membership = await this.usersRepository.findById(membershipId);
    if (!membership) {
      throw new NotFoundException("Kullanıcı bulunamadı.");
    }

    if (actor.roleCode === ROLES.BRANCH_MANAGER && membership.branchId !== actor.branchId) {
      throw new ForbiddenException("Yalnızca kendi şubenizdeki personele erişebilirsiniz.");
    }

    return membership;
  }

  private async revokeOne(userId: string, sessionId: string): Promise<number> {
    const sessions = await this.sessionService.listByUserId(userId);
    const belongsToUser = sessions.some((session) => session.id === sessionId);

    if (!belongsToUser) {
      throw new NotFoundException("Oturum bulunamadı.");
    }

    await this.sessionService.deleteById(sessionId);
    return 1;
  }

  private rethrowDuplicateMembership(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppException(
        "MEMBERSHIP_ALREADY_EXISTS",
        "Bu kullanıcı zaten bu işletmenin bir üyesi.",
        HttpStatus.CONFLICT,
        [{ field: "email", message: "Bu e-posta işletmenizde zaten kayıtlı." }],
      );
    }

    throw error;
  }
}
