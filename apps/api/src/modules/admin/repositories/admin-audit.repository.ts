import { Injectable } from "@nestjs/common";
import { Prisma, prisma } from "@qr-platform/database";
import type { AuditLog } from "@qr-platform/database";

import type { ListAuditLogsQueryDto } from "../dto/list-audit-logs-query.dto";

export type AuditLogWithActor = AuditLog & {
  user: { id: string; firstName: string; lastName: string; email: string } | null;
  tenant: { id: string; name: string; slug: string } | null;
};

const ACTOR_INCLUDE = {
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
  tenant: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.AuditLogInclude;

@Injectable()
export class AdminAuditRepository {
  async findMany(
    query: ListAuditLogsQueryDto,
    extraWhere: Prisma.AuditLogWhereInput = {},
  ): Promise<{ logs: AuditLogWithActor[]; total: number }> {
    const where: Prisma.AuditLogWhereInput = {
      ...extraWhere,
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.action ? { action: { contains: query.action, mode: "insensitive" } } : {}),
      ...(query.entity ? { entity: { contains: query.entity, mode: "insensitive" } } : {}),
      ...(query.tenantId ? { tenantId: query.tenantId } : {}),
      ...(query.requestId ? { requestId: query.requestId } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
        include: ACTOR_INCLUDE,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }
}
