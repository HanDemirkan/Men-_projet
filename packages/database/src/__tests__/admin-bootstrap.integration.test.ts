import { randomUUID } from "node:crypto";

import { ROLES } from "@qr-platform/permissions";
import * as argon2 from "argon2";
import { afterAll, describe, expect, it } from "vitest";

import { createSuperAdminIfMissing } from "../admin-bootstrap";
import { prisma } from "../index";

// Hotfix: proves the lower-level createSuperAdminIfMissing primitive - shared
// by `pnpm bootstrap:admin` and apps/api's DevelopmentBootstrapService - is
// genuinely idempotent and transactional against a real database. Only runs
// against a real PostgreSQL instance - see connection.integration.test.ts.
const runIntegration = process.env["RUN_DB_INTEGRATION_TESTS"] === "true";

describe.skipIf(!runIntegration)("createSuperAdminIfMissing (integration)", () => {
  const suffix = randomUUID();
  const email = `admin-bootstrap-${suffix}@test.local`;

  afterAll(async () => {
    await prisma.tenantUser.deleteMany({ where: { user: { email } } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("creates exactly one user and one platform-level SUPER_ADMIN membership on the first call", async () => {
    const passwordHash = await argon2.hash("Passw0rd!23", { type: argon2.argon2id });
    const result = await createSuperAdminIfMissing({ firstName: "Admin", lastName: "Bootstrap", email, passwordHash });
    expect(result.status).toBe("created");

    const users = await prisma.user.findMany({ where: { email } });
    expect(users).toHaveLength(1);

    const memberships = await prisma.tenantUser.findMany({
      where: { userId: users[0]?.id, tenantId: null },
      include: { role: true },
    });
    expect(memberships).toHaveLength(1);
    expect(memberships[0]?.role.code).toBe(ROLES.SUPER_ADMIN);
  });

  it("a second call reports 'exists' and does not create a second user, membership, or touch the password hash", async () => {
    const before = await prisma.user.findUniqueOrThrow({ where: { email } });
    const differentPasswordHash = await argon2.hash("SomeOtherPassw0rd!", { type: argon2.argon2id });

    const result = await createSuperAdminIfMissing({
      firstName: "Admin",
      lastName: "Bootstrap",
      email,
      passwordHash: differentPasswordHash,
    });
    expect(result.status).toBe("exists");

    const after = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(after.id).toBe(before.id);
    expect(after.passwordHash).toBe(before.passwordHash);

    const memberships = await prisma.tenantUser.findMany({ where: { userId: after.id, tenantId: null } });
    expect(memberships).toHaveLength(1);
  });

  it("repairs a missing SUPER_ADMIN membership for an existing user without touching their password", async () => {
    const before = await prisma.user.findUniqueOrThrow({ where: { email } });
    await prisma.tenantUser.deleteMany({ where: { userId: before.id, tenantId: null } });

    const noMemberships = await prisma.tenantUser.findMany({ where: { userId: before.id, tenantId: null } });
    expect(noMemberships).toHaveLength(0);

    const unusedPasswordHash = await argon2.hash("IgnoredPassw0rd!23", { type: argon2.argon2id });
    const result = await createSuperAdminIfMissing({
      firstName: "Admin",
      lastName: "Bootstrap",
      email,
      passwordHash: unusedPasswordHash,
    });
    expect(result.status).toBe("created");

    const after = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(after.id).toBe(before.id);
    expect(after.passwordHash).toBe(before.passwordHash);

    const memberships = await prisma.tenantUser.findMany({
      where: { userId: after.id, tenantId: null },
      include: { role: true },
    });
    expect(memberships).toHaveLength(1);
    expect(memberships[0]?.role.code).toBe(ROLES.SUPER_ADMIN);
  });
});
