// Mirrors apps/api's Sprint 5 business module response shapes 1:1 - dates
// are ISO strings (JSON serialization), never Date objects.
import type { Role } from "@qr-platform/permissions";

export type BranchStatus = "ACTIVE" | "INACTIVE";
export type TenantUserStatus = "ACTIVE" | "INACTIVE";
export type PriceDisplayFormat = "WITH_CURRENCY" | "NUMBER_ONLY";
export type QrErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface BusinessUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
  lastLoginAt: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface BusinessBranch {
  id: string;
  tenantId: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  googleMapsLink: string | null;
  workingHours: Record<string, unknown> | null;
  status: BranchStatus;
  createdAt: string;
  updatedAt: string;
  _count: { tenantUsers: number };
}

export interface BusinessMembershipRole {
  code: Role;
  name: string;
}

export interface BusinessMembership {
  id: string;
  tenantId: string;
  userId: string;
  branchId: string | null;
  roleId: string;
  status: TenantUserStatus;
  createdAt: string;
  updatedAt: string;
  user: BusinessUser;
  role: BusinessMembershipRole;
  branch: { id: string; name: string } | null;
}

export interface BusinessSession {
  id: string;
  ip: string | null;
  userAgent: string | null;
  expiresAt: string;
  lastUsedAt: string;
  createdAt: string;
}

export interface BusinessAuditLog {
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
}

export interface BusinessMembershipDetail extends BusinessMembership {
  sessions: BusinessSession[];
  recentAuditLogs: BusinessAuditLog[];
}

export interface CreateUserResult {
  user: BusinessUser;
  membership: { id: string; tenantId: string; userId: string; branchId: string | null; roleId: string };
}

export interface BusinessDashboard {
  totalBranches: number;
  totalUsers: number;
  activeMenus: number;
  totalCategories: number;
  totalProducts: number;
  publishedProducts: number;
  inactiveProducts: number;
  qrViewCount: number;
  viewsLast7Days: number;
  profileCompletionPercent: number;
  recentActivity: BusinessAuditLog[];
}

export interface QrDefaults {
  errorCorrectionLevel: QrErrorCorrectionLevel;
  includeLogo: boolean;
}

export interface BusinessSettings {
  language: string;
  currency: string;
  tenantStatus: string;
  timezone: string;
  dateFormat: string;
  priceDisplayFormat: PriceDisplayFormat;
  qrDefaults: QrDefaults;
}

export interface CreateBranchInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  googleMapsLink?: string;
  workingHours?: Record<string, unknown>;
}

export interface UpdateBranchInput {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  googleMapsLink?: string;
  workingHours?: Record<string, unknown>;
  status?: BranchStatus;
}

export interface ListBranchesParams {
  q?: string;
  status?: BranchStatus;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "status" | "createdAt";
  sortDir?: "asc" | "desc";
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  branchId?: string;
  status?: TenantUserStatus;
}

export interface UpdateUserInput {
  role?: Role;
  branchId?: string | null;
  status?: TenantUserStatus;
}

export interface ListUsersParams {
  q?: string;
  role?: Role;
  branchId?: string;
  status?: TenantUserStatus;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "email" | "lastLoginAt" | "createdAt";
  sortDir?: "asc" | "desc";
}

export interface ListActivityParams {
  userId?: string;
  action?: string;
  entity?: string;
  requestId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface UpdateSettingsInput {
  timezone?: string;
  dateFormat?: string;
  priceDisplayFormat?: PriceDisplayFormat;
  qrDefaults?: Partial<QrDefaults>;
}
