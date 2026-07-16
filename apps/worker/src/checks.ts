import type { PrismaClient } from "@qr-platform/database";
import type { ServiceStatus } from "@qr-platform/shared";
import type { Redis } from "ioredis";
import type pino from "pino";

export async function checkDatabaseConnection(
  prisma: PrismaClient,
  logger: pino.Logger,
): Promise<ServiceStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "up";
  } catch (error) {
    logger.error({ err: error }, "Database connection check failed");
    return "down";
  }
}

export async function checkRedisConnection(
  redis: Redis,
  logger: pino.Logger,
): Promise<ServiceStatus> {
  try {
    const pong = await redis.ping();
    return pong === "PONG" ? "up" : "down";
  } catch (error) {
    logger.error({ err: error }, "Redis connection check failed");
    return "down";
  }
}
