import { UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { Public } from "../decorators/public.decorator";

import { JwtAuthGuard } from "./jwt-auth.guard";

class FixturePublicController {
  @Public()
  publicRoute(): void {}
}

class FixtureProtectedController {
  protectedRoute(): void {}
}

function buildContext(handler: () => void, target: object, user?: unknown): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => target.constructor,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe("JwtAuthGuard", () => {
  const guard = new JwtAuthGuard(new Reflector());
  const publicController = new FixturePublicController();
  const protectedController = new FixtureProtectedController();

  it("allows a @Public() route through even without a resolved user", () => {
    const context = buildContext(publicController.publicRoute, publicController, undefined);

    expect(guard.canActivate(context)).toBe(true);
  });

  it("allows a protected route through when request.user was resolved", () => {
    const context = buildContext(protectedController.protectedRoute, protectedController, {
      userId: "user-1",
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("denies-by-default: throws UnauthorizedException on a protected route with no resolved user", () => {
    const context = buildContext(protectedController.protectedRoute, protectedController, undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
