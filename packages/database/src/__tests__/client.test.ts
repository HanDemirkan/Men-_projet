import { describe, expect, it } from "vitest";

import { prisma, PrismaClient } from "../index";

describe("database package", () => {
  it("exports a singleton PrismaClient instance", () => {
    expect(prisma).toBeInstanceOf(PrismaClient);
  });

  it("reuses the same instance on repeated imports", async () => {
    const { prisma: prismaAgain } = await import("../index");
    expect(prismaAgain).toBe(prisma);
  });
});
