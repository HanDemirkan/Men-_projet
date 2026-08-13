import { prisma } from "@qr-platform/database";

import { AuditService } from "./audit.service";

// ts-jest hoists jest.mock() calls above the imports above at compile time,
// so this physical position (after the imports it mocks) is safe.
jest.mock("@qr-platform/database", () => ({
  prisma: { auditLog: { create: jest.fn() } },
}));

const prismaMock = prisma as unknown as { auditLog: { create: jest.Mock } };

describe("AuditService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("writes a log row with all provided fields, including IP/User-Agent/requestId", async () => {
    prismaMock.auditLog.create.mockResolvedValue(undefined);
    const service = new AuditService();

    await service.log({
      tenantId: "tenant-1",
      branchId: null,
      userId: "user-1",
      action: "auth.login",
      entity: "User",
      entityId: "user-1",
      requestId: "req-1",
      ip: "127.0.0.1",
      userAgent: "curl/8.19.0",
    });

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: "tenant-1",
        branchId: null,
        userId: "user-1",
        action: "auth.login",
        entity: "User",
        entityId: "user-1",
        requestId: "req-1",
        ip: "127.0.0.1",
        userAgent: "curl/8.19.0",
      }),
    });
  });

  it("defaults omitted optional fields to null rather than leaving them undefined", async () => {
    prismaMock.auditLog.create.mockResolvedValue(undefined);
    const service = new AuditService();

    await service.log({ action: "auth.logout", entity: "User" });

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: null,
        branchId: null,
        userId: null,
        entityId: null,
        requestId: null,
        ip: null,
        userAgent: null,
      }),
    });
  });

  it("only includes oldValue/newValue in the write when they were actually provided", async () => {
    prismaMock.auditLog.create.mockResolvedValue(undefined);
    const service = new AuditService();

    await service.log({ action: "role.change", entity: "TenantUser", newValue: { roleId: "role-2" } });

    const [[{ data }]] = prismaMock.auditLog.create.mock.calls as [[{ data: Record<string, unknown> }]];
    expect(data).toHaveProperty("newValue", { roleId: "role-2" });
    expect(data).not.toHaveProperty("oldValue");
  });
});
