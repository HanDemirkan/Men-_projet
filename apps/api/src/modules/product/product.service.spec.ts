import { HttpStatus, NotFoundException } from "@nestjs/common";
import { Prisma, tenantScopedPrisma } from "@qr-platform/database";

import { ProductService } from "./product.service";

jest.mock("@qr-platform/database", () => {
  const actual = jest.requireActual("@qr-platform/database");
  return {
    Prisma: actual.Prisma,
    tenantScopedPrisma: {
      product: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        aggregate: jest.fn(),
      },
      category: { findUnique: jest.fn() },
      $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
    },
  };
});

jest.mock("../../common/tenant/require-tenant-id", () => ({
  requireTenantId: jest.fn().mockReturnValue("tenant-1"),
}));

const tenantScopedMock = tenantScopedPrisma as unknown as {
  product: {
    create: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
    aggregate: jest.Mock;
  };
  category: { findUnique: jest.Mock };
  $transaction: jest.Mock;
};

function activeProduct(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return { id: "product-1", categoryId: "category-1", name: "Burger", slug: "burger", deletedAt: null, ...overrides };
}

describe("ProductService", () => {
  const service = new ProductService();

  beforeEach(() => {
    jest.clearAllMocks();
    tenantScopedMock.category.findUnique.mockResolvedValue({ id: "category-1" });
    // No prior products in the category by default - nextSortOrder() resolves to 0.
    tenantScopedMock.product.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
  });

  describe("create", () => {
    it("auto-generates a URL-safe slug from the name, transliterating Turkish characters", async () => {
      tenantScopedMock.product.create.mockImplementation(({ data }) => Promise.resolve({ id: "p1", ...data }));

      const result = await service.create("category-1", { name: "Çilekli Şef Salatası", price: 10 } as never);

      expect(result.slug).toBe("cilekli-sef-salatasi");
    });

    it("uses the caller-supplied slug instead of auto-generating one when provided", async () => {
      tenantScopedMock.product.create.mockImplementation(({ data }) => Promise.resolve({ id: "p1", ...data }));

      const result = await service.create("category-1", { name: "Burger", slug: "custom-slug", price: 10 } as never);

      expect(result.slug).toBe("custom-slug");
    });

    it("throws NotFoundException when the parent category doesn't exist (or belongs to another tenant)", async () => {
      tenantScopedMock.category.findUnique.mockResolvedValue(null);

      await expect(service.create("missing-category", { name: "Burger", price: 10 } as never)).rejects.toThrow(
        NotFoundException,
      );
      expect(tenantScopedMock.product.create).not.toHaveBeenCalled();
    });

    it("assigns sortOrder = (max existing in the category) + 1 when none is supplied", async () => {
      tenantScopedMock.product.aggregate.mockResolvedValue({ _max: { sortOrder: 2 } });
      tenantScopedMock.product.create.mockImplementation(({ data }) => Promise.resolve({ id: "p1", ...data }));

      const result = await service.create("category-1", { name: "Burger", price: 10 } as never);

      expect(result.sortOrder).toBe(3);
      expect(tenantScopedMock.product.aggregate).toHaveBeenCalledWith({
        where: { categoryId: "category-1" },
        _max: { sortOrder: true },
      });
    });

    it("respects a caller-supplied sortOrder instead of computing one", async () => {
      tenantScopedMock.product.create.mockImplementation(({ data }) => Promise.resolve({ id: "p1", ...data }));

      const result = await service.create("category-1", { name: "Burger", price: 10, sortOrder: 0 } as never);

      expect(result.sortOrder).toBe(0);
      expect(tenantScopedMock.product.aggregate).not.toHaveBeenCalled();
    });

    it("maps a unique-constraint violation on slug to a 409 SLUG_ALREADY_EXISTS AppException", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.22.0",
      });
      tenantScopedMock.product.create.mockRejectedValue(prismaError);

      await expect(service.create("category-1", { name: "Burger", price: 10 } as never)).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
        code: "SLUG_ALREADY_EXISTS",
      });
    });

    it("rethrows an unrelated database error unchanged", async () => {
      const otherError = new Error("connection lost");
      tenantScopedMock.product.create.mockRejectedValue(otherError);

      await expect(service.create("category-1", { name: "Burger", price: 10 } as never)).rejects.toBe(otherError);
    });
  });

  describe("soft delete", () => {
    it("get() excludes a soft-deleted product (404, not the deleted row)", async () => {
      tenantScopedMock.product.findUnique.mockResolvedValue(activeProduct({ deletedAt: new Date() }));

      await expect(service.get("product-1")).rejects.toThrow(NotFoundException);
    });

    it("get() returns an active (non-deleted) product", async () => {
      tenantScopedMock.product.findUnique.mockResolvedValue(activeProduct());

      await expect(service.get("product-1")).resolves.toMatchObject({ id: "product-1" });
    });

    it("listByCategory() always filters deletedAt: null at the query level", async () => {
      tenantScopedMock.product.findMany.mockResolvedValue([]);

      await service.listByCategory("category-1");

      expect(tenantScopedMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { categoryId: "category-1", deletedAt: null } }),
      );
    });

    it("remove() sets deletedAt instead of issuing a hard delete", async () => {
      tenantScopedMock.product.findUnique.mockResolvedValue(activeProduct());

      await service.remove("product-1");

      expect(tenantScopedMock.product.update).toHaveBeenCalledWith({
        where: { id: "product-1" },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it("remove() 404s if the product is already soft-deleted (can't delete twice)", async () => {
      tenantScopedMock.product.findUnique.mockResolvedValue(activeProduct({ deletedAt: new Date() }));

      await expect(service.remove("product-1")).rejects.toThrow(NotFoundException);
      expect(tenantScopedMock.product.update).not.toHaveBeenCalled();
    });
  });

  describe("reorder", () => {
    it("validates every id exists (and is not soft-deleted) before issuing any update", async () => {
      tenantScopedMock.product.findMany.mockResolvedValue([{ id: "p1" }]);

      await expect(
        service.reorder({ items: [{ id: "p1", sortOrder: 0 }, { id: "p2", sortOrder: 1 }] }),
      ).rejects.toThrow(NotFoundException);
      expect(tenantScopedMock.product.findMany).toHaveBeenCalledWith({
        where: { id: { in: ["p1", "p2"] }, deletedAt: null },
        select: { id: true },
      });
      expect(tenantScopedMock.$transaction).not.toHaveBeenCalled();
    });

    it("applies all sortOrder updates as a single transaction", async () => {
      tenantScopedMock.product.findMany.mockResolvedValue([{ id: "p1" }, { id: "p2" }]);
      tenantScopedMock.product.update.mockResolvedValue(activeProduct());

      await service.reorder({
        items: [
          { id: "p1", sortOrder: 0 },
          { id: "p2", sortOrder: 1 },
        ],
      });

      expect(tenantScopedMock.$transaction).toHaveBeenCalledTimes(1);
      expect(tenantScopedMock.product.update).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: { sortOrder: 0 },
      });
      expect(tenantScopedMock.product.update).toHaveBeenCalledWith({
        where: { id: "p2" },
        data: { sortOrder: 1 },
      });
    });
  });

  describe("restore", () => {
    it("clears deletedAt on a soft-deleted product", async () => {
      tenantScopedMock.product.findUnique.mockResolvedValue(activeProduct({ deletedAt: new Date() }));
      tenantScopedMock.product.update.mockResolvedValue(activeProduct({ deletedAt: null }));

      await service.restore("product-1");

      expect(tenantScopedMock.product.update).toHaveBeenCalledWith({
        where: { id: "product-1" },
        data: { deletedAt: null },
      });
    });

    it("404s when the product doesn't exist (unlike get(), does not itself filter deletedAt)", async () => {
      tenantScopedMock.product.findUnique.mockResolvedValue(null);

      await expect(service.restore("missing")).rejects.toThrow(NotFoundException);
    });
  });

  describe("bulkUpdate", () => {
    it("issues a single updateMany for isAvailable/isFeatured/archived changes together", async () => {
      tenantScopedMock.product.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.bulkUpdate({
        ids: ["p1", "p2", "p3"],
        data: { isAvailable: false, isFeatured: true, archived: true },
      });

      expect(tenantScopedMock.product.updateMany).toHaveBeenCalledTimes(1);
      expect(tenantScopedMock.product.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["p1", "p2", "p3"] } },
        data: { isAvailable: false, isFeatured: true, deletedAt: expect.any(Date) },
      });
      expect(result).toEqual({ updated: 3 });
    });

    it("archived: false clears deletedAt instead of setting it", async () => {
      tenantScopedMock.product.updateMany.mockResolvedValue({ count: 1 });

      await service.bulkUpdate({ ids: ["p1"], data: { archived: false } });

      expect(tenantScopedMock.product.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["p1"] } },
        data: { deletedAt: null },
      });
    });
  });

  describe("duplicate", () => {
    it("deep-clones variants and option groups/options, resets isFeatured, and appends a -kopya slug", async () => {
      tenantScopedMock.product.findUnique.mockResolvedValue(
        activeProduct({
          name: "Burger",
          slug: "burger",
          sortOrder: 2,
          isFeatured: true,
          variants: [{ name: "Büyük", price: "10.00", sortOrder: 0 }],
          optionGroups: [
            {
              name: "Ekstralar",
              required: false,
              multiple: true,
              minimum: 0,
              maximum: null,
              sortOrder: 0,
              options: [{ name: "Peynir", price: "5.00", sortOrder: 0, available: true }],
            },
          ],
        }),
      );
      tenantScopedMock.product.findFirst.mockResolvedValue(null);
      tenantScopedMock.product.create.mockImplementation(({ data }) => Promise.resolve({ id: "p-copy", ...data }));

      const result = await service.duplicate("product-1");

      expect(result.slug).toBe("burger-kopya");
      expect(result.name).toBe("Burger (Kopya)");
      expect(result.isFeatured).toBe(false);
      const createCall = tenantScopedMock.product.create.mock.calls[0][0];
      expect(createCall.data.variants.create).toHaveLength(1);
      expect(createCall.data.optionGroups.create[0].options.create).toHaveLength(1);
    });

    it("de-duplicates the slug when the -kopya suffix is already taken", async () => {
      tenantScopedMock.product.findUnique.mockResolvedValue(
        activeProduct({ slug: "burger", variants: [], optionGroups: [] }),
      );
      tenantScopedMock.product.findFirst
        .mockResolvedValueOnce(activeProduct({ id: "existing" })) // "burger-kopya" taken
        .mockResolvedValueOnce(null); // "burger-kopya-2" free
      tenantScopedMock.product.create.mockImplementation(({ data }) => Promise.resolve({ id: "p-copy", ...data }));

      const result = await service.duplicate("product-1");

      expect(result.slug).toBe("burger-kopya-2");
    });

    it("404s when duplicating a soft-deleted product", async () => {
      tenantScopedMock.product.findUnique.mockResolvedValue(activeProduct({ deletedAt: new Date() }));

      await expect(service.duplicate("product-1")).rejects.toThrow(NotFoundException);
      expect(tenantScopedMock.product.create).not.toHaveBeenCalled();
    });
  });
});
