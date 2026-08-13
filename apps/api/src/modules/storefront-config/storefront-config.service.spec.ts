import { HttpStatus } from "@nestjs/common";
import { prisma, tenantScopedPrisma } from "@qr-platform/database";
import { DEFAULT_TEMPLATE_CODE, buildDefaultTheme } from "@qr-platform/shared";

import { StorefrontConfigService } from "./storefront-config.service";

jest.mock("@qr-platform/database", () => ({
  prisma: {
    media: { findUnique: jest.fn() },
  },
  tenantScopedPrisma: {
    tenantStorefrontConfig: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
    storefrontConfigRevision: { create: jest.fn(), findMany: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as { media: { findUnique: jest.Mock } };
const scopedMock = tenantScopedPrisma as unknown as {
  tenantStorefrontConfig: { findUnique: jest.Mock; upsert: jest.Mock; update: jest.Mock };
  storefrontConfigRevision: { create: jest.Mock; findMany: jest.Mock };
};

describe("StorefrontConfigService", () => {
  const service = new StorefrontConfigService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("get", () => {
    it("falls back to the default template's own defaults when nothing has been customized yet", async () => {
      scopedMock.tenantStorefrontConfig.findUnique.mockResolvedValue(null);

      const result = await service.get("tenant-1");

      expect(result.templateCode).toBe(DEFAULT_TEMPLATE_CODE);
      expect(result.published.theme).toEqual(buildDefaultTheme(DEFAULT_TEMPLATE_CODE));
      expect(result.hasUnpublishedChanges).toBe(false);
    });

    it("reports hasUnpublishedChanges: true when the draft differs from published", async () => {
      scopedMock.tenantStorefrontConfig.findUnique.mockResolvedValue({
        tenantId: "tenant-1",
        templateCode: DEFAULT_TEMPLATE_CODE,
        publishedConfig: null,
        draftConfig: { theme: { primaryColor: "#000000" } },
        publishedAt: null,
      });

      const result = await service.get("tenant-1");

      expect(result.hasUnpublishedChanges).toBe(true);
    });
  });

  describe("updateDraft", () => {
    it("merges partial theme changes over the current draft (or published, if no draft yet) without touching unrelated fields", async () => {
      scopedMock.tenantStorefrontConfig.findUnique.mockResolvedValue(null);
      scopedMock.tenantStorefrontConfig.upsert.mockResolvedValue({});

      const result = await service.updateDraft("tenant-1", { theme: { primaryColor: "#111111" } as never });

      expect(result.config.theme.primaryColor).toBe("#111111");
      expect(result.config.theme.secondaryColor).toBe(buildDefaultTheme(DEFAULT_TEMPLATE_CODE).secondaryColor);
      expect(scopedMock.tenantStorefrontConfig.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: "tenant-1" },
          create: expect.objectContaining({
            draftConfig: expect.objectContaining({ theme: expect.objectContaining({ primaryColor: "#111111" }) }),
          }),
        }),
      );
    });

    it("resets theme+layout to the new template's own defaults when templateCode switches, even with no other fields in the request", async () => {
      // Regression: previously, switching templateCode alone (no explicit
      // theme/layout in the same request) left the OLD template's theme and
      // layout untouched, since mergeStorefrontConfig only fills in missing
      // fields - a real template switch with no visual effect whatsoever.
      scopedMock.tenantStorefrontConfig.findUnique.mockResolvedValue({
        tenantId: "tenant-1",
        templateCode: "modern-cafe",
        draftConfig: { theme: { paletteCode: "coffee-brown" }, layout: { hero: "split" } },
        publishedConfig: null,
      });
      scopedMock.tenantStorefrontConfig.upsert.mockResolvedValue({});

      const result = await service.updateDraft("tenant-1", { templateCode: "premium-restaurant" } as never);

      expect(result.config.theme.paletteCode).toBe("deep-navy");
      expect(result.config.layout.hero).toBe("dark-overlay");
    });

    it("preserves sections/qr/seo when a template switch resets theme+layout", async () => {
      scopedMock.tenantStorefrontConfig.findUnique.mockResolvedValue({
        tenantId: "tenant-1",
        templateCode: "modern-cafe",
        draftConfig: { seo: { title: "Custom SEO Title" } },
        publishedConfig: null,
      });
      scopedMock.tenantStorefrontConfig.upsert.mockResolvedValue({});

      const result = await service.updateDraft("tenant-1", { templateCode: "premium-restaurant" } as never);

      expect(result.config.seo.title).toBe("Custom SEO Title");
    });

    it("does not reset theme/layout when templateCode is resent unchanged", async () => {
      scopedMock.tenantStorefrontConfig.findUnique.mockResolvedValue({
        tenantId: "tenant-1",
        templateCode: "modern-cafe",
        draftConfig: { theme: { primaryColor: "#123456" } },
        publishedConfig: null,
      });
      scopedMock.tenantStorefrontConfig.upsert.mockResolvedValue({});

      const result = await service.updateDraft("tenant-1", { templateCode: "modern-cafe" } as never);

      expect(result.config.theme.primaryColor).toBe("#123456");
    });

    it("an explicit theme override in the same request still wins over the new template's default", async () => {
      scopedMock.tenantStorefrontConfig.findUnique.mockResolvedValue({
        tenantId: "tenant-1",
        templateCode: "modern-cafe",
        draftConfig: {},
        publishedConfig: null,
      });
      scopedMock.tenantStorefrontConfig.upsert.mockResolvedValue({});

      const result = await service.updateDraft("tenant-1", {
        templateCode: "premium-restaurant",
        theme: { primaryColor: "#ff00ff" },
      } as never);

      expect(result.config.theme.primaryColor).toBe("#ff00ff");
      expect(result.config.layout.hero).toBe("dark-overlay");
    });

    it("rejects a faviconMediaId belonging to a different tenant", async () => {
      scopedMock.tenantStorefrontConfig.findUnique.mockResolvedValue(null);
      prismaMock.media.findUnique.mockResolvedValue({ id: "media-1", tenantId: "other-tenant" });

      await expect(
        service.updateDraft("tenant-1", { faviconMediaId: "media-1" } as never),
      ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST, code: "MEDIA_TENANT_MISMATCH" });
      expect(scopedMock.tenantStorefrontConfig.upsert).not.toHaveBeenCalled();
    });
  });

  describe("publish", () => {
    it("copies the draft into the published config and snapshots a revision", async () => {
      scopedMock.tenantStorefrontConfig.findUnique.mockResolvedValue({
        tenantId: "tenant-1",
        templateCode: DEFAULT_TEMPLATE_CODE,
        draftConfig: { theme: { ...buildDefaultTheme(DEFAULT_TEMPLATE_CODE), primaryColor: "#123456" } },
        publishedConfig: null,
        publishedAt: null,
      });
      scopedMock.tenantStorefrontConfig.upsert.mockResolvedValue({ publishedAt: new Date() });

      const result = await service.publish("tenant-1");

      expect(result.config.theme.primaryColor).toBe("#123456");
      expect(scopedMock.tenantStorefrontConfig.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: "tenant-1" },
          update: expect.objectContaining({
            publishedConfig: expect.objectContaining({ theme: expect.objectContaining({ primaryColor: "#123456" }) }),
            publishedAt: expect.any(Date),
          }),
        }),
      );
      expect(scopedMock.storefrontConfigRevision.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: "tenant-1", templateCode: DEFAULT_TEMPLATE_CODE }),
        }),
      );
    });

    it("publishing with no draft yet just republishes the current template's own defaults", async () => {
      scopedMock.tenantStorefrontConfig.findUnique.mockResolvedValue(null);
      scopedMock.tenantStorefrontConfig.upsert.mockResolvedValue({ publishedAt: new Date() });

      const result = await service.publish("tenant-1");

      expect(result.config.theme).toEqual(buildDefaultTheme(DEFAULT_TEMPLATE_CODE));
    });

    it("rejects publishing a draft whose text color doesn't meet WCAG AA against its background", async () => {
      scopedMock.tenantStorefrontConfig.findUnique.mockResolvedValue({
        tenantId: "tenant-1",
        templateCode: DEFAULT_TEMPLATE_CODE,
        draftConfig: { theme: { ...buildDefaultTheme(DEFAULT_TEMPLATE_CODE), text: "#f0f0f0", background: "#ffffff" } },
        publishedConfig: null,
        publishedAt: null,
      });

      await expect(service.publish("tenant-1")).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        code: "STOREFRONT_CONTRAST_TOO_LOW",
      });
      expect(scopedMock.tenantStorefrontConfig.upsert).not.toHaveBeenCalled();
    });
  });

  describe("revert", () => {
    it("rejects when fewer than 2 published revisions exist", async () => {
      scopedMock.storefrontConfigRevision.findMany.mockResolvedValue([{ id: "rev-1" }]);

      await expect(service.revert("tenant-1")).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        code: "NO_PREVIOUS_REVISION",
      });
      expect(scopedMock.tenantStorefrontConfig.update).not.toHaveBeenCalled();
    });

    it("re-publishes the revision immediately before the current one", async () => {
      const previousConfig = { theme: { ...buildDefaultTheme(DEFAULT_TEMPLATE_CODE), primaryColor: "#ABCDEF" } };
      scopedMock.storefrontConfigRevision.findMany.mockResolvedValue([
        { id: "rev-2", templateCode: DEFAULT_TEMPLATE_CODE, config: { theme: { primaryColor: "#123456" } } },
        { id: "rev-1", templateCode: DEFAULT_TEMPLATE_CODE, config: previousConfig },
      ]);
      scopedMock.tenantStorefrontConfig.update.mockResolvedValue({ publishedAt: new Date() });

      const result = await service.revert("tenant-1");

      expect(result.config.theme.primaryColor).toBe("#ABCDEF");
      expect(scopedMock.tenantStorefrontConfig.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: "tenant-1" },
          data: expect.objectContaining({ draftConfig: previousConfig, publishedConfig: previousConfig }),
        }),
      );
      expect(scopedMock.storefrontConfigRevision.create).toHaveBeenCalled();
    });
  });
});
