import { NotFoundException } from "@nestjs/common";
import { tenantScopedPrisma } from "@qr-platform/database";

import { OptionService } from "./option.service";

jest.mock("@qr-platform/database", () => ({
  tenantScopedPrisma: {
    option: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
    optionGroup: { findUnique: jest.fn() },
  },
}));

jest.mock("../../common/tenant/require-tenant-id", () => ({
  requireTenantId: jest.fn().mockReturnValue("tenant-1"),
}));

const tenantScopedMock = tenantScopedPrisma as unknown as {
  option: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock };
  optionGroup: { findUnique: jest.Mock };
};

describe("OptionService", () => {
  const service = new OptionService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create() 404s when the parent option group doesn't exist", async () => {
    tenantScopedMock.optionGroup.findUnique.mockResolvedValue(null);

    await expect(service.create("missing-group", { name: "Ekstra Peynir" })).rejects.toThrow(
      NotFoundException,
    );
    expect(tenantScopedMock.option.create).not.toHaveBeenCalled();
  });

  it("create() succeeds for an existing option group", async () => {
    tenantScopedMock.optionGroup.findUnique.mockResolvedValue({ id: "og1" });
    tenantScopedMock.option.create.mockImplementation(({ data }) => Promise.resolve({ id: "o1", ...data }));

    const result = await service.create("og1", { name: "Ekstra Peynir", price: 15 });

    expect(result).toMatchObject({ optionGroupId: "og1", name: "Ekstra Peynir", price: 15 });
  });

  it("remove() 404s for an option that doesn't exist", async () => {
    tenantScopedMock.option.findUnique.mockResolvedValue(null);

    await expect(service.remove("missing")).rejects.toThrow(NotFoundException);
    expect(tenantScopedMock.option.delete).not.toHaveBeenCalled();
  });
});
