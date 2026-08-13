import { NotFoundException } from "@nestjs/common";
import { prisma } from "@qr-platform/database";
import QRCode from "qrcode";
import sharp from "sharp";

import { QrService } from "./qr.service";

jest.mock("@qr-platform/database", () => ({
  prisma: {
    tenant: { findUnique: jest.fn() },
    media: { findUnique: jest.fn() },
  },
}));

jest.mock("node:fs/promises", () => ({
  readFile: jest.fn().mockResolvedValue(Buffer.from("logo-bytes")),
}));

jest.mock("qrcode", () => ({
  toBuffer: jest.fn().mockResolvedValue(Buffer.from("png-qr-bytes")),
  toString: jest.fn().mockResolvedValue('<svg viewBox="0 0 100 100"></svg>'),
}));

jest.mock("sharp", () =>
  jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    composite: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from("composited-bytes")),
  })),
);

const prismaMock = prisma as unknown as {
  tenant: { findUnique: jest.Mock };
  media: { findUnique: jest.Mock };
};

function createService(): QrService {
  const storage = { getAbsolutePath: jest.fn((key: string) => `/storage/${key}`) };
  const appConfig = { publicAppUrl: "http://localhost:3000" };
  return new QrService(storage as never, appConfig as never);
}

describe("QrService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("404s when the tenant doesn't exist", async () => {
    prismaMock.tenant.findUnique.mockResolvedValue(null);
    const service = createService();

    await expect(
      service.generate({ tenantId: "t1", format: "png", errorCorrectionLevel: "Q", includeLogo: false }),
    ).rejects.toThrow(NotFoundException);
  });

  it("encodes the storefront root URL (publicAppUrl/slug) tagged ?src=qr, not an arbitrary target", async () => {
    prismaMock.tenant.findUnique.mockResolvedValue({ id: "t1", slug: "sahil-cafe", logoImageId: null });
    const service = createService();

    await service.generate({ tenantId: "t1", format: "png", errorCorrectionLevel: "M", includeLogo: false });

    // The `?src=qr` tag is what lets PublicStorefrontService tell a
    // scan-originated visit apart from a direct link (see Sprint 5's
    // StorefrontView tracking).
    expect(QRCode.toBuffer).toHaveBeenCalledWith(
      "http://localhost:3000/sahil-cafe?src=qr",
      expect.objectContaining({ errorCorrectionLevel: "M", type: "png" }),
    );
  });

  it("returns the raw PNG bytes unmodified when no logo is requested", async () => {
    prismaMock.tenant.findUnique.mockResolvedValue({ id: "t1", slug: "sahil-cafe", logoImageId: null });
    const service = createService();

    const result = await service.generate({
      tenantId: "t1",
      format: "png",
      errorCorrectionLevel: "Q",
      includeLogo: false,
    });

    expect(result.contentType).toBe("image/png");
    expect(result.buffer.toString()).toBe("png-qr-bytes");
    expect(sharp).not.toHaveBeenCalled();
  });

  it("composites the tenant's logo onto the PNG when includeLogo is true", async () => {
    prismaMock.tenant.findUnique.mockResolvedValue({ id: "t1", slug: "sahil-cafe", logoImageId: "media-1" });
    prismaMock.media.findUnique.mockResolvedValue({ id: "media-1", key: "tenants/t1/logo.png" });
    const service = createService();

    const result = await service.generate({
      tenantId: "t1",
      format: "png",
      errorCorrectionLevel: "H",
      includeLogo: true,
    });

    expect(result.buffer.toString()).toBe("composited-bytes");
    expect(sharp).toHaveBeenCalled();
  });

  it("400s (via AppException) when includeLogo is true but the tenant has no logo media row", async () => {
    prismaMock.tenant.findUnique.mockResolvedValue({ id: "t1", slug: "sahil-cafe", logoImageId: "missing-media" });
    prismaMock.media.findUnique.mockResolvedValue(null);
    const service = createService();

    await expect(
      service.generate({ tenantId: "t1", format: "png", errorCorrectionLevel: "Q", includeLogo: true }),
    ).rejects.toMatchObject({ code: "MEDIA_TENANT_MISMATCH" });
  });

  it("injects an <image> element into the SVG when includeLogo is true", async () => {
    prismaMock.tenant.findUnique.mockResolvedValue({ id: "t1", slug: "sahil-cafe", logoImageId: "media-1" });
    prismaMock.media.findUnique.mockResolvedValue({ id: "media-1", key: "tenants/t1/logo.png" });
    const service = createService();

    const result = await service.generate({
      tenantId: "t1",
      format: "svg",
      errorCorrectionLevel: "Q",
      includeLogo: true,
    });

    expect(result.contentType).toBe("image/svg+xml");
    expect(result.buffer.toString()).toContain("<image");
    expect(result.buffer.toString()).toContain("</svg>");
  });

  it("returns the raw SVG string unmodified when no logo is requested", async () => {
    prismaMock.tenant.findUnique.mockResolvedValue({ id: "t1", slug: "sahil-cafe", logoImageId: null });
    const service = createService();

    const result = await service.generate({
      tenantId: "t1",
      format: "svg",
      errorCorrectionLevel: "L",
      includeLogo: false,
    });

    expect(result.buffer.toString()).toBe('<svg viewBox="0 0 100 100"></svg>');
  });
});
