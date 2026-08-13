import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../index";
import { runWithTenantContext } from "../tenant-context";
import { tenantScopedPrisma } from "../tenant-scoped-client";

// Sprint 3A extension of tenant-isolation.integration.test.ts - covers the
// deeper Menu domain models (Product especially, since it's the one with
// soft delete and the most nested children) and Media. Only runs against a
// real PostgreSQL instance - see connection.integration.test.ts.
const runIntegration = process.env["RUN_DB_INTEGRATION_TESTS"] === "true";

describe.skipIf(!runIntegration)("Product/Media tenant isolation (integration)", () => {
  const suffix = randomUUID();
  let tenantAId: string;
  let tenantBId: string;
  let menuAId: string;
  let categoryAId: string;
  let productAId: string;
  let productBId: string;
  let mediaAId: string;

  beforeAll(async () => {
    const tenantA = await prisma.tenant.create({
      data: { name: `PM Isolation Tenant A ${suffix}`, slug: `pm-isolation-a-${suffix}` },
    });
    const tenantB = await prisma.tenant.create({
      data: { name: `PM Isolation Tenant B ${suffix}`, slug: `pm-isolation-b-${suffix}` },
    });
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;

    const menuA = await prisma.menu.create({ data: { tenantId: tenantAId, name: "Menu A" } });
    menuAId = menuA.id;
    const categoryA = await prisma.category.create({
      data: { tenantId: tenantAId, menuId: menuAId, name: "Category A", slug: `category-a-${suffix}` },
    });
    categoryAId = categoryA.id;
    const productA = await prisma.product.create({
      data: { tenantId: tenantAId, categoryId: categoryAId, name: "Product A", slug: `product-a-${suffix}`, price: 10 },
    });
    productAId = productA.id;

    const menuB = await prisma.menu.create({ data: { tenantId: tenantBId, name: "Menu B" } });
    const categoryB = await prisma.category.create({
      data: { tenantId: tenantBId, menuId: menuB.id, name: "Category B", slug: `category-b-${suffix}` },
    });
    const productB = await prisma.product.create({
      data: { tenantId: tenantBId, categoryId: categoryB.id, name: "Product B", slug: `product-b-${suffix}`, price: 10 },
    });
    productBId = productB.id;

    const mediaA = await prisma.media.create({
      data: {
        tenantId: tenantAId,
        type: "PRODUCT",
        key: `tenants/${tenantAId}/media/${suffix}.png`,
        mimeType: "image/png",
        sizeBytes: 100,
        originalFilename: "a.png",
      },
    });
    mediaAId = mediaA.id;
  });

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } }); // cascades everything
    await prisma.$disconnect();
  });

  it("throws when Product is queried with no tenant context", async () => {
    await expect(tenantScopedPrisma.product.findMany()).rejects.toThrow(/Tenant context missing/);
  });

  it("never returns another tenant's products, even without an explicit where", async () => {
    const resultA = await runWithTenantContext(tenantAId, () =>
      tenantScopedPrisma.product.findMany({ where: { id: { in: [productAId, productBId] } } }),
    );

    expect(resultA.map((product) => product.id)).toEqual([productAId]);
  });

  it("returns null for a cross-tenant Product lookup by exact id (no existence leak)", async () => {
    const result = await runWithTenantContext(tenantAId, () =>
      tenantScopedPrisma.product.findUnique({ where: { id: productBId } }),
    );

    expect(result).toBeNull();
  });

  it("never returns another tenant's Media rows", async () => {
    const resultB = await runWithTenantContext(tenantBId, () =>
      tenantScopedPrisma.media.findMany({ where: { id: mediaAId } }),
    );

    expect(resultB).toHaveLength(0);
  });

  it("cascades a hard delete down the full Menu -> Category -> Product -> Variant/OptionGroup -> Option chain", async () => {
    const variant = await prisma.variant.create({
      data: { tenantId: tenantAId, productId: productAId, name: "Small", price: 5 },
    });
    const optionGroup = await prisma.optionGroup.create({
      data: { tenantId: tenantAId, productId: productAId, name: "Extras" },
    });
    const option = await prisma.option.create({
      data: { tenantId: tenantAId, optionGroupId: optionGroup.id, name: "Cheese" },
    });

    await prisma.menu.delete({ where: { id: menuAId } });

    const [remainingCategory, remainingProduct, remainingVariant, remainingOptionGroup, remainingOption] =
      await Promise.all([
        prisma.category.findUnique({ where: { id: categoryAId } }),
        prisma.product.findUnique({ where: { id: productAId } }),
        prisma.variant.findUnique({ where: { id: variant.id } }),
        prisma.optionGroup.findUnique({ where: { id: optionGroup.id } }),
        prisma.option.findUnique({ where: { id: option.id } }),
      ]);

    expect(remainingCategory).toBeNull();
    expect(remainingProduct).toBeNull();
    expect(remainingVariant).toBeNull();
    expect(remainingOptionGroup).toBeNull();
    expect(remainingOption).toBeNull();
  });
});
