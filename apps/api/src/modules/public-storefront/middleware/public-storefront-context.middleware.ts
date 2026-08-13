import { Injectable, NestMiddleware } from "@nestjs/common";
import { prisma, runWithTenantContext } from "@qr-platform/database";
import type { NextFunction, Response } from "express";

import type { RequestWithId } from "../../../common/types/request-context.types";

// Public-route counterpart to AuthContextMiddleware (see ADR 0007 §3 for why
// `runWithTenantContext(id, () => next())` correctly keeps the
// AsyncLocalStorage context alive through the rest of the async request
// chain even though `next()` itself returns synchronously). Resolves the
// tenant from the `:tenantSlug` route param instead of a JWT, so anonymous
// storefront requests get the exact same "structurally impossible to
// forget" tenant-scoped Prisma guarantee as authenticated ones - see
// ADR 0009.
@Injectable()
export class PublicStorefrontContextMiddleware implements NestMiddleware {
  async use(req: RequestWithId, res: Response, next: NextFunction): Promise<void> {
    const tenantSlug = req.params["tenantSlug"];

    if (!tenantSlug) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Sayfa bulunamadı." } });
      return;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: { storefrontConfig: true },
    });

    if (!tenant || tenant.status !== "ACTIVE" || tenant.deletedAt) {
      // An active Tenant.slug match (above) always wins over a stale alias -
      // only fall back to alias resolution once that lookup misses. This is
      // what lets a printed QR code keep working forever even after the
      // business renames its slug: the web layer 308-redirects using
      // `redirectSlug` (see [tenantSlug]/layout.tsx's leaf pages) instead of
      // showing a 404 for what the customer experiences as a working code.
      const alias = await prisma.tenantSlugAlias.findUnique({
        where: { oldSlug: tenantSlug },
        include: { tenant: true },
      });
      const target = alias && alias.tenant.status === "ACTIVE" && !alias.tenant.deletedAt ? alias.tenant.slug : null;

      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Sayfa bulunamadı.", redirectSlug: target },
      });
      return;
    }

    req.tenant = tenant;
    runWithTenantContext(tenant.id, () => next());
  }
}
