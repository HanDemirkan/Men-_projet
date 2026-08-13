import { randomUUID } from "node:crypto";

import { ROLES } from "@qr-platform/permissions";
import { afterAll, describe, expect, it } from "vitest";

import { bootstrapAdmin, validateInput, BootstrapValidationError } from "../../prisma/bootstrap-admin";
import { prisma } from "../index";

// Hotfix: proves `pnpm bootstrap:admin` is genuinely idempotent against a
// real database - running it twice must never create a second account, and
// must never touch the password of an account that already exists. Only
// runs against a real PostgreSQL instance - see connection.integration.test.ts.
const runIntegration = process.env["RUN_DB_INTEGRATION_TESTS"] === "true";

describe.skipIf(!runIntegration)("bootstrapAdmin (integration)", () => {
  const suffix = randomUUID();
  const email = `bootstrap-admin-${suffix}@test.local`;
  const input = { name: "Bootstrap Test Admin", email, password: "Passw0rd!23" };

  afterAll(async () => {
    await prisma.tenantUser.deleteMany({ where: { user: { email } } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("creates exactly one user and one platform-level SUPER_ADMIN membership on the first run", async () => {
    const result = await bootstrapAdmin(input);
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

  it("running it again reports 'exists' and does not create a second user or membership", async () => {
    const before = await prisma.user.findMany({ where: { email } });
    expect(before).toHaveLength(1);
    const originalPasswordHash = before[0]?.passwordHash;

    const result = await bootstrapAdmin(input);
    expect(result.status).toBe("exists");

    const after = await prisma.user.findMany({ where: { email } });
    expect(after).toHaveLength(1);
    expect(after[0]?.id).toBe(before[0]?.id);
    // Password must not be rewritten on the idempotent path, even though
    // the same plaintext password was passed in again.
    expect(after[0]?.passwordHash).toBe(originalPasswordHash);

    const memberships = await prisma.tenantUser.findMany({
      where: { userId: after[0]?.id, tenantId: null },
    });
    expect(memberships).toHaveLength(1);
  });

  it("a third run with a different (but still valid) password still does not touch the stored hash", async () => {
    const before = await prisma.user.findUniqueOrThrow({ where: { email } });

    const result = await bootstrapAdmin({ ...input, password: "SomeOtherPassw0rd!" });
    expect(result.status).toBe("exists");

    const after = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(after.passwordHash).toBe(before.passwordHash);
  });
});

describe("validateInput (unit, no DB)", () => {
  it("throws when any of the three fields is missing", () => {
    expect(() => validateInput({ email: "a@b.com", password: "Passw0rd!23" })).toThrow(BootstrapValidationError);
    expect(() => validateInput({ name: "A", password: "Passw0rd!23" })).toThrow(BootstrapValidationError);
    expect(() => validateInput({ name: "A", email: "a@b.com" })).toThrow(BootstrapValidationError);
  });

  it("throws on an invalid email", () => {
    expect(() => validateInput({ name: "A", email: "not-an-email", password: "Passw0rd!23" })).toThrow(
      BootstrapValidationError,
    );
  });

  it("throws on a password that's too short or missing a letter/digit", () => {
    expect(() => validateInput({ name: "A", email: "a@b.com", password: "short1" })).toThrow(
      BootstrapValidationError,
    );
    expect(() => validateInput({ name: "A", email: "a@b.com", password: "alllettersnodigits" })).toThrow(
      BootstrapValidationError,
    );
    expect(() => validateInput({ name: "A", email: "a@b.com", password: "12345678" })).toThrow(
      BootstrapValidationError,
    );
  });

  it("accepts a valid input and normalizes the email to lowercase, trimmed", () => {
    const result = validateInput({ name: "  Admin User  ", email: "  ADMIN@Example.com  ", password: "Passw0rd!23" });
    expect(result).toEqual({ name: "Admin User", email: "admin@example.com", password: "Passw0rd!23" });
  });
});
