import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../index";
import { runWithTenantContext } from "../tenant-context";
import { tenantScopedPrisma } from "../tenant-scoped-client";

// Sprint 3B: proves the exact mechanism PublicStorefrontContextMiddleware
// relies on (see ADR 0007 §3 and ADR 0009) - resolving a tenant by its
// public `slug` via the raw client, then establishing tenant context from
// that id - propagates correctly to tenantScopedPrisma for the rest of an
// (anonymous) request, and that the "published" content-filtering rules the
// public storefront applies (Menu.status, Category.active, Product
// isAvailable/deletedAt) hold against real data. Only runs against a real
// PostgreSQL instance - see connection.integration.test.ts.
const runIntegration = process.env["RUN_DB_INTEGRATION_TESTS"] === "true";

describe.skipIf(!runIntegration)("Public storefront slug-context + published filtering (integration)", () => {
  const suffix = randomUUID();
  let tenantId: string;
  const tenantSlug = `storefront-ctx-${suffix}`;
  let publishedMenuId: string;
  let activeCategoryId: string;

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: `Storefront Context Tenant ${suffix}`, slug: tenantSlug },
    });
    tenantId = tenant.id;

    const publishedMenu = await prisma.menu.create({
      data: { tenantId, name: "Published Menu", status: "PUBLISHED" },
    });
    publishedMenuId = publishedMenu.id;
    await prisma.menu.create({ data: { tenantId, name: "Draft Menu", status: "DRAFT" } });

    const activeCategory = await prisma.category.create({
      data: { tenantId, menuId: publishedMenuId, name: "Active Category", slug: `active-${suffix}` },
    });
    activeCategoryId = activeCategory.id;
    await prisma.category.create({
      data: { tenantId, menuId: publishedMenuId, name: "Inactive Category", slug: `inactive-${suffix}`, active: false },
    });

    await prisma.product.create({
      data: { tenantId, categoryId: activeCategoryId, name: "Available", slug: `available-${suffix}`, price: 10 },
    });
    await prisma.product.create({
      data: { tenantId, categoryId: activeCategoryId, name: "Unavailable", slug: `unavailable-${suffix}`, price: 10, isAvailable: false },
    });
    await prisma.product.create({
      data: {
        tenantId,
        categoryId: activeCategoryId,
        name: "Archived",
        slug: `archived-${suffix}`,
        price: 10,
        deletedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } }); // cascades everything
    await prisma.$disconnect();
  });

  it("resolves a tenant by its public slug via the unscoped client (no context needed yet)", async () => {
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

    expect(tenant?.id).toBe(tenantId);
    expect(tenant?.status).toBe("ACTIVE");
  });

  it("establishing context from a slug-resolved tenant id makes tenantScopedPrisma work exactly like an authenticated request's", async () => {
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: tenantSlug } });

    const menus = await runWithTenantContext(tenant.id, () => tenantScopedPrisma.menu.findMany({}));

    expect(menus).toHaveLength(2);
    expect(menus.every((menu) => menu.tenantId === tenant.id)).toBe(true);
  });

  it("a published-content query (status=PUBLISHED, active=true, isAvailable+not-deleted) matches only the intended rows", async () => {
    const publishedMenus = await runWithTenantContext(tenantId, () =>
      tenantScopedPrisma.menu.findMany({ where: { status: "PUBLISHED" } }),
    );
    expect(publishedMenus.map((menu) => menu.id)).toEqual([publishedMenuId]);

    const activeCategories = await runWithTenantContext(tenantId, () =>
      tenantScopedPrisma.category.findMany({ where: { menuId: publishedMenuId, active: true } }),
    );
    expect(activeCategories.map((category) => category.id)).toEqual([activeCategoryId]);

    const publishedProducts = await runWithTenantContext(tenantId, () =>
      tenantScopedPrisma.product.findMany({
        where: { categoryId: activeCategoryId, isAvailable: true, deletedAt: null },
      }),
    );
    expect(publishedProducts.map((product) => product.name)).toEqual(["Available"]);
  });

  it("category slugs are unique per-tenant but not globally (two tenants can reuse the same slug)", async () => {
    const otherTenant = await prisma.tenant.create({
      data: { name: `Storefront Context Tenant B ${suffix}`, slug: `storefront-ctx-b-${suffix}` },
    });
    const otherMenu = await prisma.menu.create({ data: { tenantId: otherTenant.id, name: "Menu" } });

    const duplicateSlugCategory = await prisma.category.create({
      data: { tenantId: otherTenant.id, menuId: otherMenu.id, name: "Active Category", slug: `active-${suffix}` },
    });

    expect(duplicateSlugCategory.slug).toBe(`active-${suffix}`);

    await prisma.tenant.delete({ where: { id: otherTenant.id } });
  });
});
