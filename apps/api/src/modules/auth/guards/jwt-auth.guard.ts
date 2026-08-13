import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { RequestWithId } from "../../../common/types/request-context.types";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

// Global (registered via APP_GUARD): every route requires authentication by
// default. `@Public()` is the only opt-out - deny-by-default so a new
// endpoint can never accidentally ship unprotected.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithId>();

    if (!request.user) {
      throw new UnauthorizedException("Kimlik doğrulaması gerekli.");
    }

    return true;
  }
}
