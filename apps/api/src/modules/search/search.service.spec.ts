import { tenantScopedPrisma } from "@qr-platform/database";

import { SearchService } from "./search.service";

jest.mock("@qr-platform/database", () => ({
  tenantScopedPrisma: {
    product: { findMany: jest.fn() },
    category: { findMany: jest.fn() },
    variant: { findMany: jest.fn() },
    option: { findMany: jest.fn() },
  },
}));

const tenantScopedMock = tenantScopedPrisma as unknown as {
  product: { findMany: jest.Mock };
  category: { findMany: jest.Mock };
  variant: { findMany: jest.Mock };
  option: { findMany: jest.Mock };
};

describe("SearchService", () => {
  const service = new SearchService();

  beforeEach(() => {
    jest.clearAllMocks();
    tenantScopedMock.product.findMany.mockResolvedValue([]);
    tenantScopedMock.category.findMany.mockResolvedValue([]);
    tenantScopedMock.variant.findMany.mockResolvedValue([]);
    tenantScopedMock.option.findMany.mockResolvedValue([]);
  });

  it("returns an empty array without querying the database for a blank query", async () => {
    const result = await service.search("   ");

    expect(result).toEqual([]);
    expect(tenantScopedMock.product.findMany).not.toHaveBeenCalled();
  });

  it("searches all four models case-insensitively within the tenant", async () => {
    await service.search("burger");

    expect(tenantScopedMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { name: { contains: "burger", mode: "insensitive" }, deletedAt: null } }),
    );
    expect(tenantScopedMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { name: { contains: "burger", mode: "insensitive" } } }),
    );
  });

  it("groups results by type with a human-readable breadcrumb", async () => {
    tenantScopedMock.product.findMany.mockResolvedValue([
      { id: "p1", name: "Cheeseburger", categoryId: "c1", category: { name: "Burgerler" } },
    ]);
    tenantScopedMock.category.findMany.mockResolvedValue([
      { id: "c1", name: "Burgerler", menu: { name: "Ana Menü" } },
    ]);

    const result = await service.search("burger");

    expect(result).toContainEqual({
      type: "product",
      id: "p1",
      name: "Cheeseburger",
      breadcrumb: "Burgerler",
      categoryId: "c1",
    });
    expect(result).toContainEqual({
      type: "category",
      id: "c1",
      name: "Burgerler",
      breadcrumb: "Ana Menü",
      categoryId: "c1",
    });
  });

  it("excludes a variant/option whose parent product is soft-deleted", async () => {
    tenantScopedMock.variant.findMany.mockResolvedValue([
      { id: "v1", name: "Büyük", product: { deletedAt: new Date(), categoryId: "c1", name: "Gone" } },
    ]);

    const result = await service.search("büyük");

    expect(result).toEqual([]);
  });
});
