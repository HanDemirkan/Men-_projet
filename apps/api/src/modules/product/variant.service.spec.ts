import { NotFoundException } from "@nestjs/common";
import { tenantScopedPrisma } from "@qr-platform/database";

import { VariantService } from "./variant.service";

jest.mock("@qr-platform/database", () => ({
  tenantScopedPrisma: {
    variant: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
    product: { findUnique: jest.fn() },
  },
}));

jest.mock("../../common/tenant/require-tenant-id", () => ({
  requireTenantId: jest.fn().mockReturnValue("tenant-1"),
}));

const tenantScopedMock = tenantScopedPrisma as unknown as {
  variant: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock };
  product: { findUnique: jest.Mock };
};

describe("VariantService", () => {
  const service = new VariantService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create() 404s when the parent product doesn't exist", async () => {
    tenantScopedMock.product.findUnique.mockResolvedValue(null);

    await expect(service.create("missing-product", { name: "Büyük", price: 10 })).rejects.toThrow(
      NotFoundException,
    );
    expect(tenantScopedMock.variant.create).not.toHaveBeenCalled();
  });

  it("create() 404s when the parent product is soft-deleted", async () => {
    tenantScopedMock.product.findUnique.mockResolvedValue({ id: "p1", deletedAt: new Date() });

    await expect(service.create("p1", { name: "Büyük", price: 10 })).rejects.toThrow(NotFoundException);
  });

  it("create() succeeds for an active product and carries its price through unchanged", async () => {
    tenantScopedMock.product.findUnique.mockResolvedValue({ id: "p1", deletedAt: null });
    tenantScopedMock.variant.create.mockImplementation(({ data }) => Promise.resolve({ id: "v1", ...data }));

    const result = await service.create("p1", { name: "Büyük", price: 169.9 });

    expect(result).toMatchObject({ productId: "p1", name: "Büyük", price: 169.9 });
  });

  it("remove() 404s for a variant that doesn't exist, and never calls delete", async () => {
    tenantScopedMock.variant.findUnique.mockResolvedValue(null);

    await expect(service.remove("missing")).rejects.toThrow(NotFoundException);
    expect(tenantScopedMock.variant.delete).not.toHaveBeenCalled();
  });
});
