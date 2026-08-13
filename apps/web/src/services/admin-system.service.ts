import { apiFetch } from "@/lib/api-client";
import type { FetchResult } from "@/lib/api-client";
import type { AdminSystemInfo } from "@/types/admin";

export function getAdminSystemInfo(): Promise<FetchResult<AdminSystemInfo>> {
  return apiFetch<AdminSystemInfo>("/admin/system");
}
