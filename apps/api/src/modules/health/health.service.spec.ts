import { PinoLogger } from "nestjs-pino";

import { HealthService } from "./health.service";

function createLoggerMock(): PinoLogger {
  return {
    setContext: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  } as unknown as PinoLogger;
}

describe("HealthService", () => {
  it("reports healthy when database and redis are reachable", async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]) };
    const redis = { ping: jest.fn().mockResolvedValue("PONG") };

    const service = new HealthService(prisma as never, redis as never, createLoggerMock());
    const result = await service.check();

    expect(result.status).toBe("healthy");
    expect(result.services).toEqual({ api: "up", database: "up", redis: "up" });
  });

  it("reports degraded when the database is unreachable", async () => {
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(new Error("connection refused")) };
    const redis = { ping: jest.fn().mockResolvedValue("PONG") };

    const service = new HealthService(prisma as never, redis as never, createLoggerMock());
    const result = await service.check();

    expect(result.status).toBe("degraded");
    expect(result.services.database).toBe("down");
    expect(result.services.redis).toBe("up");
  });

  it("reports degraded when redis is unreachable", async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]) };
    const redis = { ping: jest.fn().mockRejectedValue(new Error("ECONNREFUSED")) };

    const service = new HealthService(prisma as never, redis as never, createLoggerMock());
    const result = await service.check();

    expect(result.status).toBe("degraded");
    expect(result.services.redis).toBe("down");
  });
});
