import { ForbiddenException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { RequirePermissions } from "../decorators/require-permissions.decorator";

import { PermissionsGuard } from "./permissions.guard";

class FixtureController {
  @RequirePermissions("tenant.read", "tenant.update")
  guardedRoute(): void {}

  unguardedRoute(): void {}
}

function buildContext(handler: () => void, target: object, permissions: string[] | undefined): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => target.constructor,
    switchToHttp: () => ({
      getRequest: () => (permissions === undefined ? {} : { user: { permissions } }),
    }),
  } as unknown as ExecutionContext;
}

describe("PermissionsGuard", () => {
  const guard = new PermissionsGuard(new Reflector());
  const controller = new FixtureController();

  it("is a no-op when the handler declares no @RequirePermissions()", () => {
    const context = buildContext(controller.unguardedRoute, controller, undefined);

    expect(guard.canActivate(context)).toBe(true);
  });

  it("allows the request through when the user has every required permission", () => {
    const context = buildContext(controller.guardedRoute, controller, ["tenant.read", "tenant.update", "menu.read"]);

    expect(guard.canActivate(context)).toBe(true);
  });

  it("throws ForbiddenException when the user is missing one of the required permissions", () => {
    const context = buildContext(controller.guardedRoute, controller, ["tenant.read"]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("throws ForbiddenException when there is no resolved user at all", () => {
    const context = buildContext(controller.guardedRoute, controller, undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
