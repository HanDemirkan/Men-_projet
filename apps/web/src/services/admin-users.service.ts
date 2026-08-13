import { apiFetch } from "@/lib/api-client";
import type { FetchResult } from "@/lib/api-client";
import { buildQueryString } from "@/lib/query-string";
import type {
  AdminUserDetail,
  AdminUserWithMemberships,
  ListUsersParams,
  PaginatedResult,
  UserStatus,
} from "@/types/admin";

export function listUsers(
  params: ListUsersParams = {},
): Promise<FetchResult<PaginatedResult<AdminUserWithMemberships>>> {
  return apiFetch<PaginatedResult<AdminUserWithMemberships>>(`/admin/users${buildQueryString(params)}`);
}

export function getUser(id: string): Promise<FetchResult<AdminUserDetail>> {
  return apiFetch<AdminUserDetail>(`/admin/users/${id}`);
}

export function updateUserStatus(
  id: string,
  status: UserStatus,
): Promise<FetchResult<AdminUserWithMemberships>> {
  return apiFetch<AdminUserWithMemberships>(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function revokeUserSessions(
  id: string,
  sessionId?: string,
): Promise<FetchResult<{ revokedCount: number }>> {
  return apiFetch<{ revokedCount: number }>(`/admin/users/${id}/revoke-sessions`, {
    method: "POST",
    body: JSON.stringify(sessionId ? { sessionId } : {}),
  });
}
