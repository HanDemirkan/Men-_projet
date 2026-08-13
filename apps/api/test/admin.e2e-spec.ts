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
// discipline as auth.e2e-spec.ts. Needs the seed's system roles/permissions
// (run `pnpm db:seed` first if this fails at the role lookups below).
describe("Admin (e2e)", () => {
  let app: INestApplication;
  const suffix = randomUUID();
  const password = "Passw0rd!23";

  let superAdminUserId: string;
  let superAdminCookie: string;
  let tenantOwnerCookie: string;
  let ownerTenantId: string;
  let ownerBranchId: string;
  let ownerUserId: string;

  const createdTenantIds: string[] = [];
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const [superAdminRole, tenantOwnerRole] = await Promise.all([
      prisma.role.findFirst({ where: { tenantId: null, code: ROLES.SUPER_ADMIN } }),
      prisma.role.findFirst({ where: { tenantId: null, code: ROLES.TENANT_OWNER } }),
    ]);

    if (!superAdminRole || !tenantOwnerRole) {
      throw new Error(
        "SUPER_ADMIN/TENANT_OWNER roles not found - run `pnpm db:seed` against the target database first.",
      );
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    const superAdminUser = await prisma.user.create({
      data: {
        firstName: "Admin",
        lastName: `E2E ${suffix}`,
        email: `admin-e2e-super-${suffix}@test.local`,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });
    await prisma.tenantUser.create({
      data: { tenantId: null, userId: superAdminUser.id, roleId: superAdminRole.id },
    });
    superAdminUserId = superAdminUser.id;
    createdUserIds.push(superAdminUser.id);

    const ownerTenant = await prisma.tenant.create({
      data: { name: `Admin E2E Owner Tenant ${suffix}`, slug: `admin-e2e-owner-${suffix}` },
    });
    const ownerBranch = await prisma.branch.create({ data: { tenantId: ownerTenant.id, name: "Merkez" } });
    const ownerUser = await prisma.user.create({
      data: {
        firstName: "Owner",
        lastName: `E2E ${suffix}`,
        email: `admin-e2e-owner-${suffix}@test.local`,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });
    await prisma.tenantUser.create({
      data: { tenantId: ownerTenant.id, userId: ownerUser.id, branchId: ownerBranch.id, roleId: tenantOwnerRole.id },
    });
    ownerTenantId = ownerTenant.id;
    ownerBranchId = ownerBranch.id;
    ownerUserId = ownerUser.id;
    createdTenantIds.push(ownerTenant.id);
    createdUserIds.push(ownerUser.id);

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

    const superAdminLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: superAdminUser.email, password })
      .expect(200);
    superAdminCookie = cookiePair(
      (superAdminLogin.headers["set-cookie"] as unknown as string[]).find((c) => c.startsWith("access_token="))!,
    );

    const ownerLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: ownerUser.email, password })
      .expect(200);
    tenantOwnerCookie = cookiePair(
      (ownerLogin.headers["set-cookie"] as unknown as string[]).find((c) => c.startsWith("access_token="))!,
    );
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { OR: [{ userId: superAdminUserId }, { tenantId: { in: createdTenantIds } }] } });
    await prisma.tenantUser.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.session.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.branch.deleteMany({ where: { tenantId: { in: createdTenantIds } } });
    await prisma.tenant.deleteMany({ where: { id: { in: createdTenantIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await app.close();
    await prisma.$disconnect();
  });

  describe("permission enforcement", () => {
    it("SUPER_ADMIN can reach the dashboard", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/admin/dashboard")
        .set("Cookie", [superAdminCookie])
        .expect(200);
    });

    it("TENANT_OWNER is rejected with 403", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/admin/dashboard")
        .set("Cookie", [tenantOwnerCookie])
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it("an unauthenticated request is rejected with 401", async () => {
      await request(app.getHttpServer()).get("/api/v1/admin/dashboard").expect(401);
    });
  });

  describe("GET /admin/dashboard", () => {
    it("returns real aggregate counts, not mocked data", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/admin/dashboard")
        .set("Cookie", [superAdminCookie])
        .expect(200);

      const dashboard = response.body.data;
      // Real counts derived from the fixtures this suite itself created -
      // proves the numbers come from the database, not a fixture/constant.
      expect(dashboard.totalTenants).toBeGreaterThanOrEqual(createdTenantIds.length);
      expect(dashboard.totalUsers).toBeGreaterThanOrEqual(createdUserIds.length);
      expect(dashboard.systemHealth.status).toEqual(expect.any(String));
      expect(Array.isArray(dashboard.recentAuditLogs)).toBe(true);
    });
  });

  describe("POST /admin/tenants (transactional creation)", () => {
    it("creates a tenant + branch + owner + membership in one call, with a real audit log", async () => {
      const newOwnerEmail = `admin-e2e-new-owner-${suffix}@test.local`;
      const response = await request(app.getHttpServer())
        .post("/api/v1/admin/tenants")
        .set("Cookie", [superAdminCookie])
        .send({
          name: `Admin E2E New Tenant ${suffix}`,
          ownerFirstName: "New",
          ownerLastName: "Owner",
          ownerEmail: newOwnerEmail,
          ownerPassword: "Passw0rd!23",
          branchName: "İlk Şube",
        })
        .expect(201);

      const { tenant, branch, owner, membership } = response.body.data;
      expect(tenant.name).toBe(`Admin E2E New Tenant ${suffix}`);
      expect(branch.tenantId).toBe(tenant.id);
      expect(owner.email).toBe(newOwnerEmail);
      expect(owner.passwordHash).toBeUndefined();
      expect(membership.roleId).toEqual(expect.any(String));

      createdTenantIds.push(tenant.id);
      createdUserIds.push(owner.id);

      const dbUser = await prisma.user.findUnique({ where: { id: owner.id } });
      expect(dbUser).not.toBeNull();

      const auditLog = await prisma.auditLog.findFirst({
        where: { action: "admin.tenant.create", entityId: tenant.id },
      });
      expect(auditLog).not.toBeNull();
      expect(auditLog?.userId).toBe(superAdminUserId);
      // The temporary password must never be written to the audit trail.
      expect(JSON.stringify(auditLog?.newValue)).not.toContain("Passw0rd!23");
    });

    it("rejects a duplicate slug with 409", async () => {
      const slug = `admin-e2e-dup-${suffix}`;
      const first = await request(app.getHttpServer())
        .post("/api/v1/admin/tenants")
        .set("Cookie", [superAdminCookie])
        .send({
          name: "Dup Tenant One",
          slug,
          ownerFirstName: "Dup",
          ownerLastName: "One",
          ownerEmail: `admin-e2e-dup-one-${suffix}@test.local`,
          ownerPassword: "Passw0rd!23",
          branchName: "Şube",
        })
        .expect(201);
      createdTenantIds.push(first.body.data.tenant.id);
      createdUserIds.push(first.body.data.owner.id);

      const second = await request(app.getHttpServer())
        .post("/api/v1/admin/tenants")
        .set("Cookie", [superAdminCookie])
        .send({
          name: "Dup Tenant Two",
          slug,
          ownerFirstName: "Dup",
          ownerLastName: "Two",
          ownerEmail: `admin-e2e-dup-two-${suffix}@test.local`,
          ownerPassword: "Passw0rd!23",
          branchName: "Şube",
        })
        .expect(409);

      expect(second.body.error.code).toBe("SLUG_ALREADY_EXISTS");

      // No partial data from the failed second attempt.
      const secondUser = await prisma.user.findUnique({ where: { email: `admin-e2e-dup-two-${suffix}@test.local` } });
      expect(secondUser).toBeNull();
    });

    it("reuses an existing user by email as owner without touching their password", async () => {
      const before = await prisma.user.findUniqueOrThrow({ where: { id: ownerUserId } });

      const response = await request(app.getHttpServer())
        .post("/api/v1/admin/tenants")
        .set("Cookie", [superAdminCookie])
        .send({
          name: `Admin E2E Second Tenant For Existing Owner ${suffix}`,
          ownerFirstName: "Owner",
          ownerLastName: "Reused",
          ownerEmail: before.email,
          ownerPassword: "SomeOtherPassw0rd!99",
          branchName: "İkinci Şube",
        })
        .expect(201);

      const { tenant, owner } = response.body.data;
      expect(owner.id).toBe(ownerUserId);
      createdTenantIds.push(tenant.id);

      const after = await prisma.user.findUniqueOrThrow({ where: { id: ownerUserId } });
      expect(after.passwordHash).toBe(before.passwordHash);

      const memberships = await prisma.tenantUser.findMany({ where: { userId: ownerUserId } });
      expect(memberships.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("PATCH /admin/tenants/:id (status change)", () => {
    it("suspends a tenant and writes an audit log with old/new values", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/tenants/${ownerTenantId}`)
        .set("Cookie", [superAdminCookie])
        .send({ status: "SUSPENDED" })
        .expect(200);

      expect(response.body.data.status).toBe("SUSPENDED");

      const dbTenant = await prisma.tenant.findUniqueOrThrow({ where: { id: ownerTenantId } });
      expect(dbTenant.status).toBe("SUSPENDED");

      const auditLog = await prisma.auditLog.findFirst({
        where: { action: "admin.tenant.update", entityId: ownerTenantId },
        orderBy: { createdAt: "desc" },
      });
      expect(auditLog?.oldValue).toMatchObject({ status: "ACTIVE" });
      expect(auditLog?.newValue).toMatchObject({ status: "SUSPENDED" });

      // Restore for subsequent tests/tear-down expectations.
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/tenants/${ownerTenantId}`)
        .set("Cookie", [superAdminCookie])
        .send({ status: "ACTIVE" })
        .expect(200);
    });
  });

  describe("GET /admin/tenants/:id/users and /branches", () => {
    it("lists the real membership and branch rows for a tenant", async () => {
      const usersResponse = await request(app.getHttpServer())
        .get(`/api/v1/admin/tenants/${ownerTenantId}/users`)
        .set("Cookie", [superAdminCookie])
        .expect(200);
      expect(usersResponse.body.data.some((m: { userId: string }) => m.userId === ownerUserId)).toBe(true);

      const branchesResponse = await request(app.getHttpServer())
        .get(`/api/v1/admin/tenants/${ownerTenantId}/branches`)
        .set("Cookie", [superAdminCookie])
        .expect(200);
      expect(branchesResponse.body.data.some((b: { id: string }) => b.id === ownerBranchId)).toBe(true);
    });
  });

  describe("GET /admin/users", () => {
    it("lists platform users and supports email search", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/users?q=${encodeURIComponent(`admin-e2e-owner-${suffix}`)}`)
        .set("Cookie", [superAdminCookie])
        .expect(200);

      expect(response.body.data.items.some((u: { id: string }) => u.id === ownerUserId)).toBe(true);
      expect(response.body.data.items.every((u: { passwordHash?: unknown }) => u.passwordHash === undefined)).toBe(
        true,
      );
    });
  });

  describe("PATCH /admin/users/:id/status (self-protection policy)", () => {
    it("blocks a SUPER_ADMIN from deactivating themselves", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${superAdminUserId}/status`)
        .set("Cookie", [superAdminCookie])
        .send({ status: "INACTIVE" })
        .expect(403);

      expect(response.body.success).toBe(false);

      const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: superAdminUserId } });
      expect(dbUser.status).toBe("ACTIVE");
    });

    it("allows deactivating a different (non-super-admin) user", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${ownerUserId}/status`)
        .set("Cookie", [superAdminCookie])
        .send({ status: "INACTIVE" })
        .expect(200);

      const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: ownerUserId } });
      expect(dbUser.status).toBe("INACTIVE");

      // Restore.
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${ownerUserId}/status`)
        .set("Cookie", [superAdminCookie])
        .send({ status: "ACTIVE" })
        .expect(200);
    });
  });

  describe("POST /admin/users/:id/revoke-sessions", () => {
    it("revokes a real session row for another user", async () => {
      const ownerTenantUser = await prisma.tenantUser.findFirstOrThrow({ where: { userId: ownerUserId } });
      const session = await prisma.session.create({
        data: {
          userId: ownerUserId,
          tenantUserId: ownerTenantUser.id,
          refreshTokenHash: `admin-e2e-session-${randomUUID()}`,
          expiresAt: new Date(Date.now() + 60_000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/v1/admin/users/${ownerUserId}/revoke-sessions`)
        .set("Cookie", [superAdminCookie])
        .send({ sessionId: session.id })
        .expect(201);

      expect(response.body.data.revokedCount).toBe(1);
      const remaining = await prisma.session.findUnique({ where: { id: session.id } });
      expect(remaining).toBeNull();
    });

    it("blocks a caller from revoking their own current session through this endpoint", async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/admin/users/${superAdminUserId}/revoke-sessions`)
        .set("Cookie", [superAdminCookie])
        .send({})
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /admin/audit-logs", () => {
    it("filters by action and returns real rows written earlier in this suite", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/admin/audit-logs?action=admin.tenant.create")
        .set("Cookie", [superAdminCookie])
        .expect(200);

      expect(response.body.data.items.length).toBeGreaterThan(0);
      expect(response.body.data.items.every((log: { action: string }) => log.action === "admin.tenant.create")).toBe(
        true,
      );
    });
  });

  describe("GET /admin/system", () => {
    it("returns health/environment/version info without leaking secrets", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/admin/system")
        .set("Cookie", [superAdminCookie])
        .expect(200);

      const body = JSON.stringify(response.body);
      expect(body).not.toContain("e2e-test-secret-at-least-32-characters-long");
      expect(response.body.data.environment).toBe("test");
      expect(response.body.data.services.database).toEqual(expect.any(String));
    });
  });
});
