import { NotFoundException } from "@nestjs/common";
import { tenantScopedPrisma } from "@qr-platform/database";

import { OptionGroupService } from "./option-group.service";

jest.mock("@qr-platform/database", () => ({
  tenantScopedPrisma: {
    optionGroup: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: { findUnique: jest.fn() },
  },
}));

jest.mock("../../common/tenant/require-tenant-id", () => ({
  requireTenantId: jest.fn().mockReturnValue("tenant-1"),
}));

const tenantScopedMock = tenantScopedPrisma as unknown as {
  optionGroup: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock };
  product: { findUnique: jest.Mock };
};

describe("OptionGroupService", () => {
  const service = new OptionGroupService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create() 404s when the parent product doesn't exist or is soft-deleted", async () => {
    tenantScopedMock.product.findUnique.mockResolvedValue({ id: "p1", deletedAt: new Date() });

    await expect(service.create("p1", { name: "Ekstralar" })).rejects.toThrow(NotFoundException);
    expect(tenantScopedMock.optionGroup.create).not.toHaveBeenCalled();
  });

  it("create() carries through required/multiple/minimum/maximum as given", async () => {
    tenantScopedMock.product.findUnique.mockResolvedValue({ id: "p1", deletedAt: null });
    tenantScopedMock.optionGroup.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: "og1", ...data }),
    );

    const result = await service.create("p1", { name: "Ekstralar", multiple: true, minimum: 0, maximum: 3 });

    expect(result).toMatchObject({ name: "Ekstralar", multiple: true, minimum: 0, maximum: 3 });
  });

  it("listByProduct() includes nested options ordered by sortOrder", async () => {
    tenantScopedMock.product.findUnique.mockResolvedValue({ id: "p1", deletedAt: null });
    tenantScopedMock.optionGroup.findMany.mockResolvedValue([]);

    await service.listByProduct("p1");

    expect(tenantScopedMock.optionGroup.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ include: { options: { orderBy: { sortOrder: "asc" } } } }),
    );
  });

  it("remove() 404s for a group that doesn't exist", async () => {
    tenantScopedMock.optionGroup.findUnique.mockResolvedValue(null);

    await expect(service.remove("missing")).rejects.toThrow(NotFoundException);
    expect(tenantScopedMock.optionGroup.delete).not.toHaveBeenCalled();
  });
});
