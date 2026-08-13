import { NotFoundException } from "@nestjs/common";
import { tenantScopedPrisma } from "@qr-platform/database";
import type { Tenant, TenantStorefrontConfig } from "@qr-platform/database";
import { DEFAULT_TEMPLATE_CODE } from "@qr-platform/shared";

import { PublicStorefrontService } from "./public-storefront.service";

jest.mock("@qr-platform/database", () => ({
  tenantScopedPrisma: {
    menu: { findMany: jest.fn() },
    category: { findFirst: jest.fn() },
    product: { findFirst: jest.fn() },
  },
}));

const tenantScopedMock = tenantScopedPrisma as unknown as {
  menu: { findMany: jest.Mock };
  category: { findFirst: jest.Mock };
  product: { findFirst: jest.Mock };
};

type TenantWithStorefrontConfig = Tenant & { storefrontConfig: TenantStorefrontConfig | null };

function fakeTenant(overrides: Partial<TenantWithStorefrontConfig> = {}): TenantWithStorefrontConfig {
  return {
    id: "tenant-1",
    name: "Sahil Cafe",
    slug: "sahil-cafe",
    status: "ACTIVE",
    storefrontConfig: {
      tenantId: "tenant-1",
      templateCode: DEFAULT_TEMPLATE_CODE,
      templateVersion: 1,
      publishedConfig: null,
      draftConfig: { theme: { primaryColor: "#SECRET-DRAFT" } },
      publishedAt: null,
      updatedAt: new Date(),
    },
    ...overrides,
  } as TenantWithStorefrontConfig;
}

describe("PublicStorefrontService", () => {
  const service = new PublicStorefrontService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getHome() only queries PUBLISHED menus and never leaks the unpublished draft config", async () => {
    tenantScopedMock.menu.findMany.mockResolvedValue([{ id: "m1", name: "Ana Menü", sortOrder: 0, activeFrom: null, activeUntil: null }]);

    const result = await service.getHome(fakeTenant());

    expect(tenantScopedMock.menu.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "PUBLISHED" } }),
    );
    expect(JSON.stringify(result)).not.toContain("SECRET-DRAFT");
  });

  it("getHome() excludes a menu whose activeUntil window has already passed", async () => {
    tenantScopedMock.menu.findMany.mockResolvedValue([
      { id: "expired", name: "Kış Menüsü", sortOrder: 0, activeFrom: null, activeUntil: new Date("2020-01-01") },
      { id: "current", name: "Ana Menü", sortOrder: 1, activeFrom: null, activeUntil: null },
    ]);

    const result = await service.getHome(fakeTenant());

    expect(result.menus).toEqual([{ id: "current", name: "Ana Menü" }]);
  });

  it("getMenu() filters categories to active:true and products to isAvailable+not-deleted", async () => {
    tenantScopedMock.menu.findMany.mockResolvedValue([]);

    await service.getMenu(fakeTenant());

    const call = tenantScopedMock.menu.findMany.mock.calls[0][0];
    expect(call.include.categories.where).toEqual({ active: true });
    expect(call.include.categories.include.products.where).toEqual({ isAvailable: true, deletedAt: null });
  });

  it("getCategory() 404s when the category doesn't exist or isn't active", async () => {
    tenantScopedMock.category.findFirst.mockResolvedValue(null);

    await expect(service.getCategory(fakeTenant(), "missing-slug")).rejects.toThrow(NotFoundException);
  });

  it("getProduct() 404s for a soft-deleted or unavailable product", async () => {
    tenantScopedMock.product.findFirst.mockResolvedValue(null);

    await expect(service.getProduct(fakeTenant(), "missing-slug")).rejects.toThrow(NotFoundException);
    expect(tenantScopedMock.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "missing-slug", isAvailable: true, deletedAt: null } }),
    );
  });
});
