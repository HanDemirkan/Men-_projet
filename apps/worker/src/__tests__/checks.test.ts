import { describe, expect, it, vi } from "vitest";

import { checkDatabaseConnection, checkRedisConnection } from "../checks";

function createSilentLogger() {
  return { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } as never;
}

describe("checkDatabaseConnection", () => {
  it("returns up when the query succeeds", async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]) };

    const status = await checkDatabaseConnection(prisma as never, createSilentLogger());

    expect(status).toBe("up");
  });

  it("returns down when the query throws", async () => {
    const prisma = { $queryRaw: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) };

    const status = await checkDatabaseConnection(prisma as never, createSilentLogger());

    expect(status).toBe("down");
  });
});

describe("checkRedisConnection", () => {
  it("returns up when ping responds with PONG", async () => {
    const redis = { ping: vi.fn().mockResolvedValue("PONG") };

    const status = await checkRedisConnection(redis as never, createSilentLogger());

    expect(status).toBe("up");
  });

  it("returns down when ping throws", async () => {
    const redis = { ping: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) };

    const status = await checkRedisConnection(redis as never, createSilentLogger());

    expect(status).toBe("down");
  });
});
