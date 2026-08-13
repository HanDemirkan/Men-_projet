import type { PermissionCode, Role } from "@qr-platform/permissions";

// Attached to `request.user` by AuthContextMiddleware once the access token
// has been verified. Carries identity + a freshly-resolved permission set -
// never trust a JWT's claims for authorization, only for identity (see
// docs/decisions/0007-identity-multi-tenant-schema.md).
export interface AuthenticatedUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string | null;
  branchId: string | null;
  tenantUserId: string;
  roleId: string;
  roleCode: Role;
  permissions: PermissionCode[];
  sessionId: string;
}
