import { createSuperAdminIfMissing } from "@qr-platform/database";
import { PinoLogger } from "nestjs-pino";

import type { AppConfigService } from "../config/app-config.service";

import { DevelopmentBootstrapService } from "./development-bootstrap.service";

jest.mock("@qr-platform/database", () => ({
  createSuperAdminIfMissing: jest.fn(),
  splitFullName: jest.fn((fullName: string) => {
    const [firstName, ...rest] = fullName.split(" ");
    return { firstName, lastName: rest.join(" ") };
  }),
}));

jest.mock("argon2", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
  argon2id: "argon2id",
}));

const createSuperAdminIfMissingMock = createSuperAdminIfMissing as jest.Mock;

function createLoggerMock(): PinoLogger {
  return {
    setContext: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  } as unknown as PinoLogger;
}

function createAppConfigMock(overrides: Partial<AppConfigService> = {}): AppConfigService {
  return {
    isDevelopment: true,
    devAdminName: "Dev Admin",
    devAdminEmail: "dev-admin@example.com",
    devAdminPassword: "DevAdmin123!",
    ...overrides,
  } as AppConfigService;
}

describe("DevelopmentBootstrapService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does nothing outside development", async () => {
    const logger = createLoggerMock();
    const service = new DevelopmentBootstrapService(createAppConfigMock({ isDevelopment: false }), logger);

    await service.onModuleInit();

    expect(createSuperAdminIfMissingMock).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith("Development super admin bootstrap skipped outside development");
  });

  it("creates the dev super admin when it doesn't exist yet", async () => {
    createSuperAdminIfMissingMock.mockResolvedValue({ status: "created" });
    const logger = createLoggerMock();
    const service = new DevelopmentBootstrapService(createAppConfigMock(), logger);

    await service.onModuleInit();

    expect(createSuperAdminIfMissingMock).toHaveBeenCalledWith({
      firstName: "Dev",
      lastName: "Admin",
      email: "dev-admin@example.com",
      passwordHash: "hashed-password",
    });
    expect(logger.info).toHaveBeenCalledWith("Development super admin created");
  });

  it("reports 'ready' without recreating an existing dev super admin", async () => {
    createSuperAdminIfMissingMock.mockResolvedValue({ status: "exists" });
    const logger = createLoggerMock();
    const service = new DevelopmentBootstrapService(createAppConfigMock(), logger);

    await service.onModuleInit();

    expect(logger.info).toHaveBeenCalledWith("Development super admin ready");
  });

  it("skips without crashing when DEV_ADMIN_EMAIL is missing/invalid, and never logs the raw password", async () => {
    const logger = createLoggerMock();
    const service = new DevelopmentBootstrapService(
      createAppConfigMock({ devAdminEmail: "not-an-email" }),
      logger,
    );

    await expect(service.onModuleInit()).resolves.toBeUndefined();

    expect(createSuperAdminIfMissingMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
    const [warnMessage] = (logger.warn as jest.Mock).mock.calls[0] as [string];
    expect(warnMessage).not.toContain("DevAdmin123!");
  });

  it("skips without crashing when DEV_ADMIN_PASSWORD doesn't meet the policy", async () => {
    const logger = createLoggerMock();
    const service = new DevelopmentBootstrapService(
      createAppConfigMock({ devAdminPassword: "tooweak" }),
      logger,
    );

    await service.onModuleInit();

    expect(createSuperAdminIfMissingMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  it("skips without crashing when no DEV_ADMIN_* values are configured at all", async () => {
    const logger = createLoggerMock();
    const service = new DevelopmentBootstrapService(
      createAppConfigMock({ devAdminName: undefined, devAdminEmail: undefined, devAdminPassword: undefined }),
      logger,
    );

    await expect(service.onModuleInit()).resolves.toBeUndefined();
    expect(createSuperAdminIfMissingMock).not.toHaveBeenCalled();
  });
});
