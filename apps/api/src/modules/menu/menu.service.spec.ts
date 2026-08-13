import { NotFoundException } from "@nestjs/common";
import { tenantScopedPrisma } from "@qr-platform/database";

import { MenuService } from "./menu.service";

jest.mock("@qr-platform/database", () => ({
  tenantScopedPrisma: {
    menu: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

jest.mock("../../common/tenant/require-tenant-id", () => ({
  requireTenantId: jest.fn().mockReturnValue("tenant-1"),
}));

const tenantScopedMock = tenantScopedPrisma as unknown as {
  menu: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    aggregate: jest.Mock;
  };
};

describe("MenuService", () => {
  const service = new MenuService();

  beforeEach(() => {
    jest.clearAllMocks();
    // No prior menus for the tenant by default - nextSortOrder() resolves to 0.
    tenantScopedMock.menu.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
  });

  it("create() stamps the menu with the current tenant and parses date strings", async () => {
    tenantScopedMock.menu.create.mockImplementation(({ data }) => Promise.resolve({ id: "m1", ...data }));

    const result = await service.create({ name: "Ana Menü", activeFrom: "2026-01-01T00:00:00.000Z" });

    expect(result.tenantId).toBe("tenant-1");
    expect(tenantScopedMock.menu.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ activeFrom: new Date("2026-01-01T00:00:00.000Z") }) }),
    );
  });

  it("create() assigns sortOrder = (max existing for the tenant) + 1 when none is supplied", async () => {
    tenantScopedMock.menu.aggregate.mockResolvedValue({ _max: { sortOrder: 1 } });
    tenantScopedMock.menu.create.mockImplementation(({ data }) => Promise.resolve({ id: "m1", ...data }));

    const result = await service.create({ name: "Ana Menü" });

    expect(result.sortOrder).toBe(2);
    expect(tenantScopedMock.menu.aggregate).toHaveBeenCalledWith({ _max: { sortOrder: true } });
  });

  it("create() respects a caller-supplied sortOrder instead of computing one", async () => {
    tenantScopedMock.menu.create.mockImplementation(({ data }) => Promise.resolve({ id: "m1", ...data }));

    const result = await service.create({ name: "Ana Menü", sortOrder: 0 });

    expect(result.sortOrder).toBe(0);
    expect(tenantScopedMock.menu.aggregate).not.toHaveBeenCalled();
  });

  it("get() throws NotFoundException for a missing (or cross-tenant) menu", async () => {
    tenantScopedMock.menu.findUnique.mockResolvedValue(null);

    await expect(service.get("missing")).rejects.toThrow(NotFoundException);
  });

  it("update() 404s before attempting the update when the menu doesn't exist", async () => {
    tenantScopedMock.menu.findUnique.mockResolvedValue(null);

    await expect(service.update("missing", { name: "New" })).rejects.toThrow(NotFoundException);
    expect(tenantScopedMock.menu.update).not.toHaveBeenCalled();
  });

  it("remove() 404s before attempting the delete when the menu doesn't exist", async () => {
    tenantScopedMock.menu.findUnique.mockResolvedValue(null);

    await expect(service.remove("missing")).rejects.toThrow(NotFoundException);
    expect(tenantScopedMock.menu.delete).not.toHaveBeenCalled();
  });

  it("remove() deletes the row once existence is confirmed", async () => {
    tenantScopedMock.menu.findUnique.mockResolvedValue({ id: "m1" });

    await service.remove("m1");

    expect(tenantScopedMock.menu.delete).toHaveBeenCalledWith({ where: { id: "m1" } });
  });
});
