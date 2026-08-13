// Mirrors apps/api's Sprint 4 admin module response shapes 1:1 - dates are
// ISO strings (JSON serialization), never Date objects.
import type { Role } from "@qr-platform/permissions";

export type TenantStatus = "ACTIVE" | "SUSPENDED";
export type BranchStatus = "ACTIVE" | "INACTIVE";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type TenantUserStatus = "ACTIVE" | "INACTIVE";

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
  lastLoginAt: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AdminTenantSummary {
  id: string;
  name: string;
  slug: string;
}

// Nested inside AdminUserWithMemberships.tenantUsers - "which tenants does
// this user belong to". No `user` field (the user IS the parent object).
export interface AdminMembership {
  id: string;
  tenantId: string | null;
  userId: string;
  branchId: string | null;
  roleId: string;
  status: TenantUserStatus;
  createdAt: string;
  tenant: AdminTenantSummary | null;
  role: { code: Role; name: string };
  branch: { id: string; name: string } | null;
}

// Returned by GET /admin/tenants/:id/users - "which users belong to this
// tenant". Carries the sanitized user directly, no `tenant` field (redundant
// - the tenant is already the page's own subject).
export interface AdminTenantMembership {
  id: string;
  tenantId: string | null;
  userId: string;
  branchId: string | null;
  roleId: string;
  status: TenantUserStatus;
  createdAt: string;
  user: AdminUser;
  role: { code: Role; name: string };
  branch: { id: string; name: string } | null;
}

export interface AdminSession {
  id: string;
  ip: string | null;
  userAgent: string | null;
  expiresAt: string;
  lastUsedAt: string;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  tenantId: string | null;
  branchId: string | null;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  requestId: string | null;
  oldValue: unknown;
  newValue: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
  tenant: AdminTenantSummary | null;
}

export interface AdminTenantCounts {
  branches: number;
  tenantUsers: number;
  menus: number;
  products: number;
}

export interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _count: AdminTenantCounts;
}

export interface AdminTenantDetail extends AdminTenant {
  owner: AdminUser | null;
}

export interface AdminBranch {
  id: string;
  tenantId: string;
  name: string;
  phone: string | null;
  address: string | null;
  status: BranchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserWithMemberships extends AdminUser {
  tenantUsers: AdminMembership[];
}

export interface AdminUserDetail extends AdminUserWithMemberships {
  sessions: AdminSession[];
  recentAuditLogs: AdminAuditLog[];
}

export interface AdminDashboard {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  totalUsers: number;
  totalBranches: number;
  totalMenus: number;
  totalProducts: number;
  newTenantsLast7Days: number;
  loginsLast7Days: number;
  systemHealth: { status: "healthy" | "degraded"; services: Record<string, "up" | "down">; timestamp: string };
  recentAuditLogs: AdminAuditLog[];
}

export interface AdminSystemInfo {
  status: "healthy" | "degraded";
  services: { api: "up" | "down"; database: "up" | "down"; redis: "up" | "down"; worker: "up" | "down" };
  environment: string;
  version: string;
  uptimeSeconds: number;
  storage: { status: "up" | "down" };
  lastMigration: { name: string; finishedAt: string } | null;
  timestamp: string;
}

export interface CreateTenantResult {
  tenant: AdminTenant;
  branch: AdminBranch;
  owner: AdminUser;
  membership: { id: string; tenantId: string; userId: string; branchId: string | null; roleId: string };
}

export interface CreateTenantInput {
  name: string;
  slug?: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPassword: string;
  branchName: string;
  phone?: string;
  status?: TenantStatus;
}

export interface UpdateTenantInput {
  name?: string;
  phone?: string;
  status?: TenantStatus;
}

export interface ListTenantsParams {
  q?: string;
  status?: TenantStatus;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "slug" | "status" | "createdAt";
  sortDir?: "asc" | "desc";
}

export interface ListUsersParams {
  q?: string;
  role?: Role;
  tenantId?: string;
  status?: UserStatus;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "email" | "lastLoginAt" | "createdAt";
  sortDir?: "asc" | "desc";
}

export interface ListAuditLogsParams {
  userId?: string;
  action?: string;
  entity?: string;
  tenantId?: string;
  requestId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
