import { apiFetch } from "@/lib/api-client";
import type { FetchResult } from "@/lib/api-client";
import { buildQueryString } from "@/lib/query-string";
import type {
  BusinessMembership,
  BusinessMembershipDetail,
  CreateUserInput,
  CreateUserResult,
  ListUsersParams,
  PaginatedResult,
  UpdateUserInput,
} from "@/types/business";

export function listBusinessUsers(
  params: ListUsersParams = {},
): Promise<FetchResult<PaginatedResult<BusinessMembership>>> {
  return apiFetch<PaginatedResult<BusinessMembership>>(`/business/users${buildQueryString(params)}`);
}

export function getBusinessUser(membershipId: string): Promise<FetchResult<BusinessMembershipDetail>> {
  return apiFetch<BusinessMembershipDetail>(`/business/users/${membershipId}`);
}

export function createBusinessUser(input: CreateUserInput): Promise<FetchResult<CreateUserResult>> {
  return apiFetch<CreateUserResult>("/business/users", { method: "POST", body: JSON.stringify(input) });
}

export function updateBusinessUser(
  membershipId: string,
  input: UpdateUserInput,
): Promise<FetchResult<BusinessMembership>> {
  return apiFetch<BusinessMembership>(`/business/users/${membershipId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function revokeBusinessUserSessions(
  membershipId: string,
  sessionId?: string,
): Promise<FetchResult<{ revokedCount: number }>> {
  return apiFetch<{ revokedCount: number }>(`/business/users/${membershipId}/revoke-sessions`, {
    method: "POST",
    body: JSON.stringify(sessionId ? { sessionId } : {}),
  });
}

export function resetBusinessUserPassword(
  membershipId: string,
  newPassword: string,
): Promise<FetchResult<{ updated: boolean }>> {
  return apiFetch<{ updated: boolean }>(`/business/users/${membershipId}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });
}
