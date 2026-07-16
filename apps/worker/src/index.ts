import { prisma } from "@qr-platform/database";
import { Redis } from "ioredis";

import { checkDatabaseConnection, checkRedisConnection } from "./checks";
import { loadWorkerEnv } from "./config/env";
import { registerGracefulShutdown } from "./lifecycle/graceful-shutdown";
import { createLogger } from "./logging/logger";
import { createHealthServer } from "./server";

async function main(): Promise<void> {
  const env = loadWorkerEnv();
  const logger = createLogger(env);

  const redis = new Redis(env.REDIS_URL, {
    lazyConnect: false,
    maxRetriesPerRequest: 1,
    // Backs off up to 5s between reconnect attempts instead of hammering
    // Redis or crashing the process while it's down.
    retryStrategy: (attempt: number) => Math.min(attempt * 500, 5000),
    reconnectOnError: () => true,
  });

  // ioredis emits `error` for every failed connection attempt; without a
  // listener this would eventually surface as an unhandled error and kill
  // the process. Logging keeps the worker running with a "degraded" health
  // response instead.
  redis.on("error", (error: Error) => {
    logger.warn({ err: error }, "Redis connection error");
  });

  const databaseStatus = await checkDatabaseConnection(prisma, logger);
  const redisStatus = await checkRedisConnection(redis, logger);

  logger.info(
    { database: databaseStatus, redis: redisStatus },
    "Startup connection checks completed",
  );

  const server = createHealthServer(prisma, redis, logger);
  server.listen(env.WORKER_PORT, () => {
    logger.info({ port: env.WORKER_PORT }, "Worker started");
  });

  registerGracefulShutdown(logger, async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
    redis.disconnect();
  });
}

main().catch((error: unknown) => {
  console.error("Failed to start worker", error);
  process.exit(1);
});
