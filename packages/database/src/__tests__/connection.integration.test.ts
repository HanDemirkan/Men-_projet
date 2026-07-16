import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "../index";

// This test only runs when a real PostgreSQL instance is reachable
// (e.g. via `docker compose up postgres` or CI service containers).
// It is skipped by default so `pnpm test` works without Docker running.
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
