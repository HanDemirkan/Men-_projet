import type { Tenant, TenantStorefrontConfig } from "@qr-platform/database";
import type { Request } from "express";

import type { AuthenticatedUser } from "../../modules/auth/types/authenticated-user.types";

export interface RequestWithId extends Request {
  requestId: string;
  user?: AuthenticatedUser;
  // Set only by PublicStorefrontContextMiddleware, for anonymous
  // /storefront/:tenantSlug* requests - see CurrentPublicTenant decorator.
  // `storefrontConfig` relation is always included (see the middleware) so
  // PublicStorefrontService never needs a second query for it.
  tenant?: Tenant & { storefrontConfig: TenantStorefrontConfig | null };
}
