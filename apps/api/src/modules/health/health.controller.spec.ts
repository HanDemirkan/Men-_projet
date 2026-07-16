import { ServiceUnavailableException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

describe("HealthController", () => {
  let controller: HealthController;
  let healthService: { check: jest.Mock };

  beforeEach(async () => {
    healthService = { check: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: healthService }],
    }).compile();

    controller = module.get(HealthController);
  });

  it("returns the health status produced by the service", async () => {
    const expected = {
      status: "healthy" as const,
      services: { api: "up" as const, database: "up" as const, redis: "up" as const },
      timestamp: "2026-01-01T00:00:00.000Z",
    };
    healthService.check.mockResolvedValue(expected);

    const result = await controller.check();

    expect(result).toEqual(expected);
    expect(healthService.check).toHaveBeenCalledTimes(1);
  });

  it("live() returns up without calling the health service", () => {
    expect(controller.live()).toEqual({ status: "up" });
    expect(healthService.check).not.toHaveBeenCalled();
  });

  it("ready() returns the status when healthy", async () => {
    const expected = {
      status: "healthy" as const,
      services: { api: "up" as const, database: "up" as const, redis: "up" as const },
      timestamp: "2026-01-01T00:00:00.000Z",
    };
    healthService.check.mockResolvedValue(expected);

    await expect(controller.ready()).resolves.toEqual(expected);
  });

  it("ready() throws ServiceUnavailableException when degraded", async () => {
    healthService.check.mockResolvedValue({
      status: "degraded" as const,
      services: { api: "up" as const, database: "down" as const, redis: "up" as const },
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    await expect(controller.ready()).rejects.toThrow(ServiceUnavailableException);
  });
});
