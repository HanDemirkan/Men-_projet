import { Injectable } from "@nestjs/common";
import { prisma } from "@qr-platform/database";
import type { Prisma } from "@qr-platform/database";

export interface AuditLogInput {
  tenantId?: string | null;
  branchId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  requestId?: string | null;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
}

// Not tenant-scoped (see tenant-scoped-client.ts): audit entries can be
// platform-level (tenantId null) and must always be writable regardless of
// the caller's tenant context, so this uses the raw `prisma` client.
//
// Sprint 2 wires real calls only into login/logout (the only endpoints that
// exist). Role/permission/user/tenant/branch change logging described in
// the AUDIT requirements will start firing automatically once their CRUD
// endpoints are built - this service is already complete for that, no
// changes will be needed here.
@Injectable()
export class AuditService {
  async log(input: AuditLogInput): Promise<void> {
    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId ?? null,
        branchId: input.branchId ?? null,
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        requestId: input.requestId ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        ...(input.oldValue !== undefined ? { oldValue: input.oldValue } : {}),
        ...(input.newValue !== undefined ? { newValue: input.newValue } : {}),
      },
    });
  }
}
