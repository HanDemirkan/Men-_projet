import { HttpStatus, NotFoundException } from "@nestjs/common";
import { Prisma, prisma } from "@qr-platform/database";

import { BusinessProfileService } from "./business-profile.service";

jest.mock("@qr-platform/database", () => {
  const actual = jest.requireActual("@qr-platform/database");
  return {
    Prisma: actual.Prisma,
    prisma: {
      tenant: { findUnique: jest.fn(), update: jest.fn() },
      media: { findUnique: jest.fn() },
      tenantSlugAlias: { deleteMany: jest.fn(), upsert: jest.fn() },
    },
  };
});

const prismaMock = prisma as unknown as {
  tenant: { findUnique: jest.Mock; update: jest.Mock };
  media: { findUnique: jest.Mock };
  tenantSlugAlias: { deleteMany: jest.Mock; upsert: jest.Mock };
};

describe("BusinessProfileService", () => {
  const service = new BusinessProfileService();

  beforeEach(() => {
    jest.clearAllMocks();
    // `update()` always looks up the current row first (to know whether
    // `slug` is actually changing) - every test below that doesn't care
    // about slug-archiving gets a stable default so it isn't forced to stub
    // this out itself.
    prismaMock.tenant.findUnique.mockResolvedValue({ slug: "tenant-1-slug" });
  });

  describe("get", () => {
    it("throws NotFoundException when the tenant doesn't exist", async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(null);

      await expect(service.get("missing")).rejects.toThrow(NotFoundException);
    });

    it("returns the tenant row for a valid id", async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({ id: "tenant-1", name: "Sahil Cafe" });

      await expect(service.get("tenant-1")).resolves.toMatchObject({ id: "tenant-1" });
    });
  });

  describe("update", () => {
    it("rejects a logoImageId that belongs to a different tenant's media", async () => {
      prismaMock.media.findUnique.mockResolvedValue({ id: "media-1", tenantId: "other-tenant" });

      await expect(service.update("tenant-1", { logoImageId: "media-1" })).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        code: "MEDIA_TENANT_MISMATCH",
      });
      expect(prismaMock.tenant.update).not.toHaveBeenCalled();
    });

    it("rejects a logoImageId that doesn't exist at all", async () => {
      prismaMock.media.findUnique.mockResolvedValue(null);

      await expect(service.update("tenant-1", { logoImageId: "nonexistent" })).rejects.toMatchObject({
        code: "MEDIA_TENANT_MISMATCH",
      });
    });

    it("accepts a logoImageId that genuinely belongs to the same tenant", async () => {
      prismaMock.media.findUnique.mockResolvedValue({ id: "media-1", tenantId: "tenant-1" });
      prismaMock.tenant.update.mockResolvedValue({ id: "tenant-1", logoImageId: "media-1" });

      await expect(service.update("tenant-1", { logoImageId: "media-1" })).resolves.toMatchObject({
        logoImageId: "media-1",
      });
    });

    it("does not validate media ownership when logoImageId/coverImageId are omitted", async () => {
      prismaMock.tenant.update.mockResolvedValue({ id: "tenant-1", about: "Updated" });

      await service.update("tenant-1", { about: "Updated" });

      expect(prismaMock.media.findUnique).not.toHaveBeenCalled();
    });

    it("allows explicitly clearing logoImageId to null without a media lookup", async () => {
      prismaMock.tenant.update.mockResolvedValue({ id: "tenant-1", logoImageId: null });

      await service.update("tenant-1", { logoImageId: null });

      expect(prismaMock.media.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.tenant.update).toHaveBeenCalledWith({
        where: { id: "tenant-1" },
        data: { logoImageId: null },
      });
    });

    it("maps a unique-constraint violation on slug to a 409 SLUG_ALREADY_EXISTS AppException", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.22.0",
      });
      prismaMock.tenant.update.mockRejectedValue(prismaError);

      await expect(service.update("tenant-1", { slug: "taken-slug" })).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
        code: "SLUG_ALREADY_EXISTS",
      });
      expect(prismaMock.tenantSlugAlias.upsert).not.toHaveBeenCalled();
    });

    it("does not touch the alias table when a request omits slug entirely", async () => {
      prismaMock.tenant.update.mockResolvedValue({ id: "tenant-1", about: "Updated" });

      await service.update("tenant-1", { about: "Updated" });

      expect(prismaMock.tenantSlugAlias.upsert).not.toHaveBeenCalled();
      expect(prismaMock.tenantSlugAlias.deleteMany).not.toHaveBeenCalled();
    });

    it("does not archive anything when the submitted slug matches the current one", async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({ slug: "same-slug" });
      prismaMock.tenant.update.mockResolvedValue({ id: "tenant-1", slug: "same-slug" });

      await service.update("tenant-1", { slug: "same-slug" });

      expect(prismaMock.tenantSlugAlias.upsert).not.toHaveBeenCalled();
    });

    it("archives the old slug pointing at this tenant when the slug genuinely changes (QR permanence)", async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({ slug: "old-slug" });
      prismaMock.tenant.update.mockResolvedValue({ id: "tenant-1", slug: "new-slug" });

      await service.update("tenant-1", { slug: "new-slug" });

      expect(prismaMock.tenantSlugAlias.upsert).toHaveBeenCalledWith({
        where: { oldSlug: "old-slug" },
        create: { oldSlug: "old-slug", tenantId: "tenant-1" },
        update: { tenantId: "tenant-1" },
      });
    });

    it("drops any stale alias that pointed at the newly-claimed slug (an active slug always wins)", async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({ slug: "old-slug" });
      prismaMock.tenant.update.mockResolvedValue({ id: "tenant-1", slug: "new-slug" });

      await service.update("tenant-1", { slug: "new-slug" });

      expect(prismaMock.tenantSlugAlias.deleteMany).toHaveBeenCalledWith({ where: { oldSlug: "new-slug" } });
    });

    it("does not archive a slug when the tenant.update call itself fails", async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({ slug: "old-slug" });
      prismaMock.tenant.update.mockRejectedValue(new Error("db exploded"));

      await expect(service.update("tenant-1", { slug: "new-slug" })).rejects.toThrow("db exploded");
      expect(prismaMock.tenantSlugAlias.upsert).not.toHaveBeenCalled();
    });
  });
});
