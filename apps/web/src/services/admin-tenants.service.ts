import { apiFetch } from "@/lib/api-client";
import type { FetchResult } from "@/lib/api-client";
import { buildQueryString } from "@/lib/query-string";
import type {
  AdminAuditLog,
  AdminBranch,
  AdminTenant,
  AdminTenantDetail,
  AdminTenantMembership,
  CreateTenantInput,
  CreateTenantResult,
  ListAuditLogsParams,
  ListTenantsParams,
  PaginatedResult,
  UpdateTenantInput,
} from "@/types/admin";

export function listTenants(params: ListTenantsParams = {}): Promise<FetchResult<PaginatedResult<AdminTenant>>> {
  return apiFetch<PaginatedResult<AdminTenant>>(`/admin/tenants${buildQueryString(params)}`);
}

export function createTenant(input: CreateTenantInput): Promise<FetchResult<CreateTenantResult>> {
  return apiFetch<CreateTenantResult>("/admin/tenants", { method: "POST", body: JSON.stringify(input) });
}

export function getTenant(id: string): Promise<FetchResult<AdminTenantDetail>> {
  return apiFetch<AdminTenantDetail>(`/admin/tenants/${id}`);
}

export function updateTenant(id: string, input: UpdateTenantInput): Promise<FetchResult<AdminTenant>> {
  return apiFetch<AdminTenant>(`/admin/tenants/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function listTenantUsers(id: string): Promise<FetchResult<AdminTenantMembership[]>> {
  return apiFetch<AdminTenantMembership[]>(`/admin/tenants/${id}/users`);
}

export function listTenantBranches(id: string): Promise<FetchResult<AdminBranch[]>> {
  return apiFetch<AdminBranch[]>(`/admin/tenants/${id}/branches`);
}

export function listTenantActivity(
  id: string,
  params: ListAuditLogsParams = {},
): Promise<FetchResult<PaginatedResult<AdminAuditLog>>> {
  return apiFetch<PaginatedResult<AdminAuditLog>>(`/admin/tenants/${id}/activity${buildQueryString(params)}`);
}
