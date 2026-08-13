import { ForbiddenException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";

import { TenantGuard } from "./tenant.guard";

function buildContext(options: {
  user?: { roleCode: string; tenantId: string | null };
  params?: Record<string, string>;
  body?: Record<string, unknown>;
}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: options.user, params: options.params ?? {}, body: options.body }),
    }),
  } as unknown as ExecutionContext;
}

describe("TenantGuard", () => {
  const guard = new TenantGuard();

  it("allows the request through when there is no resolved user (deferred to JwtAuthGuard)", () => {
    expect(guard.canActivate(buildContext({}))).toBe(true);
  });

  it("bypasses the check entirely for SUPER_ADMIN, regardless of the tenantId in the route", () => {
    const context = buildContext({
      user: { roleCode: "SUPER_ADMIN", tenantId: null },
      params: { tenantId: "some-other-tenant" },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("allows a request that carries no explicit tenantId at all", () => {
    const context = buildContext({ user: { roleCode: "TENANT_OWNER", tenantId: "tenant-1" } });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("allows a route param tenantId that matches the caller's own tenant", () => {
    const context = buildContext({
      user: { roleCode: "TENANT_OWNER", tenantId: "tenant-1" },
      params: { tenantId: "tenant-1" },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("allows a body tenantId that matches the caller's own tenant", () => {
    const context = buildContext({
      user: { roleCode: "TENANT_OWNER", tenantId: "tenant-1" },
      body: { tenantId: "tenant-1" },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("throws ForbiddenException when the route's tenantId belongs to a different tenant", () => {
    const context = buildContext({
      user: { roleCode: "TENANT_OWNER", tenantId: "tenant-1" },
      params: { tenantId: "tenant-2" },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("throws ForbiddenException for a mismatched tenantId supplied in the body", () => {
    const context = buildContext({
      user: { roleCode: "BRANCH_MANAGER", tenantId: "tenant-1" },
      body: { tenantId: "tenant-2" },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
