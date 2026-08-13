import { ExecutionContext, createParamDecorator } from "@nestjs/common";

import type { RequestWithId } from "../../../common/types/request-context.types";

export const CurrentBranch = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<RequestWithId>();
    return request.user?.branchId ?? null;
  },
);
