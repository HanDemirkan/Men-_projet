import { Injectable, NotFoundException } from "@nestjs/common";
import { ROLES } from "@qr-platform/permissions";

import { toPaginatedResult } from "../../../common/pagination";
import { sanitizeUser, sanitizeUsers } from "../../../common/sanitize-user";
import { AuditService } from "../../audit/audit.service";
import { SessionService } from "../../auth/services/session.service";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user.types";
import type { ListAuditLogsQueryDto } from "../dto/list-audit-logs-query.dto";
import type { ListUsersQueryDto } from "../dto/list-users-query.dto";
import type { RevokeSessionsDto } from "../dto/revoke-sessions.dto";
import type { UpdateUserStatusDto } from "../dto/update-user-status.dto";
import { assertCanRevokeSessions } from "../policies/session-revoke.policy";
import { assertCanChangeUserStatus } from "../policies/user-status.policy";
import { AdminAuditRepository } from "../repositories/admin-audit.repository";
import { AdminUsersRepository } from "../repositories/admin-users.repository";

import type { RequestMetadata } from "./admin-tenants.service";

const RECENT_AUDIT_LOG_LIMIT = 20;

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly usersRepository: AdminUsersRepository,
    private readonly auditRepository: AdminAuditRepository,
    private readonly auditService: AuditService,
    private readonly sessionService: SessionService,
  ) {}

  async list(query: ListUsersQueryDto) {
    const { users, total } = await this.usersRepository.findMany(query);
    return toPaginatedResult(sanitizeUsers(users), total, query.page, query.pageSize);
  }

  async get(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException("Kullanıcı bulunamadı.");
    }

    const [sessions, recentActivity] = await Promise.all([
      this.sessionService.listByUserId(id),
      this.auditRepository.findMany({ page: 1, pageSize: RECENT_AUDIT_LOG_LIMIT } as ListAuditLogsQueryDto, {
        userId: id,
      }),
    ]);

    return { ...sanitizeUser(user), sessions, recentAuditLogs: recentActivity.logs };
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto, actor: AuthenticatedUser, meta: RequestMetadata) {
    const target = await this.usersRepository.findById(id);
    if (!target) {
      throw new NotFoundException("Kullanıcı bulunamadı.");
    }

    const isTargetSuperAdmin = target.tenantUsers.some(
      (membership) => membership.tenantId === null && membership.role.code === ROLES.SUPER_ADMIN,
    );
    const isLastActiveSuperAdmin =
      isTargetSuperAdmin && target.status === "ACTIVE" && (await this.usersRepository.countActiveSuperAdmins()) <= 1;

    assertCanChangeUserStatus({
      targetUserId: id,
      callerUserId: actor.userId,
      newStatus: dto.status,
      isLastActiveSuperAdmin,
    });

    const updated = await this.usersRepository.updateStatus(id, dto.status);

    await this.auditService.log({
      userId: actor.userId,
      action: "admin.user.status_update",
      entity: "User",
      entityId: id,
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      oldValue: { status: target.status },
      newValue: { status: updated.status },
    });

    return sanitizeUser(updated);
  }

  async revokeSessions(id: string, dto: RevokeSessionsDto, actor: AuthenticatedUser, meta: RequestMetadata) {
    const target = await this.usersRepository.findById(id);
    if (!target) {
      throw new NotFoundException("Kullanıcı bulunamadı.");
    }

    assertCanRevokeSessions({
      targetUserId: id,
      callerUserId: actor.userId,
      callerSessionId: actor.sessionId,
      sessionIdToRevoke: dto.sessionId,
    });

    const revokedCount = dto.sessionId
      ? await this.revokeOne(id, dto.sessionId)
      : await this.sessionService.revokeAllForUser(id);

    await this.auditService.log({
      userId: actor.userId,
      action: "admin.session.revoke",
      entity: "Session",
      entityId: dto.sessionId ?? null,
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      newValue: { targetUserId: id, sessionId: dto.sessionId ?? "all", revokedCount },
    });

    return { revokedCount };
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
}
