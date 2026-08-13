import { Injectable, NestMiddleware } from "@nestjs/common";
import { prisma, runWithTenantContext } from "@qr-platform/database";
import type { NextFunction, Response } from "express";
import { PinoLogger } from "nestjs-pino";

import type { RequestWithId } from "../../../common/types/request-context.types";
import { IdentityService } from "../services/identity.service";
import { TokenService } from "../services/token.service";

// Runs on every request. Resolves `request.user` from the access_token
// cookie (if present and valid) and - this is the piece that makes tenant
// isolation "unforgettable" - establishes the AsyncLocalStorage tenant
// context for the *entire rest of the request* by wrapping `next()`. Every
// downstream guard, interceptor, and the tenant-scoped Prisma client all
// inherit it automatically. See docs/decisions/0007.
//
// Deliberately does not reject unauthenticated/invalid requests itself -
// that is JwtAuthGuard's job (so `@Public()` routes still work). A bad or
// missing token simply leaves `request.user` undefined.
@Injectable()
export class AuthContextMiddleware implements NestMiddleware {
  constructor(
    private readonly tokenService: TokenService,
    private readonly identityService: IdentityService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthContextMiddleware.name);
  }

  async use(req: RequestWithId, _res: Response, next: NextFunction): Promise<void> {
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    const accessToken = cookies?.["access_token"];

    if (accessToken) {
      await this.resolveUser(req, accessToken);
    }

    if (req.user?.tenantId) {
      runWithTenantContext(req.user.tenantId, () => next());
    } else {
      next();
    }
  }

  private async resolveUser(req: RequestWithId, accessToken: string): Promise<void> {
    try {
      const payload = this.tokenService.verifyAccessToken(accessToken);
      const membership = await this.identityService.resolveMembershipById(payload.tenantUserId);

      if (!membership) {
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: payload.sub } });

      if (!user || user.status !== "ACTIVE" || user.deletedAt) {
        return;
      }

      req.user = {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: membership.tenantId,
        branchId: membership.branchId,
        tenantUserId: membership.tenantUserId,
        roleId: membership.roleId,
        roleCode: membership.roleCode,
        permissions: membership.permissions,
        sessionId: payload.sessionId,
      };
    } catch (error) {
      this.logger.debug({ err: error }, "Access token verification failed");
    }
  }
}
