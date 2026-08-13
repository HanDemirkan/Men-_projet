import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { PermissionCode } from "@qr-platform/permissions";

import type { RequestWithId } from "../../../common/types/request-context.types";
import { PERMISSIONS_KEY } from "../decorators/require-permissions.decorator";

// Global (registered via APP_GUARD): no-ops unless a handler declares
// `@RequirePermissions(...)`. Checks the live permission set
// AuthContextMiddleware resolved from the database this request - never a
// JWT claim.
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionCode[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithId>();
    const userPermissions = request.user?.permissions ?? [];
    const hasAllRequired = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllRequired) {
      throw new ForbiddenException("Bu işlem için yetkiniz yok.");
    }

    return true;
  }
}
