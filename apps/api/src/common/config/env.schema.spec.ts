import { validateApiEnv } from "./env.schema";

describe("validateApiEnv", () => {
  const validConfig = {
    NODE_ENV: "test",
    API_PORT: "4000",
    DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
    REDIS_URL: "redis://localhost:6379",
    CORS_ALLOWED_ORIGINS: "http://localhost:3000",
    LOG_LEVEL: "info",
    REQUEST_BODY_LIMIT: "1mb",
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

  it("applies defaults for optional variables", () => {
    const { LOG_LEVEL: _omit, ...withoutLogLevel } = validConfig;
    const result = validateApiEnv(withoutLogLevel);

    expect(result.LOG_LEVEL).toBe("info");
  });
});
