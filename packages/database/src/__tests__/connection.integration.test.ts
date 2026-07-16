import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "../index";

// This test only runs when a real PostgreSQL instance is reachable (a local
// native install, or a CI service container). It is skipped by default so
// `pnpm test` still works in environments without PostgreSQL running.
const runIntegration = process.env["RUN_DB_INTEGRATION_TESTS"] === "true";

describe.skipIf(!runIntegration)("database connection (integration)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("connects to PostgreSQL and runs a trivial query", async () => {
    const result = await prisma.$queryRaw<{ result: number }[]>`SELECT 1 as result`;
    expect(result[0]?.result).toBe(1);
  });
});
