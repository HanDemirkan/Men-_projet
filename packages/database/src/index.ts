export { prisma } from "./client";
export { PrismaClient, Prisma } from "../generated/client";
export { getCurrentTenantId, runWithTenantContext } from "./tenant-context";
export type { TenantContext } from "./tenant-context";
export { tenantScopedPrisma } from "./tenant-scoped-client";
export type { TenantScopedPrismaClient } from "./tenant-scoped-client";
