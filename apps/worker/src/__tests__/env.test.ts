import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadWorkerEnv } from "../config/env";

describe("loadWorkerEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env["DATABASE_URL"] = "postgresql://user:pass@localhost:5432/db";
    process.env["REDIS_URL"] = "redis://localhost:6379";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("parses valid environment variables", () => {
    const env = loadWorkerEnv();

    expect(env.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/db");
    expect(env.WORKER_PORT).toBe(4100);
  });

  it("throws a descriptive error when REDIS_URL is missing", () => {
    delete process.env["REDIS_URL"];

    expect(() => loadWorkerEnv()).toThrow(/REDIS_URL/);
  });
});
