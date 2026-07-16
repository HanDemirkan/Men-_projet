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

  const redis = new Redis(env.REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 1 });

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
