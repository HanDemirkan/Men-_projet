import { apiFetch } from "@/lib/api-client";
import type { FetchResult } from "@/lib/api-client";
import { buildQueryString } from "@/lib/query-string";
import type { BusinessAuditLog, ListActivityParams, PaginatedResult } from "@/types/business";

export function listBusinessActivity(
  params: ListActivityParams = {},
): Promise<FetchResult<PaginatedResult<BusinessAuditLog>>> {
  return apiFetch<PaginatedResult<BusinessAuditLog>>(`/business/activity${buildQueryString(params)}`);
}
