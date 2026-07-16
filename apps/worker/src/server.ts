import { createServer } from "node:http";
import type { Server, ServerResponse } from "node:http";

import type { PrismaClient } from "@qr-platform/database";
import type { HealthStatus } from "@qr-platform/shared";
import type { Redis } from "ioredis";
import type pino from "pino";

import { checkDatabaseConnection, checkRedisConnection } from "./checks";

async function buildHealthStatus(
  prisma: PrismaClient,
  redis: Redis,
  logger: pino.Logger,
): Promise<HealthStatus> {
  const [database, redisStatus] = await Promise.all([
    checkDatabaseConnection(prisma, logger),
    checkRedisConnection(redis, logger),
  ]);

  return {
    status: database === "up" && redisStatus === "up" ? "healthy" : "degraded",
    services: { api: "up", database, redis: redisStatus },
    timestamp: new Date().toISOString(),
  };
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

// A minimal operational HTTP surface so operators/orchestrators (PM2, a
// future container platform) can confirm the worker process is running
// (`/health/live`) and reach its dependencies (`/health/ready`). `/health`
// is kept as a combined status for backward compatibility. No job queue
// exists in Sprint 0 - this is purely operational, not a feature surface.
export function createHealthServer(prisma: PrismaClient, redis: Redis, logger: pino.Logger): Server {
  return createServer((req, res) => {
    if (req.method !== "GET") {
      sendJson(res, 404, { success: false, error: { code: "NOT_FOUND" } });
      return;
    }

    if (req.url === "/health/live") {
      sendJson(res, 200, { success: true, data: { status: "up" }, meta: null });
      return;
    }

    if (req.url === "/health/ready") {
      void buildHealthStatus(prisma, redis, logger).then((status) => {
        sendJson(res, status.status === "healthy" ? 200 : 503, {
          success: status.status === "healthy",
          data: status,
          meta: null,
        });
      });
      return;
    }

    if (req.url === "/health") {
      void buildHealthStatus(prisma, redis, logger).then((status) => {
        sendJson(res, 200, { success: true, data: status, meta: null });
      });
      return;
    }

    sendJson(res, 404, { success: false, error: { code: "NOT_FOUND" } });
  });
}
