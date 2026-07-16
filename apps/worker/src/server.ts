import { createServer } from "node:http";
import type { Server } from "node:http";

import type { PrismaClient } from "@qr-platform/database";
import type { HealthStatus } from "@qr-platform/shared";
import type { Redis } from "ioredis";
import type pino from "pino";

import { checkDatabaseConnection, checkRedisConnection } from "./checks";

// A minimal liveness endpoint so operators/orchestrators can confirm the
// worker process is running and reach its dependencies. No job queue exists
// in Sprint 0 - this is purely operational, not a feature surface.
export function createHealthServer(
  prisma: PrismaClient,
  redis: Redis,
  logger: pino.Logger,
): Server {
  return createServer((req, res) => {
    if (req.method !== "GET" || req.url !== "/health") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: { code: "NOT_FOUND" } }));
      return;
    }

    void (async () => {
      const [database, redisStatus] = await Promise.all([
        checkDatabaseConnection(prisma, logger),
        checkRedisConnection(redis, logger),
      ]);

      const payload: HealthStatus = {
        status: database === "up" && redisStatus === "up" ? "healthy" : "degraded",
        services: { api: "up", database, redis: redisStatus },
        timestamp: new Date().toISOString(),
      };

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, data: payload, meta: null }));
    })();
  });
}
