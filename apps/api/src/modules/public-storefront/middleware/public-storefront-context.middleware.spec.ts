import { prisma, runWithTenantContext } from "@qr-platform/database";

import type { RequestWithId } from "../../../common/types/request-context.types";

import { PublicStorefrontContextMiddleware } from "./public-storefront-context.middleware";

jest.mock("@qr-platform/database", () => ({
  prisma: {
    tenant: { findUnique: jest.fn() },
    tenantSlugAlias: { findUnique: jest.fn() },
  },
  runWithTenantContext: jest.fn((_id: string, fn: () => void) => fn()),
}));

const prismaMock = prisma as unknown as {
  tenant: { findUnique: jest.Mock };
  tenantSlugAlias: { findUnique: jest.Mock };
};

function mockRes() {
  const res: { status: jest.Mock; json: jest.Mock } = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe("PublicStorefrontContextMiddleware", () => {
  const middleware = new PublicStorefrontContextMiddleware();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resolves an active tenant and establishes tenant context", async () => {
    const tenant = { id: "tenant-1", slug: "sahil-cafe", status: "ACTIVE", deletedAt: null };
    prismaMock.tenant.findUnique.mockResolvedValue(tenant);
    const req = { params: { tenantSlug: "sahil-cafe" } } as unknown as RequestWithId;
    const res = mockRes();
    const next = jest.fn();

    await middleware.use(req, res as never, next);

    expect(req.tenant).toEqual(tenant);
    expect(runWithTenantContext).toHaveBeenCalledWith("tenant-1", expect.any(Function));
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("404s with no redirectSlug when the slug matches neither an active tenant nor an alias", async () => {
    prismaMock.tenant.findUnique.mockResolvedValue(null);
    prismaMock.tenantSlugAlias.findUnique.mockResolvedValue(null);
    const req = { params: { tenantSlug: "unknown-slug" } } as unknown as RequestWithId;
    const res = mockRes();

    await middleware.use(req, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "NOT_FOUND", message: "Sayfa bulunamadı.", redirectSlug: null },
    });
  });

  it("404s with a redirectSlug when the requested slug is a live alias for a renamed tenant (QR permanence)", async () => {
    prismaMock.tenant.findUnique.mockResolvedValue(null);
    prismaMock.tenantSlugAlias.findUnique.mockResolvedValue({
      oldSlug: "old-cafe-name",
      tenant: { slug: "new-cafe-name", status: "ACTIVE", deletedAt: null },
    });
    const req = { params: { tenantSlug: "old-cafe-name" } } as unknown as RequestWithId;
    const res = mockRes();

    await middleware.use(req, res as never, jest.fn());

    expect(prismaMock.tenantSlugAlias.findUnique).toHaveBeenCalledWith({
      where: { oldSlug: "old-cafe-name" },
      include: { tenant: true },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "NOT_FOUND", message: "Sayfa bulunamadı.", redirectSlug: "new-cafe-name" },
    });
  });

  it("does not redirect to an alias whose owning tenant is no longer active", async () => {
    prismaMock.tenant.findUnique.mockResolvedValue(null);
    prismaMock.tenantSlugAlias.findUnique.mockResolvedValue({
      oldSlug: "old-slug",
      tenant: { slug: "suspended-tenant-slug", status: "SUSPENDED", deletedAt: null },
    });
    const req = { params: { tenantSlug: "old-slug" } } as unknown as RequestWithId;
    const res = mockRes();

    await middleware.use(req, res as never, jest.fn());

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "NOT_FOUND", message: "Sayfa bulunamadı.", redirectSlug: null },
    });
  });

  it("404s immediately without any lookup when the route has no tenantSlug param", async () => {
    const req = { params: {} } as unknown as RequestWithId;
    const res = mockRes();

    await middleware.use(req, res as never, jest.fn());

    expect(prismaMock.tenant.findUnique).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
