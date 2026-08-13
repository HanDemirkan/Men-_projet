import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import type { Tenant, TenantStorefrontConfig } from "@qr-platform/database";

import type { RequestWithId } from "../../../common/types/request-context.types";

type TenantWithStorefrontConfig = Tenant & { storefrontConfig: TenantStorefrontConfig | null };

// Populated only by PublicStorefrontContextMiddleware - safe to assume
// non-null in any handler behind that middleware (the middleware itself
// 404s before `next()` if the slug doesn't resolve).
export const CurrentPublicTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantWithStorefrontConfig => {
    const request = ctx.switchToHttp().getRequest<RequestWithId>();
    return request.tenant as TenantWithStorefrontConfig;
  },
);
