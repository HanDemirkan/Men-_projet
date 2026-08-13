import { ExecutionContext, UnauthorizedException, createParamDecorator } from "@nestjs/common";

import type { RequestWithId } from "../../../common/types/request-context.types";
import type { AuthenticatedUser } from "../types/authenticated-user.types";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithId>();

    if (!request.user) {
      // Only reachable if used on a route that isn't behind JwtAuthGuard -
      // a programming error, not a normal auth failure.
      throw new UnauthorizedException("Kimlik doğrulaması gerekli.");
    }

    return request.user;
  },
);
