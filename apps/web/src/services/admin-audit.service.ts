import { apiFetch } from "@/lib/api-client";
import type { FetchResult } from "@/lib/api-client";
import { buildQueryString } from "@/lib/query-string";
import type { AdminAuditLog, ListAuditLogsParams, PaginatedResult } from "@/types/admin";

export function listAuditLogs(
  params: ListAuditLogsParams = {},
): Promise<FetchResult<PaginatedResult<AdminAuditLog>>> {
  return apiFetch<PaginatedResult<AdminAuditLog>>(`/admin/audit-logs${buildQueryString(params)}`);
}
