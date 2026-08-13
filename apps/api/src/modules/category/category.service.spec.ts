import { HttpStatus, NotFoundException } from "@nestjs/common";
import { Prisma, tenantScopedPrisma } from "@qr-platform/database";

import { CategoryService } from "./category.service";

jest.mock("@qr-platform/database", () => {
  const actual = jest.requireActual("@qr-platform/database");
  return {
    Prisma: actual.Prisma,
    tenantScopedPrisma: {
      category: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        aggregate: jest.fn(),
      },
      menu: { findUnique: jest.fn() },
      $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
    },
  };
});

jest.mock("../../common/tenant/require-tenant-id", () => ({
  requireTenantId: jest.fn().mockReturnValue("tenant-1"),
}));

const tenantScopedMock = tenantScopedPrisma as unknown as {
  category: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    aggregate: jest.Mock;
  };
  menu: { findUnique: jest.Mock };
  $transaction: jest.Mock;
};

describe("CategoryService", () => {
  const service = new CategoryService();

  beforeEach(() => {
    jest.clearAllMocks();
    tenantScopedMock.menu.findUnique.mockResolvedValue({ id: "menu-1" });
    // No prior categories in the menu by default - nextSortOrder() resolves to 0.
    tenantScopedMock.category.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
  });

  it("create() 404s when the parent menu doesn't exist (or belongs to another tenant)", async () => {
    tenantScopedMock.menu.findUnique.mockResolvedValue(null);

    await expect(service.create("missing-menu", { name: "Burgerler" })).rejects.toThrow(NotFoundException);
    expect(tenantScopedMock.category.create).not.toHaveBeenCalled();
  });

  it("create() stamps the created category with the menuId it was nested under", async () => {
    tenantScopedMock.category.create.mockImplementation(({ data }) => Promise.resolve({ id: "c1", ...data }));

    const result = await service.create("menu-1", { name: "Burgerler" });

    expect(result.menuId).toBe("menu-1");
  });

  it("create() auto-generates a URL-safe slug from the name when none is supplied", async () => {
    tenantScopedMock.category.create.mockImplementation(({ data }) => Promise.resolve({ id: "c1", ...data }));

    const result = await service.create("menu-1", { name: "İçecekler" });

    expect(result.slug).toBe("icecekler");
  });

  it("create() uses the caller-supplied slug instead of auto-generating one", async () => {
    tenantScopedMock.category.create.mockImplementation(({ data }) => Promise.resolve({ id: "c1", ...data }));

    const result = await service.create("menu-1", { name: "İçecekler", slug: "drinks" });

    expect(result.slug).toBe("drinks");
  });

  it("create() assigns sortOrder = (max existing in the menu) + 1 when none is supplied", async () => {
    tenantScopedMock.category.aggregate.mockResolvedValue({ _max: { sortOrder: 4 } });
    tenantScopedMock.category.create.mockImplementation(({ data }) => Promise.resolve({ id: "c1", ...data }));

    const result = await service.create("menu-1", { name: "Tatlılar" });

    expect(result.sortOrder).toBe(5);
    expect(tenantScopedMock.category.aggregate).toHaveBeenCalledWith({
      where: { menuId: "menu-1" },
      _max: { sortOrder: true },
    });
  });

  it("create() respects a caller-supplied sortOrder instead of computing one", async () => {
    tenantScopedMock.category.create.mockImplementation(({ data }) => Promise.resolve({ id: "c1", ...data }));

    const result = await service.create("menu-1", { name: "Tatlılar", sortOrder: 0 });

    expect(result.sortOrder).toBe(0);
    expect(tenantScopedMock.category.aggregate).not.toHaveBeenCalled();
  });

  it("create() maps a unique-constraint violation on slug to a 409 SLUG_ALREADY_EXISTS AppException", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "5.22.0",
    });
    tenantScopedMock.category.create.mockRejectedValue(prismaError);

    await expect(service.create("menu-1", { name: "İçecekler" })).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
      code: "SLUG_ALREADY_EXISTS",
    });
  });

  describe("reorder", () => {
    it("validates every id exists via a single findMany, before issuing any update", async () => {
      tenantScopedMock.category.findMany.mockResolvedValue([{ id: "c1" }]);

      await expect(
        service.reorder({ items: [{ id: "c1", sortOrder: 0 }, { id: "c2", sortOrder: 1 }] }),
      ).rejects.toThrow(NotFoundException);
      expect(tenantScopedMock.category.findMany).toHaveBeenCalledTimes(1);
      expect(tenantScopedMock.category.findMany).toHaveBeenCalledWith({
        where: { id: { in: ["c1", "c2"] } },
        select: { id: true },
      });
      expect(tenantScopedMock.$transaction).not.toHaveBeenCalled();
    });

    it("applies all sortOrder updates as a single transaction", async () => {
      tenantScopedMock.category.findMany.mockResolvedValue([{ id: "c1" }, { id: "c2" }]);
      tenantScopedMock.category.update.mockResolvedValue({ id: "c1" });

      await service.reorder({
        items: [
          { id: "c1", sortOrder: 1 },
          { id: "c2", sortOrder: 0 },
        ],
      });

      expect(tenantScopedMock.$transaction).toHaveBeenCalledTimes(1);
      expect(tenantScopedMock.category.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: { sortOrder: 1 },
      });
      expect(tenantScopedMock.category.update).toHaveBeenCalledWith({
        where: { id: "c2" },
        data: { sortOrder: 0 },
      });
    });
  });

  describe("listAllWithMenuName", () => {
    it("issues a single query and flattens the joined menu name onto each category", async () => {
      tenantScopedMock.category.findMany.mockResolvedValue([
        { id: "c1", name: "Sıcak İçecekler", menu: { name: "Ana Menü" } },
        { id: "c2", name: "Tatlılar", menu: { name: "Ana Menü" } },
      ]);

      const result = await service.listAllWithMenuName();

      expect(tenantScopedMock.category.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        { id: "c1", name: "Sıcak İçecekler", menuName: "Ana Menü" },
        { id: "c2", name: "Tatlılar", menuName: "Ana Menü" },
      ]);
    });
  });

  it("remove() 404s when the category doesn't exist, and never calls delete", async () => {
    tenantScopedMock.category.findUnique.mockResolvedValue(null);

    await expect(service.remove("missing")).rejects.toThrow(NotFoundException);
    expect(tenantScopedMock.category.delete).not.toHaveBeenCalled();
  });
});
