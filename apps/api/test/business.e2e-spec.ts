process.env["NODE_ENV"] = "test";
process.env["DATABASE_URL"] =
  process.env["DATABASE_URL"] ??
  "postgresql://qr_platform_user:localdevpassword123@localhost:5432/qr_platform?schema=public";
process.env["REDIS_URL"] = process.env["REDIS_URL"] ?? "redis://localhost:6379";
process.env["STORAGE_DIR"] = process.env["STORAGE_DIR"] ?? "/tmp/qr-platform-test-storage";
process.env["CORS_ALLOWED_ORIGINS"] = "http://localhost:3000";
process.env["LOG_LEVEL"] = "error";
process.env["REQUEST_BODY_LIMIT"] = "1mb";
process.env["JWT_ACCESS_SECRET"] = "e2e-test-secret-at-least-32-characters-long";
process.env["WEB_APP_URL"] = "http://localhost:3000";

/* eslint-disable import/order -- env vars above must be set before app modules are imported */
import { randomUUID } from "node:crypto";

import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import { prisma } from "@qr-platform/database";
import { ROLES } from "@qr-platform/permissions";
import * as argon2 from "argon2";
import cookieParser from "cookie-parser";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { AllExceptionsFilter } from "../src/common/filters/all-exceptions.filter";
import { AppConfigService } from "../src/common/config/app-config.service";
import { ResponseInterceptor } from "../src/common/interceptors/response.interceptor";
/* eslint-enable import/order */

function cookiePair(setCookieHeader: string): string {
  return setCookieHeader.split(";")[0] as string;
}

// Real PostgreSQL, real running Nest app, real supertest HTTP calls - same
// discipline as admin.e2e-spec.ts. Two separate tenants (A/B) are seeded so
// cross-tenant isolation is proven for real, not asserted from a single
// tenant's point of view. Needs the seed's system roles/permissions (run
// `pnpm db:seed` first if this fails at the role lookups below).
describe("Business (e2e)", () => {
  let app: INestApplication;
  const suffix = randomUUID();
  const password = "Passw0rd!23";

  // Tenant A: the tenant under test - two branches, one TENANT_OWNER, two
  // BRANCH_MANAGERs (one per branch, to prove cross-branch isolation).
  let tenantAId: string;
  let branchA1Id: string;
  let branchA2Id: string;
  let ownerAUserId: string;
  let ownerACookie: string;
  let managerA1UserId: string;
  let managerA1Cookie: string;
  let managerA2Cookie: string;

  // Tenant B: only exists to prove tenant A can never reach it.
  let tenantBId: string;
  let branchB1Id: string;
  let ownerBUserId: string;
  let ownerBEmail: string;
  let ownerBCookie: string;

  // An existing seed user with none of the new business.* permissions, for
  // permission-enforcement checks.
  let waiterCookie: string;

  const createdTenantIds: string[] = [];
  const createdUserIds: string[] = [];

  async function login(email: string): Promise<string> {
    const response = await request(app.getHttpServer()).post("/api/v1/auth/login").send({ email, password }).expect(200);
    return cookiePair(
      (response.headers["set-cookie"] as unknown as string[]).find((c) => c.startsWith("access_token="))!,
    );
  }

  beforeAll(async () => {
    const [ownerRole, managerRole] = await Promise.all([
      prisma.role.findFirst({ where: { tenantId: null, code: ROLES.TENANT_OWNER } }),
      prisma.role.findFirst({ where: { tenantId: null, code: ROLES.BRANCH_MANAGER } }),
    ]);
    if (!ownerRole || !managerRole) {
      throw new Error("TENANT_OWNER/BRANCH_MANAGER roles not found - run `pnpm db:seed` against the target database first.");
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    // --- Tenant A ---
    const tenantA = await prisma.tenant.create({
      data: { name: `Business E2E Tenant A ${suffix}`, slug: `biz-e2e-a-${suffix}` },
    });
    const branchA1 = await prisma.branch.create({ data: { tenantId: tenantA.id, name: "Merkez" } });
    const branchA2 = await prisma.branch.create({ data: { tenantId: tenantA.id, name: "Şube 2" } });

    const ownerA = await prisma.user.create({
      data: {
        firstName: "Owner",
        lastName: `A ${suffix}`,
        email: `biz-e2e-owner-a-${suffix}@test.local`,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });
    await prisma.tenantUser.create({ data: { tenantId: tenantA.id, userId: ownerA.id, roleId: ownerRole.id } });

    const managerA1 = await prisma.user.create({
      data: {
        firstName: "Manager",
        lastName: `A1 ${suffix}`,
        email: `biz-e2e-manager-a1-${suffix}@test.local`,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });
    await prisma.tenantUser.create({
      data: { tenantId: tenantA.id, userId: managerA1.id, branchId: branchA1.id, roleId: managerRole.id },
    });

    const managerA2 = await prisma.user.create({
      data: {
        firstName: "Manager",
        lastName: `A2 ${suffix}`,
        email: `biz-e2e-manager-a2-${suffix}@test.local`,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });
    await prisma.tenantUser.create({
      data: { tenantId: tenantA.id, userId: managerA2.id, branchId: branchA2.id, roleId: managerRole.id },
    });

    tenantAId = tenantA.id;
    branchA1Id = branchA1.id;
    branchA2Id = branchA2.id;
    ownerAUserId = ownerA.id;
    managerA1UserId = managerA1.id;
    createdTenantIds.push(tenantA.id);
    createdUserIds.push(ownerA.id, managerA1.id, managerA2.id);

    // --- Tenant B ---
    const tenantB = await prisma.tenant.create({
      data: { name: `Business E2E Tenant B ${suffix}`, slug: `biz-e2e-b-${suffix}` },
    });
    const branchB1 = await prisma.branch.create({ data: { tenantId: tenantB.id, name: "B Merkez" } });
    ownerBEmail = `biz-e2e-owner-b-${suffix}@test.local`;
    const ownerB = await prisma.user.create({
      data: { firstName: "Owner", lastName: `B ${suffix}`, email: ownerBEmail, passwordHash, emailVerifiedAt: new Date() },
    });
    await prisma.tenantUser.create({ data: { tenantId: tenantB.id, userId: ownerB.id, roleId: ownerRole.id } });

    tenantBId = tenantB.id;
    branchB1Id = branchB1.id;
    ownerBUserId = ownerB.id;
    createdTenantIds.push(tenantB.id);
    createdUserIds.push(ownerB.id);

    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalInterceptors(new ResponseInterceptor());
    const appConfig = app.get(AppConfigService);
    app.useGlobalFilters(
      new AllExceptionsFilter({ setContext: jest.fn(), error: jest.fn(), warn: jest.fn() } as never, appConfig),
    );
    await app.init();

    ownerACookie = await login(ownerA.email);
    managerA1Cookie = await login(managerA1.email);
    managerA2Cookie = await login(managerA2.email);
    ownerBCookie = await login(ownerBEmail);
    waiterCookie = await login("burak.sahin@sahil-cafe.dev");
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { tenantId: { in: createdTenantIds } } });
    await prisma.session.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.tenantUser.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.storefrontView.deleteMany({ where: { tenantId: { in: createdTenantIds } } });
    await prisma.branch.deleteMany({ where: { tenantId: { in: createdTenantIds } } });
    await prisma.tenant.deleteMany({ where: { id: { in: createdTenantIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await app.close();
    await prisma.$disconnect();
  });

  describe("permission enforcement", () => {
    it("TENANT_OWNER can reach the business dashboard", async () => {
      await request(app.getHttpServer()).get("/api/v1/business/dashboard").set("Cookie", [ownerACookie]).expect(200);
    });

    it("a role with none of the new business permissions (WAITER) is rejected with 403", async () => {
      await request(app.getHttpServer()).get("/api/v1/business/branches").set("Cookie", [waiterCookie]).expect(403);
    });

    it("an unauthenticated request is rejected with 401", async () => {
      await request(app.getHttpServer()).get("/api/v1/business/dashboard").expect(401);
    });
  });

  describe("tenant isolation", () => {
    it("TENANT_OWNER lists exactly their own tenant's branches, never another tenant's", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/business/branches?pageSize=100")
        .set("Cookie", [ownerACookie])
        .expect(200);

      const ids = response.body.data.items.map((b: { id: string }) => b.id);
      expect(ids).toEqual(expect.arrayContaining([branchA1Id, branchA2Id]));
      expect(ids).not.toContain(branchB1Id);
    });

    it("TENANT_OWNER of A cannot fetch tenant B's branch by id (tenant-scoped 404)", async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/business/branches/${branchB1Id}`)
        .set("Cookie", [ownerACookie])
        .expect(404);
    });

    it("business/activity for tenant A never includes tenant B's audit entries", async () => {
      // Generate a real, distinctive tenant B action first.
      await request(app.getHttpServer())
        .patch(`/api/v1/business/branches/${branchB1Id}`)
        .set("Cookie", [ownerBCookie])
        .send({ phone: "+905551112233" })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get("/api/v1/business/activity?pageSize=100")
        .set("Cookie", [ownerACookie])
        .expect(200);

      expect(response.body.data.items.every((log: { tenantId: string }) => log.tenantId === tenantAId)).toBe(true);
    });
  });

  describe("branch isolation (BRANCH_MANAGER)", () => {
    it("BRANCH_MANAGER's branch list contains only their own branch", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/business/branches")
        .set("Cookie", [managerA1Cookie])
        .expect(200);

      const ids = response.body.data.items.map((b: { id: string }) => b.id);
      expect(ids).toEqual([branchA1Id]);
    });

    it("BRANCH_MANAGER of branch A1 is forbidden from viewing branch A2 (same tenant)", async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/business/branches/${branchA2Id}`)
        .set("Cookie", [managerA1Cookie])
        .expect(403);
    });

    it("BRANCH_MANAGER of branch A2 sees only their own branch, symmetrically", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/business/branches")
        .set("Cookie", [managerA2Cookie])
        .expect(200);

      const ids = response.body.data.items.map((b: { id: string }) => b.id);
      expect(ids).toEqual([branchA2Id]);

      await request(app.getHttpServer())
        .get(`/api/v1/business/branches/${branchA1Id}`)
        .set("Cookie", [managerA2Cookie])
        .expect(403);
    });

    it("BRANCH_MANAGER cannot create a new branch (BRANCH_CREATE is TENANT_OWNER-only)", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/business/branches")
        .set("Cookie", [managerA1Cookie])
        .send({ name: "Should not be created" })
        .expect(403);
    });
  });

  describe("POST /business/branches (TENANT_OWNER)", () => {
    // Runs before "creates a real branch" below - tenant A must still have
    // exactly its original 2 branches (A1, A2) for "last active branch"
    // to mean what it says.
    it("blocks deactivating the tenant's last remaining active branch", async () => {
      // Suspend A2 first, leaving A1 as the only active branch.
      await request(app.getHttpServer())
        .patch(`/api/v1/business/branches/${branchA2Id}`)
        .set("Cookie", [ownerACookie])
        .send({ status: "INACTIVE" })
        .expect(200);

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/business/branches/${branchA1Id}`)
        .set("Cookie", [ownerACookie])
        .send({ status: "INACTIVE" })
        .expect(403);

      expect(response.body.success).toBe(false);

      // Restore for the rest of the suite.
      await request(app.getHttpServer())
        .patch(`/api/v1/business/branches/${branchA2Id}`)
        .set("Cookie", [ownerACookie])
        .send({ status: "ACTIVE" })
        .expect(200);
    });

    it("creates a real branch", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/business/branches")
        .set("Cookie", [ownerACookie])
        .send({ name: `E2E New Branch ${suffix}` })
        .expect(201);

      expect(response.body.data.tenantId).toBe(tenantAId);
      const dbBranch = await prisma.branch.findUnique({ where: { id: response.body.data.id } });
      expect(dbBranch).not.toBeNull();
    });
  });

  describe("POST /business/users (transactional creation + role rules)", () => {
    it("creates a real staff member scoped to a branch, with a real audit log", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/business/users")
        .set("Cookie", [ownerACookie])
        .send({
          firstName: "New",
          lastName: "Waiter",
          email: `biz-e2e-new-waiter-${suffix}@test.local`,
          password: "Passw0rd!23",
          role: "WAITER",
          branchId: branchA1Id,
        })
        .expect(201);

      expect(response.body.data.user.email).toBe(`biz-e2e-new-waiter-${suffix}@test.local`);
      expect(response.body.data.user.passwordHash).toBeUndefined();
      createdUserIds.push(response.body.data.user.id);

      const auditLog = await prisma.auditLog.findFirst({
        where: { action: "business.user.create", entityId: response.body.data.membership.id },
      });
      expect(auditLog).not.toBeNull();
      expect(JSON.stringify(auditLog?.newValue)).not.toContain("Passw0rd!23");
    });

    it("reuses an existing global user by email as a new tenant member, without touching their password", async () => {
      const before = await prisma.user.findUniqueOrThrow({ where: { id: ownerBUserId } });

      const response = await request(app.getHttpServer())
        .post("/api/v1/business/users")
        .set("Cookie", [ownerACookie])
        .send({
          firstName: "Owner",
          lastName: "B Reused",
          email: ownerBEmail,
          password: "SomeOtherPassw0rd!99",
          role: "MENU_EDITOR",
        })
        .expect(201);

      expect(response.body.data.user.id).toBe(ownerBUserId);

      const after = await prisma.user.findUniqueOrThrow({ where: { id: ownerBUserId } });
      expect(after.passwordHash).toBe(before.passwordHash);

      const memberships = await prisma.tenantUser.findMany({ where: { userId: ownerBUserId } });
      expect(memberships.some((m) => m.tenantId === tenantAId)).toBe(true);
      expect(memberships.some((m) => m.tenantId === tenantBId)).toBe(true);
    });

    it("rejects a duplicate membership for the same tenant with 409", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/business/users")
        .set("Cookie", [ownerACookie])
        .send({
          firstName: "Owner",
          lastName: "B Again",
          email: ownerBEmail,
          password: "Passw0rd!23",
          role: "MENU_EDITOR",
        })
        .expect(409);

      expect(response.body.error.code).toBe("MEMBERSHIP_ALREADY_EXISTS");
    });

    it("BRANCH_MANAGER cannot assign TENANT_OWNER or BRANCH_MANAGER roles", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/business/users")
        .set("Cookie", [managerA1Cookie])
        .send({
          firstName: "Should",
          lastName: "Fail",
          email: `biz-e2e-should-fail-${suffix}@test.local`,
          password: "Passw0rd!23",
          role: "TENANT_OWNER",
          branchId: branchA1Id,
        })
        .expect(403);
    });

    it("BRANCH_MANAGER can only create staff scoped to their own branch", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/business/users")
        .set("Cookie", [managerA1Cookie])
        .send({
          firstName: "Wrong",
          lastName: "Branch",
          email: `biz-e2e-wrong-branch-${suffix}@test.local`,
          password: "Passw0rd!23",
          role: "WAITER",
          branchId: branchA2Id,
        })
        .expect(403);
    });

    it("BRANCH_MANAGER succeeds when creating staff scoped to their own branch", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/business/users")
        .set("Cookie", [managerA1Cookie])
        .send({
          firstName: "Right",
          lastName: "Branch",
          email: `biz-e2e-right-branch-${suffix}@test.local`,
          password: "Passw0rd!23",
          role: "KITCHEN",
          branchId: branchA1Id,
        })
        .expect(201);

      createdUserIds.push(response.body.data.user.id);
    });
  });

  describe("PATCH /business/users/:membershipId (status protections)", () => {
    it("blocks deactivating the tenant's last active TENANT_OWNER", async () => {
      const ownerMembership = await prisma.tenantUser.findFirstOrThrow({ where: { tenantId: tenantAId, userId: ownerAUserId } });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/business/users/${ownerMembership.id}`)
        .set("Cookie", [ownerACookie])
        .send({ status: "INACTIVE" })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it("blocks a user from deactivating their own account", async () => {
      const managerMembership = await prisma.tenantUser.findFirstOrThrow({
        where: { tenantId: tenantAId, userId: managerA1UserId },
      });

      await request(app.getHttpServer())
        .patch(`/api/v1/business/users/${managerMembership.id}`)
        .set("Cookie", [managerA1Cookie])
        .send({ status: "INACTIVE" })
        .expect(403);
    });
  });

  describe("POST /business/users/:membershipId/revoke-sessions", () => {
    it("revokes a real session for a branch member", async () => {
      const managerMembership = await prisma.tenantUser.findFirstOrThrow({
        where: { tenantId: tenantAId, userId: managerA1UserId },
      });
      const session = await prisma.session.create({
        data: {
          userId: managerA1UserId,
          tenantUserId: managerMembership.id,
          refreshTokenHash: `biz-e2e-session-${randomUUID()}`,
          expiresAt: new Date(Date.now() + 60_000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/v1/business/users/${managerMembership.id}/revoke-sessions`)
        .set("Cookie", [ownerACookie])
        .send({ sessionId: session.id })
        .expect(201);

      expect(response.body.data.revokedCount).toBe(1);
      expect(await prisma.session.findUnique({ where: { id: session.id } })).toBeNull();
    });
  });

  describe("POST /business/users/:membershipId/reset-password", () => {
    it("sets a real new password and invalidates existing sessions", async () => {
      const managerMembership = await prisma.tenantUser.findFirstOrThrow({
        where: { tenantId: tenantAId, userId: managerA1UserId },
      });
      await prisma.session.create({
        data: {
          userId: managerA1UserId,
          tenantUserId: managerMembership.id,
          refreshTokenHash: `biz-e2e-pw-session-${randomUUID()}`,
          expiresAt: new Date(Date.now() + 60_000),
        },
      });

      await request(app.getHttpServer())
        .post(`/api/v1/business/users/${managerMembership.id}/reset-password`)
        .set("Cookie", [ownerACookie])
        .send({ newPassword: "BrandNewPassw0rd!23" })
        .expect(201);

      expect(await prisma.session.count({ where: { userId: managerA1UserId } })).toBe(0);

      const managerUser = await prisma.user.findUniqueOrThrow({ where: { id: managerA1UserId } });
      await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({ email: managerUser.email, password })
        .expect(401);
      const newLoginResponse = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({ email: managerUser.email, password: "BrandNewPassw0rd!23" })
        .expect(200);

      // Refresh the cookie other tests in this file rely on - the shared
      // login() helper is hardcoded to the original fixture password, which
      // this test just changed, so extract the cookie from the response above.
      managerA1Cookie = cookiePair(
        (newLoginResponse.headers["set-cookie"] as unknown as string[]).find((c) => c.startsWith("access_token="))!,
      );
    });
  });

  describe("GET /business/dashboard", () => {
    it("returns real aggregate counts scoped to the caller's own tenant", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/business/dashboard")
        .set("Cookie", [ownerACookie])
        .expect(200);

      const dashboard = response.body.data;
      expect(dashboard.totalBranches).toBeGreaterThanOrEqual(2);
      expect(dashboard.totalUsers).toBeGreaterThanOrEqual(4);
      expect(dashboard.profileCompletionPercent).toEqual(expect.any(Number));
      expect(Array.isArray(dashboard.recentActivity)).toBe(true);
      expect(dashboard.recentActivity.every((log: { tenantId: string }) => log.tenantId === tenantAId)).toBe(true);
    });
  });

  describe("GET /business/settings", () => {
    it("TENANT_OWNER can read and update settings", async () => {
      const before = await request(app.getHttpServer())
        .get("/api/v1/business/settings")
        .set("Cookie", [ownerACookie])
        .expect(200);
      expect(before.body.data.tenantStatus).toBe("ACTIVE");

      const updated = await request(app.getHttpServer())
        .patch("/api/v1/business/settings")
        .set("Cookie", [ownerACookie])
        .send({ timezone: "Europe/Istanbul", qrDefaults: { errorCorrectionLevel: "H", includeLogo: true } })
        .expect(200);

      expect(updated.body.data.qrDefaults).toEqual({ errorCorrectionLevel: "H", includeLogo: true });
    });

    it("BRANCH_MANAGER can read but not update settings", async () => {
      await request(app.getHttpServer()).get("/api/v1/business/settings").set("Cookie", [managerA1Cookie]).expect(200);
      await request(app.getHttpServer())
        .patch("/api/v1/business/settings")
        .set("Cookie", [managerA1Cookie])
        .send({ timezone: "UTC" })
        .expect(403);
    });
  });
});
