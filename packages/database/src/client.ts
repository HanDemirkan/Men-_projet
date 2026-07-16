import { PrismaClient } from "../generated/client";

declare global {
  var __qrPlatformPrismaClient: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env["NODE_ENV"] === "development" ? ["warn", "error"] : ["error"],
  });
}

// In development, Node's module cache is cleared on every hot reload, which
// would otherwise create a new PrismaClient (and a new connection pool) per
// reload. Stashing the instance on `global` survives the reload.
export const prisma: PrismaClient = globalThis.__qrPlatformPrismaClient ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalThis.__qrPlatformPrismaClient = prisma;
}
