import { UnauthorizedException } from "@nestjs/common";
import { prisma } from "@qr-platform/database";

import { IdentityService } from "./identity.service";

// ts-jest hoists jest.mock() calls above the imports above at compile time,
// so this physical position (after the imports it mocks) is safe.
jest.mock("@qr-platform/database", () => ({
  prisma: { tenantUser: { findMany: jest.fn(), findUnique: jest.fn() } },
}));

const prismaMock = prisma as unknown as {
  tenantUser: { findMany: jest.Mock; findUnique: jest.Mock };
};

function buildMembershipRow(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "tenant-user-1",
    tenantId: "tenant-1",
    branchId: null,
    roleId: "role-1",
    status: "ACTIVE",
    createdAt: new Date("2026-01-01"),
    role: {
      code: "TENANT_OWNER",
      rolePermissions: [
        { permission: { code: "tenant.read" } },
        { permission: { code: "tenant.update" } },
      ],
    },
    ...overrides,
  };
}

describe("IdentityService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("resolvePrimaryMembership", () => {
    it("maps a membership row into a MembershipContext with resolved permission codes", async () => {
      prismaMock.tenantUser.findMany.mockResolvedValue([buildMembershipRow()]);
      const service = new IdentityService();

      const result = await service.resolvePrimaryMembership("user-1");

      expect(result).toEqual({
        tenantUserId: "tenant-user-1",
        tenantId: "tenant-1",
        branchId: null,
        roleId: "role-1",
        roleCode: "TENANT_OWNER",
        permissions: ["tenant.read", "tenant.update"],
      });
    });

    it("prefers a platform-level (tenantId null) membership over a tenant one", async () => {
      const tenantMembership = buildMembershipRow({
        id: "tu-tenant",
        tenantId: "tenant-1",
        createdAt: new Date("2026-01-01"),
      });
      const platformMembership = buildMembershipRow({
        id: "tu-platform",
        tenantId: null,
        createdAt: new Date("2026-02-01"),
        role: { code: "SUPER_ADMIN", rolePermissions: [] },
      });
      prismaMock.tenantUser.findMany.mockResolvedValue([tenantMembership, platformMembership]);
      const service = new IdentityService();

      const result = await service.resolvePrimaryMembership("user-1");

      expect(result.tenantUserId).toBe("tu-platform");
      expect(result.tenantId).toBeNull();
    });

    it("falls back to the earliest-created membership when there is no platform membership", async () => {
      const earlier = buildMembershipRow({ id: "tu-earlier", createdAt: new Date("2026-01-01") });
      const later = buildMembershipRow({ id: "tu-later", createdAt: new Date("2026-02-01") });
      prismaMock.tenantUser.findMany.mockResolvedValue([earlier, later]);
      const service = new IdentityService();

      const result = await service.resolvePrimaryMembership("user-1");

      expect(result.tenantUserId).toBe("tu-earlier");
    });

    it("throws UnauthorizedException when the user has no active membership", async () => {
      prismaMock.tenantUser.findMany.mockResolvedValue([]);
      const service = new IdentityService();

      await expect(service.resolvePrimaryMembership("user-1")).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("resolveMembershipById", () => {
    it("returns the mapped membership context for an active membership", async () => {
      prismaMock.tenantUser.findUnique.mockResolvedValue(buildMembershipRow());
      const service = new IdentityService();

      const result = await service.resolveMembershipById("tenant-user-1");

      expect(result?.roleCode).toBe("TENANT_OWNER");
      expect(result?.permissions).toEqual(["tenant.read", "tenant.update"]);
    });

    it("returns null when the membership no longer exists", async () => {
      prismaMock.tenantUser.findUnique.mockResolvedValue(null);
      const service = new IdentityService();

      await expect(service.resolveMembershipById("gone")).resolves.toBeNull();
    });

    it("returns null when the membership has been deactivated (e.g. revoked access)", async () => {
      prismaMock.tenantUser.findUnique.mockResolvedValue(buildMembershipRow({ status: "INACTIVE" }));
      const service = new IdentityService();

      await expect(service.resolveMembershipById("tenant-user-1")).resolves.toBeNull();
    });
  });
});
