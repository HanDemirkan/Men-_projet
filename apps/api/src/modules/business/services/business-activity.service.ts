import { Injectable } from "@nestjs/common";
import { Prisma, prisma } from "@qr-platform/database";

import { toPaginatedResult } from "../../../common/pagination";
import { redactAuditLog } from "../../../common/redact-audit-value";
import { requireTenantId } from "../../../common/tenant/require-tenant-id";
import type { ListActivityQueryDto } from "../dto/list-activity-query.dto";

const ACTOR_INCLUDE = {
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.AuditLogInclude;

// AuditLog is deliberately not in TENANT_SCOPED_MODELS (platform-level
// entries have a null tenantId) - so this filters explicitly by the
// caller's own tenantId, always, never trusting a tenantId from the
// request itself (see the sprint's "request body içindeki tenantId
// güvenilir kabul edilmesin" requirement - there isn't even a tenantId
// param here to be tempted to trust).
@Injectable()
export class BusinessActivityService {
  async list(query: ListActivityQueryDto) {
    const tenantId = requireTenantId();

    const where: Prisma.AuditLogWhereInput = {
      tenantId,
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.action ? { action: { contains: query.action, mode: "insensitive" } } : {}),
      ...(query.entity ? { entity: { contains: query.entity, mode: "insensitive" } } : {}),
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

    return toPaginatedResult(logs.map(redactAuditLog), total, query.page, query.pageSize);
  }
}
