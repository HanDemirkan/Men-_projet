import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../index";
import { runWithTenantContext } from "../tenant-context";
import { tenantScopedPrisma } from "../tenant-scoped-client";

// This is the central mechanism from ADR 0007: tenant-scoped models
// (Branch, TenantUser) can only be queried through `tenantScopedPrisma`
// inside a `runWithTenantContext()` call - the Prisma Client Extension
// stamps every where/data with the current tenantId, so there is no
// controller/service code path that could "forget" the filter. Only runs
// against a real PostgreSQL instance (see connection.integration.test.ts).
const runIntegration = process.env["RUN_DB_INTEGRATION_TESTS"] === "true";

describe.skipIf(!runIntegration)("tenant isolation (integration)", () => {
  const suffix = randomUUID();
  let tenantAId: string;
  let tenantBId: string;
  let branchAId: string;
  let branchBId: string;

  beforeAll(async () => {
    const tenantA = await prisma.tenant.create({
      data: { name: `Isolation Test Tenant A ${suffix}`, slug: `isolation-test-a-${suffix}` },
    });
    const tenantB = await prisma.tenant.create({
      data: { name: `Isolation Test Tenant B ${suffix}`, slug: `isolation-test-b-${suffix}` },
    });
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;

    const branchA = await prisma.branch.create({ data: { tenantId: tenantAId, name: "Branch A" } });
    const branchB = await prisma.branch.create({ data: { tenantId: tenantBId, name: "Branch B" } });
    branchAId = branchA.id;
    branchBId = branchB.id;
  });

  afterAll(async () => {
    await prisma.branch.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });
    await prisma.$disconnect();
  });

  it("throws when a tenant-scoped model is queried with no tenant context at all", async () => {
    await expect(tenantScopedPrisma.branch.findMany()).rejects.toThrow(/Tenant context missing/);
  });

  it("returns only the current tenant's rows, never another tenant's, even without an explicit where", async () => {
    const resultA = await runWithTenantContext(tenantAId, () =>
      tenantScopedPrisma.branch.findMany({ where: { id: { in: [branchAId, branchBId] } } }),
    );

    expect(resultA.map((branch) => branch.id)).toEqual([branchAId]);
  });

  it("returns null for findUnique when the row belongs to a different tenant, even by exact id", async () => {
    const result = await runWithTenantContext(tenantAId, () =>
      tenantScopedPrisma.branch.findUnique({ where: { id: branchBId } }),
    );

    expect(result).toBeNull();
  });

  it("stamps created rows with the current tenant context's id, ignoring any caller-supplied tenantId", async () => {
    const created = await runWithTenantContext(tenantAId, () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- deliberately smuggling a foreign tenantId to prove it gets overwritten
      tenantScopedPrisma.branch.create({ data: { name: "Smuggled Branch", tenantId: tenantBId } as any }),
    );

    expect(created.tenantId).toBe(tenantAId);
    await prisma.branch.delete({ where: { id: created.id } });
  });

  it("never leaks tenant context across concurrent requests (AsyncLocalStorage isolation under real load)", async () => {
    const [resultA, resultB] = await Promise.all([
      runWithTenantContext(tenantAId, () => tenantScopedPrisma.branch.findMany()),
      runWithTenantContext(tenantBId, () => tenantScopedPrisma.branch.findMany()),
    ]);

    expect(resultA.every((branch) => branch.tenantId === tenantAId)).toBe(true);
    expect(resultB.every((branch) => branch.tenantId === tenantBId)).toBe(true);
  });

  it("still allows unscoped platform-level access via the raw `prisma` export (the one documented exception)", async () => {
    const bothBranches = await prisma.branch.findMany({ where: { id: { in: [branchAId, branchBId] } } });

    expect(bothBranches).toHaveLength(2);
  });
});
