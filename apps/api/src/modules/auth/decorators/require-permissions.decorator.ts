import { SetMetadata } from "@nestjs/common";
import type { PermissionCode } from "@qr-platform/permissions";

export const PERMISSIONS_KEY = "requiredPermissions";

// Declares which permission codes PermissionsGuard (global) requires the
// caller to have, ALL of them, to reach this handler.
export const RequirePermissions = (...permissions: PermissionCode[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(PERMISSIONS_KEY, permissions);
