export { prisma } from "./client";
export {
  PrismaClient,
  Prisma,
  MediaType,
  MenuStatus,
  TenantStatus,
  BranchStatus,
  UserStatus,
  TenantUserStatus,
} from "../generated/client";
export type {
  Tenant,
  Branch,
  User,
  TenantUser,
  Session,
  AuditLog,
  StorefrontView,
  TenantStorefrontConfig,
  StorefrontConfigRevision,
  TenantSlugAlias,
} from "../generated/client";
export { getCurrentTenantId, runWithTenantContext } from "./tenant-context";
export type { TenantContext } from "./tenant-context";
export { tenantScopedPrisma } from "./tenant-scoped-client";
export type { TenantScopedPrismaClient } from "./tenant-scoped-client";
export {
  PERMISSION_NAMES,
  ROLE_NAMES,
  seedPermissions,
  seedRoles,
  splitFullName,
  createSuperAdminIfMissing,
} from "./admin-bootstrap";
export type { CreateSuperAdminIfMissingInput, CreateSuperAdminIfMissingResult } from "./admin-bootstrap";
