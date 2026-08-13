import { ForbiddenException } from "@nestjs/common";
import { getCurrentTenantId } from "@qr-platform/database";

// Menu-domain services call this instead of threading `@CurrentTenant()`
// through every controller method - `tenantScopedPrisma` already enforces
// isolation at the query level (see ADR 0007/0008), this only turns the
// "no tenant context" case into a proper 403 instead of the extension's
// generic Error surfacing as a 500 (e.g. a SUPER_ADMIN, whose tenantId is
// always null, hitting a tenant-only route).
export function requireTenantId(): string {
  const tenantId = getCurrentTenantId();

  if (!tenantId) {
    throw new ForbiddenException("Bu işlem için bir işletmeye bağlı olmanız gerekir.");
  }

  return tenantId;
}
