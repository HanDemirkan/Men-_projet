import { ExecutionContext, createParamDecorator } from "@nestjs/common";

import type { RequestWithId } from "../../../common/types/request-context.types";

// `null` for platform-level users (SUPER_ADMIN) - callers that require a
// concrete tenant should check for null themselves (TenantGuard does this
// for routes that carry a tenantId param/body field).
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<RequestWithId>();
    return request.user?.tenantId ?? null;
  },
);
