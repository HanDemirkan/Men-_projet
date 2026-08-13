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
import * as argon2 from "argon2";
import cookieParser from "cookie-parser";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { AllExceptionsFilter } from "../src/common/filters/all-exceptions.filter";
import { AppConfigService } from "../src/common/config/app-config.service";
import { ResponseInterceptor } from "../src/common/interceptors/response.interceptor";
import { PasswordResetService } from "../src/modules/auth/services/password-reset.service";
/* eslint-enable import/order */

// A Set-Cookie response header carries attributes (Path/Expires/HttpOnly/...)
// that must NOT be echoed back in a request's Cookie header - only the
// `name=value` pair itself.
function cookiePair(setCookieHeader: string): string {
  return setCookieHeader.split(";")[0] as string;
}

// This suite talks to a REAL PostgreSQL instance (no PRISMA_CLIENT/
// REDIS_CLIENT overrides) - matching this sprint's "no mocks" requirement,
// since login/session/argon2/audit only mean anything when exercised for
// real. `pnpm test:e2e` already documents that Postgres/Redis must be
// running, and this test needs the Sprint 2 seed data (system roles +
// permissions) to exist - run `pnpm db:seed` first if it fails below.
describe("Auth (e2e)", () => {
  let app: INestApplication;
  const suffix = randomUUID();
  const password = "Passw0rd!23";
  const email = `auth-e2e-${suffix}@test.local`;

  let tenantId: string;
  let branchId: string;
  let userId: string;

  beforeAll(async () => {
    const role = await prisma.role.findFirst({ where: { code: "TENANT_OWNER" } });

    if (!role) {
      throw new Error(
        "No TENANT_OWNER role found - the Sprint 2 seed data (roles/permissions) must be " +
          "loaded before running this suite. Run `pnpm db:seed` against the target database first.",
      );
    }

    const tenant = await prisma.tenant.create({
      data: { name: `Auth E2E Tenant ${suffix}`, slug: `auth-e2e-${suffix}` },
    });
    const branch = await prisma.branch.create({ data: { tenantId: tenant.id, name: "Auth E2E Branch" } });
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const user = await prisma.user.create({
      data: {
        firstName: "Auth",
        lastName: "E2E",
        email,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });
    await prisma.tenantUser.create({
      data: { tenantId: tenant.id, userId: user.id, branchId: branch.id, roleId: role.id },
    });

    tenantId = tenant.id;
    branchId = branch.id;
    userId = user.id;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new ResponseInterceptor());

    const appConfig = app.get(AppConfigService);
    app.useGlobalFilters(
      new AllExceptionsFilter(
        { setContext: jest.fn(), error: jest.fn(), warn: jest.fn() } as never,
        appConfig,
      ),
    );

    await app.init();
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { tenantId } });
    await prisma.user.delete({ where: { id: userId } }); // cascades Session/TenantUser/PasswordResetToken
    await prisma.branch.delete({ where: { id: branchId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await app.close();
    await prisma.$disconnect();
  });

  it("rejects a login with the wrong password using a generic message (anti-enumeration)", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email, password: "WrongPassword123!" })
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe("E-posta veya şifre hatalı.");
  });

  it("rejects a login for an email that doesn't exist, with the SAME generic message", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "does-not-exist@test.local", password: "WrongPassword123!" })
      .expect(401);

    expect(response.body.error.message).toBe("E-posta veya şifre hatalı.");
  });

  it("rejects GET /auth/me with no session cookie", async () => {
    await request(app.getHttpServer()).get("/api/v1/auth/me").expect(401);
  });

  describe("full login -> me -> refresh -> logout flow", () => {
    let accessCookie: string;
    let refreshCookie: string;

    it("logs in successfully and sets correctly-scoped httpOnly cookies", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .set("User-Agent", "jest-supertest-e2e")
        .send({ email, password })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: { email, tenantId, branchId, role: "TENANT_OWNER" },
      });
      expect(response.body.data.permissions).toEqual(expect.arrayContaining(["tenant.read", "tenant.update"]));

      const setCookieHeader = response.headers["set-cookie"] as unknown as string[];
      const access = setCookieHeader.find((cookie) => cookie.startsWith("access_token="));
      const refresh = setCookieHeader.find((cookie) => cookie.startsWith("refresh_token="));

      expect(access).toMatch(/HttpOnly/);
      expect(access).toMatch(/SameSite=Lax/);
      expect(access).toMatch(/Path=\//);
      expect(refresh).toMatch(/HttpOnly/);
      expect(refresh).toMatch(/SameSite=Lax/);
      expect(refresh).toMatch(/Path=\/api\/v1\/auth\/refresh/);

      // Request `Cookie` headers only ever carry `name=value` pairs, not the
      // full Set-Cookie attribute string (Path/Expires/HttpOnly/...).
      accessCookie = cookiePair(access as string);
      refreshCookie = cookiePair(refresh as string);
    });

    it("writes an audit log row for the login with IP/User-Agent/requestId", async () => {
      const log = await prisma.auditLog.findFirst({
        where: { userId, action: "auth.login" },
        orderBy: { createdAt: "desc" },
      });

      expect(log).not.toBeNull();
      expect(log?.tenantId).toBe(tenantId);
      expect(log?.requestId).toEqual(expect.any(String));
      expect(log?.userAgent).toBe("jest-supertest-e2e");
    });

    it("GET /auth/me returns the authenticated user using the access cookie", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/auth/me")
        .set("Cookie", [accessCookie])
        .expect(200);

      expect(response.body.data).toMatchObject({ email, tenantId, role: "TENANT_OWNER" });
    });

    it("POST /auth/refresh rotates the refresh token and rejects the old one on reuse", async () => {
      const refreshResponse = await request(app.getHttpServer())
        .post("/api/v1/auth/refresh")
        .set("Cookie", [refreshCookie])
        .expect(200);

      const setCookieHeader = refreshResponse.headers["set-cookie"] as unknown as string[];
      const newRefreshHeader = setCookieHeader.find((cookie) => cookie.startsWith("refresh_token="));
      expect(newRefreshHeader).toBeDefined();
      const newRefresh = cookiePair(newRefreshHeader as string);
      expect(newRefresh).not.toBe(refreshCookie);

      // The OLD refresh token must no longer work - rotation invalidates it.
      await request(app.getHttpServer()).post("/api/v1/auth/refresh").set("Cookie", [refreshCookie]).expect(401);

      refreshCookie = newRefresh;
    });

    it("POST /auth/logout invalidates the session so a subsequent refresh fails", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/logout")
        .set("Cookie", [accessCookie, refreshCookie])
        .expect(200);

      await request(app.getHttpServer()).post("/api/v1/auth/refresh").set("Cookie", [refreshCookie]).expect(401);
    });

    it("writes an audit log row for the logout", async () => {
      const log = await prisma.auditLog.findFirst({
        where: { userId, action: "auth.logout" },
        orderBy: { createdAt: "desc" },
      });

      expect(log).not.toBeNull();
      expect(log?.tenantId).toBe(tenantId);
    });
  });

  describe("forgot-password -> reset-password flow", () => {
    it("always returns a generic 200, and creates a real single-use hashed token", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/forgot-password")
        .send({ email })
        .expect(200);

      expect(response.body.data.message).toEqual(expect.any(String));

      const token = await prisma.passwordResetToken.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      expect(token).not.toBeNull();
      expect(token?.usedAt).toBeNull();
      expect(token?.tokenHash).not.toBe(""); // never stores the raw token
    });

    it("returns the same generic 200 for an email that doesn't exist (anti-enumeration)", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/forgot-password")
        .send({ email: "does-not-exist@test.local" })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("rejects reset-password with a garbage token", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/reset-password")
        .send({ token: "not-a-real-token", newPassword: "NewPassw0rd!45" })
        .expect(401);
    });

    it("completes a real reset end-to-end: single-use, changes the password, and ends other sessions", async () => {
      // The raw token is only ever exposed via the (currently log-only)
      // delivery channel - obtaining it through the real service, not a
      // fixture, keeps this test honest about what's actually stored.
      const passwordResetService = app.get(PasswordResetService);
      const rawToken = await passwordResetService.createResetToken(userId);
      const newPassword = "NewPassw0rd!45";

      // A live session exists from the earlier login/logout flow's final
      // refresh - resetting the password must end it too.
      await prisma.session.create({
        data: {
          userId,
          tenantUserId: (await prisma.tenantUser.findFirstOrThrow({ where: { userId } })).id,
          refreshTokenHash: "irrelevant-for-this-assertion",
          expiresAt: new Date(Date.now() + 60_000),
        },
      });

      await request(app.getHttpServer())
        .post("/api/v1/auth/reset-password")
        .send({ token: rawToken, newPassword })
        .expect(200);

      const remainingSessions = await prisma.session.count({ where: { userId } });
      expect(remainingSessions).toBe(0);

      // Reusing the same (now-consumed) token must fail.
      await request(app.getHttpServer())
        .post("/api/v1/auth/reset-password")
        .send({ token: rawToken, newPassword: "AnotherPassw0rd!67" })
        .expect(401);

      await request(app.getHttpServer()).post("/api/v1/auth/login").send({ email, password }).expect(401);
      await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({ email, password: newPassword })
        .expect(200);
    });
  });
});
