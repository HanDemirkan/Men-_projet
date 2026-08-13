import type { PermissionCode, Role } from "@qr-platform/permissions";

// Mirrors the API's GET /auth/me and login/refresh response shape exactly -
// this is the one real session/user model for the web app.
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string | null;
  branchId: string | null;
  role: Role;
  permissions: PermissionCode[];
}
