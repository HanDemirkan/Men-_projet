import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { ROLES } from "@qr-platform/permissions";

import type { RequestWithId } from "../../../common/types/request-context.types";

// Global (registered via APP_GUARD): if a route carries an explicit
// `tenantId` in its params or body, it must match the caller's own tenant -
// this is what stops a tenant owner from passing a different tenantId to
// reach another tenant's data through a route param, independent of
// whatever the tenant-scoped Prisma client already enforces at the query
// level (defense in depth, not a replacement for it).
// SUPER_ADMIN is platform-level by design and bypasses this check.
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithId>();
    const user = request.user;

    if (!user || user.roleCode === ROLES.SUPER_ADMIN) {
      return true;
    }

    const params = request.params as Record<string, string | undefined>;
    const body = request.body as Record<string, unknown> | undefined;
    const candidateTenantId = params["tenantId"] ?? (body?.["tenantId"] as string | undefined);

    if (candidateTenantId !== undefined && candidateTenantId !== user.tenantId) {
      throw new ForbiddenException("Bu işletmeye erişim yetkiniz yok.");
    }

    return true;
  }
}
