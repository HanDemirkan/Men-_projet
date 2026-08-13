import { HttpStatus } from "@nestjs/common";
import { prisma, tenantScopedPrisma } from "@qr-platform/database";
import { StorageValidationError } from "@qr-platform/storage";
import type { StorageService } from "@qr-platform/storage";
import sharp from "sharp";

import { AppException } from "../../common/exceptions/app.exception";

import { MediaService } from "./media.service";

jest.mock("@qr-platform/database", () => ({
  prisma: { media: { findUnique: jest.fn() } },
  tenantScopedPrisma: {
    media: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
  },
}));

jest.mock("sharp", () =>
  jest.fn(() => ({
    metadata: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from("thumbnail-bytes")),
  })),
);

const tenantScopedMock = tenantScopedPrisma as unknown as {
  media: { create: jest.Mock; findUnique: jest.Mock; delete: jest.Mock };
};
const prismaMock = prisma as unknown as { media: { findUnique: jest.Mock } };

function createStorageMock(): jest.Mocked<StorageService> {
  return {
    save: jest.fn().mockResolvedValue({ key: "irrelevant", absolutePath: "/x", sizeBytes: 1, mimeType: "image/png" }),
    getAbsolutePath: jest.fn((key: string) => `/storage-root/${key}`),
    exists: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
  };
}

describe("MediaService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("upload", () => {
    it("rejects an unsupported mime type before touching storage", async () => {
      const storage = createStorageMock();
      const service = new MediaService(storage);

      await expect(
        service.upload({
          tenantId: "tenant-1",
          type: "IMAGE",
          buffer: Buffer.from("data"),
          mimeType: "application/pdf",
          originalFilename: "doc.pdf",
          uploadedByUserId: "user-1",
        }),
      ).rejects.toThrow(AppException);
      expect(storage.save).not.toHaveBeenCalled();
    });

    it("maps a StorageValidationError (size/mime rejected by the storage layer) to a 400 AppException", async () => {
      const storage = createStorageMock();
      storage.save.mockRejectedValueOnce(new StorageValidationError("File too large"));
      const service = new MediaService(storage);

      await expect(
        service.upload({
          tenantId: "tenant-1",
          type: "IMAGE",
          buffer: Buffer.from("data"),
          mimeType: "image/png",
          originalFilename: "big.png",
          uploadedByUserId: "user-1",
        }),
      ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST, code: "MEDIA_VALIDATION_FAILED" });
    });

    it("saves the original and a resized thumbnail, then creates a Media row with both keys", async () => {
      const storage = createStorageMock();
      tenantScopedMock.media.create.mockImplementation(({ data }) => Promise.resolve({ id: "media-1", ...data }));
      const service = new MediaService(storage);

      const result = await service.upload({
        tenantId: "tenant-1",
        type: "LOGO",
        buffer: Buffer.from("original-bytes"),
        mimeType: "image/png",
        originalFilename: "logo.png",
        uploadedByUserId: "user-1",
      });

      expect(storage.save).toHaveBeenCalledTimes(2);
      const [[originalCall], [thumbnailCall]] = storage.save.mock.calls as unknown as [
        [{ key: string; data: Buffer }],
        [{ key: string; data: Buffer }],
      ];
      expect(originalCall.key).toMatch(/^tenants\/tenant-1\/media\/.+\.png$/);
      expect(thumbnailCall.key).toBe(originalCall.key.replace(".png", "-thumb.png"));
      expect(thumbnailCall.data.toString()).toBe("thumbnail-bytes");

      expect(tenantScopedMock.media.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: "tenant-1",
          type: "LOGO",
          width: 800,
          height: 600,
          thumbnailKey: thumbnailCall.key,
        }),
      });
      expect(result.thumbnailKey).toBe(thumbnailCall.key);
    });

    it("resizes with fit:inside so the thumbnail never upscales or distorts aspect ratio", async () => {
      const storage = createStorageMock();
      tenantScopedMock.media.create.mockResolvedValue({ id: "media-1" });
      const service = new MediaService(storage);

      await service.upload({
        tenantId: "tenant-1",
        type: "PRODUCT",
        buffer: Buffer.from("x"),
        mimeType: "image/webp",
        originalFilename: "p.webp",
        uploadedByUserId: "user-1",
      });

      // sharp(buffer) is called twice: once for .metadata(), once for the
      // thumbnail's .resize().toBuffer() - each mocked call yields a fresh
      // instance, so the resize assertion is against the second one.
      const sharpMock = sharp as unknown as jest.Mock;
      const instance = sharpMock.mock.results[1]?.value as { resize: jest.Mock };
      expect(instance.resize).toHaveBeenCalledWith(400, 400, { fit: "inside", withoutEnlargement: true });
    });
  });

  describe("delete", () => {
    it("throws MEDIA_NOT_FOUND when the row doesn't exist (or belongs to another tenant)", async () => {
      const storage = createStorageMock();
      tenantScopedMock.media.findUnique.mockResolvedValue(null);
      const service = new MediaService(storage);

      await expect(service.delete("gone")).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
        code: "MEDIA_NOT_FOUND",
      });
      expect(storage.delete).not.toHaveBeenCalled();
    });

    it("deletes the DB row and both the original and thumbnail files", async () => {
      const storage = createStorageMock();
      tenantScopedMock.media.findUnique.mockResolvedValue({
        id: "media-1",
        key: "tenants/t/media/a.png",
        thumbnailKey: "tenants/t/media/a-thumb.png",
      });
      const service = new MediaService(storage);

      await service.delete("media-1");

      expect(tenantScopedMock.media.delete).toHaveBeenCalledWith({ where: { id: "media-1" } });
      expect(storage.delete).toHaveBeenCalledWith("tenants/t/media/a.png");
      expect(storage.delete).toHaveBeenCalledWith("tenants/t/media/a-thumb.png");
    });

    it("does not attempt to delete a thumbnail file when none exists", async () => {
      const storage = createStorageMock();
      tenantScopedMock.media.findUnique.mockResolvedValue({
        id: "media-1",
        key: "tenants/t/media/a.png",
        thumbnailKey: null,
      });
      const service = new MediaService(storage);

      await service.delete("media-1");

      expect(storage.delete).toHaveBeenCalledTimes(1);
      expect(storage.delete).toHaveBeenCalledWith("tenants/t/media/a.png");
    });
  });

  describe("findByIdUnscoped", () => {
    it("uses the raw (unscoped) prisma client, not tenantScopedPrisma", async () => {
      const storage = createStorageMock();
      prismaMock.media.findUnique.mockResolvedValue({ id: "media-1" });
      const service = new MediaService(storage);

      await service.findByIdUnscoped("media-1");

      expect(prismaMock.media.findUnique).toHaveBeenCalledWith({ where: { id: "media-1" } });
      expect(tenantScopedMock.media.findUnique).not.toHaveBeenCalled();
    });
  });
});
