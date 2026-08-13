import { validateApiEnv } from "./env.schema";

describe("validateApiEnv", () => {
  const validConfig = {
    NODE_ENV: "test",
    API_PORT: "4000",
    DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
    REDIS_URL: "redis://localhost:6379",
    STORAGE_DIR: "/tmp/qr-platform-storage",
    CORS_ALLOWED_ORIGINS: "http://localhost:3000",
    LOG_LEVEL: "info",
    REQUEST_BODY_LIMIT: "1mb",
    JWT_ACCESS_SECRET: "test-secret-at-least-32-characters-long",
  };

  it("returns a parsed config when all required variables are present", () => {
    const result = validateApiEnv(validConfig);

    expect(result.API_PORT).toBe(4000);
    expect(result.DATABASE_URL).toBe(validConfig.DATABASE_URL);
  });

  it("throws a descriptive error when DATABASE_URL is missing", () => {
    const { DATABASE_URL: _omit, ...incompleteConfig } = validConfig;

    expect(() => validateApiEnv(incompleteConfig)).toThrow(/DATABASE_URL/);
  });

  it("throws when DATABASE_URL is not a valid URL", () => {
    expect(() => validateApiEnv({ ...validConfig, DATABASE_URL: "not-a-url" })).toThrow(
      /DATABASE_URL/,
    );
  });

  it("throws when JWT_ACCESS_SECRET is missing", () => {
    const { JWT_ACCESS_SECRET: _omit, ...incompleteConfig } = validConfig;

    expect(() => validateApiEnv(incompleteConfig)).toThrow(/JWT_ACCESS_SECRET/);
  });

  it("throws when JWT_ACCESS_SECRET is shorter than 32 characters", () => {
    expect(() => validateApiEnv({ ...validConfig, JWT_ACCESS_SECRET: "too-short" })).toThrow(
      /JWT_ACCESS_SECRET/,
    );
  });

  it("applies defaults for optional variables", () => {
    const { LOG_LEVEL: _omit, ...withoutLogLevel } = validConfig;
    const result = validateApiEnv(withoutLogLevel);

    expect(result.LOG_LEVEL).toBe("info");
  });

  it("defaults API_HOST to 0.0.0.0 so the API is LAN-reachable out of the box", () => {
    const result = validateApiEnv(validConfig);

    expect(result.API_HOST).toBe("0.0.0.0");
  });

  it("defaults PUBLIC_APP_URL to http://localhost:3000 when not set", () => {
    const result = validateApiEnv(validConfig);

    expect(result.PUBLIC_APP_URL).toBe("http://localhost:3000");
  });
});
