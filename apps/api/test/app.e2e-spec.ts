process.env["NODE_ENV"] = "test";
process.env["DATABASE_URL"] = "postgresql://user:pass@localhost:5432/test_db";
process.env["REDIS_URL"] = "redis://localhost:6379";
process.env["STORAGE_DIR"] = "/tmp/qr-platform-test-storage";
process.env["CORS_ALLOWED_ORIGINS"] = "http://localhost:3000";
process.env["LOG_LEVEL"] = "error";
process.env["REQUEST_BODY_LIMIT"] = "1mb";
process.env["JWT_ACCESS_SECRET"] = "e2e-test-secret-at-least-32-characters-long";

/* eslint-disable import/order -- env vars above must be set before app modules are imported */
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { AllExceptionsFilter } from "../src/common/filters/all-exceptions.filter";
import { AppConfigService } from "../src/common/config/app-config.service";
import { ResponseInterceptor } from "../src/common/interceptors/response.interceptor";
import { PRISMA_CLIENT, REDIS_CLIENT } from "../src/modules/health/health.tokens";
/* eslint-enable import/order */

describe("API (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PRISMA_CLIENT)
      .useValue({ $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]) })
      .overrideProvider(REDIS_CLIENT)
      .useValue({
        ping: jest.fn().mockResolvedValue("PONG"),
        quit: jest.fn().mockResolvedValue("OK"),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new ResponseInterceptor());

    const appConfig = app.get(AppConfigService);
    app.useGlobalFilters(
      new AllExceptionsFilter(
        { setContext: jest.fn(), error: jest.fn(), warn: jest.fn() } as never,
        appConfig,
      ),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1/health returns a successful envelope with healthy status", async () => {
    const response = await request(app.getHttpServer()).get("/api/v1/health").expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        status: "healthy",
        services: { api: "up", database: "up", redis: "up" },
      },
      meta: null,
    });
    expect(typeof response.body.data.timestamp).toBe("string");
  });

  it("returns the standard success envelope shape on every successful response", async () => {
    const response = await request(app.getHttpServer()).get("/api/v1/health").expect(200);

    expect(Object.keys(response.body).sort()).toEqual(["data", "meta", "success"]);
  });

  it("returns a standard error envelope for an unknown endpoint", async () => {
    const response = await request(app.getHttpServer()).get("/api/v1/does-not-exist").expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: "NOT_FOUND", message: expect.any(String), details: [] },
    });
    expect(typeof response.body.requestId).toBe("string");
  });

  it("generates and returns a request id header on every response", async () => {
    const response = await request(app.getHttpServer()).get("/api/v1/health").expect(200);

    expect(response.headers["x-request-id"]).toBeDefined();
    expect(response.headers["x-request-id"]).toHaveLength(36);
  });

  it("echoes back a client-provided request id instead of generating a new one", async () => {
    const clientRequestId = "11111111-1111-4111-8111-111111111111";

    const response = await request(app.getHttpServer())
      .get("/api/v1/health")
      .set("x-request-id", clientRequestId)
      .expect(200);

    expect(response.headers["x-request-id"]).toBe(clientRequestId);
  });
});
